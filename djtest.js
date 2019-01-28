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
-- block 1 @CM_BUSNESSUPPOFFENSE.xml:17
select c.case_num Caseno, to_char(c.report_date,'mm/dd/yyyy') Reported, 
to_char(c.date_assigned,'mm/dd/yyyy') Assigned, to_char(c.date_cleared,'mm/dd/yyyy') Cleared,
d.badge_num, c.squad_num, dis.description Status, tr_incidentuid, v.tr_personuid,
b.name Victim,
a.house_num ||' '|| a.direction ||' '|| a.street ||' '|| a.street_type ||' '|| a. apartment Address,
p.area_code ||'-'|| substr(p.phone,1,3) || '-' || substr(p.phone,4,7) Phone,
inc.house_num ||' '|| inc.direction ||' '|| inc.street ||' '|| inc.street_type Location,
d.lastname ||', '|| d.firstname ||' ' || d.mi Detective,
cr.crime_description Crime,
to_char(inc.start_date,'mm/dd/yyyy') OccurenceDate,
troff.last_name ||', '|| troff.first_name ||' '|| substr(troff.middle_name,1,1) ReportingOff,
off.suppoffense_details Notes
--
from cm.case c, cm_victim v, tr_incident inc, tr_officer troff,
cm_detective d, cm_case_crime_type cr, cm_detective_squad s,
cm_disposition dis, cm_supplemental_offense off,
tr_business b, tr_address a, tr_phone p,
tr_firmvictim fv, tr_incident_firmvictim ifv
--
where c.case_num = :PF_REPORT_CASENUM and
off.case_num = c.case_num and
off.suppoffense_seq_num = :PF_REPORT_SEQ_NUM and
c.case_num = v.case_num(+) and
c.tr_incidentuid = inc.incidentuid(+)and
c.badge_num = d.badge_num and 
c.crime_num = cr.crime_num and
c.squad_num = s.squad_num and
c.disposition_num = dis.disposition_num and
c.case_num = off.case_num and
inc.officer_id_reported = troff.officer_id(+) and
c.tr_incidentuid = ifv.incidentuid and
fv.firmvictimuid = ifv.firmvictimuid and
fv.businessuid = b.businessuid and
fv.addressuid = a.addressuid(+) and
fv.phoneuid = p.phoneuid(+)

-- The plus signs were added to the right of cm.victim, tr_person, and tr_incident since they may
-- a deficient number of rows compared to cm.case and cm.victim.  This ensures that the correct
-- number of cases are selected for reporting.
-- David McCormick - 6-30-2006.
`;
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
-- block 5 @CM_BUSNESSUPPOFFENSE.xml:1103
function AFTERPFORM return boolean is
begin
  
  If (:PF_REPORT_CASENUM = 'per_cent') Then
  	:PF_REPORT_CASENUM := '%';
  End If;
  
  If (:PF_REPORT_SEQ_NUM = 'per_cent') Then
  	:PF_REPORT_SEQ_NUM := '%';
  End If;  
  
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