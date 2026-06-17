const fs = require('fs');
const path = 'src/modules/hod/HodDashboard.tsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Update editCourseData state
content = content.replace(
  `const [editCourseData, setEditCourseData] = useState({ semester: 1, category: 'PC', L: 3, T: 0, P: 0, S: 0, C: 3, coordinatorId: '' });`,
  `const [editCourseData, setEditCourseData] = useState({
    title: '', code: '', programId: '', category: 'PC', semester: 1, courseLevel: 'FC - Foundation', status: 'Active',
    L: 3, T: 0, P: 0, S: 0, C: 3, cieMarks: 40, seeMarks: 60,
    description: '', offeredFor: ['CSE'], objectives: [''], coordinatorId: '', prerequisites: ''
  });`
);

// 2. Update handleSaveCourseEdit
const oldHandleSave = `  const handleSaveCourseEdit = async () => {
    try {
      if (!approvalEditModal.version) return;
      await api.courses.saveDraft(approvalEditModal.version._id, {
        semester: editCourseData.semester,
        category: editCourseData.category,
        credits: { L: editCourseData.L, T: editCourseData.T, P: editCourseData.P, S: editCourseData.S, C: editCourseData.C }
      });

      if (editCourseData.coordinatorId && editCourseData.coordinatorId !== (approvalEditModal.version.coordinatorId?._id || approvalEditModal.version.coordinatorId)) {
        await api.courses.assign({
          courseVersionId: approvalEditModal.version._id,
          coordinatorId: editCourseData.coordinatorId
        });
      }

      alert('Course details updated successfully.');
      setApprovalEditModal({ open: false, version: null });
      loadData();
    } catch (err: any) {
      alert(\`Failed to update course: \${err.message}\`);
    }
  };`;

const newHandleSave = `  const handleSaveCourseEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      if (!approvalEditModal.version) return;
      await api.courses.saveDraft(approvalEditModal.version._id, {
        semester: editCourseData.semester,
        category: editCourseData.category,
        courseLevel: editCourseData.courseLevel,
        status: editCourseData.status,
        credits: { L: editCourseData.L, T: editCourseData.T, P: editCourseData.P, S: editCourseData.S, C: editCourseData.C },
        cieSee: { cieMaxMarks: editCourseData.cieMarks, seeMaxMarks: editCourseData.seeMarks },
        description: editCourseData.description,
        offeredFor: editCourseData.offeredFor,
        objectives: editCourseData.objectives,
        prerequisites: editCourseData.prerequisites ? [editCourseData.prerequisites] : []
      });

      if (editCourseData.coordinatorId && editCourseData.coordinatorId !== (approvalEditModal.version.coordinatorId?._id || approvalEditModal.version.coordinatorId)) {
        await api.courses.assign({
          courseVersionId: approvalEditModal.version._id,
          coordinatorId: editCourseData.coordinatorId
        });
      }

      alert('Course details updated successfully.');
      setApprovalEditModal({ open: false, version: null });
      loadData();
    } catch (err: any) {
      alert(\`Failed to update course: \${err.message}\`);
    }
  };`;

content = content.replace(oldHandleSave, newHandleSave);

// 3. Update setEditCourseData at line 1300
const oldSetEdit1 = `                                  setEditCourseData({
                                    semester: v.semester || 1,
                                    category: v.category || 'PC',
                                    L: v.credits?.L || 0,
                                    T: v.credits?.T || 0,
                                    P: v.credits?.P || 0,
                                    S: v.credits?.S || 0,
                                    C: v.credits?.C || 0,
                                    coordinatorId: v.coordinatorId?._id || v.coordinatorId || '',
                                  });`;
                                  
const newSetEdit1 = `                                  setEditCourseData({
                                    title: v.courseId?.title || '',
                                    code: v.courseId?.code || '',
                                    programId: v.programId || '',
                                    category: v.category || 'PC',
                                    semester: v.semester || 1,
                                    courseLevel: v.courseLevel || 'FC - Foundation',
                                    status: v.status || 'Active',
                                    L: v.credits?.L || 0,
                                    T: v.credits?.T || 0,
                                    P: v.credits?.P || 0,
                                    S: v.credits?.S || 0,
                                    C: v.credits?.C || 0,
                                    cieMarks: v.cieSee?.cieMaxMarks || 40,
                                    seeMarks: v.cieSee?.seeMaxMarks || 60,
                                    description: v.description || '',
                                    offeredFor: v.offeredFor || ['CSE'],
                                    objectives: v.objectives?.length ? v.objectives : [''],
                                    coordinatorId: v.coordinatorId?._id || v.coordinatorId || '',
                                    prerequisites: v.prerequisites?.[0] || ''
                                  });`;
content = content.replace(oldSetEdit1, newSetEdit1);

// 4. Update setEditCourseData at line 1711
const oldSetEdit2 = `                          setEditCourseData({
                            semester: v.semester || 1,
                            category: v.category || 'PC',
                            L: v.credits?.L || 0,
                            T: v.credits?.T || 0,
                            P: v.credits?.P || 0,
                            S: v.credits?.S || 0,
                            C: v.credits?.C || 0,
                            coordinatorId: v.coordinatorId?._id || v.coordinatorId || '',
                          });`;
content = content.replace(oldSetEdit2, newSetEdit1.replace(/                                  /g, '                          '));

// 5. Replace Course Approval Edit Modal UI
const fsContent = fs.readFileSync(path, 'utf8');
const modalStartIdx = fsContent.indexOf('{/* Course Approval Edit Modal */}');
const modalEndStr = '      )}';
const modalEndIdx = fsContent.indexOf(modalEndStr, modalStartIdx) + modalEndStr.length;

const oldModalText = fsContent.substring(modalStartIdx, modalEndIdx);

const newModal = `{\/\* Course Approval Edit Modal \*\/}
      {approvalEditModal.open && approvalEditModal.version && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white w-[650px] max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl border border-slate-200">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Edit3 className="w-5 h-5 text-teal-700" />
                <span>Review & Edit Course</span>
              </h3>
              <button onClick={() => setApprovalEditModal({ open: false, version: null })} className="text-slate-400 hover:text-slate-700 text-lg font-bold">✕</button>
            </div>
            <form onSubmit={handleSaveCourseEdit} className="p-6 space-y-4 text-xs font-bold text-slate-500">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span>Course Name</span>
                  <input
                    type="text"
                    value={editCourseData.title}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-400 font-semibold outline-none bg-slate-50"
                    disabled
                  />
                </div>
                <div className="space-y-1">
                  <span>Course Code</span>
                  <input
                    type="text"
                    value={editCourseData.code}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-400 font-semibold outline-none bg-slate-50"
                    disabled
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span>Program</span>
                  <select
                    value={editCourseData.programId}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-400 outline-none bg-slate-50 font-semibold"
                    disabled
                  >
                    <option value="">B.Tech</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span>Department</span>
                  <select className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-400 outline-none bg-slate-50 font-semibold" disabled>
                    <option>{selectedDepartment?.name || 'Computer Science and Engineering'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span>Regulation</span>
                  <select className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-400 outline-none bg-slate-50 font-semibold" disabled>
                    <option>{selectedRegulation?.code || 'R2025'}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span>Course Type *</span>
                  <select
                    value={editCourseData.category}
                    onChange={(e) => setEditCourseData({ ...editCourseData, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none bg-white"
                  >
                    <option value="PC">Professional Core (PC)</option>
                    <option value="PE">Professional Elective (PE)</option>
                    <option value="OE">Open Elective (OE)</option>
                    <option value="BS">Basic Sciences (BS)</option>
                    <option value="ES">Engineering Sciences (ES)</option>
                    <option value="HS">Humanities & Social Sciences (HS)</option>
                    <option value="MC">Mandatory Course (MC)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span>Course Level</span>
                  <select
                    value={editCourseData.courseLevel}
                    onChange={(e) => setEditCourseData({ ...editCourseData, courseLevel: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none bg-white"
                  >
                    <option value="FC - Foundation">FC - Foundation</option>
                    <option value="PC - Core">PC - Core</option>
                    <option value="PE - Elective">PE - Elective</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span>Semester *</span>
                  <select
                    value={editCourseData.semester}
                    onChange={(e) => setEditCourseData({ ...editCourseData, semester: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none bg-white"
                  >
                    {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <span>Status</span>
                  <select
                    value={editCourseData.status}
                    onChange={(e) => setEditCourseData({ ...editCourseData, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* L-T-P-S-C Grid */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wide block">L-T-P-S—C Structure</span>
                <div className="grid grid-cols-5 gap-3 font-mono">
                  <div className="space-y-1">
                    <span className="text-center block text-[9px]">L</span>
                    <input
                      type="number"
                      value={editCourseData.L}
                      onChange={(e) => {
                        const lVal = parseInt(e.target.value) || 0;
                        const cVal = lVal + (editCourseData.T) + (editCourseData.P / 2) + (editCourseData.S);
                        setEditCourseData({ ...editCourseData, L: lVal, C: cVal });
                      }}
                      className="w-full text-center border border-slate-300 rounded p-1.5 text-slate-700 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-center block text-[9px]">T</span>
                    <input
                      type="number"
                      value={editCourseData.T}
                      onChange={(e) => {
                        const tVal = parseInt(e.target.value) || 0;
                        const cVal = (editCourseData.L) + tVal + (editCourseData.P / 2) + (editCourseData.S);
                        setEditCourseData({ ...editCourseData, T: tVal, C: cVal });
                      }}
                      className="w-full text-center border border-slate-300 rounded p-1.5 text-slate-700 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-center block text-[9px]">P</span>
                    <input
                      type="number"
                      value={editCourseData.P}
                      onChange={(e) => {
                        const pVal = parseInt(e.target.value) || 0;
                        const cVal = (editCourseData.L) + (editCourseData.T) + (pVal / 2) + (editCourseData.S);
                        setEditCourseData({ ...editCourseData, P: pVal, C: cVal });
                      }}
                      className="w-full text-center border border-slate-300 rounded p-1.5 text-slate-700 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-center block text-[9px]">S</span>
                    <input
                      type="number"
                      value={editCourseData.S}
                      onChange={(e) => {
                        const sVal = parseInt(e.target.value) || 0;
                        const cVal = (editCourseData.L) + (editCourseData.T) + (editCourseData.P / 2) + sVal;
                        setEditCourseData({ ...editCourseData, S: sVal, C: cVal });
                      }}
                      className="w-full text-center border border-slate-300 rounded p-1.5 text-slate-700 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-center block text-[9px] font-bold text-teal-800">Credits (C)</span>
                    <input
                      type="number"
                      value={editCourseData.C}
                      onChange={(e) => setEditCourseData({ ...editCourseData, C: parseInt(e.target.value) || 0 })}
                      className="w-full text-center border border-teal-300 font-bold bg-teal-50 rounded p-1.5 text-teal-850"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span>Course Offered for Branches *</span>
                <div className="grid grid-cols-4 gap-2">
                  {branchOptions.map((branch) => {
                    const isChecked = editCourseData.offeredFor.includes(branch);
                    return (
                      <label key={branch} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const offeredFor = isChecked
                              ? editCourseData.offeredFor.filter((item) => item !== branch)
                              : [...editCourseData.offeredFor, branch];
                            setEditCourseData({ ...editCourseData, offeredFor });
                          }}
                          className="accent-teal-700"
                        />
                        <span>{branch}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <span>CIE Marks</span>
                  <input
                    type="number"
                    value={editCourseData.cieMarks}
                    onChange={(e) => setEditCourseData({ ...editCourseData, cieMarks: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <span>SEE Marks</span>
                  <input
                    type="number"
                    value={editCourseData.seeMarks}
                    onChange={(e) => setEditCourseData({ ...editCourseData, seeMarks: parseInt(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <span>Total Marks (AUTO)</span>
                  <input
                    type="number"
                    value={editCourseData.cieMarks + editCourseData.seeMarks}
                    readOnly
                    className="w-full border border-teal-200 bg-teal-50/50 rounded-lg p-2.5 text-teal-850 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span>Course Coordinator</span>
                <select
                  value={editCourseData.coordinatorId}
                  onChange={(e) => setEditCourseData({ ...editCourseData, coordinatorId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 font-semibold outline-none bg-white"
                >
                  <option value="">-- Choose Coordinator --</option>
                  {faculty.map(f => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span>Prerequisites</span>
                <input
                  type="text"
                  placeholder="e.g. CS201 - Data Structures"
                  value={editCourseData.prerequisites}
                  onChange={(e) => setEditCourseData({ ...editCourseData, prerequisites: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-slate-700 bg-white outline-none focus:ring-1 focus:ring-teal-700"
                />
              </div>

              <div className="flex gap-3 pt-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setApprovalEditModal({ open: false, version: null })}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg font-bold shadow cursor-pointer transition-all animate-pulse"
                >
                  Save Course Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}`;

content = content.replace(oldModalText, newModal);
fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated HodDashboard.tsx');
