const fs = require('fs');
const path = require('path');

const jsPath = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\0dcc52be-6916-4385-8bb9-ff3f88b89deb\\.system_generated\\steps\\27\\content.md';
const endpointsTsPath = 'f:\\WDP\\frontend\\services\\endpoints.ts';

const fileContent = fs.readFileSync(jsPath, 'utf8');
// Find the swaggerDoc block
const startIdx = fileContent.indexOf('"swaggerDoc":');
if (startIdx === -1) {
  console.error('Cannot find swaggerDoc in init file');
  process.exit(1);
}

// Find options = { ... }; we can try to parse the JSON portion
// Let's find the opening brace after "swaggerDoc":
const openBraceIdx = fileContent.indexOf('{', startIdx);
let braceCount = 1;
let closeBraceIdx = openBraceIdx + 1;
while (braceCount > 0 && closeBraceIdx < fileContent.length) {
  if (fileContent[closeBraceIdx] === '{') {
    braceCount++;
  } else if (fileContent[closeBraceIdx] === '}') {
    braceCount--;
  }
  closeBraceIdx++;
}

const swaggerDocJsonStr = fileContent.substring(openBraceIdx, closeBraceIdx);
let spec;
try {
  spec = JSON.parse(swaggerDocJsonStr);
} catch (e) {
  console.error('JSON parse error:', e.message);
  // fallback using eval (since it's a JS file)
  try {
    spec = eval('(' + swaggerDocJsonStr + ')');
  } catch (ee) {
    console.error('Eval error:', ee.message);
    process.exit(1);
  }
}

const allApiPaths = Object.keys(spec.paths);
console.log('Total Swagger API paths:', allApiPaths.length);

const endpointsTs = fs.readFileSync(endpointsTsPath, 'utf8');
const matches = [...endpointsTs.matchAll(/(?:\:|return)\s*(?:`|')(\/.*?)(?:`|')/g)];
const frontendPaths = matches.map(m => {
  return m[1].replace(/\$\{.*?\}/g, '{id}').replace('/api', '');
});

const missing = allApiPaths.filter(apiPath => {
  if (apiPath === '/') return false;
  // Swagger paths have /api prefix, strip it for matching if needed
  const normalizedApi = apiPath.replace(/^\/api/, '');
  
  // check if any frontend path matches
  return !frontendPaths.some(fp => {
    // exact match or match dynamic params
    const fNorm = fp.replace(/\{.*?\}/g, 'PARAM');
    const aNorm = normalizedApi.replace(/\{.*?\}/g, 'PARAM');
    return fNorm === aNorm;
  });
});

console.log('\nMissing APIs (Not found in endpoints.ts):');
missing.forEach(p => console.log(p));
