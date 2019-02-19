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
let src = fs.readFileSync(fname).toString(); //files are small; just load synchronously; don't need streams/async

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
if (false)
{
    src = src.replace(/\}:/g, "#KLUDGE1#").replace(/=>/g, "#KLUDGE2#");
    src = src.replace_log(exclre(/(:)|(=)/g), (as_is, colon, equal) => colon? "=": equal? ":": as_is); //swap "="/":"; exclude strings/sets and ternary op
    src = src.replace(/#KLUDGE2#/g, "=>").replace(/#KLUDGE1#/g, "}:");
    src = src.replace_log(exclre(/(\|)/g), (as_is, bar) => bar? "/": as_is); //  /([^'])\|/gm, "$1 / "); //(match) => match.replace(/\|/, "/"));
    src = src.replace_log(exclre(/(~)/g), (as_is, tilda) => tilda? "!": as_is); // /([^'])~/gm, "$1 !");
    src = src.replace_log(exclre(/(;\s*?)$/gm), (as_is, semi) => semi? ` //${semi}`: as_is); // /(;\s*)$/gm, " //$1");
//NO: src = src.replace_log(exclre(/./g), (match) => match.replace(/^\{.*\}$/, `&${match}`)); // }) /(.)\{/g, (match) => (match[0] != "'")? `${match[0]} &{`: match);
    src = src.replace_log(exclre(/(.)(\{[^}]+\})\?/g), (as_is, prefix, pred) => pred? `${prefix.replace(/([^!~])/, "$1&")}${pred}`: as_is); //CAUTION: only inject "&" for conditional predicates, not retvals; drop trailing "?"
}
else //broken
{
    const delims = /""|''|``|\{\}/;
    src = src.replace_unn_log(/:/g, "=", delims); //swap =/:; exclude strings/sets
    src = src.replace_unn_log(/\|/g, "/", delims); //  /([^'])\|/gm, "$1 / "); //(match) => match.replace(/\|/, "/"));
    src = src.replace_unn_log(/~/g, "!", delims); // /([^'])~/gm, "$1 !");
    src = src.replace_unn_log(/(;\s*?)$/gm, " //$1", delims); // /(;\s*)$/gm, " //$1");
//only inject "&" for conditional predicates, not retvals; drop trailing "?":
let svsrc = src;
    let insofs = [];
//    if (src.indexOf("{") != -1) debugger;
    src = src.replace_unn_log(/(.)/g, (ch) =>
    {
        if (ch.input[ch.index + 1] == "{") insofs.push(ch.index);
        if (ch.input[ch.index - 1] == "}") { if (ch[0] == "?") return ""; insofs.pop(); }
        return ch[0];
    }, delims);
    while (insofs.length)
    {
        if (src[insofs.top] != "!") src = src.slice(0, insofs.top + 1) + "&" + src.slice(insofs.top + 1);
        insofs.pop();
    }
//if (src != svsrc)
for (let i = 0; i < src.length; ++i)
    if (src[i] != svsrc[i]) { console.error(`diff at line ${numlines(src.slice(0, i))}: ${highlight(src, i, 20)}`); break; }
}
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

function unit_test()
{
    const str = `abc: { def: { }, " \\"}", xyz: 4} : 567`;
//const str = `abc: { def: { }, " \\"}"", xyz: 4} : 567`;
//const str = `abc: { def: { }, " \\"}", xyz: 4}} : 567`;
    console.log(str.blue_lt);
    console.log(str.replace(/:/g, "=").cyan_lt);
//let nested = 0;
//console.log(str.replace_unnested(/(\{)|(\})|(:)/g, (match, nest, unnest, target) => nest? (++nested, match): unnest? (--nested, match): !nested? "=": match));
//console.log(str.replace(/(:)/g, "=");
//console.log(str.replace_unnested(/[{}`'"\\}]|(:)/g, (match, target) => !target? nested(match): nested()? target: "="));
    console.log(str.replace_unnested(/:/g, "=", /""|''|``|\{\}/).cyan_lt);
//if (nested()) console.error("str !nested correctly".red);
    process.exit();
}

//regex replace only when not nested within delim pairs:
function replace_unnested(str, re, cb, delims)
{
//    delims = delims.source.split("|");
    if (delims.source != "\"\"|''|``|\\{\\}") throw `/${delims.source}/ not implemented`.red;
    const NestBegin = "\"'`{"; //delims.reduce((list, char) => list + char, "");
    const NestEnd = "\"'`}"; //
    const delim_re = new RegExp("[\"'`\{\}\\\\]|(" + re.source + ")", "g"), Esc = "\\";
    const cb_func = (typeof cb != "function")? function(arg) { return cb; }: cb;
    const repl_all = (re.flags.indexOf("g") != -1);
    const stack = [], prev = {};
    let retstr = "", count = 0;
//    if (!Array.prototype.top) Object.defineProperty(Array.prototype, "top", { get() { return this[this.length - 1]; }, });
//console.error("delim_re", delim_re.source);
    for (;;)
    {
debugger;
        const match = delim_re.exec(str); //must use exec() to get match index :(
        if (!match) break;
        const [char, caller_match] = [match[0], match.slice(1)];
        const is_escd = (prev.char == Esc) && (match.index == prev.chofs + 1);
        const begin_type = (!is_escd && !caller_match)? NestBegin.indexOf(char): -1;
        const end_type = (!is_escd && !caller_match)? NestEnd.indexOf(char): -1;
//console.error(`repl_unnested[${count++}]: char '${char}', caller_match '${caller_match}', inx ${match.index}, prev '${prev.char}@${prev.chofs}', depth ${stack.length}, begin ${begin_type}, end ${end_type}, esc? ${is_escd}`);
        if ((end_type != -1) && stack.length && (stack.top.type == end_type)) stack.pop(); //exit dead zone
//            if (!stack.length || (stack.slice(-1)[0] != end_type)) throw `unmatched '${NestEnd[end_type]}' at ofs ${match.index}`.red;
        else if (begin_type != -1) stack.push({type: begin_type, index: match.index}); //enter dead zone
        else if ((end_type != -1) && !stack.length) unmatched(end_type, match.index); //throw `unmatched '${NestEnd[end_type]}' at ofs ${match.index}`.red;
//    nesting.depth = (nesting.stack || []).length;
        prev.char = !is_escd? char: ""; prev.chofs = match.index; //double esc char == unescaped
//        if (++count > 20) throw "inf loop?".red;
console.error(`char '${char}', caller match len ${(caller_match || []).length}, index ${match.index} ${highlight(str, match.index, 10)} @${__line}`);
        if (!(caller_match || []).length || stack.length) continue;
        caller_match.index = match.index;
        caller_match.input = match.input;
        retstr += str.slice(prev.index || 0, match.index) + cb_func(caller_match);
//console.error(retstr.yellow_lt);
        prev.index = match.index + caller_match[0].length;
        if (!repl_all) break;
    }
    if (stack.length) unmatched(stack.top.type, stack.top.index); //throw `unmatched '${NestBegin[stack.top.type]}' at ofs ${stack.top.index}: ${str.slice(Math.max(stack.top.index - 10, 0), stack.top.index)}${str.slice(stack.top.index, stack.top.index + 1).yellow_lt}${str.slice(stack.top.index + 1, stack.top.index + 10).red_lt}`.red_lt;
    return retstr + str.slice(prev.index || 0); //add trailing unreplaced fragment

    function unmatched(type, ofs)
    {
        console.error(`unmatched '${NestBegin[type]}' at ofs ${ofs}: ${str.slice(Math.max(ofs - 30, 0), ofs)}${str.slice(ofs, ofs + 1).red_lt}${str.slice(ofs + 1, ofs + 10).yellow_lt}`.yellow_lt);
    }
}

//make it easier to see where error is:
function highlight(str, ofs, len)
{
    return `${str.slice(Math.max(ofs - len, 0), Math.max(ofs - 1, 0)).blue}${str.slice(Math.max(ofs -1, 0), ofs + 1).red}${str.slice(ofs + 1, ofs + len).blue}`.replace(/\n/g, "\\n");
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
    String.prototype.replace_unn_log = function(re, newstr, delims)
    {
        let retval = replace_unnested(this, re, newstr, delims);
        if (retval == this) console.error(`Did not replace '${re.sourcec}' @${__stack[1].getLineNumber()} in ${extensions.bname}`.yellow);
        return retval;
    }
    if (!Array.prototype.top)
        Object.defineProperty(Array.prototype, "top", { get() { return this[this.length - 1]; }, });
}

//eof