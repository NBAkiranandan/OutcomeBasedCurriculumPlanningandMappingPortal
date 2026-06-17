import React, { useState, useEffect } from 'react';
import { useCurriculumBuilderStore, CourseData } from './documentStore';
import { api } from '../../../services/api';
import { useContextStore } from '../../../store/contextStore';
import { Search, Plus, X } from 'lucide-react';

export const CourseSelectorModal: React.FC = () => {
  const store = useCurriculumBuilderStore();
  const { selectedDepartment, selectedRegulation } = useContextStore();
  const [availableCourses, setAvailableCourses] = useState<CourseData[]>([]);
  const [courseSearch, setCourseSearch] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      if (selectedDepartment && store.courseSelectorOpen) {
        try {
          const courseRes = await api.courses.listByDept(selectedDepartment._id);
          let regVersions: any[] = [];
          if (selectedRegulation) {
            const verRes = await api.courses.listByReg(selectedRegulation._id);
            regVersions = verRes.versions || [];
          }
          
          const mapped = (courseRes.courses || []).map((c: any) => {
            const ver = regVersions.find((v: any) => (v.courseId?._id || v.courseId) === c._id);
            return {
              _id: c._id,
              code: c.code,
              title: c.title,
              category: ver?.category || 'PC',
              L: ver?.credits?.L || 3,
              T: ver?.credits?.T || 0,
              P: ver?.credits?.P || 0,
              S: ver?.credits?.S || 0,
              credits: ver?.credits?.C || 3
            };
          });
          setAvailableCourses(mapped);
        } catch (e) {
          console.error(e);
        }
      }
    };
    fetchCourses();
  }, [selectedDepartment, selectedRegulation, store.courseSelectorOpen]);

  if (!store.courseSelectorOpen || store.targetSemesterForCourse === null) return null;

  const filteredCourses = availableCourses.filter(c => 
    c.title.toLowerCase().includes(courseSearch.toLowerCase()) || 
    c.code.toLowerCase().includes(courseSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden animate-fadeIn">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Select Course from Repository</h2>
            <p className="text-xs text-slate-500 font-semibold mt-1">Adding to Semester {store.targetSemesterForCourse}</p>
          </div>
          <button 
            onClick={store.closeCourseSelector}
            className="text-slate-400 hover:text-slate-700 bg-white border border-slate-200 p-2 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by course code or title..." 
              value={courseSearch}
              onChange={e => setCourseSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 bg-slate-50">
          {filteredCourses.length === 0 ? (
            <div className="p-12 text-center text-sm font-semibold text-slate-400">
              No repository courses found matching your criteria.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCourses.map(course => {
                const isAlreadyAdded = store.semesters.some(s => s.courses.some(c => c._id === course._id));
                return (
                  <div key={course._id} className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center hover:border-blue-300 hover:shadow-md transition-all group">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{course.code}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{course.category}</span>
                      </div>
                      <div className="font-bold text-slate-800 text-sm">{course.title}</div>
                      <div className="text-[11px] font-mono font-semibold text-slate-500 mt-2">L:{course.L} T:{course.T} P:{course.P} C:{course.credits}</div>
                    </div>
                    {isAlreadyAdded ? (
                      <span className="text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold font-sans">
                        Added
                      </span>
                    ) : (
                      <button 
                        onClick={() => store.addCourseToSemester(store.targetSemesterForCourse!, course)}
                        className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Plus size={16}/> Select
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
