const fs = require('fs');

const contentMdPath = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\5a2c1166-d96c-4927-bad1-1a1a28ca4db7\\.system_generated\\steps\\27\\content.md';
const endpointsTsPath = 'f:\\WDP\\frontend\\services\\endpoints.ts';

const contentMd = fs.readFileSync(contentMdPath, 'utf8');
const lines = contentMd.split('\n');
const jsonLine = lines.find(line => line.startsWith('{"openapi"'));

if (!jsonLine) {
  console.log('Could not find JSON line');
  process.exit(1);
}

const spec = JSON.parse(jsonLine);
const allApiPaths = Object.keys(spec.paths).map(p => p.replace('/api', '')); // strip /api prefix since frontend doesn't use it in ENDPOINTS mapping? Wait, let's check endpoints.ts

const endpointsTs = fs.readFileSync(endpointsTsPath, 'utf8');
// simplistic extraction of string literals in endpoints.ts
const matches = [...endpointsTs.matchAll(/(?:\:|return)\s*(?:`|')(\/.*?)(?:`|')/g)];
const frontendPaths = matches.map(m => {
  // convert dynamic paths like /me/orders/${id} to /me/orders/{id}
  return m[1].replace(/\$\{.*?\}/g, '{id}');
});

console.log('Available API paths:', allApiPaths.length);
console.log('Frontend paths extracted:', frontendPaths.length);

const missing = allApiPaths.filter(apiPath => {
  if (apiPath === '/') return false;
  // Convert api path parameters like {id} to match frontend
  let normalizedApi = apiPath;
  
  return !frontendPaths.includes(normalizedApi);
});

console.log('\nMissing APIs in endpoints.ts:');
missing.forEach(p => console.log(p));
