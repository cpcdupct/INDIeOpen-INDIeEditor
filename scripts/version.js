'use strict';

const fs = require('fs');
const path = require('path');
const pjPath = path.resolve(path.dirname(__filename), '../package.json');
const srcPath = path.resolve(path.dirname(__filename), '../src/version-info.json');
const distPath = path.resolve(path.dirname(__filename), '../dist/version-info.json');

const pj = require(pjPath);

console.log(`### INFO: Current Version: ${pj.version}`);
fs.writeFileSync(srcPath, `{ "version" : "${pj.version}" }`);
fs.writeFileSync(distPath, `{ "version" : "${pj.version}" }`);

module.exports = pj.version;
