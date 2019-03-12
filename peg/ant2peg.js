#!/usr/bin/env node
//convert Ant to peg
//Copyright (c) 2019 Softech & Associates, Inc.

"use strict";
require("magic-globals"); //__file, __line, __stack, __func, etc
require("colors").enabled = true; //for console output; https://github.com/Marak/colors.js/issues/127
const pathlib = require('path');
const util = require("util");
const fs = require('fs');


extensions(); //hoist

const NEW = true; //newer grammar (pre-filtered)
const out = [];
const keywds = {};

//test();
function test()
{
//for (var i = 0x7f; i < 0x100; ++i) console.log(`\\x${i.toString(16)}  ${String.fromCharCode(i)}`);
const test2 = `BINDVAR
//    : ':' SIMPLE_LETTER  (SIMPLE_LETTER | [0-9] | '_')*
    : [:] first=SIMPLE_LETTER  more=(SIMPLE_LETTER | [0-9_])* TOKEND { return {BINDVAR: first + more.join("")}; }
    | [:] DELIMITED_ID  // not used in SQL but spotted in v$sqltext when using cursor_sharing
    | [:] UNSIGNED_INTEGER
    | QUESTION_MARK // not in SQL, not in Oracle, not in OCI, use this for JDBC
    ;`;
const test3 = `
CHAR_STRING: "'"  inner=( [^'\r\n]  |  "''" { return "'"; } |  NEWLINE)* "'" WHITE_SPACE { return {CHAR_STRING: inner.join("")}; };
`;
const test = `
DELIMITED_ID: ["]  inner=( [^"\r\n]  |  ["]["])+ '"' { return {DELIMITED_ID: inner.join("")}; };
`;
extensions.bname = "unit test";
//debugger;
const str = xlate(test);
console.log(str.escall);
process.exit();
}


function main()
{
    if (process.argv.length < 3) { console.error(`usage: ${pathlib.basename(process.argv[1])} <ant-file>`.red); process.exit(1); }
    process.argv.slice(2).forEach((fname) =>
    {
//const fname = process.argv[2];
        if (!fname) { console.error(`usage: ${pathlib.basename(process.argv[1])} <ant-file>`.red); process.exit(1); }
        if (fname == "-") fname = "/dev/stdin";
        const bname = extensions.bname = pathlib.basename(fname);
        let src = fs.readFileSync(fname).toString(); //files are small; just load synchronously; don't need streams/async
        const sv_count = numkeys(keywds);
//replace_unnested.debug = 20; //-174;
        src = xlate(src);
/*console.log*/ out.push(`//${bname} top`);
/*console.log*/ out.push(src);
/*console.log*/ out.push(`//${bname} eof`);
        console.error(`${bname} ${commas(numlines(src))} lines, ${commas(src.length)} chars converted, ${commas(numkeys(keywds) - sv_count)} keywords found`.green);
    });

    const src = out.join("\n").replace(/^\s*#KEYWORDS#\s*(\/\/[^\n]+)?$/m, `//${numkeys(keywds)} keywords: $1\n` + Object.keys(keywds).map((keywd) => `\t\t\t'${keywd.toUpperCase()}': true,`).join("\n"));
    console.log(src);
    console.error(`total ${commas(numlines(src))} lines, ${commas(src.length)} chars, ${commas(numkeys(keywds))} keywords`.green);
}

//const re1 = /[ab]|[1-3]|/g;
//const re2 = exclre(/(x)|(y)/gi);
//let str = `"a c" b X Y [X] 'Y' !`;
//console.log(str);
//console.log(str.replace(re2, (match, x, y) => x? ` <<${x}>> `: y? ` ##${y}## `: match));
//process.exit();

function xlate(src)
{
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
const                  NAME = 1,              VAL1 = 3,        VAL2 = 4;
const keywd_re = /^\s*([a-z0-9@_$]+)\s*:\s*('([a-z0-9@_$]+)'|"([a-z0-9@_$]+)")\s*;\s*$/gmi;
//const sv_count = numkeys(keywds);
for (;;)
{
    const Hardcoded =
    {
        NULL_: true, PERCENT_KEYWORD: true, SKIP_: true, //avoid warnings below
//allow these to be used as identifiers:
        A_LETTER: false, //avoid warnings below
        TYPE: false,
        ERR: false,
    };
    const parts = keywd_re.exec(src);
    if (!parts) break;
//    if (parts[NAME] != parts[VAL1] || parts[VAL2]) console.error(`not sure if ${parts[NAME]} is a keyword in line ${numlines(src.slice(0, parts.index))}`.yellow);
    if (Hardcoded[parts[NAME]] === false) continue; //not a keywd
    if (parts[NAME] != parts[VAL1] || parts[VAL2])
    {
        if (Hardcoded[parts[NAME]]); //add to keywd list below, no warning msg
//        if (Hardcoded.hasOwnProperty(parts[NAME]));
        else console.error(`not sure if ${parts[NAME]} is a keyword in line ${numlines(src, parts.index)}`.yellow);
    }
    ++keywds[parts[VAL1] || parts[VAL2]];
}

//src = src.replace_log(/^(\s*\r?\n\s+[;|])/gm, "//$1"); //remove blank lines within rules
//src = src.replace_log(/:\s+/gm, (match) => match.replace(/:/, " ="));
//src = src.replace_log(/=/g, ":");
//src = src.replace_log(/\('\+'\|'-'\)/gm, "( '+' | '-' )");
//src = src.replace_log(/'[:=]'|\[[:=]\]|(:)|(=)/g, (match, colon, equal) => colon? "=": equal? ":": match);
src = src.replace(/\/\*(.|\r|\n)*?\*\//gm, (match) => match.replace(/[^\n]/g, " ")); // "//" + match.replace(/\n/g, "\n//")); //strip multi-line comments, preserve file offsets + line#s
src = src.replace(/\/\/[^\n]*/g, (match) => "//" + " ".repeat(match.length - 2)); //strip in-line comment text; (doesn't affect line#s); preserve file offsets
//src = src.replace(/^[^\S\n]*$/gm, ""); //strip blank lines; NO-leave placeholder
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
else //not broken
{
    const delims = /""|''|``|\{\}|\[\]/; //exclude substr that have special meaning
    src = src.replace_unn_log(/[:=]/g, (match) => (match[0] == "=")? ":": "=", delims); //swap =/:; exclude strings/sets
    src = src.replace_unn_log(/\|/g, "/", delims); //  /([^'])\|/gm, "$1 / "); //(match) => match.replace(/\|/, "/"));
    src = src.replace_unn_log(/~/g, "!", delims); // /([^'])~/gm, "$1 !");
//replace_unnested.debug = 20; //-174;
//broken; can't overlap nesting chars!    src = src.replace_unn_log(/;[^\n}]*\n/g, (match) => "\n".padStart(match[0].length - 1, " ")); //preserve file offsets; (match.length < 3)? " ".repeat(match.length): "//$1", delims); //(;\s*?)$/gm, " //$1", delims); // /(;\s*)$/gm, " //$1");
    src = src.replace_unn_log(/;/g, " "); //(match) => (~match.indexOf("\n")? ` ${match.slice(1)}`: `//;`)); //preserve file offsets; (match.length < 3)? " ".repeat(match.length): "//$1", delims); //(;\s*?)$/gm, " //$1", delims); // /(;\s*)$/gm, " //$1");
//let svsrc = src;
    let insofs = [];
//    if (src.indexOf("{") != -1) debugger;
//replace_unnested.debug = -77;
debugger;
    let chars_removed = 0;
const svlen = src.length;
    src = src.replace_unn_log(/([\s\S])/g, (ch) => // (.|\n)/g, (ch) =>
    {
//move above repl into here, since we're already scanning anyway:?
//        if (ch[0] == ":") return "=";
//        if (ch[0] == "|") return "/";
//        if (ch[0] == "~") return "!";
//only inject "&" for conditional predicates, not retvals; drop trailing "?":
if (ch.input[ch.index] != ch[0]) error(`match ofs error: ${ch.input[ch.index]} vs. ${ch[0]}`);
        if (ch.input[ch.index + 1] == "{") { /*console.error("<nest" + ch[0].escall, commas(ch.index), highlight(src, ch.index + 1, 10));*/ insofs.push(ch.index - chars_removed); }
        if (ch.input[ch.index - 1] == "}") { /*console.error(">NEST" + ch[0].escall, commas(ch.index), highlight(src, ch.index - 1, 10));*/ if (ch[0] == "?") { ++chars_removed; return ""; }; insofs.pop(); }
        return ch[0];
    }, delims);
if (src.length != svlen - chars_removed) error(`bad char remove count: actual ${svlen - src.length} vs. expected ${chars_removed}`);
//let found = insofs.length, svofs1 = insofs.top;
//if (insofs.length) console.error(insofs.length, "& to insert");
//    insofs.sort(); //might overlap; put in increasing order
    insofs.forEach((ofs, i, all) => //for (let i = 0; i < insofs.length; ++i) //while (insofs.length) //NOTE: need to go low->high here to match stored offsets above
    {
//        let lines = src.slice(0, ofs).split(/\r?\n/);
//console.error(`char before "{" at ofs ${commas(ofs)} line ${commas(numlines(src, ofs))}: '${highlight(src, ofs, 20)}', ins "&"? ${src[ofs] != "!"}`);
        if (src[ofs] == "!")
        {
//            all.slice(i + 1).forEach((val, j) => --all[i + j + 1]); //TODO: why is this needed? bump remaining offsets to account for removed "?"
            return; //continue;
        }
        src = src.slice(0, ofs + 1) + "&" + src.slice(ofs + 1);
        all.slice(i + 1).forEach((val, j) => ++all[i + j + 1]); //bump remaining offsets to account for "&" inserted
//        insofs.shift(); //pop();
    });
//if (src != svsrc)
//for (let i = 0; i < src.length; ++i)
//    if (src[i] != svsrc[i]) { console.error(`diff at line ${numlines(src, i)}: ${highlight(src, i, 20)}`); break; }
//if (found) { console.error(`diff at line ${numlines(src, svofs1)}`); console.error("before", svsrc); console.error("after", src); }
//if (src != svsrc)
}
src = src.replace_log(/('[^'\n]*?[a-z0-9@$_]')(\??)|('[^'\n]*?')(\??)|"[^"\n]*?"|\[[^\]\n]*?\]/gmi, (match, squo_alpha, squo_alpha_optnl, squo_other, squo_other_optnl) => squo_alpha? `${squo_alpha}i${squo_alpha_optnl || ""} TOKEND`: squo_other? `${squo_other}i${squo_other_optnl || ""} WHITE_SPACE`: match); //make keywords case insensitive, also allow trailing whitespace (only for single-quoted strings)

//TODO: not sure what to do with these:
if (!NEW) src = src.replace_log(/(\.\*\?)/g, "'$1'");
if (!NEW) src = src.replace_log(/->/g, "'->'");

//src = src.replace(/#KEYWORDS#/, Object.keys(keywds).map((keywd) => `\t\t'${keywd.toUpperCase()}': true,`).join("\n"));
return src;
}


//exclude re matches from sets, strings, and comments by matching those first (caller must replace as-is):
/*
function exclre(re)
{
    const excludes_re = /\n\{[\s\S\r\n]*?\n\}|'[^'\r\n]*?'|"[^"\r\n]*?"|\[[^\]\r\n]*?\]|\{[^}\r\n]+\}|\/\*[\S\s]*?\*\/|\/\/[^\n]*|--[^\n]*|/g; //match strings, sets, and comments first so they can be excluded (non-captured); non-greedy; TODO: escaped quotes?
    const retval = new RegExp(excludes_re.source + re.source, dedupe(excludes_re.flags + re.flags));
    retval.pre_excl = re;
    return retval;
}
*/

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

function pred_fixup(str) //, delims)
{
//broken    return str.replace_unn_log(/([^!~])(?=\{)/g, "$1&", delims).replace_unn_log(/\?/g, (match) => (match.input[match.index - 1] == "}")? "&": match, delims); //CAUTION: only inject "&" for conditional predicates, not retvals; drop trailing "?"
//    return str.replace_unn_log(/[^!~\n]/g, (match) => (match.input[match.index + 1] == "{")? match[0] + "&": match[0], delims).replace_unn_log(/\?/g, (match) => (match.input[match.index - 1] == "}")? "&": match[0], delims); //CAUTION: only inject "&" for conditional predicates, not retvals; drop trailing "?"
    return str.replace_unn_log(/[^!~\n]/g, (match) => (match.input[match.index + 1] == "{")? match[0] + "&": match[0]).replace_unn_log(/\?/g, (match) => (match.input[match.index - 1] == "}")? "&": match[0]); //CAUTION: only inject "&" for conditional predicates, not retvals; drop trailing "?"
}


//regex replace only when not nested within delim pairs:
function replace_unnested(str, re, cb, delims)
{
//    if (!delims) delims = /""|''|``|\{\}/;
//    delims = delims.source.split("|");
    if (delims && (delims.source != "\"\"|''|``|\\{\\}|\\[\\]")) throw `/${delims.source}/ not implemented`.red;
    const NestBegin = "\"'`{["; //delims.reduce((list, char) => list + char, "");
    const NestEnd = "\"'`}]"; //
    const delim_re = new RegExp("([\"'`{}\\[\\]\\\\]|\\n\\{\\n[\\s\\S]*?\\n\\}\\n)|" + re.source.escall, dedupe("g" + re.flags)), Esc = "\\";
    const cb_func = (typeof cb != "function")? function(match) { return cb.replace(/\$1/g, match[1]); }: cb;
    const repl_all = ~re.flags.indexOf("g"); //!= -1);
    const stack = [], prev = {};
    let retstr = "", count = 0;
//    if (!Array.prototype.top) Object.defineProperty(Array.prototype, "top", { get() { return this[this.length - 1]; }, });
//console.error("delim_re", delim_re.source);
//debugger;
    for (;;)
    {
        ++replace_unnested.count || (replace_unnested.count = 1);
        if (replace_unnested.debug < 0) { if (!++replace_unnested.debug) debugger; }
        if (replace_unnested.debug > 0) { debugger; --replace_unnested.debug; }
        const match = delim_re.exec(str); //must use exec() to get match index :(
        if (!match) break;
//        const [char, caller_match] = [match[0], match.slice(1)];
        const char = match[1]; match.splice(1, 1); //remove my extra captured char so caller doesn't see it
//if ((match.input[match.index + 1] == "{") || (char == "}")) debugger;
        const is_escd = (prev.char == Esc) && (match.index == prev.chofs + 1);
        const begin_type = (!is_escd && char)? NestBegin.indexOf(char): -1;
        const end_type = (!is_escd && char)? NestEnd.indexOf(char): -1;
//console.error(`repl_unnested[${count++}]: char '${char}', caller_match '${caller_match}', inx ${match.index}, prev '${prev.char}@${prev.chofs}', depth ${stack.length}, begin ${begin_type}, end ${end_type}, esc? ${is_escd}`);
        if (/*(end_type != -1) && stack.length &&*/ (stack.top || {}).type == end_type) stack.pop(); //exit dead zone
//            if (!stack.length || (stack.slice(-1)[0] != end_type)) throw `unmatched '${NestEnd[end_type]}' at ofs ${match.index}`.red;
        else if (stack.length && (stack.top.type != NestBegin.indexOf("{"))); //"[")); //inside "[]" or strings regex can be unmatched so don't track it
        else if (~begin_type /*!= -1*/) { /*debugger;*/ stack.push({type: begin_type, index: match.index, str: str.slice(match.index, match.index + 10)}); } //enter dead zone
        else if (/*(end_type != -1)*/ ~end_type && !stack.length) unmatched(end_type, match.index); //throw `unmatched '${NestEnd[end_type]}' at ofs ${match.index}`.red;
//    nesting.depth = (nesting.stack || []).length;
        prev.char = !is_escd? char: ""; prev.chofs = match.index; //double esc char == unescaped
//        if (++count > 20) throw "inf loop?".red;
//++replace_unnested.count || (replace_unnested.count = 1);
//if (replace_unnested.count < 10) console.error(`char '${char}', nesting ${stack.length}, match ${match.length}:'${match[0]}', index ${match.index} ${highlight(str, match.index, 10)} @${__line}`);
//console.error(`match#${replace_unnested.count}: inx ${commas(match.index)} (line ${commas(numlines(str, match.index))}), stack ${stack.length}:${NestBegin[(stack.top || {}).type]}, #subm ${commas(match.length)}, my char ${commas((char || "").length)}:'${trunc(char, 10, true)}', caller's ${commas(match[0].length)}:'${trunc(match[0], 10, true)}' @${__line}`)
        if (char || stack.length) continue; //don't return my special chars or nested matches; //!(caller_match || []).length || stack.length) continue;
//        caller_match.index = match.index;
//        caller_match.input = match.input;
        const repl_str = cb_func(match);
        if (typeof repl_str != "undefined")
        {
            retstr += str.slice(prev.index || 0, match.index) + repl_str; //cb_func(match);
//console.error(retstr.yellow_lt);
            prev.index = match.index + match[0].length;
        }
        if (!repl_all) break;
    }
    if (stack.length) unmatched(stack.top.type, stack.top.index); //throw `unmatched '${NestBegin[stack.top.type]}' at ofs ${stack.top.index}: ${str.slice(Math.max(stack.top.index - 10, 0), stack.top.index)}${str.slice(stack.top.index, stack.top.index + 1).yellow_lt}${str.slice(stack.top.index + 1, stack.top.index + 10).red_lt}`.red_lt;
    return retstr + str.slice(prev.index || 0); //add trailing unreplaced fragment

    function unmatched(type, ofs)
    {
        console.error(`${replace_unnested.count}. unmatched[${stack.length}] '${NestBegin[type]}' at ofs ${commas(ofs)} (line ${numlines(str, ofs)}): ${highlight(str, ofs, "30".yellow, "10".yellow)} @${__stack[3].getLineNumber()}`.yellow); //str.slice(Math.max(ofs - 30, 0), ofs)}${str.slice(ofs, ofs + 1).red_lt}${str.slice(ofs + 1, ofs + 10).yellow_lt}`.yellow_lt);
//        if (stack.length) console.error(JSON.stringify(stack));
//        console.error("re", re.source, re.flags);
    }
}

//make it easier to see where error is:
function highlight(str, ofs, before, after)
{
    const VisibleSpace = String.fromCharCode(0xa4);
    const color_re = /m(\d+)\x1b/; // /\d+/;
//    if (!highlight.space) highlight.space = VisibleSpace; //String.fromCharCode(0xa4);
//++highlight.count || (highlight.count = 1);
    let len_before, color_before = (before + "").replace(color_re, (match, color) => { len_before = +color; return "m##\x1b"; });
    if (!len_before) [len_before, color_before] = [before, "##"];
    color_before = color_before.replace(/##/, str.slice(Math.max(ofs - len_before, 0), ofs).escall).blue; //Math.max(ofs - 1, 0))).blue;
    let len_after, color_after = ((after || before) + "").replace(color_re, (match, color) => { len_after = +color; return "m##\x1b"; });
    if (!len_after) [len_after, color_after] = [after || before, "##"];
    color_after = color_after.replace(/##/, str.slice(ofs + 1, ofs + len_after).escall).blue;
//if (highlight.count < 5) { console.error("before", before); console.error("color before", color_before); }
    return `${color_before}${str.slice(ofs, ofs + 1).escall.replace(/ /, highlight.space || VisibleSpace).red}${color_after}`; //kludge: show something visible in place of space; //Math.max(ofs -1, 0)
}

function dedupe(str)
{
    return (str || "").split("").reduce((contents, char) => (contents.indexOf(char) != -1)? contents: contents + char, "");
//    return Object.keys((str || "").split("").reduce((contents, char) => { ++contents[char]; return contents; }, {})).join("");
}

function trunc(str, len, esc)
{
    var retval = (str || "").slice(0, len);
    if (retval.length == len) retval += ` ${commas(str.length - len)} more...`.slice(str[len - 1] == " ");
    if (esc) retval = retval.escall; //replace(/\r/g, "\\r").replace(/\n/g, "\\n");
    return retval;
}

function json_tidy(str)
{
return str;
    return (str || "").replace(/(\{)"|(,)"|"(:)/g, "$1$2$3"); //|#PEG-KLUDGE#\}/g, "$1$2$3"); //kludge: peg parser wants matched "}" here
}

function pct(val, prec) { return Math.round(100 * val / (prec || 1)) * (prec || 1) + "%"; }

function commas(num) { return num.toLocaleString(); } //grouping (1000s) default = true

function echo(val, desc) { console.error((desc || "echo: #").replace(/#/, JSON.stringify(val))); return val; }

function rg(str, ok)  { return ok? str.green: str.red; }

function plural(count, multiple, single)
{
    if (typeof count == "object") count = numkeys(count);
    else if (count.length) count = count.length; //array
    plural.suffix = (count == 1)? single || "": multiple || "s";
    return count;
}

function numkeys(obj) { return Object.keys(obj || {}).length; }

function numlines(src, len) { return ((typeof len != "undefined")? src.slice(0, len): (src || "")).split(/\r?\n/).length; }

function debug(str) { console.log(str); }

function inspect(obj) { console.log(util.inspect(obj, false, 10)); }

function error(msg) { throw `${msg || "error"}  @${__parent_line}`.red; }

function warn(msg) { console.error(`${msg}  @${__parent_line}`.yellow); }

function entries(obj)
{
    if (Object.prototype.entries) return Object.entries(obj);
    return Object.keys(obj).map((key) => [key, obj[key]]);
}

function forEachRev(ary, cb)
{
    for (var i = ary.length - 1; i >= 0; --i) cb(ary[i], i, ary);
    return ary.length;
}


function extensions()
{
    if (extensions.done) return; //once only
    Object.defineProperty(global, '__parent_line', { get: function() { return __stack[2].getLineNumber(); } });
//    Object.defineProperty(global, '__grand_parent_line', { get: function() { return __stack[3].getLineNumber(); } });
//console.error("apt", (Array.prototype.top || "none").toString());
if (!Array.prototype.top)
    Object.defineProperty(Array.prototype, "top", //{ get() { return this[this.length - 1]; }, });
    {
        get() { return this[this.length - 1]; },
        set(newval) { this.pop(); this.push(newval); },
    });
if (!Array.prototype.push_fluent)
    Array.prototype.push_fluent = function() { this.push.apply(this, arguments); return this; }
if (!Array.prototype.unshift_fluent)
    Array.prototype.unshift_fluent = function() { this.unshift.apply(this, arguments); return this; }
//console.error("apt", (Array.prototype.top || "none").toString());
    Array.prototype.forEachRev = function(cb) { return forEachRev(this, cb); }

    String.prototype.replace_log = function(re, newstr)
    {
        let retval = this.replace.apply(this, arguments);
        if (retval == this) console.error(`Did not replace '${re.pre_excl || re}' @${__stack[1].getLineNumber()} in ${extensions.bname}`.yellow);
        return retval;
    }
    String.prototype.replace_unnested = function(re, cb, delims) { return replace_unnested(this, re, cb, delims); }
    String.prototype.replace_unn_log = function(re, newstr, delims)
    {
        let retval = replace_unnested(this, re, newstr, delims);
        if ((retval == this) && !replace_unnested.nowarn) console.error(`Did not replace '${re.source}' @${__stack[1].getLineNumber()} in ${extensions.bname}`.yellow);
        return retval;
    }
if (!String.prototype.splice) //NOTE: strings are immutable so caller must use assignment stmt
    String.prototype.splice = function(ofs, len, ...more) { return this.slice(0, ofs) + more.join("") + this.slice(ofs + len); }
    Object.defineProperty(String.prototype, "escnl", { get() { return (this || "").replace(/\r/g, "\\r").replace(/\n/g, "\\n"); }, });
    Object.defineProperty(String.prototype, "escall", { get() { return (this || "").replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/[^\x1b\x20-\x7E]/g, (match) => "\\x" + match.charCodeAt(0).toString(16)); }, }); //allow Esc for color
//console.error("apt", (Array.prototype.top || "none").toString());
//    if (!Array.prototype.top)
//        Object.defineProperty(Array.prototype, "top", { get() { return this[this.length - 1]; }, });
//console.error("apt", (Array.prototype.top || "none").toString());
    extensions.done = true;
}

//share helper functions with others:
if (!module.parent) main();
[dedupe, commas, echo, plural, numkeys, numlines, pct, trunc, highlight, rg, /*exclre, replace_log,*/ json_tidy, entries, extensions, replace_unnested, warn, error, inspect, debug].forEach((func) => module.exports[func.name] = func);

//eof