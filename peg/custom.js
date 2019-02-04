//https://pegjs.org/documentation

//peg parser initializer:
//adds custom logic to peg parser
//gets inserts below parser logic right before parser start rule is invoked
{
//require("magic-globals"); //https://github.com/gavinengel/magic-globals
require("colors").enabled = true; //for console output; https://github.com/Marak/colors.js/issues/127
const util = require("util");

//    const HELLO = "hello";
    let state =
    {
        verb: [], //stack
        tbls: {},
        cols: {},
        funcs: {},
    };

//TODO: add keywords to reservedMap{} rather than using separate rules

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
        const where = __stack.slice(1).map((stkfr) => (stkfr.getFunctionName() || "?").replace(/^peg\$parse/, "")).join("->");
        peg$maxFailExpected.push(Object.assign({}, expected, {where})); //show rule stack
    }

//make it easier to see where error is:
    function highlight(str, ofs, len)
    {
        return `${str.slice(ofs - len, ofs - 1).blue}${str.slice(ofs -1, ofs + 1).red}${str.slice(ofs + 1, ofs + len).blue}`.replace(/\n/g, "\\n");
    }

//return "true" so these can all be embedded into grammar rules:
    function DEBUG(n)
    {
        if (!DEBUG.seen) DEBUG.seen = {};
        ++DEBUG.seen[n] || (DEBUG.seen[n] = 1);
debugger;
        if (n < 0) throw `DEBUG(${n})`.red;
        return true;
    }

//    function start_rule()
//    {
//debugger;
//        return true;
//    }

    function colref(name)
    {
        ++state.cols[name] || (state.cols[name] = 1);
//debugger;
        return true;
    }

    function tblref(name)
    {
        ++state.tbls[name] || (state.tbls[name] = 1);
//debugger;
        return true;
    }

    function funcref(name)
    {
        ++state.funcs[name] || (state.funcs[name] = 1);
//debugger;
        return true;
    }

    function verb(name)
    {
        if (!name) state.verb.pop();
        else state.verb.push(name);
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
        state.verb = [];
        state.tbls = {};
        state.cols = {};
        state.funcs = {};
    }

    function iskeywd(str)
    {
        const keywds =
        {
            #KEYWORDS#
        };
        return keywds[str.toUpperCase()];
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

    function results()
    {
        inspect(state); //TODO: return this to caller
        return true;
    }
//kludge: hang extra functions/data off parse() so they will also be exported
//    peg$parse.from = from;
//    peg$parse.init = init;
//    peg$parse.results = state;

//debugger;
}


//first rule = start rule; redirect to real start:
//allow bare stmts as well
//start = WHITE_SPACE? (sql_script / seq_of_statements) EOF
start: WHITE_SPACE { return DEBUG(0); }? sql_script { return results(); } ;

//end of string token:
TOKEND: ~[A-Za-z0-9$@_] WHITE_SPACE;

//optional white space:
//TODO: required white space?
WHITE_SPACE: [ \t\r\n]* ; //(NEWLINE / ' ')*

//eof


//TODO?:
//eat white space with all tokens
//upon see proc/func, push new func, append verbs to func
//  upon see C/R/U/D, push new verb, append tbl, col, func refs to verb
//  upon valid stmt end, emit verb with tbl/col/func refs
//upon valid proc end, emit func with verb refs
