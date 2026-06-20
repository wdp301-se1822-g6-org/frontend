const fs = require('fs');
const path = require('path');

const jsPath = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\fbff0117-a332-42fd-96d2-6e1da3ae334c\\.system_generated\\steps\\129\\content.md';
const endpointsTsPath = 'f:\\WDP\\frontend\\services\\endpoints.ts';
const libDir = 'f:\\WDP\\frontend\\lib';

const fileContent = fs.readFileSync(jsPath, 'utf8');
const separator = '---';
const sepIdx = fileContent.indexOf(separator);
if (sepIdx === -1) {
  console.error('Cannot find separator in content file');
  process.exit(1);
}

const jsonStr = fileContent.substring(sepIdx + separator.length).trim();
let spec;
try {
  spec = JSON.parse(jsonStr);
} catch (e) {
  console.error('JSON parse error:', e.message);
  process.exit(1);
}

const allApiPaths = Object.keys(spec.paths);
console.log('Total Swagger API paths:', allApiPaths.length);

// Read endpoints.ts
const endpointsTs = fs.readFileSync(endpointsTsPath, 'utf8');

// Also scan lib files to see if paths are called directly
const libFiles = fs.readdirSync(libDir)
  .filter(file => file.endsWith('.ts'))
  .map(file => fs.readFileSync(path.join(libDir, file), 'utf8'));

const allSourceCode = [endpointsTs, ...libFiles].join('\n');

const missing = allApiPaths.filter(apiPath => {
  if (apiPath === '/') return false;
  if (apiPath === '/health') return false;

  // Swagger paths might have dynamic parts like {id} or :id or {sessionId}
  // Let's create a regular expression to match if this path or a variation of it exists in the codebase
  // For example: /admin/users/{id} -> look for /admin/users/
  const cleanPath = apiPath.split('/{')[0].split('/:')[0];
  
  // Also check direct match of the path with parameters formatted as template strings
  // E.g., /admin/users/${id} or /admin/users/{id}
  const isUsed = allSourceCode.includes(cleanPath) || 
                 allSourceCode.includes(apiPath) ||
                 allSourceCode.includes(apiPath.replace(/{.*?}/g, ''));

  return !isUsed;
});

console.log('\nMissing APIs (Not referenced in endpoints.ts or lib/*.ts):');
missing.forEach(p => console.log(p));
