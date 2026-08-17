import fs from 'fs';
import path from 'path';

const samplesDir = 'c:/Users/HP/Hackathon/Offline-Signature-Matching-using-LCS-algo/frontend/public/samples';
if (!fs.existsSync(samplesDir)) {
  fs.mkdirSync(samplesDir, { recursive: true });
}

// Create sample SVG signatures with fluid handwriting strokes
const signatureA_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <path d="M 50 130 C 80 40, 100 30, 120 120 C 130 160, 140 160, 160 100 C 175 60, 190 70, 200 110 C 215 150, 240 120, 260 90 C 280 60, 300 130, 340 100 M 70 150 C 140 140, 260 145, 360 135" 
        fill="none" stroke="#111827" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 120 70 C 150 65, 170 80, 180 95" 
        fill="none" stroke="#111827" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;

const signatureB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <path d="M 55 125 C 82 45, 98 35, 122 118 C 132 155, 142 158, 162 102 C 178 62, 192 72, 202 112 C 218 148, 238 122, 258 92 C 278 62, 302 128, 342 98 M 68 152 C 138 142, 258 147, 358 137" 
        fill="none" stroke="#111827" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 122 72 C 148 68, 168 82, 178 98" 
        fill="none" stroke="#111827" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;

fs.writeFileSync(path.join(samplesDir, 'sample_sig_a.svg'), signatureA_SVG);
fs.writeFileSync(path.join(samplesDir, 'sample_sig_b.svg'), signatureB_SVG);
console.log('Created sample SVGs in public/samples/');
