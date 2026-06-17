const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, '../src/modules/hod/components');

const components = [
  'DashboardView',
  'PeoManagementView',
  'PsoManagementView',
  'CourseRepositoryView',
  'CourseAssignmentView',
  'CourseApprovalsView',
  'SyllabusApprovalsView',
  'MinorStreamsView',
  'PrerequisitesView',
  'CurriculumBuilderView',
  'ReportsView'
];

components.forEach(comp => {
  const content = `import React from 'react';\n\nexport const ${comp}: React.FC = () => {\n  return (\n    <div className="p-6">\n      <h1 className="text-2xl font-bold text-slate-800">${comp.replace(/([A-Z])/g, ' $1').trim()}</h1>\n      <p className="text-slate-500 mt-2">Work in progress...</p>\n    </div>\n  );\n};\n`;
  fs.writeFileSync(path.join(componentsDir, `${comp}.tsx`), content);
});

console.log('Components generated.');
