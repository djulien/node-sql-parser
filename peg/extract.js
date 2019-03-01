#!/usr/bin/env node
//extract minimal grammar rules from Ant
//Copyright (c) 2019 Softech & Associates, Inc.

"use strict";
require("magic-globals"); //__file, __line, __stack, __func, etc
require("colors").enabled = true; //for console output; https://github.com/Marak/colors.js/issues/127
const fs = require('fs');
const pathlib = require('path');
const {numkeys, numlines, commas, dedupe, pct, extensions, highlight, warn, error} = require("./ant2peg"); //share code + extensions

//extensions(); //hoist

const WANT_LIST = false;
const WANT_CHILDREN = false;
const TEXT_RULER = "124679".split("").reduce((str, col) => str.padEnd(col * 10, ".") + (col * 10), "") + "\n";

//build list of available named blocks:
const blocks = {};
let num_chkpt = 0;
const START = "sql_script";
const SYMBOL = /([a-z$@_][a-z0-9$@_]*)/gi; //symbol name can have "$@_"; don't use "\w"; captured
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

    const                                            NAME = 1,                     GROUPING = 3+1;
    const lines = src.split(new RegExp(`^([^\\S\\n]*${SYMBOL.source}(\\s|\\r|\\n)*:)`, dedupe("gmi" + SYMBOL.flags))); //CAUTION: doesn't match if "//" between name + ":"
//for (let i = 1; i < 10; ++i) console.error(`line[${i}]`, (lines[i] || "NONE").slice(0, 30));
    let line_num = numlines(lines.shift());
    lines.forEach((blk, inx, all) =>
    {
//    if (inx > 7) return;
        if (inx % GROUPING) return;
//debugger;
        const srcline = `@${bname}:${commas(line_num)}`, sname = all[inx + NAME];
if (sname.match(/[^a-z0-9$@_]/i)) error(`symbol parser bad: '${sname.slice(0, 30)}'`);
        if (WANT_LIST) console.log(`${inx / GROUPING}/${all.length / GROUPING}`, sname, srcline);
        if (blocks[sname]) throw `dupl block[${inx / GROUPING}/${all.length / GROUPING}] '${sname}' ${srcline}, previous was ${blocks[sname].srcline}`.red;
        const blk_txt = all[inx] + all[inx + GROUPING - 1]; //.slice(inx, inx + GROUPING).join(""); //all[inx - 1] + all[inx + 3];
//if ((all[inx + 3] || "").match(/newline/i) && !all[inx + 3].match(/newline_eof/i)) console.error(srcline, sname, blk_txt);
        blocks[sname] = {text: blk_txt, srcline};
        line_num += numlines(blk_txt) - 1;
        if (line_num > numlines(sv_src)) throw `line# ovfl at '${sname}' ${srcline}`.red;
//add parser chkpts:
//chkpt=CHKPT ( 
//    | { return CHKPT(chkpt); }?
//    )
        if ((sname == "@lexer") || (sname == "@parser")) return; //skip hdr stuff
        let branches = [], keep = [];
//if (sname == "routine_name") console.error(TEXT_RULER, blk_txt.escall);
        blk_txt.replace_unnested(/[:;|()]/g, (ch) =>
        {
//            inner(ch);
//            if (sname == "routine_name") console.error(ch.index, JSON.stringify(ch), JSON.stringify(branches));
//        function inner(ch)
//        {
            if (ch[0] == "|") { branches.top.br.push(ch.index); return; } //start of alt branch
            if ((ch[0] == ":") || (ch[0] == "(")) { branches.push({stofs: ch.index, br: []}); return; } //start outer/inner branch
            if ((ch[0] == ";") || (ch[0] == ")")) //end outer/inner branch
            {
                const finished_branch = branches.pop();
                if (!finished_branch) //branches.length)
                    ((ch[0] == ")")? error: warn)(`rule '${sname}' underflow at char ofs ${ch.index}: ${highlight(blk_txt, ch.index, 20)}`); //NOTE: okay for ";" to underflow (could have extras)
//                if (!branches.top.br.length) { branches.pop(); return; } //don't need to adjust this one
                if (!((finished_branch || {}).br || []).length) return; //don't need to add chkpts
                finished_branch.enofs = ch.index;
                keep.push(finished_branch); //branches.pop());
                return;
            }
            error(`unknown branching char: '${ch[0]}'`);
//            if (parts[1] == name) return; //skip self; redundant - check below will catch this
//        }
        });
        if (branches.length) error(`rule '${sname}' bad branch nesting`);
        if (!keep.length) return;
//        console.error(`rule '${sname}' has ${keep.length} branches to adjust`);
        keep.forEachRev((chkpt) =>
        {
            blk_txt = blk_txt.slice(0, chkpt.enofs) + ")" + blk_txt.slice(chkpt.enofs);
            chkpt.br.forEachRev((ofs) => blk_txt = blk_txt.slice(0, ofs) + " { return CHKPT(chkpt); }? " + blk_txt.slice(ofs));
            blk_txt = blk_txt.slice(0, chkpt.stofs) + " chkpt=CHKPT ( " + blk_txt.slice(chkpt.stofs);
        });
        blocks[sname].blk_txt = blk_txt;
        ++num_chkpt;
    });
//console.log(`//${bname} top`);
//console.log(src);
//console.log(`//${bname} eof`);
console.error(`${bname} ${commas(numlines(sv_src))} => ${commas(numlines(src))} lines (${pct(numlines(src) / numlines(sv_src))}), ${commas(sv_src.length)} => ${commas(src.length)} chars (${pct(src.length / sv_src.length)}), ${commas(numkeys(blocks) - sv_numblks)} blocks (${pct(num_chkpt / (numkeys(blocks) - sv_numblks))} chkpt)`[(numlines(sv_src) == numlines(src))? "green": "red"]);
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
//    const child_re = new RegExp(SYMBOL, "gi");
    if (blocks[name].text.match(/','\?/) && !blocks[name].text.match(/'\('/)) console.error(`check rule '${name}' for over-greediness!`.yellow);
//remove various parts to prevent extraneous symbol names:
function old_way()
{
    const srch_txt = blocks[name].text
//        .replace(/\\./g, "").replace(/'[^']*'/g, "").replace(/"[^"]*"/g, "") //strip strings
//        .replace(/\[[^]+\]/g, "") //strip char sets
//        .replace(/\{[^}]+\}/g, "") //strip code escapes
        .replace(/'[^'\r\n]*?'|"[^"\r\n]*?"|\[[^\]\r\n]*?\]|\{[^}\r\n]+\}|\/\*[\S\s]*?\*\/|\/\/[^\n]*/gm, " ") //match strings, sets, and comments first so they can be excluded (non-captured); non-greedy; TODO: escaped quotes?
        .replace(new RegExp(`${SYMBOL.source}\s*=`, "gmi"), ""); //strip var captures
    for (;;)
    {
        let parts = child_re.exec(srch_txt); //blocks[name].text);
        if (!parts) break;
        if (WANT_CHILDREN) console.error(`block '${name}' uses ${parts[1]} ${keep.blocks[parts[1]]? "(already seen)": "(new)"}`);
        if (keep.blocks[parts[1]]) continue;
        keep(parts[1], blocks[name].srcline);
    }
}
//if ((keep.num_found || 0) < 10) debugger;
const want_debug = false; //~blocks[name].text.indexOf("tblvw_name"); //false; //~",regular_id,id_expression,identifier,numeric".indexOf(name);
if (want_debug) console.error(`rule '${name.cyan}' from ${blocks[name].srcline} ${from} text: ${blocks[name].text.blue} @${__line}`);
if (want_debug) debugger;
    blocks[name].text
        .replace(new RegExp(`${SYMBOL.source}\\s*=`, "gmi"), "") //strip var captures
        .replace_unnested(SYMBOL, (parts) =>
        {
//            if (parts[1] == name) return; //skip self; redundant - check below will catch this
if (want_debug) debugger;
            if (WANT_CHILDREN) console.error(`block '${name}' uses ${parts[0]} ${keep.blocks[parts[1]]? "(already seen)": "(new)"}`);
            if (keep.blocks[parts[1]]) return; //continue; //already have this rule
            (blocks[name].children || (blocks[name].children = [])).push(parts[1]); //only for debug
            keep(parts[1], blocks[name].srcline);
        });
if (want_debug) //(++keep.num_found || (keep.num_found = 1)) < 10)
    console.error(`rule '${name.cyan}' from ${blocks[name].srcline} ${from} ${(blocks[name].children || []).length} children: ${(blocks[name].children || []).join(", ").cyan} @${__line}`);
if (want_debug) debugger;
}
console.error(`minimal set: ${commas(numkeys(keep.blocks))}/${commas(numkeys(blocks))} blocks (${pct(numkeys(keep.blocks) / numkeys(blocks))})`.cyan);
if (numkeys(keep.missing)) console.error(`missing names: ${numkeys(keep.missing)}`.yellow);

//Object.keys(keep.blocks).forEach((name) => console.log(keep.blocks[name].text.replace(/^[^\S\n]*\n/gm, "")));
const txtout = Object.keys(keep.blocks).sort().map((name) => keep.blocks[name].text.replace(/^[^\S\n]*\n/gm, "")).join("");
console.log(txtout);
console.error(`${commas(numlines(txtout))} lines, ${commas(txtout.length)} chars written`.cyan);

//function numkeys(obj) { return Object.keys(obj || {}).length; }

//function numlines(src) { return (src || "").split(/\r?\n/).length; }

//function commas(num) { return num.toLocaleString(); } //grouping (1000s) default = true

//function extensions()
//{
//    String.prototype.replace_log = function(re, newstr)
//    {
//        let retval = this.replace.apply(this, arguments);
//        if (retval == this) console.error(`Did not replace '${re}' in ${extensions.bname}`.yellow);
//        return retval;
//    }
//}

//eof