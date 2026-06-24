import * as regulationService from '../services/regulationService.js';
import * as regulationRepository from '../repositories/regulationRepository.js';
import Regulation from '../models/Regulation.js';
import AuditLog from '../models/AuditLog.js';
import CourseVersion from '../models/CourseVersion.js';

import MinorStream from '../models/MinorStream.js';
import PrerequisiteLink from '../models/PrerequisiteLink.js';
import CourseAssignment from '../models/CourseAssignment.js';
import PeoPso from '../models/PeoPso.js';

// ─────────────────────────────────────────────
// Valid lifecycle transitions per role
// ─────────────────────────────────────────────
const ADMIN_TRANSITIONS = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['LOCKED', 'ARCHIVED'],
  LOCKED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: ['DRAFT']
};

const HOD_TRANSITIONS = {
  DRAFT: [], // HOD cannot transition — admin only
  ACTIVE: [],
  LOCKED: [],
  ARCHIVED: []
};

// ─────────────────────────────────────────────
// READ endpoints
// ─────────────────────────────────────────────

export const getRegulations = async (req, res, next) => {
  try {
    const regulations = await regulationService.getAllRegulations();
    return res.status(200).json({ regulations });
  } catch (error) {
    return next(error);
  }
};

export const getRegulationsByProgram = async (req, res, next) => {
  try {
    const { programId } = req.params;
    const regulations = await regulationRepository.findRegulationsByProgram(programId);
    res.json({ regulations });
  } catch (error) {
    next(error);
  }
};

export const getRegulationsByDept = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const regulations = await regulationService.getRegulationsByDept(departmentId);
    return res.status(200).json({ regulations });
  } catch (error) {
    return next(error);
  }
};

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

export const createRegulation = async (req, res, next) => {
  try {
    if (req.user.role === 'HOD') {
      req.body.programId = req.user.programId;
      req.body.departmentId = req.user.departmentId;
    }
    const reg = await regulationService.createNewRegulation(req.body, req.user);
    return res.status(201).json({ regulation: reg, message: 'Academic regulation created successfully.' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE (general field edit — gated by status)
// ─────────────────────────────────────────────

export const updateRegulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await Regulation.findById(id);
    if (!existing) return res.status(404).json({ message: 'Regulation not found' });

    // HOD can only edit regulations of their own program
    if (req.user.role === 'HOD' && existing.programId.toString() !== req.user.programId.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only update regulations of your own program.' });
    }

    // HOD cannot edit LOCKED or ARCHIVED regulations
    if (req.user.role !== 'Admin' && (existing.status === 'LOCKED' || existing.status === 'ARCHIVED')) {
      return res.status(423).json({
        message: `Regulation "${existing.code}" is ${existing.status}. Only Admin can modify a locked or archived regulation.`,
        regulationStatus: existing.status
      });
    }

    // Prevent changing status through general update endpoint — use /status route instead
    const { status, activatedBy, activatedAt, lockedBy, lockedAt, archivedBy, archivedAt, lifecycleHistory, ...safeUpdateData } = req.body;

    const reg = await Regulation.findByIdAndUpdate(id, safeUpdateData, { new: true }).populate('programId');

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'UPDATE_REGULATION',
      details: `Updated regulation details for ${reg.code} (status: ${reg.status})`,
      category: 'Configuration'
    });

    return res.status(200).json({ regulation: reg, message: `Regulation updated successfully.` });
  } catch (error) {
    return next(error);
  }
};

// ─────────────────────────────────────────────
// LIFECYCLE TRANSITION — POST /regulations/:id/status
// ─────────────────────────────────────────────

export const transitionRegulationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status: targetStatus, notes = '', lockPreviousActive = false } = req.body;

    if (!targetStatus) {
      return res.status(400).json({ message: 'Target status is required.' });
    }

    const validStatuses = ['DRAFT', 'ACTIVE', 'LOCKED', 'ARCHIVED'];
    if (!validStatuses.includes(targetStatus)) {
      return res.status(400).json({ message: `Invalid status "${targetStatus}". Must be one of: ${validStatuses.join(', ')}` });
    }

    const reg = await Regulation.findOne({ _id: id, isDeleted: { $ne: true } }).populate('programId');
    if (!reg) return res.status(404).json({ message: 'Regulation not found.' });

    const currentStatus = reg.status || 'DRAFT';

    // Validate transition is allowed for this role
    const allowedTransitions = req.user.role === 'Admin' ? ADMIN_TRANSITIONS[currentStatus] : HOD_TRANSITIONS[currentStatus];
    if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
      return res.status(403).json({
        message: `Transition from ${currentStatus} to ${targetStatus} is not permitted for role ${req.user.role}.`,
        currentStatus,
        allowedTransitions
      });
    }

    const now = new Date();
    const updatePayload = { status: targetStatus };

    // Set tracking fields based on target status
    if (targetStatus === 'ACTIVE') {
      updatePayload.activatedBy = req.user.id;
      updatePayload.activatedAt = now;
    } else if (targetStatus === 'LOCKED') {
      updatePayload.lockedBy = req.user.id;
      updatePayload.lockedAt = now;
    } else if (targetStatus === 'ARCHIVED') {
      updatePayload.archivedBy = req.user.id;
      updatePayload.archivedAt = now;
    }

    // Append to lifecycle history
    const historyEntry = {
      status: targetStatus,
      changedBy: req.user.id,
      changedByName: req.user.name,
      changedByRole: req.user.role,
      changedAt: now,
      notes: notes || ''
    };

    const updatedReg = await Regulation.findByIdAndUpdate(
      id,
      {
        ...updatePayload,
        $push: { lifecycleHistory: historyEntry }
      },
      { new: true }
    ).populate('programId');

    // Handle optional auto-lock of previously ACTIVE regulation
    if (targetStatus === 'ACTIVE' && lockPreviousActive) {
      const otherActive = await Regulation.find({
        _id: { $ne: id },
        programId: reg.programId._id || reg.programId,
        status: 'ACTIVE',
        isDeleted: { $ne: true }
      });

      for (const other of otherActive) {
        await Regulation.findByIdAndUpdate(other._id, {
          status: 'LOCKED',
          lockedBy: req.user.id,
          lockedAt: now,
          $push: {
            lifecycleHistory: {
              status: 'LOCKED',
              changedBy: req.user.id,
              changedByName: req.user.name,
              changedByRole: req.user.role,
              changedAt: now,
              notes: `Auto-locked when regulation ${updatedReg.code} was activated.`
            }
          }
        });

        await AuditLog.create({
          userId: req.user.id,
          userName: req.user.name,
          userEmail: req.user.email,
          action: 'AUTO_LOCK_REGULATION',
          details: `Regulation ${other.code} auto-locked when ${updatedReg.code} was activated by ${req.user.name}.`,
          category: 'Configuration'
        });
      }
    }

    // Primary audit log
    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'TRANSITION_REGULATION_STATUS',
      details: `Regulation ${updatedReg.code} (${updatedReg.programId?.name || 'Unknown Program'}) transitioned from ${currentStatus} → ${targetStatus} by ${req.user.role} ${req.user.name}.${notes ? ' Notes: ' + notes : ''}`,
      category: 'Configuration'
    });

    return res.status(200).json({
      regulation: updatedReg,
      message: `Regulation ${updatedReg.code} successfully transitioned to ${targetStatus}.`,
      previousStatus: currentStatus
    });
  } catch (error) {
    return next(error);
  }
};

// ─────────────────────────────────────────────
// DELETE (soft-delete cascade)
// ─────────────────────────────────────────────

export const deleteRegulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find regulation including those not marked as deleted
    const reg = await Regulation.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!reg) return res.status(404).json({ message: 'Regulation not found' });

    const deleteTime = new Date();

    // 1. Soft-delete CourseVersion
    await CourseVersion.updateMany(
      { regulationId: id },
      { isDeleted: true, deletedAt: deleteTime }
    );

    // 2. Removed CurriculumBook cascading

    // 3. Soft-delete MinorStream
    await MinorStream.updateMany(
      { regulationId: id },
      { isDeleted: true, deletedAt: deleteTime }
    );

    // 4. Soft-delete PrerequisiteLink
    await PrerequisiteLink.updateMany(
      { regulationId: id },
      { isDeleted: true, deletedAt: deleteTime }
    );

    // 5. Soft-delete CourseAssignment
    await CourseAssignment.updateMany(
      { regulationId: id },
      { isDeleted: true, deletedAt: deleteTime }
    );

    // 6. Soft-delete PeoPso
    await PeoPso.updateMany(
      { regulationId: id },
      { isDeleted: true, deletedAt: deleteTime }
    );

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'DELETE_REGULATION',
      details: `Soft-deleted regulation code ${reg.code} and cascade-deactivated associated courses, minor streams, and assignments.`,
      category: 'Configuration'
    });

    return res.status(200).json({ 
      regulation: reg, 
      message: `Regulation ${reg.code} successfully soft-deleted.` 
    });
  } catch (error) {
    return next(error);
  }
};

// ─────────────────────────────────────────────
// DELETION STATS
// ─────────────────────────────────────────────

export const getRegulationDeletionStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const reg = await Regulation.findOne({ _id: id, isDeleted: { $ne: true } });
    if (!reg) return res.status(404).json({ message: 'Regulation not found' });

    // 1. Total Courses
    const coursesCount = await CourseVersion.countDocuments({ regulationId: id, isDeleted: { $ne: true } });

    // 2. Total PEOs & PSOs
    let peosCount = reg.outcomes?.find(o => o.name === 'PEO')?.items?.length || 0;
    let psosCount = reg.outcomes?.find(o => o.name === 'PSO')?.items?.length || 0;
    
    const peoPso = await PeoPso.findOne({ regulationId: id, isDeleted: { $ne: true } });
    if (peoPso) {
      peosCount = Math.max(peosCount, peoPso.peos?.length || 0);
      psosCount = Math.max(psosCount, peoPso.psos?.length || 0);
    }

    // 3. Total Mappings (CO-PO + CO-PSO matrices)
    const versions = await CourseVersion.find({ regulationId: id, isDeleted: { $ne: true } });
    let mappingsCount = 0;
    versions.forEach(v => {
      mappingsCount += (v.coPoMappings?.length || 0) + (v.coPsoMappings?.length || 0);
    });

    // 4. Removed Curriculum Records Count
    const booksCount = 0;

    return res.status(200).json({
      stats: {
        totalCourses: coursesCount,
        totalPeos: peosCount,
        totalPsos: psosCount,
        totalMappings: mappingsCount,
        totalCurriculumRecords: booksCount
      }
    });
  } catch (error) {
    return next(error);
  }
};

// ─────────────────────────────────────────────
// RESTORE (soft-deleted regulation)
// ─────────────────────────────────────────────

export const restoreRegulation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find regulation that is soft-deleted
    const reg = await Regulation.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { isDeleted: false, deletedAt: null },
      { new: true }
    );
    if (!reg) return res.status(404).json({ message: 'Archived regulation not found or already active' });

    // 1. Restore CourseVersion
    await CourseVersion.updateMany(
      { regulationId: id, isDeleted: true },
      { isDeleted: false, deletedAt: null }
    );

    // 2. Removed CurriculumBook restore logic

    // 3. Restore MinorStream
    await MinorStream.updateMany(
      { regulationId: id, isDeleted: true },
      { isDeleted: false, deletedAt: null }
    );

    // 4. Restore PrerequisiteLink
    await PrerequisiteLink.updateMany(
      { regulationId: id, isDeleted: true },
      { isDeleted: false, deletedAt: null }
    );

    // 5. Restore CourseAssignment
    await CourseAssignment.updateMany(
      { regulationId: id, isDeleted: true },
      { isDeleted: false, deletedAt: null }
    );

    // 6. Restore PeoPso
    await PeoPso.updateMany(
      { regulationId: id, isDeleted: true },
      { isDeleted: false, deletedAt: null }
    );

    await AuditLog.create({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      action: 'RESTORE_REGULATION',
      details: `Restored regulation code ${reg.code} and cascade-reactivated associated courses, minor streams, and assignments.`,
      category: 'Configuration'
    });

    return res.status(200).json({
      regulation: reg,
      message: `Regulation ${reg.code} successfully restored.`
    });
  } catch (error) {
    return next(error);
  }
};

// ─────────────────────────────────────────────
// GET DELETED REGULATIONS
// ─────────────────────────────────────────────

export const getDeletedRegulations = async (req, res, next) => {
  try {
    const regulations = await Regulation.find({ isDeleted: true })
      .populate('programId')
      .sort({ academicYear: -1, code: -1 });
    return res.status(200).json({ regulations });
  } catch (error) {
    return next(error);
  }
};
