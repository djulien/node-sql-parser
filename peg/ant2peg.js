#!/usr/bin/env node
//convert Ant to peg
//Copyright (c) 2019 Softech & Associates, Inc.

"use strict";
require("magic-globals"); //__file, __line, __stack, __func, etc
require("colors").enabled = true; //for console output; https://github.com/Marak/colors.js/issues/127
const fs = require('fs');
const pathlib = require('path');
extensions();

const NEW = true; //newer grammar (pre-filtered)

if (process.argv.length < 3) { console.error(`usage: ${pathlib.basename(process.argv[1])} <ant-file>`.red); process.exit(1); }
process.argv.slice(2).forEach((fname) =>
{
//const fname = process.argv[2];
if (!fname) { console.error(`usage: ${pathlib.basename(process.argv[1])} <ant-file>`.red); process.exit(1); }
if (fname == "-") fname = "/dev/stdin";
const bname = extensions.bname = pathlib.basename(fname);
let src = fs.readFileSync(fname).toString();

if (!NEW)
{
    src = src.replace_log(/^\/\/[^\n]*/gm, (match) => match.replace(/[{}]/, "")); //strip special chars from comments to avoid extraneous replacements + parse errors
    src = src.replace_log(/\/\*(.|\r|\n)*?\*\//gm, (match) => match.replace(/[{}]/, "")); //strip special chars from comments to avoid extraneous replacements + parse errors
//src = src.replace(/\(\s*\|/gm, "( /*|*/");
    src = src.replace_log(/^(\w+ grammar \w+)/gmi, "//$1");
    src = src.replace_log(/^([^\/{\r\n]+\{[^}]+\}\r?\n)/gm, (match) => `/*${match.slice(0, -1)}*/\n`); //don't replace if followed by non-newline
    src = src.replace_log(/^fragment\s+/gmi, (match) => match.replace(/(fragment)/i, "/*$1*/"));
    src = src.replace_log(/~';'\+/gm, "[^;]+");
//src = src.replace_log(/\s+#\s+/g, " // ");
    src = src.replace_log(/(type\(CHAR_STRING\))/gi, "'$1'"); //comment out "type()"
    src = src.replace_log(/(channel\(HIDDEN\))/gi, "'$1'"); //string-out "channel()"
}

//const NO_WHSP = "APPROXIMATE_NUM_LIT,CHAR_STRING,DELIMITED_ID,NATIONAL_CHAR_STRING_LIT,NEWLINE,PROMPT_MESSAGE,REGULAR_ID,START_CMD"; '_'i  '.'

//src = src.replace_log(/^(\s*\r?\n\s+[;|])/gm, "//$1"); //remove blank lines within rules
//src = src.replace_log(/:\s+/gm, (match) => match.replace(/:/, " ="));
//src = src.replace_log(/=/g, ":");
src = src.replace_log(/\('\+'\|'-'\)/gm, "( '+' | '-' )");
src = src.replace_log(/'[:=]'|\[[:=]\]|(:)|(=)/g, (match, colon, equal) => colon? "=": equal? ":": match);
src = src.replace_log(/([^'])\|/gm, "$1 / "); //(match) => match.replace(/\|/, "/"));
src = src.replace_log(/([^'])~/gm, "$1 !");
src = src.replace_log(/(;\s*)$/gm, " //$1");
src = src.replace_log(/(.)\{/g, (match) => (match[0] != "'")? `${match[0]} &{`: match);
src = src.replace_log(/('[^'\n]*?[a-z0-9@$_]')|('[^'\n]*?')|"[^"\n]*?"|\[[^\]\n]*?\]/gmi, (match, single_alpha, single_other) => single_alpha? `${single_alpha}i TOKEND`: single_other? `${single_other}i WHITE_SPACE`: match); //make keywords case insensitive, also allow trailing whitespace (only for single-quoted strings)

//TODO: not sure what to do with these:
if (!NEW) src = src.replace_log(/(\.\*\?)/g, "'$1'");
if (!NEW) src = src.replace_log(/->/g, "'->'");

console.log(`//${bname} top`);
console.log(src);
console.log(`//${bname} eof`);
console.error(`${bname} ${commas(src.split(/\r?\n/).length)} lines, ${commas(src.length)} chars converted`.green);
});


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
