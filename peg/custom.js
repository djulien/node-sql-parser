//https://pegjs.org/documentation

//peg parser initializer:
//adds custom logic to peg parser
//gets inserts below parser logic right before parser start rule is invoked
{
//    const HELLO = "hello";
    let state =
    {
        verb: [], //stack
        tbls: {},
        cols: {},
        funcs: {},
    }

//return "true" so these can all be embedded into grammar rules:
    function start_rule()
    {
//debugger;
        return true;
    }

    function colref(name)
    {
        ++state.cols[name] || (state.cols[name] = 1);
        return true;
    }

    function tblref(name)
    {
        ++state.tbls[name] || (state.tbls[name] = 1);
        return true;
    }

    function funcref(name)
    {
        ++state.funcs[name] || (state.funcs[name] = 1);
        return true;
    }

    function verb(name)
    {
        if (!name) state.verb.pop();
        else state.verb.push(name);
        return true;
    }

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

    function makename(head, tail, shape)
    {
        let retval = head;
        if (Array.isArray(shape))
            tail.forEach((level) => retval += `.${level[shape[0]]}`);
        else
            retval += (typeof shape != "undefined")? tail[shape]: tail;
        return retval;
    }

//kludge: hang extra functions/data off parse() so they will also be exported
//    peg$parse.from = from;
    peg$parse.init = init;
    peg$parse.results = state;

debugger;
}


//first rule = start rule; redirect to real start:
//allow bare stmts as well
//start = WHITE_SPACE? (sql_script / seq_of_statements) EOF
start = WHITE_SPACE? sql_script


WHITE_SPACE = (NEWLINE / ' ')*

//eof