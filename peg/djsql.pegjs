//skeletal grammar based on https://github.com/antlr/grammars-v4/blob/master/plsql/PlSqlParser.g4

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

    function inspect(obj) { console.log(util.inspect(obj, false, 20)); }

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
//            #KEYWORDS#
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


//first rule = start rule
//start = WHITE_SPACE? (sql_script / seq_of_statements) EOF
start: WHITE_SPACE { return DEBUG(0); }? sql_script { return results(); } ;

//end of string token:
TOKEND: ~[A-Za-z0-9$@_] WHITE_SPACE;

//optional white space:
//TODO: required white space?
WHITE_SPACE: [ \t\r\n]* ; //(NEWLINE / ' ')*

//eof


///////////////////////////////////////////////////////////////////////////////////
//special chars/fragments:

DOUBLE_PERIOD:  '..';
PERIOD:         '.';

UNSIGNED_INTEGER:    [0-9]+;

CHAR_STRING: "'"  ( [^'\r\n]  |  "''"  |  NEWLINE)* "'" WHITE_SPACE;

DELIMITED_ID: ["]  inner=( [^"\r\n]  |  ["]["])+ '"' { return inner.join(""); };

PERCENT:                   '%';
AMPERSAND:                 '&';
LEFT_PAREN:                '(';
RIGHT_PAREN:               ')';
DOUBLE_ASTERISK:           '**';
ASTERISK:                  '*';
PLUS_SIGN:                 '+';
MINUS_SIGN:                '-';
COMMA:                     ',';
SOLIDUS:                   '/';
AT_SIGN:                   '@';
ASSIGN_OP:                 ':=';

BINDVAR
//    : ':' SIMPLE_LETTER  (SIMPLE_LETTER | [0-9] | '_')*
    : [:] SIMPLE_LETTER  (SIMPLE_LETTER | [0-9_])* TOKEND
    | [:] DELIMITED_ID  // not used in SQL but spotted in v$sqltext when using cursor_sharing
    | [:] UNSIGNED_INTEGER
    | QUESTION_MARK // not in SQL, not in Oracle, not in OCI, use this for JDBC
    ;

NOT_EQUAL_OP:              '!='
            |              '<>'
            |              '^='
            |              '~='
            ;
//CARRET_OPERATOR_PART:      '^';
//TILDE_OPERATOR_PART:       '~';
//EXCLAMATION_OPERATOR_PART: '!';
GREATER_THAN_OP:           '>';
LESS_THAN_OP:              '<';
COLON:                     ':';
SEMICOLON:                 ';';

BAR:       '|';
EQUALS_OP: '=';

LEFT_BRACKET:  '[';
RIGHT_BRACKET: ']';

INTRODUCER: [_];

REGULAR_ID: head=SIMPLE_LETTER tail=(SIMPLE_LETTER | [$_#0-9])* TOKEND { return head + tail.join(""); };

SPACES: [ \t\r\n]+ -> channel(HIDDEN);

fragment NEWLINE_EOF    : NEWLINE | EOF;
fragment QUESTION_MARK  : '?';
fragment SIMPLE_LETTER  : [A-Za-z]; //allow lower case -DJ
fragment FLOAT_FRAGMENT : UNSIGNED_INTEGER* [.]? UNSIGNED_INTEGER+ ![0-9]; //is !dig look-ahead needed? -DJ
fragment NEWLINE        : [\r]? [\n];
fragment SPACE          : [ \t];


///////////////////////////////////////////////////////////////////////////////////
//keywords used:

ABS= 'ABS' TOKEND //4 occurrences: J-FMB.sql:31,841, J-FMB.sql:31,842, ...
ABSDATE= 'ABSDATE' TOKEND //2 occurrences: J-FMB.sql:7,120, J-FMB.sql:7,122
AND= 'AND' TOKEND //7360 occurrences: CM-FMB.sql:58, CM-FMB.sql:58, ...
AS= 'AS' TOKEND //69 occurrences: CM-FMB.sql:1,508, J-FMB.sql:19,388, ...
ASC= 'ASC' TOKEND //33 occurrences: J-FMB.sql:5,161, J-FMB.sql:5,936, ...
BEGIN= 'BEGIN' TOKEND //8676 occurrences: CM-FMB.sql:3, CM-FMB.sql:30, ...
BETWEEN= 'BETWEEN' TOKEND //210 occurrences: CM-RDF.sql:101, CM-RDF.sql:452, ...
BOOLEAN= 'BOOLEAN' TOKEND //676 occurrences: CM-FMB.sql:137, CM-FMB.sql:179, ...
BY= 'BY' TOKEND //1029 occurrences: CM-FMB.sql:454, CM-FMB.sql:1,149, ...
CASE= 'CASE' TOKEND //446 occurrences: CM-FMB.sql:454, CM-FMB.sql:1,580, ...
CHAR= 'CHAR' TOKEND //207 occurrences: CM-FMB.sql:831, CM-FMB.sql:2,691, ...
CHR= 'CHR' TOKEND //91 occurrences: J-FMB.sql:12,153, J-FMB.sql:12,159, ...
COMMIT= 'COMMIT' TOKEND //433 occurrences: CM-FMB.sql:435, CM-FMB.sql:1,489, ...
CREATE= 'CREATE' TOKEND //8 occurrences: TR-RDF.sql:932, TR-RDF.sql:952, ...
DATE= 'DATE' TOKEND //318 occurrences: CM-FMB.sql:112, CM-FMB.sql:2,053, ...
DELETE= 'DELETE' TOKEND //287 occurrences: CM-FMB.sql:34,681, CM-FMB.sql:34,681, ...
DES= 'DES' TOKEND //4 occurrences: J-FMB.sql:18,474, J-FMB.sql:18,563, ...
DESC= 'DESC' TOKEND //147 occurrences: CM-FMB.sql:454, CM-FMB.sql:2,413, ...
DUAL= 'DUAL' TOKEND //873 occurrences: CM-FMB.sql:119, CM-FMB.sql:189, ...
ELSE= 'ELSE' TOKEND //5061 occurrences: CM-FMB.sql:10, CM-FMB.sql:42, ...
ELSIF= 'ELSIF' TOKEND //1686 occurrences: CM-FMB.sql:39, CM-FMB.sql:67, ...
END= 'END' TOKEND //22544 occurrences: CM-FMB.sql:21, CM-FMB.sql:22, ...
ENDLOOP= 'ENDLOOP' TOKEND //12 occurrences: TR-FMB.sql:70,344, TR-FMB.sql:70,364, ...
ERR= 'ERR' TOKEND //112 occurrences: CM-FMB.sql:1,301, CM-FMB.sql:1,314, ...
ERROR= 'ERROR' TOKEND //6 occurrences: J-FMB.sql:30,322, J-FMB.sql:37,890, ...
EXCEPTION= 'EXCEPTION' TOKEND //2754 occurrences: CM-FMB.sql:86, CM-FMB.sql:129, ...
EXIT= 'EXIT' TOKEND //410 occurrences: J-FMB.sql:72, J-FMB.sql:90, ...
FALSE= 'FALSE' TOKEND //398 occurrences: CM-FMB.sql:157, CM-FMB.sql:159, ...
FOR= 'FOR' TOKEND //150 occurrences: CM-FMB.sql:1,356, CM-FMB.sql:5,827, ...
FROM= 'FROM' TOKEND //5541 occurrences: CM-FMB.sql:84, CM-FMB.sql:119, ...
GOTO= 'GOTO' TOKEND //22 occurrences: J-FMB.sql:98, J-FMB.sql:158, ...
GOTOREC= 'GOTOREC' TOKEND //16 occurrences: J-FMB.sql:4,914, J-FMB.sql:4,922, ...
GROUP= 'GROUP' TOKEND //110 occurrences: CM-FMB.sql:1,508, CM-RDF.sql:464, ...
IF= 'IF' TOKEND //26363 occurrences: CM-FMB.sql:5, CM-FMB.sql:22, ...
IN= 'IN' TOKEND //2130 occurrences: CM-FMB.sql:33, CM-FMB.sql:68, ...
INC= 'INC' TOKEND //103 occurrences: CM-FMB.sql:3,112, CM-FMB.sql:3,114, ...
INPUT= 'INPUT' TOKEND //2 occurrences: TR-FMB.sql:53,121, TR-FMB.sql:53,123
INT= 'INT' TOKEND //75 occurrences: TR-FMB.sql:12,377, TR-FMB.sql:12,378, ...
INTEGER= 'INTEGER' TOKEND //620 occurrences: CM-FMB.sql:851, CM-FMB.sql:852, ...
INTO= 'INTO' TOKEND //3542 occurrences: CM-FMB.sql:83, CM-FMB.sql:119, ...
LOCKED= 'LOCKED' TOKEND //7 occurrences: J-FMB.sql:3,807, JTintf-FMB.sql:80, ...
LOOP= 'LOOP' TOKEND //1383 occurrences: CM-FMB.sql:303, CM-FMB.sql:330, ...
MAX= 'MAX' TOKEND //119 occurrences: CM-FMB.sql:2,956, CM-FMB.sql:2,995, ...
MAXIMIZE= 'MAXIMIZE' TOKEND //2 occurrences: CM-FMB.sql:15,246, CM-FMB.sql:43,683
MESSAGE= 'MESSAGE' TOKEND //5419 occurrences: CM-FMB.sql:90, CM-FMB.sql:132, ...
MINUTE= 'MINUTE' TOKEND //12 occurrences: J-FMB.sql:17,643, J-FMB.sql:17,645, ...
MOD= 'MOD' TOKEND //10 occurrences: J-FMB.sql:12,880, J-FMB.sql:16,806, ...
NCHARS= 'NCHARS' TOKEND //3 occurrences: CM-FMB.sql:38,289, CM-FMB.sql:38,292, ...
NOT= 'NOT' TOKEND //4249 occurrences: CM-FMB.sql:197, CM-FMB.sql:209, ...
NULL= 'NULL' TOKEND //11464 occurrences: CM-FMB.sql:169, CM-FMB.sql:187, ...
NVL= 'NVL' TOKEND //2137 occurrences: CM-FMB.sql:1,474, CM-FMB.sql:1,474, ...
OF= 'OF' TOKEND //12 occurrences: J-FMB.sql:31,739, TR-FMB.sql:9,518, ...
OFF= 'OFF' TOKEND //69 occurrences: CM-FMB.sql:3,108, CM-FMB.sql:3,110, ...
OR= 'OR' TOKEND //1351 occurrences: CM-FMB.sql:155, CM-FMB.sql:371, ...
ORDER= 'ORDER' TOKEND //907 occurrences: CM-FMB.sql:454, CM-FMB.sql:1,149, ...
OWNER= 'OWNER' TOKEND //594 occurrences: J-FMB.sql:1,209, J-FMB.sql:1,231, ...
PARAMETERNAME= 'PARAMETERNAME' TOKEND //7 occurrences: JTintf-FMB.sql:1,999, JTintf-FMB.sql:2,007, ...
PARAMETERS= 'PARAMETERS' TOKEND //4 occurrences: JTintf-FMB.sql:1,952, JTintf-FMB.sql:2,001, ...
PKG= 'PKG' TOKEND //239 occurrences: J-FMB.sql:24,356, J-FMB.sql:24,361, ...
PRAGMA= 'PRAGMA' TOKEND //41 occurrences: CM-FMB.sql:141, CM-FMB.sql:144, ...
PROCEDURE= 'PROCEDURE' TOKEND //2580 occurrences: CM-FMB.sql:1, CM-FMB.sql:76, ...
PROCESS= 'PROCESS' TOKEND //6 occurrences: J-FMB.sql:1,211, J-FMB.sql:1,240, ...
PROCNAME= 'PROCNAME' TOKEND //4 occurrences: TR-FMB.sql:1,988, TR-FMB.sql:2,096, ...
PUT= 'PUT' TOKEND //4 occurrences: J-FMB.sql:4,532, TR-RDF.sql:1,877, ...
QUERY= 'QUERY' TOKEND //17 occurrences: TR-RDF.sql:7,762, TR-RDF.sql:7,780, ...
REPLACE= 'REPLACE' TOKEND //188 occurrences: CM-FMB.sql:1,162, CM-FMB.sql:2,727, ...
RETURN= 'RETURN' TOKEND //3197 occurrences: CM-FMB.sql:26, CM-FMB.sql:64, ...
ROWID= 'ROWID' TOKEND //10 occurrences: TR-FMB.sql:30,190, TR-FMB.sql:30,190, ...
ROWNUM= 'ROWNUM' TOKEND //342 occurrences: CM-FMB.sql:580, CM-FMB.sql:602, ...
SELECT= 'SELECT' TOKEND //5442 occurrences: CM-FMB.sql:82, CM-FMB.sql:117, ...
STATUS= 'STATUS' TOKEND //620 occurrences: CM-FMB.sql:311, CM-FMB.sql:386, ...
STRING1= 'STRING1' TOKEND //50 occurrences: J-RDF.sql:1,564, J-RDF.sql:1,567, ...
SUM= 'SUM' TOKEND //180 occurrences: J-FMB.sql:4,873, J-FMB.sql:4,873, ...
TABLE= 'TABLE' TOKEND //20 occurrences: J-FMB.sql:31,739, TR-FMB.sql:9,518, ...
TEMP= 'TEMP' TOKEND //46 occurrences: J-FMB.sql:12,422, J-FMB.sql:12,430, ...
TEXT= 'TEXT' TOKEND //23 occurrences: J-FMB.sql:586, J-FMB.sql:2,110, ...
THEN= 'THEN' TOKEND //18413 occurrences: CM-FMB.sql:7, CM-FMB.sql:33, ...
TO= 'TO' TOKEND //5 occurrences: TR-FMB.sql:23, TR-FMB.sql:6,337, ...
TODAY= 'TODAY' TOKEND //2 occurrences: J-RDF.sql:850, J-RDF.sql:939
TRIM= 'TRIM' TOKEND //10 occurrences: J-FMB.sql:11,759, J-FMB.sql:11,759, ...
TROFF= 'TROFF' TOKEND //5 occurrences: CM-RDF.sql:11, CM-RDF.sql:12, ...
TRUE= 'TRUE' TOKEND //705 occurrences: CM-FMB.sql:151, CM-FMB.sql:220, ...
TRUNC= 'TRUNC' TOKEND //228 occurrences: CM-RDF.sql:663, CM-RDF.sql:834, ...
TTY= 'TTY' TOKEND //4 occurrences: TR-FMB.sql:34,879, TR-FMB.sql:37,745, ...
UPDATE= 'UPDATE' TOKEND //471 occurrences: CM-FMB.sql:5,349, CM-FMB.sql:15,269, ...
USER= 'USER' TOKEND //364 occurrences: CM-FMB.sql:767, CM-FMB.sql:769, ...
USERID= 'USERID' TOKEND //657 occurrences: J-FMB.sql:1,209, J-FMB.sql:1,231, ...
USERNAME= 'USERNAME' TOKEND //53 occurrences: CM-FMB.sql:1,217, CM-FMB.sql:2,799, ...
VALCHAR= 'VALCHAR' TOKEND //9 occurrences: J-FMB.sql:33,013, J-FMB.sql:33,719, ...
VARCHAR= 'VARCHAR' TOKEND //104 occurrences: CM-FMB.sql:2,348, CM-FMB.sql:2,350, ...
VARCHAR2= 'VARCHAR2' TOKEND //5733 occurrences: CM-FMB.sql:25, CM-FMB.sql:25, ...
WARNING= 'WARNING' TOKEND //20 occurrences: CM-FMB.sql:2,872, J-FMB.sql:3,727, ...
WHERE= 'WHERE' TOKEND //4465 occurrences: CM-FMB.sql:85, CM-FMB.sql:454, ...
YEAR= 'YEAR' TOKEND //83 occurrences: CM-FMB.sql:5,384, CM-FMB.sql:5,385, ...
YEAR2= 'YEAR2' TOKEND //2 occurrences: J-RDF.sql:733, J-RDF.sql:1,088


//upon see proc/func, push new func, append verbs to func
//  upon see C/R/U/D, push new verb, append tbl, col, func refs to verb
//  upon valid stmt end, emit verb with tbl/col/func refs
//upon valid proc end, emit func with verb refs

//eof