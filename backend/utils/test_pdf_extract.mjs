import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pdfParseModule = require('pdf-parse');
const pdfParse = pdfParseModule.default || pdfParseModule;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.resolve(__dirname, '../../src/assets/B.Tech_CSE_ProgramStructure_Syllabus (2)R24.pdf');

console.log('[TEST] Reading PDF from:', pdfPath);
console.log('[TEST] File exists:', fs.existsSync(pdfPath));
console.log('[TEST] File size:', fs.statSync(pdfPath).size, 'bytes');

const buf = fs.readFileSync(pdfPath);

try {
  const data = await pdfParse(buf, { max: 10 });
  console.log('\n=== PDF INFO ===');
  console.log('Total pages:', data.numpages);
  console.log('Total chars extracted (first 10 pages):', data.text.length);
  
  console.log('\n=== FIRST 5000 CHARS ===');
  console.log(data.text.substring(0, 5000));

  console.log('\n=== CHARS 5000-10000 ===');
  console.log(data.text.substring(5000, 10000));
} catch (err) {
  console.error('[ERROR]', err.message);
}
