import React from 'react';
import { useCurriculumBuilderStore } from './documentStore';
import { FileText, Book, LayoutList, Target, Layers } from 'lucide-react';

export const DocumentNavigator: React.FC = () => {
  const store = useCurriculumBuilderStore();

  const handleNavClick = (id: string) => {
    store.setActiveSection(id);
    const element = document.getElementById(`section-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { id: 'cover', label: 'Cover Page', icon: <FileText size={16} /> },
    { id: 'metadata', label: 'Vision & Mission', icon: <Target size={16} /> },
    { id: 'peo-pso', label: 'PEOs & PSOs', icon: <Target size={16} /> },
    { id: 'semester-1', label: 'Semester 1', icon: <Layers size={16} />, sub: true },
    { id: 'semester-2', label: 'Semester 2', icon: <Layers size={16} />, sub: true },
    { id: 'semester-3', label: 'Semester 3', icon: <Layers size={16} />, sub: true },
    { id: 'semester-4', label: 'Semester 4', icon: <Layers size={16} />, sub: true },
    { id: 'semester-5', label: 'Semester 5', icon: <Layers size={16} />, sub: true },
    { id: 'semester-6', label: 'Semester 6', icon: <Layers size={16} />, sub: true },
    { id: 'semester-7', label: 'Semester 7', icon: <Layers size={16} />, sub: true },
    { id: 'semester-8', label: 'Semester 8', icon: <Layers size={16} />, sub: true },
  ];

  return (
    <div className="h-full bg-slate-50 border-r border-slate-200 flex flex-col w-64 shrink-0 shadow-lg z-20">
      <div className="p-4 border-b border-slate-200 bg-white">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Book className="text-blue-600" size={18} />
          Document Outline
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors ${
              store.activeSectionId === item.id 
                ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent'
            } ${item.sub ? 'pl-8' : ''}`}
          >
            <span className={store.activeSectionId === item.id ? 'text-blue-600' : 'text-slate-400'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
