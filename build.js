const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

fs.rmSync(path.join(process.cwd(), 'dist'), {force: true, recursive: true});

const spawn = (command, args) => {
    return new Promise((resolve, reject) => {
        const process = child_process.spawn(command, args, {stdio: 'inherit'});
        let rejected = false;
        process.once('error', err => {
            process.removeAllListeners('exit');
            reject(err);
        });
        process.once('exit', (code, signal) => {
            process.removeAllListeners('error');
            if (code === 0) {
                resolve();
            } else {
                reject(`Process exited with code ${code}, signal ${signal}`);
            }
        });
    });
};

async function main() {
    const promises = [];

    for (const {moduleType, packageModuleType} of [
        {moduleType: 'cjs', packageModuleType: 'commonjs'},
        {moduleType: 'mjs', packageModuleType: 'module'}
    ]) {
        promises.push((async () => {
            await spawn(path.join(__dirname, 'node_modules/.bin/tsc'), ['-p', `tsconfig-${moduleType}.json`, '--outDir', `./dist/${moduleType}`]);
            await fs.promises.mkdir(path.join(process.cwd(), 'dist', moduleType), {recursive: true});
            await fs.promises.writeFile(path.join(process.cwd(), 'dist', moduleType, 'package.json'), JSON.stringify({type: packageModuleType}, null, 2));
        })());
    }

    promises.push((async () => {
        await fs.promises.mkdir(path.join(process.cwd(), 'dist/types'), {recursive: true});
        await spawn(path.join(__dirname, 'node_modules/.bin/tsc'), ['-p', `tsconfig-mjs.json`, '-d', '--emitDeclarationOnly', '--outDir', './dist/types']);
    })());

    await Promise.all(promises);
}

main();

