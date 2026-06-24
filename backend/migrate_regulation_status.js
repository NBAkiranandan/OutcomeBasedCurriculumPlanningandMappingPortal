/**
 * Migration Script: Regulation Status Enum Update
 * 
 * Converts existing regulation status values:
 *   Draft      → DRAFT
 *   Published  → ACTIVE
 *   Archived   → ARCHIVED
 * 
 * Also initializes lifecycleHistory: [] for all regulations that lack it.
 * 
 * Run once with: node migrate_regulation_status.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/obcpmp';

const statusMap = {
  'Draft': 'DRAFT',
  'Published': 'ACTIVE',
  'Archived': 'ARCHIVED'
};

async function migrate() {
  console.log('[Migration] Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('[Migration] Connected.');

  const db = mongoose.connection.db;
  const regulations = db.collection('regulations');

  const all = await regulations.find({}).toArray();
  console.log(`[Migration] Found ${all.length} regulations.`);

  let updated = 0;
  let skipped = 0;

  for (const reg of all) {
    const oldStatus = reg.status;
    const newStatus = statusMap[oldStatus];
    
    const updates = {};
    
    // Migrate status if it's an old-style value
    if (newStatus) {
      updates.status = newStatus;
      console.log(`  → ${reg.code}: "${oldStatus}" → "${newStatus}"`);
    } else if (!['DRAFT', 'ACTIVE', 'LOCKED', 'ARCHIVED'].includes(oldStatus)) {
      // Unknown or missing status — default to DRAFT
      updates.status = 'DRAFT';
      console.log(`  → ${reg.code}: "${oldStatus || 'undefined'}" → "DRAFT" (fallback)`);
    } else {
      console.log(`  ✓ ${reg.code}: already "${oldStatus}" — no migration needed`);
      skipped++;
    }
    
    // Initialize lifecycleHistory if missing
    if (!Array.isArray(reg.lifecycleHistory)) {
      updates.lifecycleHistory = [];
    }
    
    // Initialize lifecycle tracking fields if missing
    if (reg.activatedBy === undefined) updates.activatedBy = null;
    if (reg.activatedAt === undefined) updates.activatedAt = null;
    if (reg.lockedBy === undefined) updates.lockedBy = null;
    if (reg.lockedAt === undefined) updates.lockedAt = null;
    if (reg.archivedBy === undefined) updates.archivedBy = null;
    if (reg.archivedAt === undefined) updates.archivedAt = null;
    
    if (Object.keys(updates).length > 0) {
      await regulations.updateOne(
        { _id: reg._id },
        { $set: updates }
      );
      updated++;
    }
  }

  console.log(`\n[Migration] Complete!`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (already correct): ${skipped}`);
  
  await mongoose.disconnect();
  console.log('[Migration] Disconnected.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('[Migration] FAILED:', err);
  process.exit(1);
});
