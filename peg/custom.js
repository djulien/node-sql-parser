//https://pegjs.org/documentation

//peg parser initializer:
//adds custom logic to peg parser
//gets inserts below parser logic right before parser start rule is invoked
{
//require("magic-globals"); //https://github.com/gavinengel/magic-globals
require("colors").enabled = true; //for console output; https://github.com/Marak/colors.js/issues/127
const util = require("util");

//    const HELLO = "hello";

//debug info:
    function debug(str) { console.log(str); }

    function inspect(obj) { console.log(util.inspect(obj, false, 10)); }

//wedge debug info (override peg funcs):
//  const sv_peg$buildStructuredError = peg$buildStructuredError;
    function peg$buildStructuredError(expected, found, location)
    {
        console.log("fail exp", peg$maxFailExpected);
        console.log("fail pos", peg$maxFailPos, "line", input.slice(0, peg$maxFailPos).split(/\n/).length, highlight(input, peg$maxFailPos, 20));
//    return sv_peg$buildStructuredError.apply(null, arguments);
        return new peg$SyntaxError(
            peg$SyntaxError.buildMessage(expected, found),
            expected,
            found,
            location);
    }

    function describeExpectation(expectation)
    {
        return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation) + ` from ${expectation.where}`;
    }
    
    function peg$fail(expected) 
    {
        if (peg$currPos < peg$maxFailPos) return;
        if (peg$currPos > peg$maxFailPos) 
        {
            peg$maxFailPos = peg$currPos;
            peg$maxFailExpected = [];
        }
//        peg$maxFailExpected.push(expected);
//inspect(__stack[0]);
//console.log(__stack.map((stkfr) => stkfr.getFunctionName()).join(" -> "));
        const where = __stack.slice(1).map((stkfr) => (stkfr.getFunctionName() || "?").replace(/^peg\$parse/, "")).reverse().join(" -> ");
        peg$maxFailExpected.push(Object.assign({}, expected, {where})); //show rule stack
    }

//make it easier to see where error is:
    function highlight(str, ofs, len)
    {
        return `${str.slice(Math.max(ofs - len, 0), Math.max(ofs - 1, 0)).blue}${str.slice(Math.max(ofs -1, 0), ofs + 1).red}${str.slice(ofs + 1, ofs + len).blue}`.replace(/\n/g, "\\n");
    }

//return "true" so these can all be embedded into grammar rules:
    function DEBUG(n)
    {
//    var called_from = __stack[1].getLineNumber();
        if (!DEBUG.seen) DEBUG.seen = {};
        ++DEBUG.seen[n] || (DEBUG.seen[n] = 1);
console.error(`DEBUG(${n}) ${state.srcline}`.red);
//if (!DEBUG.seen) debugger; //first time only;
debugger;
        if (n < 0) throw `DEBUG(${n}) ${state.srcline}`.red;
        return true;
    }

    function my_location()
    {
        const info = location(); //peg start/end info
        return {ofs: info.start.offset, line: info.start.line, col: info.start.column}; //abreviated info
    }

    const state = {};
//    {
//        verbs: [], //stack
//        tbls: {},
//        cols: {},
//        var_defs: {},
//        var_refs: {},
//        func_defs: {},
//        func_refs: {},
//    };

//    function start_rule()
//    {
//debugger;
//        return true;
//    }

    function colref(name)
    {
        (state.cols[name] || (state.cols[name] = [])).push(my_location());
//debugger;
        return true;
    }

    function tblref(name)
    {
        (state.tbls[name] || (state.tbls[name] = [])).push(my_location());
//debugger;
        return true;
    }

    function funcref(name)
    {
        (state.func_refs[name] || (state.func_refs[name] = [])).push(my_location());
//debugger;
        return true;
    }

    function funcdef(name)
    {
        (state.func_defs[name] || (state.func_defs[name] = [])).push(my_location());
//debugger;
        return true;
    }

    function verb(name)
    {
//        if (!name) state.verb.pop();
//        else state.verb.push(name);
        (state.verbs[name] || (state.verbs[name] = [])).push(my_location());
//debugger;
        return true;
    }

//reformat lexer/parser rule results into simpler data fmts:
//    function makeid(head, tail)
//    {
//debugger;
//        return head + tail.join("");
//    }

//parser mgmt:
//    function from(srcline)
//    {
//        state.srcline = srcline;
//        return results;
//    }

    function init(srcline)
    {
        state.srcline = srcline;
        Object.defineProperty(state, "started", {value: Date.now(), writable: true}); //!enum
        state.verbs = [];
        state.tbls = {};
        state.cols = {};
        state.func_defs = {};
        state.func_refs = {};
//        var_defs: {},
//        var_refs: {},
    }

//add keywords to reservedMap{} rather than using separate rules:
    function iskeywd(str)
    {
        const keywds =
        {
            #KEYWORDS# //this will be replaced by a list of keywords
        };
        str = key(str);
        return keywds[str.toUpperCase()];
    }

//return first prop of an obj:
    function key(obj)
    {
        const keys = Object.keys(obj || {});
        return keys.length? obj[keys[0]]: obj;
    }
/*
    function mkname(head, tail, shape)
    {
debugger;
        let retval = head;
        if (Array.isArray(shape))
            tail.forEach((level) => retval += `.${level[shape[0]]}`);
        else //if (shape != void 0)
            retval += (typeof shape != "undefined")? tail[shape]: tail;
//        else
//            retval += tail.join("");
        return retval;
    }
*/

    function commas(num) { return num.toLocaleString(); } //grouping (1000s) default = true

    function results()
    {
        state.elapsed = `${commas(Date.now() - state.started)} msec`;
        state.started = null;
        inspect(state); //TODO: return this to caller
        return true;
    }
//kludge: hang extra functions/data off parse() so they will also be exported
//    peg$parse.from = from;
//    peg$parse.init = init;
//    peg$parse.results = state;

    function bind_var(bv, ibv, gep)
    {
        const retval = {bv};
        if (ibv) retval.ibv = ibv[1];
        const gepstr = gep.map((part) => part[1]).join(".");
        if (gepstr) retval.gep = gepstr; //filter out nulls
        return (ibv || gepstr)? {bind_var: retval}: bv;
    }

    function json_tidy(str)
    {
        return (str || "").replace(/(\{)"|(,)"|"(:)/g, "$1$2$3"); //kludge: peg parser wants a trailing "}" here
    }

//debugger;
}


//first rule = start rule; redirect to real start:
//allow bare stmts as well
//start = WHITE_SPACE? (sql_script / seq_of_statements) EOF
new_start: WHITE_SPACE /*"DJTEST" { return DEBUG(0); }?*/ srcline WHITE_SPACE sql_script { return results(); } ;

srcline: /*{ return DEBUG(0); }?*/ [@] file=[^:]+ ':' line=[0-9]+ ~[0-9] { init(`${file.join("")}:${line.join("")}`); return DEBUG(0); }

//end of string token:
TOKEND: ~[A-Za-z0-9$@_] WHITE_SPACE ;

//optional white space:
//TODO: required white space?
WHITE_SPACE: [ \t\r\n]* ; //(NEWLINE / ' ')*

dummy: 'a' | 'b' { return true; }?; //dummy rule to avoid "did not replace" warnings

//eof


//TODO?:
//eat white space with all tokens
//upon see proc/func, push new func, append verbs to func
//  upon see C/R/U/D, push new verb, append tbl, col, func refs to verb
//  upon valid stmt end, emit verb with tbl/col/func refs
//upon valid proc end, emit func with verb refs
