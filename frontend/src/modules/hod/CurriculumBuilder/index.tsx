import React, { useEffect } from 'react';
import { DocumentNavigator } from './DocumentNavigator';
import { DocumentEditor } from './DocumentEditor';
import { exportToPDF, exportToWord } from './ExportUtils';
import { useCurriculumBuilderStore } from './documentStore';
import { Download, FileText, FileDown, ZoomIn, ZoomOut, Save } from 'lucide-react';
import { useContextStore } from '../../../store/contextStore';
import { api } from '../../../services/api';

export const CurriculumBuilder: React.FC<{ readOnly?: boolean }> = ({ readOnly = false }) => {
  const store = useCurriculumBuilderStore();
  const { selectedRegulation, selectedDepartment, selectedProgram } = useContextStore();

  useEffect(() => {
    const syncData = async () => {
      if (selectedRegulation) {
        await store.loadCurriculum(selectedRegulation._id);
        store.setField('regulation', selectedRegulation.code);
        store.setField('academicYear', `${selectedRegulation.academicYear}-${selectedRegulation.academicYear + 1}`);
      }

      if (selectedDepartment) {
        store.setField('department', selectedDepartment.name);
      }
      if (selectedProgram) {
        store.setField('program', selectedProgram.code);
      }
    };

    syncData();
  }, [selectedRegulation, selectedDepartment, selectedProgram]);

  const handleDownloadPDF = () => {
    exportToPDF('live-preview-document', `${store.program}_${store.department}_Curriculum`);
  };

  const handleDownloadWord = () => {
    exportToWord(store, `${store.program}_${store.department}_Curriculum`);
  };

  const timeAgo = store.lastSaved ? Math.floor((new Date().getTime() - store.lastSaved.getTime()) / 60000) : 0;
  const saveText = timeAgo === 0 ? 'Saved just now' : `Saved ${timeAgo}m ago`;

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <FileText className="text-blue-600" /> {readOnly ? 'Curriculum View' : 'Curriculum Editor'}
          </h2>
          {!readOnly && (
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              {store.isSaving ? (
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> Saving...</span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600"><Save size={14}/> {saveText}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button onClick={() => store.setZoom(Math.max(50, store.zoomLevel - 10))} className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-colors"><ZoomOut size={16} /></button>
            <span className="text-xs font-bold text-slate-600 w-12 text-center">{store.zoomLevel}%</span>
            <button onClick={() => store.setZoom(Math.min(200, store.zoomLevel + 10))} className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 transition-colors"><ZoomIn size={16} /></button>
          </div>
          
          <div className="flex gap-2 border-l border-slate-200 pl-6">
            <button 
              onClick={handleDownloadWord}
              className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 rounded-lg hover:bg-slate-100 hover:text-blue-700 transition-colors"
            >
              <FileDown size={16} /> Download Word
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 shadow transition-all"
            >
              <Download size={16} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        <DocumentNavigator />
        <DocumentEditor readOnly={readOnly} />
      </div>
    </div>
  );
};

export default CurriculumBuilder;
