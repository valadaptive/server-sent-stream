const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

fs.rmSync(path.join(process.cwd(), 'dist'), {force: true, recursive: true});

for (const {moduleType, packageModuleType} of [
    {moduleType: 'cjs', packageModuleType: 'commonjs'},
    {moduleType: 'mjs', packageModuleType: 'module'}
]) {
    child_process.spawnSync(path.join(__dirname, 'node_modules/.bin/tsc'), ['-p', `tsconfig-${moduleType}.json`, '--outDir', `./dist/${moduleType}`], {stdio: 'inherit'});
    fs.mkdirSync(path.join(process.cwd(), 'dist', moduleType), {recursive: true});
    fs.writeFileSync(path.join(process.cwd(), 'dist', moduleType, 'package.json'), JSON.stringify({type: packageModuleType}, null, 2));
}

fs.mkdirSync(path.join(process.cwd(), 'dist/types'), {recursive: true});
child_process.spawnSync(path.join(__dirname, 'node_modules/.bin/tsc'), ['-p', `tsconfig-mjs.json`, '-d', '--emitDeclarationOnly', '--outDir', './dist/types'], {stdio: 'inherit'});