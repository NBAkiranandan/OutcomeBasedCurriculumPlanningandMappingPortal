import React, { useState, useEffect } from 'react';
import { useCurriculumBuilderStore } from './documentStore';
import { CourseSelectorModal } from './CourseSelectorModal';
import { api } from '../../../services/api';
import { useContextStore } from '../../../store/contextStore';

const SemesterSection = React.memo(({ semester, readOnly, onAddCourse, semesterCredits }: { semester: any, readOnly: boolean, onAddCourse: (sem: number) => void, semesterCredits: number }) => {
  const store = useCurriculumBuilderStore();
  const [showNotes, setShowNotes] = useState(!!semester.notes);
  const [showComments, setShowComments] = useState(false);

  return (
    <section className="mb-10 page-break-inside-avoid">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold uppercase">Semester {semester.semester}</h2>
          <p className="text-sm text-slate-500">{semester.courses.length} courses</p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2 print:hidden">
            <button 
              onClick={() => setShowNotes(!showNotes)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold uppercase text-slate-700 hover:bg-slate-50"
            >
              {showNotes ? 'Hide Guidelines' : 'Add Guidelines'}
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold uppercase text-amber-700 hover:bg-amber-100"
            >
              Review / Comment
            </button>
            <button 
              onClick={() => onAddCourse(semester.semester)}
              className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold uppercase text-blue-700 hover:bg-blue-100"
            >
              Add Course
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm mb-4">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-700">
              <th className="border border-slate-200 px-3 py-3 text-left">S.No</th>
              <th className="border border-slate-200 px-3 py-3 text-left">Course Code</th>
              <th className="border border-slate-200 px-3 py-3 text-left">Course Name</th>
              <th className="border border-slate-200 px-3 py-3 text-center">L</th>
              <th className="border border-slate-200 px-3 py-3 text-center">T</th>
              <th className="border border-slate-200 px-3 py-3 text-center">P</th>
              <th className="border border-slate-200 px-3 py-3 text-center">C</th>
              <th className="border border-slate-200 px-3 py-3 text-center">Category</th>
              <th className="border border-slate-200 px-3 py-3 text-center">Level</th>
            </tr>
          </thead>
          <tbody>
            {semester.courses.length === 0 ? (
              <tr>
                <td colSpan={9} className="border border-slate-200 p-6 text-center text-slate-500">No courses assigned to this semester yet.</td>
              </tr>
            ) : semester.courses.map((course: any, index: number) => (
              <tr key={course._id || `${semester.semester}-${index}`} className="even:bg-slate-50">
                <td className="border border-slate-200 px-3 py-2 text-center">{index + 1}</td>
                <td className="border border-slate-200 px-3 py-2 font-semibold">{course.code}</td>
                <td className="border border-slate-200 px-3 py-2">{course.title}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">{course.L}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">{course.T}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">{course.P}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">{course.credits}</td>
                <td className="border border-slate-200 px-3 py-2 text-center uppercase">{course.category}</td>
                <td className="border border-slate-200 px-3 py-2 text-center">{(() => { const l = ((course as any).courseLevel || (course as any).level || (course as any).knowledgeLevel || '').toLowerCase(); if (l.includes('ic') || l.includes('intermediate')) return 'IC'; if (l.includes('ac') || l.includes('advanced')) return 'AC'; if (l.includes('fc') || l.includes('foundation')) return 'FC'; return '-'; })()}</td>
              </tr>
            ))}
            {semester.courses.length > 0 && (
              <tr className="bg-slate-100 font-semibold">
                <td colSpan={3} className="border border-slate-200 px-3 py-3 text-right">Semester Total</td>
                <td className="border border-slate-200 px-3 py-3 text-center">{semester.courses.reduce((sum: any, course: any) => sum + (course.L || 0), 0)}</td>
                <td className="border border-slate-200 px-3 py-3 text-center">{semester.courses.reduce((sum: any, course: any) => sum + (course.T || 0), 0)}</td>
                <td className="border border-slate-200 px-3 py-3 text-center">{semester.courses.reduce((sum: any, course: any) => sum + (course.P || 0), 0)}</td>
                <td className="border border-slate-200 px-3 py-3 text-center">{semesterCredits}</td>
                <td colSpan={2} className="border border-slate-200 px-3 py-3"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showNotes && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner mb-4">
          <div className="text-xs font-bold uppercase text-slate-500 mb-2">Semester Guidelines / Notes</div>
          {readOnly ? (
            <div className="whitespace-pre-wrap text-sm text-slate-700 min-h-[40px]">
              {semester.notes || <span className="text-slate-400 italic">No guidelines provided.</span>}
            </div>
          ) : (
            <textarea
              className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[80px]"
              placeholder="Add formatting using markdown (e.g., **bold**, - list items)..."
              value={semester.notes || ''}
              onChange={(e) => store.updateSemesterNotes(semester.semester, e.target.value)}
            />
          )}
        </div>
      )}

      {showComments && !readOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm mb-4 print:hidden">
          <div className="text-xs font-bold uppercase text-amber-700 mb-2">Reviewer Comments</div>
          <div className="text-sm text-amber-900 mb-3 bg-white p-3 rounded-xl border border-amber-100">
            <span className="font-bold">Admin:</span> Please ensure the credit limits match the AICTE guidelines for Semester {semester.semester}.
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" 
              placeholder="Reply or add a comment..."
            />
            <button className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-amber-700">Post</button>
          </div>
        </div>
      )}
    </section>
  );
});

// We will dynamically extract categories from the courses to ensure no category is missing.
export const DocumentEditor: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const store = useCurriculumBuilderStore();
  const { selectedRegulation, selectedDepartment } = useContextStore();
  const [minorDegrees, setMinorDegrees] = useState<any[]>([]);

  useEffect(() => {
    if (selectedRegulation?._id && selectedDepartment?._id) {
      api.minorDegrees.getAllPublished({ regulationId: selectedRegulation._id }).then((res: any) => {
        const minorsObj = res.publishedMinorDegrees || {};
        const minorsForDept = minorsObj[selectedDepartment.name] || [];
        setMinorDegrees(minorsForDept);
      }).catch((e: any) => console.error("Failed to load minor degrees", e));
    }
  }, [selectedRegulation, selectedDepartment]);

  const allCourses = store.semesters.flatMap((sem) => sem.courses);
  const dynamicCategories = Array.from(new Set(allCourses.map((course) => course.category || 'MCC')));
  const categoryTotals = dynamicCategories.reduce((acc, category) => {
    acc[category] = allCourses
      .filter((course) => (course.category || 'MCC') === category)
      .reduce((sum, course) => sum + (course.credits || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  const totalCredits = allCourses.reduce((sum, course) => sum + (course.credits || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-300 p-8 flex flex-col items-center">
      <div 
        id="live-preview-document" 
        className="bg-white shadow-2xl origin-top transition-transform duration-200"
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          fontFamily: '"Times New Roman", Times, serif',
          transform: `scale(${store.zoomLevel / 100})`,
          marginBottom: `${(store.zoomLevel / 100 - 1) * 297}mm`
        }}
      >
        <div className="px-[20mm] py-[18mm]">
          <div className="text-center mb-10">
            <div className="text-sm uppercase tracking-[0.5em] text-slate-500">Aditya University</div>
            <h1 className="mt-4 text-3xl font-bold uppercase">Curriculum Structure & Syllabus</h1>
            <p className="mt-3 text-sm text-slate-600">Regulation {store.regulation} | Academic Year {store.academicYear}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 mb-10 text-sm text-slate-800">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Program</div>
              <div className="font-semibold">{store.program}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Department</div>
              <div className="font-semibold">{store.department}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Regulation</div>
              <div className="font-semibold">{store.regulation}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Total Credits</div>
              <div className="font-semibold">{store.totalCredits}</div>
            </div>
          </div>

          {store.isLoading ? (
            <div className="min-h-[240px] rounded-3xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 font-semibold">Loading curriculum...</div>
          ) : store.error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 font-semibold">{store.error}</div>
          ) : store.semesters.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-slate-600 font-semibold">No curriculum data available for the selected regulation.</div>
          ) : (
            store.semesters.map((semester) => {
              const semesterCredits = semester.courses.reduce((sum, course) => sum + (course.credits || 0), 0);
              return (
                <SemesterSection 
                  key={semester.semester} 
                  semester={semester} 
                  readOnly={readOnly} 
                  onAddCourse={store.openCourseSelector} 
                  semesterCredits={semesterCredits} 
                />
              );
            })
          )}

          {minorDegrees.length > 0 && (
            <section className="mb-10 page-break-inside-avoid mt-8 border-t border-slate-300 pt-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold uppercase text-slate-800">Minor Degrees Offered</h2>
                <p className="text-sm text-slate-500">Cross-departmental minor degrees associated with this curriculum.</p>
              </div>

              {minorDegrees.map((minor: any) => (
                <div key={minor._id} className="mb-8">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-md font-bold uppercase text-slate-700">{minor.minorName}</h3>
                      <p className="text-sm text-slate-500">
                        {minor.courses?.length || 0} courses | {minor.requiredCredits} Required Credits
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700">
                          <th className="border border-slate-200 px-3 py-3 text-left">S.No</th>
                          <th className="border border-slate-200 px-3 py-3 text-left">Course Code</th>
                          <th className="border border-slate-200 px-3 py-3 text-left">Course Name</th>
                          <th className="border border-slate-200 px-3 py-3 text-center">C</th>
                          <th className="border border-slate-200 px-3 py-3 text-center">Semester</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!minor.courses || minor.courses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="border border-slate-200 p-6 text-center text-slate-500">No courses assigned to this minor degree.</td>
                          </tr>
                        ) : minor.courses.map((course: any, index: number) => (
                          <tr key={course._id || index} className="even:bg-slate-50">
                            <td className="border border-slate-200 px-3 py-2 text-center">{index + 1}</td>
                            <td className="border border-slate-200 px-3 py-2 font-semibold">{course.courseCode}</td>
                            <td className="border border-slate-200 px-3 py-2">{course.courseName}</td>
                            <td className="border border-slate-200 px-3 py-2 text-center">{course.credits}</td>
                            <td className="border border-slate-200 px-3 py-2 text-center">{course.semester || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </section>
          )}

          <div className="mb-12 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-bold uppercase text-slate-900">Cumulative Credit Summary by Category</h3>
                <p className="text-sm text-slate-500">Reflects the full regulation curriculum.</p>
              </div>
              <div className="text-sm font-semibold text-slate-700">Credits rendered: {totalCredits}</div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {dynamicCategories.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-slate-200 bg-white p-4 text-center text-slate-500">
                  No courses added yet.
                </div>
              ) : dynamicCategories.map((category) => (
                <div key={category} className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{category}</div>
                  <div className="mt-3 text-3xl font-bold text-slate-900">{categoryTotals[category] || 0}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400 mt-1">credits</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {!readOnly && <CourseSelectorModal />}
    </div>
  );
};
