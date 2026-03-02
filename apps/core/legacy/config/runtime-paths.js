const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

const isPackaged = !!process.pkg;

function getResourceRoot() {
    // ncc bundle: proto/gameConfig at dist root (shared by main + worker)
    const parent = path.join(__dirname, '..');
    if (fs.existsSync(path.join(parent, 'proto'))) return parent;
    // ncc main: proto in same dir as index.js
    if (fs.existsSync(path.join(__dirname, 'proto'))) return __dirname;
    // source: src/config -> src
    return path.join(__dirname, '..');
}

function getResourcePath(...segments) {
    return path.join(getResourceRoot(), ...segments);
}

function getAppRootForWritable() {
    return isPackaged ? path.dirname(process.execPath) : path.join(__dirname, '../..');
}

function getDataDir() {
    return path.join(getAppRootForWritable(), 'data');
}

function ensureDataDir() {
    const dir = getDataDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function getDataFile(filename) {
    return path.join(getDataDir(), filename);
}

function getShareFilePath() {
    return path.join(__dirname, '..', 'share.txt');
}

module.exports = {
    isPackaged,
    getResourcePath,
    getDataDir,
    getDataFile,
    ensureDataDir,
    getShareFilePath,
};
