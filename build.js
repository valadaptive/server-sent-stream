const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

fs.rmSync(path.join(__dirname, 'dist'), {force: true, recursive: true});
child_process.spawnSync(path.join(__dirname, 'node_modules/.bin/tsc'), ['-p', 'tsconfig-cjs.json'], {stdio: 'inherit'});
child_process.spawnSync(path.join(__dirname, 'node_modules/.bin/tsc'), ['-p', 'tsconfig-mjs.json'], {stdio: 'inherit'});
fs.writeFileSync(path.join(__dirname, 'dist/cjs/package.json'), JSON.stringify({type: 'commonjs'}, null, 2));
fs.writeFileSync(path.join(__dirname, 'dist/mjs/package.json'), JSON.stringify({type: 'module'}, null, 2));