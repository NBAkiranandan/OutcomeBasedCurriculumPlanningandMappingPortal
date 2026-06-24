import sys

def main():
    try:
        with open('frontend/src/modules/faculty/FacultyDashboard.tsx', 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        # The block was replaced but badly expanded. We need to find where it starts and ends now.
        # It starts at "      {/* ============================================================== */}"
        # It ends at "      )}", before "      {/* ============================================================== */}\n      {/* 4.5 CURRICULUM BOOK */}"
        start_idx = -1
        end_idx = -1
        
        for i, line in enumerate(lines):
            if "NEW VIEW COURSES PAGE" in line:
                start_idx = i - 1
                break
                
        for i in range(start_idx + 1, len(lines)):
            if "4.5 CURRICULUM BOOK" in lines[i]:
                end_idx = i - 1
                break
                
        replacement = """      {/* ============================================================== */}
      {/* NEW VIEW COURSES PAGE (PREVIEW) */}
      {/* ============================================================== */}
      {activeTab === 'view-courses' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 font-sans">View Courses</h1>
            <p className="text-xs text-slate-500 mt-1 font-semibold">View accreditation-ready syllabus documents for your assigned courses.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
            
            {/* Left sidebar: Assigned courses */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">YOUR ASSIGNED COURSES</h4>
              
              <div className="space-y-2">
                {approvedCourses.length === 0 ? (
                  <p className="text-slate-400 italic text-xs">No approved courses assigned.</p>
                ) : (
                  approvedCourses.map((v: any) => {
                    const isSelected = selectedCourseId === v._id;
                    return (
                      <div 
                        key={v._id}
                        onClick={() => {
                          setSelectedCourseId(v._id);
                          setSelectedCourseCode(v.courseId?.code);
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left space-y-1 ${
                          isSelected ? 'border-blue-600 bg-blue-50/10' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className={`text-[11px] font-bold block ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                          {v.courseId?.code}
                        </span>
                        <span className={`text-[10px] font-semibold block ${isSelected ? 'text-blue-800' : 'text-slate-600'}`}>
                          {v.courseId?.title}
                        </span>
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase tracking-wider">
                          Sem {v.semester} | {v.category || 'Theory'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right details card: PdfCoursePage */}
            <div className="md:col-span-3 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-slate-300" />
                  Read-Only Preview
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded font-semibold">
                  Syllabus Document
                </span>
              </div>
              
              <div className="bg-slate-200 border border-slate-300 rounded-2xl p-6 shadow-inner overflow-y-auto max-h-[800px] flex justify-center">
                {(() => {
                  const activeVersion = approvedCourses.find(v => v._id === selectedCourseId) || approvedCourses[0];
                  if (!activeVersion) return <p className="text-slate-500 font-semibold text-sm py-20">No course selected.</p>;
                  return (
                    <div className="shadow-[0_4px_24px_rgba(0,0,0,0.35)] w-[210mm] flex-shrink-0 bg-white">
                      <PdfCoursePageStyles />
                      <PdfCoursePage 
                        courseVersion={activeVersion}
                        departmentName={getDepartmentName()}
                        departmentCode={getDepartmentCode()}
                        regulationYear={selectedRegulation?.code || 'Regulation'}
                        showFooter={true}
                        forcePageBreak={false}
                      />
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
\n"""

        new_lines = lines[:start_idx] + [replacement] + lines[end_idx:]
        with open('frontend/src/modules/faculty/FacultyDashboard.tsx', 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print("Success")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
