#!/usr/bin/env node

'use strict';
//const utils = require("utils");
const Parser = require('./lib/parser');

var sql;
//var sql, ast;
//const sql = "update xyz set x = 1, y = '2', z = three where key in (SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 3)";

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

sql = `
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
//test(sql);

sql = `
select trunc(c.report_date) "Date", c.case_num
from cm_case c
where c.tr_incidentuid is not null
`;
//test(sql);

//var p132 = /^[^'\\\0-\x1F\x7F]/;
//sql = "select";
//console.log(p132.test(sql.charAt(0))); process.exit();
//sql = `SELECT a fROM garuda_keykeys.keykeys wHERE type > 3 and id in (1, 2, 3) AND keywords CONTAINS (1,'str')`;
//test(sql);

sql = `
function AFTERPFORM return boolean is
--PF_DATE2 varchar2(10);
begin
--  IF :PF_DATE IS NOT NULL THEN
  	:PF_WHERECLAUSE := ' and receipt_date between 
  	to_date('''||PF_DATE2||' 07:00'''||',''MM/DD/YYYY HH24:MI'')'||'
  	and (to_date('''||PF_DATE2||' 07:00'''||',''MM/DD/YYYY HH24:MI'') + 1)';
--  END IF; 
  return (TRUE);
end;
`;
//sql = `SELECT 'single str' ,\"double string \", ' escape \\n \\t \\u0002'`;
//test(sql);

sql = `
SELECT ALL RECEIPT_NO FROM CT_RECEIPT C
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