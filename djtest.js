#!/usr/bin/env node

'use strict';
//const utils = require("utils");
const Parser = require('./lib/parser');

var sql;
//var sql, ast;
//const sql = "update xyz set x = 1, y = '2', z = three where key in (SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 3)";

//NOTE: had to edit ../../peg/nquery.pegjs and then ../../make to add "||" operator
sql = "select a.x || a.y as Value from db.dual a";
//test(sql);

sql = `
function f(s1 varchar(12), i2 integer, d3 date) returns bool is
--procedure p returns bool is
begin
    select a from dual;
    return a <> 4;
end
`;
//test(sql);

sql = `
function BeforePForm return boolean is
begin
 SRW.DO_SQL('SET ROLE ALL'); 
  return (TRUE);
end;
`;
//test(sql);

sql =
`-- block 2 @CM_DET_STATS.xml:1657
function PercentExecFormula return Number is
  Percent_exec number(5) :=0;
begin

  IF :solved=0
      Then
        return(0);
  ELSE
  	 Percent_exec:=(:exec_cleared/:solved)*100;
       return( Percent_exec);
  end if;
   
 END;
`;
test(sql);


function test(sql)
{
    var ast, str;
    sql = sql.replace(/--[^\n]*/g, ""); //remove single-line comments
    sql = sql.replace(/\/\*(.|\n)*?\*\//g, ""); //remove multi-line comments
    sql = sql.replace(/\(\+\)/g, " "); //drop (+) old-style outer join syntax
    inspect(sql);
    ast = Parser.parse(sql);
//    str = JSON.stringify(ast, null, 2); //utils.inspect(ast));
//    str = str.replace(/\s*\r?\n\s*(}|])\s*(,)?\s*(?=\r?\n)/g, " $1$2");
//    console.log(str);
    inspect(sql);
    inspect(ast);
}

function debug(str) { console.log(str); }

function inspect(obj) { console.log(require('util').inspect(obj, false, 20/*10*/, true)); }
  
//eof