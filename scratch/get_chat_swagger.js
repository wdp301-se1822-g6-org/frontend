const fs = require('fs');
const contentMdPath = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\5a2c1166-d96c-4927-bad1-1a1a28ca4db7\\.system_generated\\steps\\27\\content.md';
const contentMd = fs.readFileSync(contentMdPath, 'utf8');
const lines = contentMd.split('\n');
const jsonLine = lines.find(line => line.startsWith('{"openapi"'));

if (!jsonLine) {
  console.log('Could not find JSON line');
  process.exit(1);
}

const spec = JSON.parse(jsonLine);
const chatPaths = Object.keys(spec.paths).filter(p => p.toLowerCase().includes('chat'));

console.log('--- CHAT PATHS & SPECS ---');
chatPaths.forEach(p => {
  console.log(`\nPath: ${p}`);
  const methods = Object.keys(spec.paths[p]);
  methods.forEach(m => {
    console.log(`  Method: ${m.toUpperCase()}`);
    const summary = spec.paths[p][m].summary || 'No summary';
    console.log(`    Summary: ${summary}`);
    const body = spec.paths[p][m].requestBody;
    if (body) {
      console.log(`    Body schema:`, JSON.stringify(body.content?.['application/json']?.schema, null, 2));
    }
  });
});
