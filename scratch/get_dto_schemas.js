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
console.log('--- SendMessageDto ---');
console.log(JSON.stringify(spec.components.schemas.SendMessageDto, null, 2));

console.log('--- CreateChatKnowledgeDto ---');
console.log(JSON.stringify(spec.components.schemas.CreateChatKnowledgeDto, null, 2));
