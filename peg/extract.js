#!/usr/bin/env node
//extract minimal grammar rules from Ant
//Copyright (c) 2019 Softech & Associates, Inc.

"use strict";
require("magic-globals"); //__file, __line, __stack, __func, etc
require("colors").enabled = true; //for console output; https://github.com/Marak/colors.js/issues/127
const fs = require('fs');
const pathlib = require('path');
extensions();

let blocks = {};
const START = "sql_script";
if (process.argv.length < 3) { console.error(`usage: ${pathlib.basename(process.argv[1])} <ant-file>`.red); process.exit(1); }
process.argv.slice(2).forEach((fname) =>
{
//const fname = process.argv[2];
if (!fname) { console.error(`usage: ${pathlib.basename(process.argv[1])} <ant-file>`.red); process.exit(1); }
const bname = extensions.bname = pathlib.basename(fname);
let src = fs.readFileSync(fname).toString();
const sv_src = src, sv_numblks = Object.keys(blocks).length;

src = src.replace(/\/\*(.|\r|\n)*?\*\//gm, (match) => match.replace(/[^\n]/g, "")); // "//" + match.replace(/\n/g, "\n//")); //strip multi-line comments, preserve line#s
src = src.replace(/\/\/[^\n]*/g, "//"); //strip in-line comments
src = src.replace(/^\s*$/gm, "//");

src.split(/^( *(\w+)(\s|\r|\n)*:)/gmi).slice(1).forEach((blk, inx, all) =>
{
    const GROUPING = 3+1;
//    if (inx > 7) return;
    if (inx % GROUPING) return;
    console.log(`${inx / GROUPING}/${all.length / GROUPING}`, all[inx + 1]);
    if (blocks[all[inx + 1]]) throw `dupl block '${all[inx + 1]}'`.red;
    blocks[all[inx + 1]] = all[inx] + all[inx + GROUPING - 1]; //.slice(inx, inx + GROUPING).join(""); //all[inx - 1] + all[inx + 3];
});

//console.log(`//${bname} top`);
//console.log(src);
//console.log(`//${bname} eof`);
console.error(`${bname} ${commas(sv_src.split(/\r?\n/).length)} => ${commas(src.split(/\r?\n/).length)} lines, ${commas(sv_src.length)} => ${commas(src.length)} chars, ${Object.keys(blocks).length - sv_numblks} blocks found`.green);
});

//if (!blocks[START]) throw `Start rule '${START}' is undefined`.red;
//console.log(blocks[START]);
keep(START);

function keep(name)
{
    if (!keep.blocks) keep.blocks = {};
    if (!blocks[name]) throw `Rule '${name}' is undefined`.red;
    keep.blocks[name] = blocks[name];
}
keep[START] = blocks[START];
add
for (;;)
{
    let parts = /\w+/.exec(blocks[START].exec

}


function commas(num) { return num.toLocaleString(); } //grouping (1000s) default = true

function extensions()
{
    String.prototype.replace_log = function(re, newstr)
    {
        let retval = this.replace.apply(this, arguments);
        if (retval == this) console.error(`Did not replace '${re}' in ${extensions.bname}`.yellow);
        return retval;
    }
}

//eof