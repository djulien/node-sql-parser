//https://pegjs.org/documentation

//peg parser initializer:
//adds custom logic to peg parser
//gets inserts below parser logic right before parser start rule is invoked
{
//require("magic-globals"); //https://github.com/gavinengel/magic-globals
//require("colors").enabled = true; //for console output; https://github.com/Marak/colors.js/issues/127
//const util = require("util");
const {commas, highlight, echo, entries, numkeys, inspect} = require("../peg/ant2peg");

//    const HELLO = "hello";

//debug info:
    function debug(str) { console.log(str); }

//    function inspect(obj) { console.log(util.inspect(obj, false, 10)); }

//wedge debug info (override peg funcs):
//  const sv_peg$buildStructuredError = peg$buildStructuredError;
    function peg$buildStructuredError(expected, found, location)
    {
        console.log("fail exp".red, peg$maxFailExpected);
        console.log("fail pos".red, peg$maxFailPos, "line", input.slice(0, peg$maxFailPos).split(/\n/).length, highlight(input, peg$maxFailPos, 20));
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
//    function highlight(str, ofs, len)
//    {
//        return `${str.slice(Math.max(ofs - len, 0), Math.max(ofs - 1, 0)).blue}${str.slice(Math.max(ofs -1, 0), ofs + 1).red}${str.slice(ofs + 1, ofs + len).blue}`.replace(/\n/g, "\\n");
//    }

//return "true" so these can all be embedded into grammar rules:
    function DEBUG(n)
    {
//    var called_from = __stack[1].getLineNumber();
if (!state.srcline.match(/:7735$/)) return true;
        if (!DEBUG.seen) DEBUG.seen = {};
        ++DEBUG.seen[n] || (DEBUG.seen[n] = 1);
console.error(`DEBUG(${n}) loc ${my_location()} ${state.srcline}`.red);
console.error("STACK", __stack.slice(2).map((stkfr, inx, all) => (all[all.length - inx - 1].getFunctionName() || "no func?").replace(/^peg\$parse/, "")).join(" -> ").cyan);
console.error("inp:", input.slice(peg$currPos, peg$currPos + 30).escall.blue);
//if (!DEBUG.seen) debugger; //first time only;
debugger;
        if (n < 0) throw `DEBUG(${n}) ${state.srcline}`.red;
        return true;
    }

    function my_location()
    {
        const info = location(); //peg start/end info
//        return {ofs: info.start.offset, line: info.start.line, col: info.start.column}; //abreviated info
        return `${info.start.offset}@${info.start.line}.${info.start.column}`; //more abreviated info
    }

//    const state = []; //{};
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

//    function colref(name) { return addref("col_refs", name_obj); }
//    {
//        (state.top.cols[name] || (state.top.cols[name] = [])).push(my_location());
//debugger;
//        return true;
//    }

//    function tblref(name_obj) { return addref("tbl_refs", name_obj); }
//    {
//console.error(`tblref @${__line}`, JSON.stringify(name));
//process.exit();
//        (state.top.tbls[key(name_obj)] || (state.top.tbls[key(name_obj)] = [])).push(my_location());
//debugger;
//        return name_obj; //true;
//    }

//    function funcref(name_obj) { return addref("func_refs", name_obj); }
//    {
//        (state.top.func_refs[key(name_obj)] || (state.top.func_refs[key(name_obj)] = [])).push(my_location());
//debugger;
//        return name_obj; //true;
//    }

//    function funcdef(name_obj) { return addref("func_defs", name_obj); }
//    {
//        (state.top.func_defs[key(name_obj)] || (state.top.func_defs[key(name_obj)] = [])).push(my_location());
//debugger;
//        return name_obj; //true;
//    }

//    function verb(name_obj) { return addref("verbs", name_obj); }
//    {
//        if (!name) state.verb.pop();
//        else state.verb.push(name);
//        (state.verbs[key(name_obj)] || (state.verbs[key(name_obj)] = [])).push(my_location());
//debugger;
//        return name_obj; //true;
//    }

    const state = []; //{};

    function addref(type, name_obj)
    {
//        (state.top[type][key(name_obj)] || (state.top[type][key(name_obj)] = [])).push(my_location());
        (state.top[type] || (state.top[type] = [])).push(Object.assign(name_obj, {loc: my_location()}));
//debugger;
        return name_obj; //true;
    }

//parse results check-point:
//set chkpt before first branch, restore chkpt after failed branches
    function CHKPT(chkpt)
    {
        if (!chkpt) return state.push_fluent({}).length; //++CHKPT.seq || (CHKPT.seq = 1); //new (nested) chkpt (must be non-0)
//restore (back-track:
//forget any parse results since chkpt
//        parse_results.push(state_name);
//        saved_state[state_name] = results.seq++;
        state.splice(chkpt - 1); //.forEach((depth, inx) => console.error(`chkpt[${inx}]: dropping ${JSON.stringify(depth, null, 2)} @${__file}:${__line}`));
        return true;
    }

    function unchkpt(chkval)
    {
        if (chkval.map) chkval = chkval.map((aryval) => aryval.join? aryval.join(""): aryval).join("");
        return chkval.join? chkval.join(""): chkval;
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
//        state.verbs = [];
//        state.tbls = {};
//        state.cols = {};
//        state.func_defs = {};
//        state.func_refs = {};
//        var_defs: {},
//        var_refs: {},
        return CHKPT(); //create initial stack frame
    }

//add keywords to reservedMap{} rather than using separate rules:
    function iskeywd(str)
    {
        const keywds =
        {
            #KEYWORDS# //this will be replaced by a list of keywords
        };
        str = key(str);
if (!str.toUpperCase) throw new Error(`!str? ${typeof str}: ${JSON.stringify(str)} @${__file}:${__line}`.red);
        return keywds[str.toUpperCase()];
    }

//return first prop of an obj:
//first prop name is used as object "type" without needing extra prototypes
    function key(obj)
    {
if (typeof obj != "object") throw new Error(`!obj @${__file}:${__line}`.red);
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

//    function commas(num) { return num.toLocaleString(); } //grouping (1000s) default = true

//return parsed results:
    function results()
    {
        state.elapsed = `${commas(Date.now() - state.started)} msec`;
//        state.started = null;
//console.error("results".cyan);
//        inspect(state); //TODO: return this to caller
        const retval = {};
//        return state.reduce((keep, val) => numkeys(val)? keep.push_fluent(val): keep, []); //true;
        state.forEach((chkpt) => entries(chkpt).forEach(([type, list]) => retval[type] = list.concat.apply(list, retval[type] || [])));
        return retval;
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

//    function json_tidy(str)
//    {
//        return (str || "").replace(/(\{)"|(,)"|"(:)|#PEG-KLUDGE#\}/g, "$1$2$3"); //kludge: peg parser wants matched "}" here
//    }

//debugger;
}


//first rule = start rule; redirect to real start:
//allow bare stmts as well
//start = WHITE_SPACE? (sql_script / seq_of_statements) EOF
new_start: WHITE_SPACE /*"DJTEST" { return DEBUG(0); }?*/ srcline sql_script { return results(); };

srcline: /*{ return DEBUG(0); }?*/ [@] file=[^:]+ [:] line=[0-9]+ ~[0-9] WHITE_SPACE { init(`${file.join("")}:${line.join("")}`); return DEBUG(0); };

//end of string token:
TOKEND: ~[A-Za-z0-9$@_] WHITE_SPACE;

//optional white space:
//TODO: required white space?
WHITE_SPACE: [ \t\r\n]*; //(NEWLINE / ' ')*

//save parse state at start of conditional branch:
//failed branches will restore back to chkpt
CHKPT: "" { return CHKPT(); };

dummy: 'a' | 'b' { return true; }? 'c'; //dummy rule to avoid "did not replace" warnings

//eof


//TODO?:
//eat white space with all tokens
//upon see proc/func, push new func, append verbs to func
//  upon see C/R/U/D, push new verb, append tbl, col, func refs to verb
//  upon valid stmt end, emit verb with tbl/col/func refs
//upon valid proc end, emit func with verb refs
