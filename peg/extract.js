#!/usr/bin/env node
//extract minimal grammar rules from Ant
//Copyright (c) 2019 Softech & Associates, Inc.

"use strict";
require("magic-globals"); //__file, __line, __stack, __func, etc
require("colors").enabled = true; //for console output; https://github.com/Marak/colors.js/issues/127
const fs = require('fs');
const pathlib = require('path');
extensions();

const WANT_LIST = false;
const WANT_CHILDREN = false;

//build list of available named blocks:
const blocks = {};
const START = "sql_script";
const SYMBOL = "([a-z$@_][a-z0-9$@_]*)"; //symbol name can have "$@_"; don't use "\w"; captured
if (process.argv.length < 3) { console.error(`usage: ${pathlib.basename(process.argv[1])} <ant-file>`.red); process.exit(1); }
blocks.EOF = {text: "EOF: ~.;\n", srcline: "added-later"};
process.argv.slice(2).forEach((fname) =>
{
//const fname = process.argv[2];
    if (!fname) { console.error(`usage: ${pathlib.basename(process.argv[1])} <ant-file>`.red); process.exit(1); }
    const bname = extensions.bname = pathlib.basename(fname);
    if (bname.match(/-(BK|ORIG)/i)) return;
    console.error(`processing '${bname}' ...`.cyan);
    let src = fs.readFileSync(fname).toString();
    const sv_src = src, sv_numblks = numkeys(blocks);

    src = src.replace(/\/\*(.|\r|\n)*?\*\//gm, (match) => match.replace(/[^\n]/g, "")); // "//" + match.replace(/\n/g, "\n//")); //strip multi-line comments, preserve line#s
if (numlines(src) != numlines(sv_src)) throw 'lost lines @1'.red;
    src = src.replace(/\/\/[^\n]*/g, ""); //strip in-line comment text; no-leave placeholder (to preserve line#s)
if (numlines(src) != numlines(sv_src)) throw 'lost lines @2'.red;
    src = src.replace(/^[^\S\n]*$/gm, ""); //strip blank lines; no-leave placeholder
if (numlines(src) != numlines(sv_src)) throw 'lost lines @3'.red;
    src = src.replace(/^[^\S\n]*fragment[^\S\n]+/gmi, ""); //kludge to handle fragment rules
if (numlines(src) != numlines(sv_src)) throw 'lost lines @4'.red;

    const                                            NAME = 1;
    const lines = src.split(new RegExp(`^([^\\S\\n]*${SYMBOL}(\\s|\\r|\\n)*:)`, "gmi")); //CAUTION: doesn't match if "//" between name + ":"
    let line_num = numlines(lines.shift());
    lines.forEach((blk, inx, all) =>
    {
        const GROUPING = 3+1;
//    if (inx > 7) return;
        if (inx % GROUPING) return;
//debugger;
        const srcline = `@${bname}:${commas(line_num)}`, sname = all[inx + NAME];
        if (WANT_LIST) console.log(`${inx / GROUPING}/${all.length / GROUPING}`, sname, srcline);
        if (blocks[sname]) throw `dupl block[${inx / GROUPING}/${all.length / GROUPING}] '${sname}' ${srcline}, previous was ${blocks[sname].srcline}`.red;
        const blk_txt = all[inx] + all[inx + GROUPING - 1]; //.slice(inx, inx + GROUPING).join(""); //all[inx - 1] + all[inx + 3];
//if ((all[inx + 3] || "").match(/newline/i) && !all[inx + 3].match(/newline_eof/i)) console.error(srcline, sname, blk_txt);
        blocks[sname] = {text: blk_txt, srcline};
        line_num += numlines(blk_txt) - 1;
        if (line_num > numlines(sv_src)) throw `line# ovfl at '${sname}' ${srcline}`.red;
    });

//console.log(`//${bname} top`);
//console.log(src);
//console.log(`//${bname} eof`);
console.error(`${bname} ${commas(numlines(sv_src))} => ${commas(numlines(src))} lines, ${commas(sv_src.length)} => ${commas(src.length)} chars, ${commas(numkeys(blocks) - sv_numblks)} blocks`[(numlines(sv_src) == numlines(src))? "green": "red"]);
});


//build minimal list of needed blocks:
//if (!blocks[START]) throw `Start rule '${START}' is undefined`.red;
//console.log(blocks[START]);
//keep[START] = blocks[START];
keep(START);

function keep(name, from)
{
    if (from) from = `from ${from} `;
    if (!keep.blocks) keep.blocks = {};
    if (!blocks[name])
    {
        if (!keep.missing) keep.missing = {};
        if (!keep.missing[name]) console.error(`Rule '${name}' ${from || ""}is missing`.yellow);
        ++keep.missing[name] || (keep.missing[name] = 1); 
        return;
    }
    keep.blocks[name] = blocks[name];
    const child_re = new RegExp(SYMBOL, "gi");
    if (blocks[name].text.match(/','\?/) && !blocks[name].text.match(/'\('/)) console.error(`check rule '${name}' for over-greediness!`.yellow);
//remove various parts to prevent extraneous symbol names:
    const srch_txt = blocks[name].text
//        .replace(/\\./g, "").replace(/'[^']*'/g, "").replace(/"[^"]*"/g, "") //strip strings
//        .replace(/\[[^]+\]/g, "") //strip char sets
//        .replace(/\{[^}]+\}/g, "") //strip code escapes
        .replace(/'[^'\r\n]*?'|"[^"\r\n]*?"|\[[^\]\r\n]*?\]|\{[^}\r\n]+\}|\/\*[\S\s]*?\*\/|\/\/[^\n]*/gm, " ") //match strings, sets, and comments first so they can be excluded (non-captured); non-greedy; TODO: escaped quotes?
        .replace(new RegExp(`${SYMBOL}\s*=`, "gmi"), ""); //strip var captures
    for (;;)
    {
        let parts = child_re.exec(srch_txt); //blocks[name].text);
        if (!parts) break;
        if (WANT_CHILDREN) console.error(`block '${name}' uses ${parts[1]} ${keep.blocks[parts[1]]? "(already seen)": "(new)"}`);
        if (keep.blocks[parts[1]]) continue;
        keep(parts[1], blocks[name].srcline);
    }
}
console.error(`minimal set: ${commas(numkeys(keep.blocks))}/${commas(numkeys(blocks))} blocks (${Math.round(100 * numkeys(keep.blocks) / numkeys(blocks))}%)`.cyan);
if (numkeys(keep.missing)) console.error(`missing names: ${numkeys(keep.missing)}`.yellow);

//Object.keys(keep.blocks).forEach((name) => console.log(keep.blocks[name].text.replace(/^[^\S\n]*\n/gm, "")));
const txtout = Object.keys(keep.blocks).sort().map((name) => keep.blocks[name].text.replace(/^[^\S\n]*\n/gm, "")).join("");
console.log(txtout);
console.error(`${commas(numlines(txtout))} lines, ${commas(txtout.length)} chars written`.cyan);

function numkeys(obj) { return Object.keys(obj || {}).length; }

function numlines(src) { return (src || "").split(/\r?\n/).length; }

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