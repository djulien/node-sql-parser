#!/usr/bin/env node
//convert Ant to peg
//Copyright (c) 2019 Softech & Associates, Inc.

"use strict";
require("magic-globals"); //__file, __line, __stack, __func, etc
require("colors").enabled = true; //for console output; https://github.com/Marak/colors.js/issues/127
const pathlib = require('path');
const fs = require('fs');
extensions();

const NEW = true; //newer grammar (pre-filtered)
const out = [];
const keywds = {};

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

//const keywds = {};
const                  NAME = 1,              VAL1 = 3,   VAL2 = 4;
const keywd_re = /^\s*([a-z0-9@_$]+)\s*:\s*('([a-z0-9@_$]+)'|"([a-z0-9@_$]+)")\s*;\s*$/gmi;
const sv_count = numkeys(keywds);
for (;;)
{
    const parts = keywd_re.exec(src);
    if (!parts) break;
    if (parts[NAME] != parts[VAL1] || parts[VAL2]) console.error(`not sure if ${parts[NAME]} is a keyword in line ${numlines(src.slice(0, parts.index))}`.yellow);
    ++keywds[parts[VAL1] || parts[VAL2]];
}
//src = src.replace_log(/^(\s*\r?\n\s+[;|])/gm, "//$1"); //remove blank lines within rules
//src = src.replace_log(/:\s+/gm, (match) => match.replace(/:/, " ="));
//src = src.replace_log(/=/g, ":");
//src = src.replace_log(/\('\+'\|'-'\)/gm, "( '+' | '-' )");
//src = src.replace_log(/'[:=]'|\[[:=]\]|(:)|(=)/g, (match, colon, equal) => colon? "=": equal? ":": match);
src = src.replace_log(exclre(/(:)|(=)/g), (as_is, colon, equal) => colon? "=": equal? ":": as_is); //swap =/:; exclude strings/sets
src = src.replace_log(exclre(/(\|)/g), (as_is, bar) => bar? "/": as_is); //  /([^'])\|/gm, "$1 / "); //(match) => match.replace(/\|/, "/"));
src = src.replace_log(exclre(/(~)/g), (as_is, tilda) => tilda? "!": as_is); // /([^'])~/gm, "$1 !");
src = src.replace_log(exclre(/(;\s*?)$/gm), (as_is, semi) => semi? ` //${semi}`: as_is); // /(;\s*)$/gm, " //$1");
//NO: src = src.replace_log(exclre(/./g), (match) => match.replace(/^\{.*\}$/, `&${match}`)); // }) /(.)\{/g, (match) => (match[0] != "'")? `${match[0]} &{`: match);
src = src.replace_log(exclre(/(.)(\{[^}]+\})\?/g), (as_is, prefix, pred) => pred? `${prefix.replace(/([^!~])/, "$1&")}${pred}`: as_is); //CAUTION: only inject "&" for conditional predicates, not retvals; drop trailing "?"
src = src.replace_log(/('[^'\n]*?[a-z0-9@$_]')(\??)|('[^'\n]*?')(\??)|"[^"\n]*?"|\[[^\]\n]*?\]/gmi, (match, squo_alpha, squo_alpha_optnl, squo_other, squo_other_optnl) => squo_alpha? `${squo_alpha}i${squo_alpha_optnl || ""} TOKEND`: squo_other? `${squo_other}i${squo_other_optnl || ""} WHITE_SPACE`: match); //make keywords case insensitive, also allow trailing whitespace (only for single-quoted strings)

//TODO: not sure what to do with these:
if (!NEW) src = src.replace_log(/(\.\*\?)/g, "'$1'");
if (!NEW) src = src.replace_log(/->/g, "'->'");


//src = src.replace(/#KEYWORDS#/, Object.keys(keywds).map((keywd) => `\t\t'${keywd.toUpperCase()}': true,`).join("\n"));

/*console.log*/ out.push(`//${bname} top`);
/*console.log*/ out.push(src);
/*console.log*/ out.push(`//${bname} eof`);
console.error(`${bname} ${commas(numlines(src))} lines, ${commas(src.length)} chars converted, ${commas(numkeys(keywds) - sv_count)} keywords found`.green);
});

const src = out.join("\n").replace(/^\s*#KEYWORDS#\s*(\/\/[^\n]+)?$/m, `//${numkeys(keywds)} keywords: $1\n` + Object.keys(keywds).map((keywd) => `\t\t\t'${keywd.toUpperCase()}': true,`).join("\n"));
console.log(src);
console.error(`total ${commas(numlines(src))} lines, ${commas(src.length)} chars, ${commas(numkeys(keywds))} keywords`.green);

//const re1 = /[ab]|[1-3]|/g;
//const re2 = exclre(/(x)|(y)/gi);
//let str = `"a c" b X Y [X] 'Y' !`;
//console.log(str);
//console.log(str.replace(re2, (match, x, y) => x? ` <<${x}>> `: y? ` ##${y}## `: match));
//process.exit();

//exclude re matches from sets, strings, and comments by matching those first (caller must replace as-is):
function exclre(re)
{
    const excludes_re = /\n\{[\s\S\r\n]*?\n\}|'[^'\r\n]*?'|"[^"\r\n]*?"|\[[^\]\r\n]*?\]|\{[^}\r\n]+\}|\/\*[\S\s]*?\*\/|\/\/[^\n]*|--[^\n]*|/g; //match strings, sets, and comments first so they can be excluded (non-captured); non-greedy; TODO: escaped quotes?
    const retval = new RegExp(excludes_re.source + re.source, dedupe(excludes_re.flags + re.flags));
    retval.pre_excl = re;
    return retval;
}

function dedupe(str)
{
    return Object.keys((str || "").split("").reduce((contents, char) => { ++contents[char]; return contents; }, {})).join("");
}

function commas(num) { return num.toLocaleString(); } //grouping (1000s) default = true

function numkeys(obj) { return Object.keys(obj || {}).length; }

function numlines(src) { return (src || "").split(/\r?\n/).length; }

function extensions()
{
    String.prototype.replace_log = function(re, newstr)
    {
        let retval = this.replace.apply(this, arguments);
        if (retval == this) console.error(`Did not replace '${re.pre_excl || re}' @${__stack[1].getLineNumber()} in ${extensions.bname}`.yellow);
        return retval;
    }
}

//eof
