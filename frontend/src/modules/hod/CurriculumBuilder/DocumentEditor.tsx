import React from 'react';
import { useCurriculumBuilderStore } from './documentStore';
import { CourseSelectorModal } from './CourseSelectorModal';

const SUMMARY_CATEGORIES = ['MCC', 'MDC', 'AEC', 'SEC', 'VAC', 'SI', 'PROJ', 'MC', 'PE', 'OE', 'ES', 'HS'];

export const DocumentEditor: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const store = useCurriculumBuilderStore();
  const allCourses = store.semesters.flatMap((sem) => sem.courses);
  const categoryTotals = SUMMARY_CATEGORIES.reduce((acc, category) => {
    acc[category] = allCourses
      .filter((course) => course.category === category)
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
                <section key={semester.semester} className="mb-10 page-break-inside-avoid">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold uppercase">Semester {semester.semester}</h2>
                      <p className="text-sm text-slate-500">{semester.courses.length} courses</p>
                    </div>
                    {!readOnly && (
                      <button 
                        onClick={() => store.openCourseSelector(semester.semester)}
                        className="print:hidden rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold uppercase text-blue-700 hover:bg-blue-100"
                      >Add Course</button>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-3xl border border-slate-200 shadow-sm">
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
                        ) : semester.courses.map((course, index) => (
                          <tr key={course._id || `${semester.semester}-${index}`} className="even:bg-slate-50">
                            <td className="border border-slate-200 px-3 py-2 text-center">{index + 1}</td>
                            <td className="border border-slate-200 px-3 py-2 font-semibold">{course.code}</td>
                            <td className="border border-slate-200 px-3 py-2">{course.title}</td>
                            <td className="border border-slate-200 px-3 py-2 text-center">{course.L}</td>
                            <td className="border border-slate-200 px-3 py-2 text-center">{course.T}</td>
                            <td className="border border-slate-200 px-3 py-2 text-center">{course.P}</td>
                            <td className="border border-slate-200 px-3 py-2 text-center">{course.credits}</td>
                            <td className="border border-slate-200 px-3 py-2 text-center uppercase">{course.category}</td>
                            <td className="border border-slate-200 px-3 py-2 text-center">{(course as any).courseLevel || '-'}</td>
                          </tr>
                        ))}
                        {semester.courses.length > 0 && (
                          <tr className="bg-slate-100 font-semibold">
                            <td colSpan={3} className="border border-slate-200 px-3 py-3 text-right">Semester Total</td>
                            <td className="border border-slate-200 px-3 py-3 text-center">{semester.courses.reduce((sum, course) => sum + (course.L || 0), 0)}</td>
                            <td className="border border-slate-200 px-3 py-3 text-center">{semester.courses.reduce((sum, course) => sum + (course.T || 0), 0)}</td>
                            <td className="border border-slate-200 px-3 py-3 text-center">{semester.courses.reduce((sum, course) => sum + (course.P || 0), 0)}</td>
                            <td className="border border-slate-200 px-3 py-3 text-center">{semesterCredits}</td>
                            <td colSpan={2} className="border border-slate-200 px-3 py-3"></td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })
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
              {SUMMARY_CATEGORIES.map((category) => (
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
