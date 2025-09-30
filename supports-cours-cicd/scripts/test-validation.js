console.log('Test script running...');
console.log('Current directory:', process.cwd());
console.log('Script path:', __filename);
console.log('Node version:', process.version);

const fs = require('fs');
const path = require('path');

console.log('Checking base path...');
const basePath = path.join(__dirname, '..');
console.log('Base path:', basePath);
console.log('Base path exists:', fs.existsSync(basePath));

if (fs.existsSync(basePath)) {
    const contents = fs.readdirSync(basePath);
    console.log('Base path contents:', contents);
}