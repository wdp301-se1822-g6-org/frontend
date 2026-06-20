const fs = require('fs');

const jsPath = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\fbff0117-a332-42fd-96d2-6e1da3ae334c\\.system_generated\\steps\\129\\content.md';
const fileContent = fs.readFileSync(jsPath, 'utf8');
const separator = '---';
const sepIdx = fileContent.indexOf(separator);
const jsonStr = fileContent.substring(sepIdx + separator.length).trim();
const spec = JSON.parse(jsonStr);

const missingPaths = [
  '/auth/admin-only',
  '/admin/golden-hours',
  '/admin/golden-hours/{id}',
  '/admin/pricing-policy',
  '/admin/work-orders/queue',
  '/washers/me/schedule'
];

missingPaths.forEach(p => {
  console.log(`\n=========================================\nPATH: ${p}`);
  if (spec.paths[p]) {
    console.log(JSON.stringify(spec.paths[p], null, 2));
  } else {
    console.log('NOT FOUND');
  }
});
