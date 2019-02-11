// (C) 2011-2012 Alibaba Group Holding Limited.
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License 
// version 2 as published by the Free Software Foundation. 

// Author :windyrobin <windyrobin@Gmail.com>

{
  var util = require('util');
//  require("magic-globals");

 //make debug easier -DJ
//return "true" so these can all be embedded into grammar rules:
    function DEBUG(n)
    {
//    var called_from = __stack[1].getLineNumber();
        if (!DEBUG.seen) DEBUG.seen = {};
        ++DEBUG.seen[n] || (DEBUG.seen[n] = 1);
console.error(`DEBUG(${n}) ${state.srcline}`.red);
//if (!DEBUG.seen) debugger; //first time only;
debugger;
        if (n < 0) throw `DEBUG(${n})`.red;
        return true;
    }

//  function inbuf() //BROKEN
//  {
//    debug(input.slice(pre$currPos).replace(/\n/g, "\\n"));
//  }

    let state =
    {
        verb: [], //stack
        tbls: {},
        cols: {},
        funcs: {},
    };

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

    function init(srcline)
    {
        state.srcline = srcline;
        state.verb = [];
        state.tbls = {};
        state.cols = {};
        state.funcs = {};
    }

    function results()
    {
        inspect(state); //TODO: return this to caller
        return true;
    }

    function iskeywd(str)
    {
        const keywds =
        {
//            #KEYWORDS#
        };
        return keywds[str.toUpperCase()];
    }

/////////////////////////////////////////////////////////////////////////////////////////////

  var reservedMap = module.exports.reservedMap || {};
//disambiguate plain proc vars: -DJ
  reservedMap.BEGIN = true;
  reservedMap.END = true;
  reservedMap.PRAGMA = true;
//needed to disambiguate proc calls without "()": -DJ
//  reservedMap.PROCEDURE = true;
//  reservedMap.FUNCTION = true;
//  reservedMap.IF = true;

//allow in-line push: -DJ
  if (!Array.prototype.push_fluent)
    Object.defineProperty(Array.prototype, "push_fluent", {value: function(val) { this.push(val); return this; }});

  function debug(str){
    console.log(str);
  }

  function inspect(obj){
    console.log(util.inspect(obj, false, 10));
  }

  function createUnaryExpr(op, e) {
    return {
      type     : 'unary_expr',
      operator : op,
      expr     : e
    }
  }

  function createBinaryExpr(op, left, right) {
    return {
      type      : 'binary_expr',
      operator  : op,
      left      : left,
      right     : right
    }  
  }

  function createList(head, tail) {
    var result = [head];
    for (var i = 0; i < tail.length; i++) {
      result.push(tail[i][3]);
    }
    return result;
  }

  function createExprList(head, tail, room) {
    var epList = createList(head, tail);
    var exprList  = [];
    var ep;
    for (var i = 0; i < epList.length; i++) {
      ep = epList[i]; 
      //the ep has already added to the global params
      if (ep && ep.type == 'param') {
        ep.room = room;
        ep.pos  = i;
      } else {
        exprList.push(ep);  
      }
    }
    return exprList;
  }

  function createBinaryExprChain(head, tail) {
    var result = head;
    for (var i = 0; i < tail.length; i++) {
      result = createBinaryExpr(tail[i][1], result, tail[i][3]);
    }
    return result;
  }

  var cmpPrefixMap = {
    '+' : true,
    '-' : true,
    '*' : true,
    '/' : true,
    '>' : true,
    '<' : true,
    '!' : true,
    '=' : true,

    //between
    'B' : true,
    'b' : true,
    //for is or in
    'I' : true,
    'i' : true,
    //for like
    'L' : true,
    'l' : true,
    //for not
    'N' : true, 
    'n' : true, 
    //for contains
    'C' : true, 
    'c' : true, 
  }

  //used for store refered parmas
  var params = [];

  //used for dependency analysis
  var varList = [];

  var verb_stk = []; //track what can happen to col or var refs -DJ
  var ctx_stk = []; //track cols/vars used in expr, func/proc, etc -DJ

//wedge debug info: -DJ
//require("magic-globals");
require("colors").enabled = true; //for console output; https://github.com/Marak/colors.js/issues/127

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
      location
    );
  }

/*
//BROKEN-add caller info for easier debug: -DJ
  function peg$literalExpectation(text, ignoreCase) {
    return { type: "literal", text: `${text} @${__stack[1].getLineNumber()}`, ignoreCase: ignoreCase };
  }
*/

//make it easier to see where error is: -DJ
  function highlight(str, ofs, len)
  {
    return `${str.slice(Math.max(ofs - len, 0), Math.max(ofs - 4, 0)).blue}${str.slice(Math.max(ofs - 4, 0), ofs).yellow}${str.slice(ofs, ofs + 4).red}${str.slice(ofs + 4, ofs + len).blue}`.replace(/\n/g, "\\n"); //-DJx
  }
}


/////////////////////////////////////////////////////////////////////////////////

//use new top-level rules: -DJ
//start = "DJTEST" { return DEBUG(0); }? sql_script / old_start
start
  = __ srcline sql_script { return results(); }
  / old_start ;

srcline
  = '@' file:[^:]+ ':' line:[0-9]+ ![0-9] { init(`${file.join("")}:${line.join("")}`); return DEBUG(0); }


//added "debugger" for easier debug -DJ
//allow trailing white space and ";" -DJ
old_start 
//  = __ "ALT" __ alt:ALT_grammar { return alt; } //experimental; use prefix keywd to avoid impact to existing unit tests -DJ
  = &{ params = []; /*DEBUG(1)*/; return true; } __ ast:(union_stmt  / update_stmt / replace_insert_stmt ) __ SEMI? __ {
//TODO: maybe params should not be cleared here? (proc_stmts can be recursive) -DJ
      return {
        ast   : ast,
        param : params
      } 
    } 
//  / ast:proc_stmts __ SEMI? __ {
//      return {
//        ast : ast  
//      }
//    }

union_stmt
  = head:select_stmt tail:(__ KW_UNION __ select_stmt)* {
      var cur = head;
      for (var i = 0; i < tail.length; i++) {
        cur._next = tail[i][3];
        cur = cur._next
      }
      return head; 
    } 

//add "select ... into"; must check this first ("into" could be alias) n-DJ
select_stmt
  = KW_SELECT __
    c:column_list_item     __  
    KW_INTO __ v:(param / var_decl / ident) __
    f:from_clause?      __
    w:where_clause? {
      return {
        type      : 'select_into',
        target    : v,
        from      : f,
        where     : w,
      }      
    }
  /  select_stmt_nake
  / s:('(' __ select_stmt __ ')') {
      return s[2];
    }

extract_from_clause
  = before:(__ LPAREN? __ KW_SELECT __ (!(KW_FROM) .)* { return text() }) __
    f:from_clause? __
    after:(.*) {
      return {
        before: before,
        from: f,
        after: after.join('')
      }
    }

//add "having"; CAUTION: don't mess up unit tests -DJ
select_stmt_nake
  = KW_SELECT           __ 
    d:KW_DISTINCT?      __
    c:column_clause     __  
    f:from_clause?      __
    w:where_clause?     __  
    g:group_by_clause?  __  
    h:having_clause?     __  
    o:order_by_clause?  __
    l:limit_clause?  {
      return Object.assign({
        type      : 'select',
        distinct  : d,
        columns   : c,
        from      : f,
        where     : w,
        groupby   : g,
//no        having    : h,
        orderby   : o,
        limit     : l
      }, h? {having: h}: {}); //kludge: unit tests don't like extra null "having" prop :(
  }

//allow extra "all" keyword in front of column list (don't treat as "*"): -DJ
column_clause
  = (/*KW_ALL /*/ (STAR !ident_start)) {
      return '*';
    }  
  / (KW_ALL __)? head:column_list_item tail:(__ COMMA __ column_list_item)* {
      return createList(head, tail);
    }

/**
 * maybe you should use `expr` instead of `primary` or `additive_expr` 
 * to support complicated expression in column clause
 */
column_list_item
  = e:additive_expr __ alias:alias_clause? { 
      return {
        expr : e, 
        as : alias
      }; 
    } 

alias_clause 
  = KW_AS? __ i:(ident / literal_string) { return i; } //allow quoted string -DJ

from_clause
  = KW_FROM __ l:table_ref_list { return l; }

table_ref_list
  = head:table_base
    tail:table_ref*  {
      tail.unshift(head);
      return tail;
    }

table_ref 
  = __ COMMA __ t:table_base { return t; }
  / __ t:table_join { return t; } 
  
  
table_join 
  = op:join_op __ t:table_base __ expr:on_clause? {
    t.join = op;
    t.on   = expr;
    return t;
    /*
      return  {
        db    : t.db,
        table : t.table,
        as    : t.as,
        join  : op,
        on    : expr
      }
    */
    }

//NOTE that ,the table assigned to `var` shouldn't write in `table_join`
table_base
  = db:db_name __ DOT __ t:table_name __ KW_AS? __ alias:ident? {
      if (t && t.type == 'var') {
        t.as = alias;
        return t;
      } else {
        return  {
          type: 'table',
          db    : db,
          table : t,
          as    : alias,
          location: location()
        }
      }
    }
  / t:table_name __ KW_AS? __ alias:ident? {
      if (t && t.type == 'var') {
        t.as = alias;
        return t;
      } else {
        return  {
          type: 'table',
          db    : '',
          table : t,
          as    : alias,
          location: location()
        }
      }
    }
  / s:select_stmt __ KW_AS? __ alias:ident? {
      return  { type: 'subquery', subquery: s, as: alias, location: location() };
    }
  / text:(LPAREN __ table:table_base __ RPAREN) __ KW_AS? __ alias:ident? {
      return  { type: 'subquery', subquery: table, as: alias, location: location() };
    }
  / text:(LPAREN __ ([^)]* {return text()}) __ RPAREN) __ KW_AS? __ alias:ident? {
      return  { type: 'incomplete_subquery', text: text.join(''), as: alias, location: location() };
    }

join_op
  = KW_LEFT __ KW_JOIN { return 'LEFT JOIN'; }
  / (KW_INNER __)? KW_JOIN { return 'INNER JOIN'; }

db_name
  = db:ident_name {
    return db;
  }

table_name
  = table:ident {
      return table;
    }
    /v:var_decl {
      return v.name;
    }

on_clause 
  = KW_ON __ e:expr { return e; }

where_clause 
  = KW_WHERE __ e:expr { return e; } 

group_by_clause
  = KW_GROUP __ KW_BY /*&{ return DEBUG(5); }*/ __ l:column_ref_list { return l; }

//allow func calls or expr: -DJ
column_ref_list
  = head:/*(func_call / column_ref)*/ expr tail:(__ COMMA __ /*(func_call / column_ref)*/ expr)* {
      return createList(head, tail);
    }

having_clause
  = KW_HAVING __ e:expr { return e; }

order_by_clause
  = KW_ORDER __ KW_BY __ l:order_by_list { return l; }

order_by_list
  = head:order_by_element tail:(__ COMMA __ order_by_element)* {
      return createList(head, tail);
    }

order_by_element
  = e:expr __ d:(KW_DESC / KW_ASC)? {
    var obj = {
      expr : e,
      type : 'ASC'
    }
    if (d == 'DESC') {
      obj.type = 'DESC';
    }
    return obj;
  }

number_or_param
  = literal_numeric
  / param

limit_clause
  = KW_LIMIT __ i1:(number_or_param) __ tail:(COMMA __ number_or_param)? {
      var res = [i1];
      if (tail === null) {
        res.unshift({
          type  : 'number',
          value : 0
        });  
      } else {
        res.push(tail[2]);
      }
      return res;
    }

update_stmt
  = KW_UPDATE    __
    db:db_name   __ DOT __
    t:table_name __
    KW_SET       __
    l:set_list   __
    w:where_clause? {
      return {
        type  : 'update',
        db    : db,
        table : t,
        set   : l,
        where : w
      }
    }
  / KW_UPDATE    __
    t:table_name __
    KW_SET       __
    l:set_list   __
    w:where_clause? {
      return {
        type  : 'update',
        db    : '',
        table : t,
        set   : l,
        where : w
      }
    }

set_list
  = head:set_item tail:(__ COMMA __ set_item)*  {
      return createList(head, tail);
    }

/**
 * here only use `additive_expr` to support 'col1 = col1+2'
 * if you want to use lower operator, please use '()' like below
 * 'col1 = (col2 > 3)'
 */
set_item
  = c:column __ '=' __ v:additive_expr {
      return {
        column: c,
        value : v
      }
    }
  / t:ident __ DOT __ c:column __ '=' __ v:additive_expr {
      return {
        table: t,
        column: c,
        value : v
      }
    }

replace_insert_stmt
  = ri:replace_insert       __
    KW_INTO                 __
    db:db_name    __  DOT   __
    t:table_name  __ LPAREN __
    c:column_list __ RPAREN __
    v:value_clause             {
      return {
        type      : ri,
        db        : db,
        table     : t,
        columns   : c,
        values    : v
      }
    }
  / ri:replace_insert       __
    KW_INTO                 __
    db:db_name       __ DOT __
    t:table_name            __
    KW_SET                  __
    l:set_list              __
    u:on_duplicate_key_update? {
      var v = {
        type  : ri,
        db    : db,
        table : t,
        set   : l
      };

      if (u) {
        v.duplicateSet = u;
      }

      return v;
    }
  / ri:replace_insert       __
    KW_INTO                 __
    t:table_name  __ LPAREN __
    c:column_list  __ RPAREN __
    v:value_clause             {
      return {
        type      : ri,
        db        : '',
        table     : t,
        columns   : c,
        values    : v
      }
    }
  / ri:replace_insert       __
    KW_INTO                 __
    t:table_name            __
    KW_SET                  __
    l:set_list              __
    u:on_duplicate_key_update? {
      var v = {
        type  : ri,
        db    : '',
        table : t,
        set   : l
      }

      if (u) {
        v.duplicateSet = u;
      }

      return v;
    }

replace_insert
  = KW_INSERT   { return 'insert'; } 
  / KW_REPLACE  { return 'replace' }

value_clause
  = KW_VALUES __ l:value_list  { return l; }

on_duplicate_key_update
  = KW_ON __ KW_DUPLICATE __ KW_KEY __ KW_UPDATE __ l:set_list {
    return l;
  }

value_list
  = head:value_item tail:(__ COMMA __ value_item)* {
      return createList(head, tail);
    } 

value_item
  = LPAREN __ l:expr_list  __ RPAREN {
      return l;
    }

//for template auto fill
expr_list
  = head:expr tail:(__ COMMA __ expr)*{
      var el = {
        type : 'expr_list'  
      }
      var l = createExprList(head, tail, el); 

      el.value = l;
      return el;
    }

expr_list_or_empty
  = l:expr_list 
  / "" {
      return { 
        type  : 'expr_list',
        value : []
      }
    }

/** 
 * Borrowed from PL/SQL ,the priority of below list IS ORDER BY DESC 
 * ---------------------------------------------------------------------------------------------------
 * | +, -                                                     | identity, negation                   |     
 * | *, /                                                     | multiplication, division             |
 * | +, -                                                     | addition, subtraction, concatenation |
 * | =, <, >, <=, >=, <>, !=, IS, LIKE, BETWEEN, IN, CONTAINS | comparion                            |
 * | !, NOT                                                   | logical negation                     |
 * | AND                                                      | conjunction                          |
 * | OR                                                       | inclusion                            |      
 * ---------------------------------------------------------------------------------------------------
 */

expr = or_expr
    
or_expr
  = head:and_expr tail:(__ KW_OR __ and_expr)* {
      return createBinaryExprChain(head, tail);
    }

and_expr
  = head:not_expr tail:(__ KW_AND __ not_expr)* {
      return createBinaryExprChain(head, tail);
    }

//here we should use `NOT` instead of `comparision_expr` to support chain-expr
not_expr
  = (KW_NOT / "!" !"=") __ expr:not_expr {
      return createUnaryExpr('NOT', expr);
    }
  / comparison_expr

//add old-style outer join syntax -DJ
 OJ = "(+)"

comparison_expr
  = j:OJ? __ left:additive_expr __ rh:comparison_op_right? {
      if (j) left.OJ = j; //remember outer join -DJ
      if (rh === null) {
        return left;  
      } else {
        var res = null;
        if (rh !== null && rh.type == 'arithmetic') {
          res = createBinaryExprChain(left, rh.tail);
        } else {
          res = createBinaryExpr(rh && rh.op, left, rh && rh.right);
        }
        return res;
      }
    }

/* 
//optimization for comparison judge, bug because we in use `additive` expr
//in column clause now , it have little effect
cmp_prefix_char
  = c:char &{ debug(c); return cmpPrefixMap[c]; }

comparison_op_right 
  = &cmp_prefix_char  body:(
      arithmetic_op_right
      / in_op_right
      / between_op_right 
      / is_op_right
      / like_op_right
      / contains_op_right
    ) __ j:OJ? {
      if (j) body.OJ = j; //remember outer join -DJ
      return body; 
    }
*/

comparison_op_right 
  = arithmetic_op_right
    / in_op_right
    / between_op_right 
    / is_op_right
    / like_op_right
    / contains_op_right

arithmetic_op_right
  = l:(__ arithmetic_comparison_operator __ additive_expr)+ {
      return {
        type : 'arithmetic',
        tail : l
      }
    } 

arithmetic_comparison_operator
  = ">=" / ">" / "<=" / "<>" / "<" / "=" / "!="  

is_op_right
  = op:KW_IS n:(__ KW_NOT / "!")? __ right:additive_expr {
      if (n) right = createUnaryExpr('NOT', right); //remember inverse compare (alt syntax); should be promoted -DJ
      return {
        op    : op,   
        right : right
      }
    }

between_op_right
  = op:KW_BETWEEN __  begin:additive_expr __ KW_AND __ end:additive_expr {
      return {
        op    : op,
        right : {
          type : 'expr_list',
          value : [begin, end]
        }
      }
    }

like_op
  = nk:(KW_NOT __ KW_LIKE) { return nk[0] + ' ' + nk[2]; }
  / KW_LIKE 

in_op 
  = nk:(KW_NOT __ KW_IN) { return nk[0] + ' ' + nk[2]; }
  / KW_IN

contains_op 
  = nk:(KW_NOT __ KW_CONTAINS) { return nk[0] + ' ' + nk[2]; }
  / KW_CONTAINS

like_op_right
  = op:like_op __ right:comparison_expr {
      return {
        op    : op,
        right : right
      }
    }

in_op_right
  = op:in_op __ LPAREN  __ l:expr_list __ RPAREN {
      return {
        op    : op,
        right : l
      }
    }
  / op:in_op __ l:select_stmt {
    return {
        op    : op,
        right : l
      }
    }
  / op:in_op __ e:var_decl {
      return {
        op    : op,  
        right : e
      }
    }

contains_op_right
  = op:contains_op __ LPAREN  __ l:expr_list __ RPAREN {
      return {
        op    : op,  
        right : l
      }
    }
  / op:contains_op __ e:var_decl {
      return {
        op    : op,  
        right : e
      }
    }

additive_expr
  = head:multiplicative_expr
    tail:(__ additive_operator  __ multiplicative_expr)* {
      return createBinaryExprChain(head, tail);
    }

//added "||" (string concat) operator -DJ
additive_operator
  = "+" / "-" / "||"

multiplicative_expr
  = head:primary
    tail:(__ multiplicative_operator  __ primary)* {
      return createBinaryExprChain(head, tail)
    }

multiplicative_operator
  = "*" / "/" / "%"

primary 
  = literal
  / aggr_func
  / func_call 
  / column_ref 
  / param
  / LPAREN __ e:expr __ RPAREN { 
      e.paren = true; 
      return e; 
    } 
  / var_decl

column_ref 
  = tbl:ident __ DOT __ col:column {
      return {
        type  : 'column_ref',
        table : tbl, 
        column : col,
        location: location()
      }; 
    } 
  / col:column {
      return {
        type  : 'column_ref',
        table : '', 
        column: col,
        location: location()
      };
    }
  / s:('(' __ select_stmt __ ')') {
      return s[2]; //nested SELECT -DJ
    }

column_list
  = head:column tail:(__ COMMA __ column)* {
      return createList(head, tail);
    }

ident =
  name:ident_name !{ return reservedMap[name.toUpperCase()] === true; } {
    return name;
  }
  / '`' chars:[^`]+ '`' {
    return chars.join('');
  }

column = 
  name:column_name !{ return reservedMap[name.toUpperCase()] === true; } {
    return name;
  }
  / '`' chars:[^`]+ '`' {
    return chars.join('');
  }

column_name 
  =  start:ident_start parts:column_part* { return start + parts.join(''); }

ident_name  
  =  start:ident_start parts:ident_part* { return start + parts.join(''); }

ident_start = [A-Za-z_]

ident_part  = [A-Za-z0-9$_] //allow "$" -DJ

//to support column name like `cf1:name` in hbase
column_part  = [A-Za-z0-9_:]


//allow mem_chain in param name -DJ
param 
  = l:(':' ident_name) m:mem_chain { 
    var p = Object.assign({
      type : 'param',
      value: l[1]
    }, m.length? { members: m}: {}); //kludge: unit tests don't like extra prop :(
    //var key = 'L' + line + 'C' + column;
    //debug(key);
    //params[key] = p;
    params.push(p);
    return p;
  }

aggr_func
  = aggr_fun_count
  / aggr_fun_smma

aggr_fun_smma 
  = name:KW_SUM_MAX_MIN_AVG  __ LPAREN __ e:additive_expr __ RPAREN {
      return {
        type : 'aggr_func',
        name : name,
        args : {
          expr : e  
        } 
      }   
    }

KW_SUM_MAX_MIN_AVG
  = KW_SUM / KW_MAX / KW_MIN / KW_AVG 

aggr_fun_count 
  = name:KW_COUNT __ LPAREN __ arg:count_arg __ RPAREN {
      return {
        type : 'aggr_func',
        name : name,
        args : arg 
      }   
    }

//allow "distinct(expr)": -DJ
count_arg 
  = e:star_expr {
      return {
        expr  : e 
      }
    }
  / d:KW_DISTINCT __ LPAREN __ c:expr __ RPAREN {
      return {
        distinct : d, 
        expr   : c
      }
    }
  / d:KW_DISTINCT? __ c:column_ref {
      return {
        distinct : d, 
        expr   : c
      }
    }

star_expr 
  = "*" {
      return {
        type  : 'star',
        value : '*'
      }
    }

//mem_chain not needed here? -DJ
func_call
  = name:ident __ LPAREN __ l:expr_list_or_empty __ RPAREN {
      return {
        type : 'function',
        name : name, 
        args : l
      }
    }

literal 
  = literal_string / literal_numeric / literal_bool /literal_null

literal_list
  = head:literal tail:(__ COMMA __ literal)* {
      return createList(head, tail); 
    }

literal_null
  = KW_NULL {
      return {
        type  : 'null',
        value : null
      };  
    }

literal_bool 
  = KW_TRUE { 
      return {
        type  : 'bool',
        value : true
      };  
    }
  / KW_FALSE { 
      return {
        type  : 'bool',
        value : false
      };  
    }

literal_string 
  = ca:( ('"' double_char* '"') 
        /("'" single_char* "'")) {
      return {
        type  : 'string',
        value : ca[1].join('')
      }
    }

//allow newlines within quoted strings: -DJ
//NOTE: need to preserve #alt branches in single/double _char for unit tests to pass
single_char
  = /*&{ return DEBUG(4); }*/ ([^'\\\0-\x1F\x7f] / [\t\n] / "''" { return "'"; })
  / escape_char

double_char
  = ([^"\\\0-\x1F\x7f] / [\t\n])
/ escape_char
  
escape_char
  = "\\'"  { return "'";  }
  / '\\"'  { return '"';  }
  / "\\\\" { return "\\"; }
  / "\\/"  { return "/";  }
  / "\\b"  { return "\b"; }
  / "\\f"  { return "\f"; }
  / "\\n"  { return "\n"; }
  / "\\r"  { return "\r"; }
  / "\\t"  { return "\t"; }
  / "\\u" h1:hexDigit h2:hexDigit h3:hexDigit h4:hexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4));
    }

//NOTE: not used: -DJ
line_terminator
  = [\n\r]

literal_numeric
  = n:number {
      return {
        type  : 'number',
        value : n 
      }  
    }

number
  = int_:int frac:frac exp:exp __ { return parseFloat(int_ + frac + exp); }
  / int_:int frac:frac __         { return parseFloat(int_ + frac);       }
  / int_:int exp:exp __           { return parseFloat(int_ + exp);        }
  / int_:int __                   { return parseFloat(int_);              }

int
  = digit19:digit19 digits:digits     { return digit19 + digits;       }
  / digit:digit
  / op:("-" / "+" ) digit19:digit19 digits:digits { return "-" + digit19 + digits; }
  / op:("-" / "+" ) digit:digit                   { return "-" + digit;            }

frac
  = "." digits:digits { return "." + digits; }

exp
  = e:e digits:digits { return e + digits; }

digits
  = digits:digit+ { return digits.join(""); }

digit   = [0-9]
digit19 = [1-9]

hexDigit
  = [0-9a-fA-F]

e
  = e:[eE] sign:[+-]? { return e + (sign || ''); }


KW_NULL      = "NULL"i     !ident_start
KW_TRUE      = "TRUE"i     !ident_start
KW_FALSE     = "FALSE"i    !ident_start

KW_SHOW      = "SHOW"i     !ident_start
KW_DROP      = "DROP"i     !ident_start
KW_SELECT    = "SELECT"i   !ident_start
KW_UPDATE    = "UPDATE"i   !ident_start
KW_CREATE    = "CREATE"i   !ident_start
KW_DELETE    = "DELETE"i   !ident_start
KW_INSERT    = "INSERT"i   !ident_start
KW_REPLACE   = "REPLACE"i  !ident_start
KW_EXPLAIN   = "EXPLAIN"i  !ident_start

KW_INTO      = "INTO"i     !ident_start
KW_FROM      = "FROM"i     !ident_start
KW_SET       = "SET"i      !ident_start

KW_AS        = "AS"i       !ident_start
KW_TABLE     = "TABLE"i    !ident_start

KW_ON        = "ON"i       !ident_start
KW_LEFT      = "LEFT"i     !ident_start
KW_INNER     = "INNER"i    !ident_start
KW_JOIN      = "JOIN"i     !ident_start
KW_UNION     = "UNION"i    !ident_start
KW_VALUES    = "VALUES"i   !ident_start

KW_EXISTS    = "EXISTS"i   !ident_start

KW_WHERE     = "WHERE"i    !ident_start

KW_GROUP     = "GROUP"i    !ident_start
KW_BY        = "BY"i       !ident_start
KW_ORDER     = "ORDER"i    !ident_start
KW_HAVING    = "HAVING"i   !ident_start

KW_LIMIT     = "LIMIT"i    !ident_start

KW_ASC       = "ASC"i      !ident_start    { return 'ASC';      }
KW_DESC      = "DESC"i     !ident_start    { return 'DESC';     }

KW_ALL       = "ALL"i      !ident_start    { return 'ALL';      }
KW_DISTINCT  = "DISTINCT"i !ident_start    { return 'DISTINCT'; }
KW_DUPLICATE = "DUPLICATE"i!ident_start    { return 'DUPLICATE';}
KW_BETWEEN   = "BETWEEN"i  !ident_start    { return 'BETWEEN';  }
KW_IN        = "IN"i       !ident_start    { return 'IN';       }
KW_IS        = "IS"i       !ident_start    { return 'IS';       }
KW_LIKE      = "LIKE"i     !ident_start    { return 'LIKE';     }
KW_CONTAINS  = "CONTAINS"i !ident_start    { return 'CONTAINS'; }
KW_KEY       = "KEY"i      !ident_start    { return 'KEY';      }

KW_NOT       = "NOT"i      !ident_start    { return 'NOT';      }
KW_AND       = "AND"i      !ident_start    { return 'AND';      }
KW_OR        = "OR"i       !ident_start    { return 'OR';       }

KW_COUNT     = "COUNT"i    !ident_start    { return 'COUNT';    }
KW_MAX       = "MAX"i      !ident_start    { return 'MAX';      }
KW_MIN       = "MIN"i      !ident_start    { return 'MIN';      }
KW_SUM       = "SUM"i      !ident_start    { return 'SUM';      }
KW_AVG       = "AVG"i      !ident_start    { return 'AVG';      }

//special characters
DOT       = '.'
COMMA     = ','
STAR      = '*'
LPAREN    = '('
RPAREN    = ')'

LBRAKE    = '['
RBRAKE    = ']'

__ =
  whitespace*

char = .

whitespace =
  [ \t\n\r]

EOL 
  = EOF
  / [\n\r]+
  
EOF = !.




/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
//added missing stmt types, better BEGIN/END and block handling: -DJ

SEMI      = ';' __ //need terminator for multiple proc stmts

//reworked top levels: -DJ
//eat leading white space for simpler token parsing
sql_script = __ seq_of_statements
//  = __ ((unit_statement / sql_plus_command) SEMI?)* EOF
//  = __ s:seq_of_statements EOF { return s; }
  //;

seq_of_statements
  = (statement (SEMI / EOF) / label_declaration)+
  //;

label_declaration
  = '<<' __ label_name '>>' __
  //;

statement
  = body
  / block
  / assign_stmt //assignment_statement
//  / continue_statement
//  / exit_statement
//  / goto_statement
  / if_statement
//  / loop_statement
//  / forall_statement
//  / null_statement
//  / raise_statement
  / return_statement
  / case_statement
  / sql_statement
  / function_call
//  / pipe_row_statement
  / procedure_call
  //;

//seq_of_statements
sql_statement
//  = select_statement
//  / update_statement
//  / delete_statement
//  / insert_statement
//  / lock_table_statement
//  / merge_statement
//  / explain_statement
//  = __ ((unit_statement / sql_plus_command) SEMI?)*
  = unit_statement
  / data_manipulation_language_statements
  //;

unit_statement
  = create_function_body
  / create_procedure_body
  / anonymous_block
//  / procedure_call
  //;

//sql_plus_command
//  = '/'i __
//  / EXIT
//  / PROMPT_MESSAGE
//  / SHOW (ERR / ERRORS)
//  / START_CMD
//  = sql_statement 
  //;

//sql_statement
//  = execute_immediate
//  = data_manipulation_language_statements
//  / cursor_manipulation_statements
  //;

data_manipulation_language_statements
  = select_statement
  / update_statement
  / delete_statement
  / insert_statement
  //;

/*
X_cursor_manipulation_statements
  = close_statement
  / open_statement
  / fetch_statement
  / open_for_statement
  //;
*/


/////////////////////////////////////////////////////////////////////////////////
//main stmt types:
//all should eat trailing white space
// create_function_body
// create_procedure_body
// anonymous_block
// procedure_call
// select_statement
// update_statement
// delete_statement
// insert_statement

//more keywords: -DJ
//eat trailing white space to reduce parent rule clutter
KKW_CREATE    = "CREATE"i   !ident_start __
KKW_OR    = "OR"i   !ident_start __
KKW_REPLACE    = "REPLACE"i   !ident_start __
KKW_DELETE    = "DELETE"i   !ident_start __
KKW_FROM    = "FROM"i   !ident_start __
KKW_RETURN    = "RETURN"i   !ident_start __
KKW_RETURNING    = "RETURNING"i   !ident_start __
KKW_IS    = "IS"i   !ident_start __
KKW_AS    = "AS"i   !ident_start __
KKW_EXCEPTION    = "EXCEPTION"i   !ident_start __
KKW_CALL    = "CALL"i   !ident_start __


block
  = KKW_DECLARE? declare_spec+ body
  //;

//assignment_statement = proc_var __
//  = (general_element / bind_variable) ASSIGN_OP expression
  //;
//general_element
//  = general_element_part ('.'i WHITE_SPACE general_element_part)*
  //;
//bind_variable
//  = (BINDVAR / ':'i WHITE_SPACE UNSIGNED_INTEGER)
//    (INDICATOR? (BINDVAR / ':'i WHITE_SPACE UNSIGNED_INTEGER))?
//    ('.'i WHITE_SPACE general_element_part)*
  //;

return_statement = KKW_RETURN expr __


create_function_body
  = KKW_CREATE (KKW_OR KKW_REPLACE)? b:function_body //{ return {type: func_body, body: b}; }
  //;

create_procedure_body
  = KKW_CREATE (KKW_OR KKW_REPLACE)? procedure_body //{ return {type: func_body, body: b}; }
//  PROCEDURE procedure_name ('('i WHITE_SPACE parameter (','i WHITE_SPACE parameter)* ')'i WHITE_SPACE)?
//    invoker_rights_clause? (IS / AS)
//    (DECLARE? seq_of_declare_specs? body / call_spec / EXTERNAL) ';'i WHITE_SPACE
  //;

anonymous_block
  = (KKW_DECLARE seq_of_declare_specs)? KKW_BEGIN seq_of_statements (KKW_EXCEPTION exception_handler+)? KKW_END SEMI

procedure_call
  = routine_name arg_list? //function_argument?
  //;

function_call
  = KKW_CALL? routine_name arg_list? //function_argument?
  //;

//shims to old stuff up above:
select_statement = st:union_stmt __ { return st; }
update_statement = st:update_stmt __{ return st; }
insert_statement = st:replace_insert_stmt __{ return st; }
routine_name = id:ident m:mem_chain __ { return id; } //?? name:ident m:mem_chain
//function_argument = a:arg_def __ { return a; }
general_table_ref = t:table_ref __ { return t; }
identifier = i:ident __ { return i; }
type_spec = d:data_type __ { return d; }
variable_declaration = proc_vars __
label_name = id:ident __ { return id; }
exception_name = identifier // m:mem_chain ('.'i WHITE_SPACE id_expression)*
condition = e:proc_expr __ { return e; }
expression = e:expr __ { return e; }
 into_clause
  =  db:db_name    __  DOT   __
    t:table_name  __ LPAREN __
    c:column_list __ RPAREN __
  //;
expressions = column_list


delete_statement
  = KKW_DELETE &{ return verb("delete"); } KKW_FROM? general_table_ref where_clause? static_returning_clause? error_logging_clause?
  //;

seq_of_declare_specs
//  = declare_spec+
  = (declare_spec (SEMI / EOF))+
  //;

static_returning_clause
  = (KKW_RETURNING / KKW_RETURN) expressions into_clause
  //;

error_logging_clause
//  = KKW_LOG KKW_ERRORS error_logging_into_part? expression? error_logging_reject_part?
  = "TODO"
  //;
//error_logging_into_part
//  = KKW_INTO tableview_name
  //;
//error_logging_reject_part
//  = KKW_REJECT KKW_LIMIT (KKW_UNLIMITED / expression)
  //;


////////////////////////////////////////////////////////////////////////////////
//main (added) functional blocks:
//  function_body
//  procedure_body
//  declare_spec
//  exception_handler
//  routine_name
//  function_argument


function_body
  = KKW_FUNCTION identifier arg_def_list? //(LPAREN __ (COMMA? __ parameter)+ __ RPAREN)?
    KKW_RETURN type_spec /*(invoker_rights_clause | parallel_enable_clause | result_cache_clause | DETERMINISTIC)* */
    ((/*PIPELINED?*/ (KKW_IS / KKW_AS) (KKW_DECLARE? seq_of_declare_specs? body /*| call_spec*/))) // SEMI // | (PIPELINED | AGGREGATE) USING implementation_type_name) SEMI
  //;

procedure_body
  = KKW_PROCEDURE identifier arg_def_list? /*(LPAREN __ (COMMA? __ parameter)+ __ RPAREN)?*/ (KKW_IS / KKW_AS)
    (KKW_DECLARE? seq_of_declare_specs? body) // SEMI // | call_spec | EXTERNAL) SEMI
  //;

exception_declaration
  = identifier KKW_EXCEPTION SEMI
  //;

declare_spec
  = pragma_declaration
  / variable_declaration
//  / subtype_declaration
//  / cursor_declaration
  / exception_declaration
//  / type_declaration
  / procedure_spec
  / function_spec
  / procedure_body
  / function_body
  //;


/////////////////////////////////////////////////////////////////////////////////
//main stmt types:
//  pragma_declaration
//  variable_declaration
//  exception_declaration
//  procedure_spec
//  function_spec
//  procedure_body
//  function_body


procedure_spec
  = KKW_PROCEDURE identifier arg_def_list // SEMI // ('(' parameter ( ',' parameter )* ')')? ';'
  //;

function_spec
  = KKW_FUNCTION identifier arg_def_list // ('(' parameter ( ',' parameter)* ')')?
    KKW_RETURN type_spec SEMI // (DETERMINISTIC)? (RESULT_CACHE)? ';'
  //;

pragma_declaration
  = KKW_PRAGMA "TODO?" __ // (SERIALLY_REUSABLE
//    / AUTONOMOUS_TRANSACTION
//    / EXCEPTION_INIT '('i WHITE_SPACE exception_name ','i WHITE_SPACE numeric_negative ')'i WHITE_SPACE
//    / INLINE '('i WHITE_SPACE id1:identifier ','i WHITE_SPACE expression ')'i WHITE_SPACE
//    / RESTRICT_REFERENCES '('i WHITE_SPACE (identifier / DEFAULT) (','i WHITE_SPACE identifier)+ ')'i WHITE_SPACE) ';'i WHITE_SPACE
  //;

//more keywords: -DJ
//NOTE: only needs to return a value if token is stored
//include trailing white space to reduce clutter in parent rules (denoted with extra leading "K" - still searchable with "KW")
KKW_PROCEDURE      = "PROCEDURE"i !ident_start __  { return 'PROCEDURE'; }
KKW_FUNCTION      = "FUNCTION"i !ident_start __   { return 'FUNCTION'; }
KKW_BEGIN     = "BEGIN"i    !ident_start __   //{ return 'BEGIN';    }
KKW_END       = "END"i      !ident_start __   //{ return 'END';      }
KKW_IN       = "IN"i      !ident_start __   { return 'IN';      }
KKW_OUT       = "OUT"i      !ident_start __   { return 'OUT';      }
KKW_INOUT     = "INOUT"i    !ident_start __   { return 'INOUT';      }
//KKW_PRAGMA    = "PRAGMA"i   !ident_start __   { return 'PRAGMA';      } //exception_init(cd_notfound,-1115);
KKW_PRAGMA    = "PRAGMA"i   !ident_start __
KKW_DECLARE    = "DECLARE"i   !ident_start __   { return 'DECLARE'; }
//KKW_EXCEPTION  = "EXCEPTION"i   !ident_start __   { return 'EXCEPTION'; }
KKW_WHEN    = "WHEN"i   !ident_start __
KKW_CASE    = "CASE"i   !ident_start __


body
  = KKW_BEGIN seq_of_statements (KKW_EXCEPTION exception_handler+)? KKW_END label_name?

exception_handler
  = KKW_WHEN exception_name (KKW_OR exception_name)* KKW_THEN seq_of_statements

if_statement
  = KKW_IF &{ return DEBUG(8); } condition KKW_THEN seq_of_statements/*+*/ elsif_part* else_part? KKW_END KKW_IF

elsif_part
  = KKW_ELSIF &{ return DEBUG(9); } condition KKW_THEN seq_of_statements/*+*/

else_part
  = KKW_ELSE seq_of_statements/*+*/


case_statement
  = searched_case_statement
  / simple_case_statement
  //;

searched_case_statement
  = label_name? ck1:KKW_CASE searched_case_when_part+ case_else_part? KKW_END KKW_CASE? label_name?
  //;

simple_case_statement
  = label_name? ck1:KKW_CASE expression simple_case_when_part+  case_else_part? KKW_END KKW_CASE? label_name?
  //;

simple_case_when_part
  = KKW_WHEN expression KKW_THEN ( seq_of_statements / expression)
  //;
searched_case_when_part = simple_case_when_part
//    = WHEN expression THEN ( seq_of_statements / expression)
//     //;

case_else_part
  = KKW_ELSE ( seq_of_statements / expression)
  //;


/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////
//begin procedure extension

//put func/proc stmt at same level as other, allow repeat -DJ
proc_stmt = EOF
X_proc_stmts 
  = head:proc_stmt tail:(__ SEMI __ proc_stmt)* __ SEMI? {
    return createList(head, tail);
  }

KW_PROC = "proc"
KW_FUNC = "func"

//added proc/func keywds, ret type -DJ
//procs don't have arg lists, but allow it here so parse rule can be shared -DJ
//kludge: allow "()" on BEGIN and END to simplify proc call parsing -DJ
X_proc_def
  = __ t:(KW_PROC / KW_FUNC) __ name:ident m:mem_chain __ l:arg_list? __ r:(KW_RETURN __ data_type)? __ KW_IS __ v:proc_vars? __ KKW_BEGIN /*(__ LPAREN __ RPAREN)?*/ __ s:start* __ KKW_END  /*( __ LPAREN __ RPAREN)?*/ {
    //based on proc_func_call example below
    varList.push(name); //push for analysis
    return {
      type : t.slice(0, 4).toLowerCase() + "_def",
      name : name, 
      members : m,
//      args : {
//        type  : 'arg_list',
//        value : l
//      },
      args: l, //array
      vars: v, //array
      rettype: ((r || [])[2] || {}).typename,
      retprec: ((r || [])[2] || {}).precision,
      body : (s || []).reduce((result, stmt) => result.push_fluent(stmt.ast), []), //head.stmt || stmt.head), //array of stmts
    }
  }

arg_list 
//  = LPAREN __ head:arg_def tail:(__ COMMA __ arg_def)* __ RPAREN __ {
  = LPAREN __ args:proc_primary_list_or_empty __ RPAREN __ {
    return args; //createList(head, tail);
//NO  / proc_stmt* //creates "infinite loop" error
  } 

arg_def_list 
  = LPAREN __ head:arg_def tail:(__ COMMA __ arg_def)* __ RPAREN __ {
    return createList(head, tail);
//NO  / proc_stmt* //creates "infinite loop" error
  } 

//added param direction -DJ
arg_def
  = name:ident_name __ dir:(KKW_IN / KKW_OUT / KKW_INOUT)? type:data_type {
    return {
      type: 'arg_def',
      name: name,
      direction: dir, //param direction
      datatype: type.typename,
      precision: type.precision,
    }
  }

//need data type for proc/func return type and func args -DJ
//just check syntax (allow any data type/len)
//see examples at https://forcedotcom.github.io/phoenix/index.html#data_type
data_type
  = name:ident_name size:(__ LPAREN __ int __ RPAREN)? __ {
      return {
        type  : 'data_type',
        typename : name,
        precision : (size || [])[3],
      }  
    }

proc_vars
  = head:proc_var tail:(__ SEMI __ proc_var)* __ SEMI? {
    return createList(head, tail);
    }
  / proc_var __ SEMI?

//ignore "pragma" stmts -DJ
proc_var
  = v:(ident / var_decl / param) __ dt:data_type __ e:(KW_ASSIGN __ proc_expr)? __ {
    //push for analysis
    varList.push(v);
    return {
      type : 'proc_var',
      name : v,
      data_type: dt.typename,
      data_prec: dt.precision,
      init: (e || [])[2],
    }
  }
  / KKW_PRAGMA func_call

//allow proc call, other proc stmts -DJ
//BROKEN-ignore extraneous BEGIN/END (can be nested) -DJ
/*
X_proc_def = EOF
X_proc_stmt 
  = &{ varList = []; return true; } __ s:(assign_stmt / return_stmt / proc_func_call / proc_if / proc_def) {
//TODO: maybe varList should not be cleared here? (proc_stmts can be recursive) -DJ
      return {
        stmt : s,
        vars: varList
      }
    }
*/
/*
    / (KW_BEGIN (__ SEMI?) __)?
    / (KW_END (__ SEMI?) __)?
*/

 KKW_IF = 'if'i !ident __
 KKW_THEN = 'then'i !ident __
 KKW_ELSIF = 'elsif'i !ident __
 KKW_ELSE = 'else'i !ident __
 //KKW_ENDIF = KW_END __ KW_IF

/*
X_proc_if
  = /-*&{ return DEBUG(2); }*-/ KW_IF __ e:proc_expr __ KW_THEN __ t:proc_stmts __ SEMI? __ f:else_stmt? __ KW_ENDIF {
      return {
        stmt: "if",
        expr: e,
        then_stmt: t,
        else_stmt: f, //(f || [])[2], //optional
      }
    }

X_else_stmt
  = KW_ELSIF __ e:proc_expr __ KW_THEN __ t:proc_stmts __ SEMI? __ f:else_stmt? {
      return {
        stmt: "elsif",
        expr: e,
        then_stmt: t,
        else_stmt: f,
      };
//      return createList(head, tail);
    }
  / KW_ELSE __ s:proc_stmts __ SEMI? {
      return s;
    }
*/

//allow param -DJ
assign_stmt 
  = va:(ident / var_decl / param) __ KW_ASSIGN /*&{ return DEBUG(5); }*/ __ e:proc_expr {
    return {
      type : 'assign',
      left : va,
      right: e
    }
  }

return_stmt 
  = /*&{ return DEBUG(3); }*/ KW_RETURN __ e:proc_expr {
  return {
    type : 'return',
    expr: e
  }
}

//allow arith expr return from func -DJ
proc_expr 
  = select_stmt 
  / proc_join 
  / expr
  / proc_additive_expr 
  / proc_array

proc_additive_expr
  = head:proc_multiplicative_expr
    tail:(__ additive_operator  __ proc_multiplicative_expr)* {
      return createBinaryExprChain(head, tail);
    }

proc_multiplicative_expr
  = head:proc_primary
    tail:(__ multiplicative_operator  __ proc_primary)* {
      return createBinaryExprChain(head, tail);
    }

proc_join
  = lt:var_decl __ op:join_op  __ rt:var_decl __ expr:on_clause __ {
      return {
        type    : 'join',
        ltable  : lt, 
        rtable  : rt,
        op      : op,
        on      : expr
      }
    }

//allow non-$ vars here -DJ
proc_primary 
  = literal
  / var_decl / ident
  / proc_func_call 
  / param
  / LPAREN __ e:proc_additive_expr __ RPAREN { 
      e.paren = true; 
      return e; 
    } 

//allow mem_chain, make arg list optional -DJ
proc_func_call
  = name:ident m:mem_chain __ LPAREN __ args:proc_primary_list_or_empty __ RPAREN __ {
      //compatible with original func_call
      return {
        type : "func_call", //'function',
        name : name, 
        members: m,
        args : {
          type  : 'expr_list',
          value : args, //(args || [])[2], //optional
        }
      }
    }
/*BROKEN
  / name:ident m:mem_chain __ SEMI {
      //compatible with original func_call
      return {
        type : "func_call", //'function',
        name : name, 
        members: m,
      }
    }
*/

proc_primary_list_or_empty
  = proc_primary_list
  / "" {
      return { 
        type  : 'expr_list',
        value : []
      }
    }

proc_primary_list 
  = head:proc_primary tail:(__ COMMA __ proc_primary)* {
      return createList(head, tail);
    } 

proc_array = 
  LBRAKE __ l:proc_primary_list __ RBRAKE {
    return {
      type : 'array',
      value : l
    }
  }


var_decl 
  = KW_VAR_PRE name:ident_name m:mem_chain {
    //push for analysis
    varList.push(name);
    return {
      type : 'var',
      name : name,
      members : m
    }
  } 

mem_chain 
  = l:('.' ident_name)* {
    var s = [];
    for (var i = 0; i < l.length; i++) {
      s.push(l[i][1]); 
    }
    return s;
  }

 KW_VAR_PRE = '$'

 KW_RETURN = 'return'i

 KW_ASSIGN = ':='


/////////////////////////////////////////////////////////////////////////////////
////
/// alternate grammar based on https://github.com/antlr/grammars-v4/blob/master/plsql/PlSqlParser.g4
//

/*
ALT_SEMI = ';' ALT_SPACE?

ALT_grammar
//  = ((unit_statement | sql_plus_command) SEMICOLON?)* EOF
  = &{ params = []; DEBUG(0); return true; } stmts:(ALT_unit_statement ALT_SEMI?)* //EOF
    {
      return {
        ast: stmts.map((stmt) => stmt[0]),
        params: params,
      };
    }

ALT_unit_statement
//    : transaction_control_statements
//    | alter_cluster
//    | alter_database
//    | alter_function
//    | alter_package
//    | alter_procedure
//    | alter_sequence
//    | alter_session
//    | alter_trigger
//    | alter_type
//    | alter_table
//    | alter_tablespace
//    | alter_index
//    | alter_library
//    | alter_materialized_view
//    | alter_materialized_view_log
//    | alter_user
//    | alter_view
//
//    | analyze
//    | associate_statistics
//    | audit_traditional
//    | unified_auditing
//
//    | create_function_body
  = ALT_create_function_body
//    | create_procedure_body
  / ALT_create_procedure_body
//    | create_package
//    | create_package_body
//
//    | create_index
//    | create_table
//    | create_tablespace
//    | create_cluster
//    | create_context
//    | create_view //TODO
//    | create_directory
//    | create_materialized_view
//    | create_materialized_view_log
//    | create_user
//
//    | create_sequence
//    | create_trigger
//    | create_type
//    | create_synonym
//
//    | drop_function
//    | drop_package
//    | drop_procedure
//    | drop_sequence
//    | drop_trigger
//    | drop_type
//    | data_manipulation_language_statements
  / ALT_data_manipulation_language_statements
//    | drop_table
//    | drop_index
//
//    | comment_on_column
//    | comment_on_table
//
//    | anonymous_block
  / ALT_anonymous_block
//
//    | grant_statement
//
//    | procedure_call
  / ALT_procedure_call
//    ;


/////////////////////////////////////////////////////////////////////////////////

TODO = "?"

ALT_CREATE = "create"i !ident ALT_SPACE?
ALT_OR = "or"i !ident ALT_SPACE?
ALT_REPLACE = "replace"i !ident ALT_SPACE?
ALT_FUNCTION = "function"i !ident ALT_SPACE?
ALT_RETURN = "return"i !ident ALT_SPACE?
ALT_IS = "is"i !ident ALT_SPACE?
ALT_AS = "as"i !ident ALT_SPACE?
ALT_DECLARE = "declare"i !ident ALT_SPACE?
ALT_LPAREN = '(' ALT_SPACE?
ALT_RPAREN = ')' ALT_SPACE?
ALT_COMMA = ',' ALT_SPACE?

ALT_create_function_body
//    : CREATE (OR REPLACE)? FUNCTION function_name ('(' (','? parameter)+ ')')?
//      RETURN type_spec (invoker_rights_clause | parallel_enable_clause | result_cache_clause | DETERMINISTIC)*
//      ((PIPELINED? (IS | AS) (DECLARE? seq_of_declare_specs? body | call_spec)) | (PIPELINED | AGGREGATE) USING implementation_type_name) ';'
//    ;
//    = TODO "func" __ { return {type: "func"}; }
    = ALT_CREATE (ALT_OR ALT_REPLACE)? ALT_FUNCTION ALT_function_name (ALT_LPAREN ALT_parameter (ALT_COMMA ALT_parameter)* ALT_RPAREN)?
      ALT_RETURN ALT_type_spec
      (ALT_IS / ALT_AS) ALT_DECLARE? ALT_seq_of_declare_specs? ALT_body ALT_SEMI {
        return {
          type: "func_def",
        };
      }

ALT_create_procedure_body
//    : CREATE (OR REPLACE)? PROCEDURE procedure_name ('(' parameter (',' parameter)* ')')?
//      invoker_rights_clause? (IS | AS)
//      (DECLARE? seq_of_declare_specs? body | call_spec | EXTERNAL) ';'
    = TODO "proc" __ { return {type: "proc"}; }

ALT_data_manipulation_language_statements
//    : merge_statement
//    | lock_table_statement
//    | select_statement
    = ALT_select_statement
//    | update_statement
    / ALT_update_statement
//    | delete_statement
    / ALT_delete_statement
//    | insert_statement
    / ALT_insert_statement
//    | explain_statement
//    ;

ALT_anonymous_block
//    : (DECLARE seq_of_declare_specs)? BEGIN seq_of_statements (EXCEPTION exception_handler+)? END SEMICOLON
//    ;
  = TODO "anon" __ { return {type: "anon"}; }

ALT_procedure_call
//    : routine_name function_argument?
//    ;
  = TODO "call" __ { return {type: "call"}; }


//////////////////////////////////////////////////////////////////////////////////

ALT_select_statement
  = TODO "sel" &{ verb_stk.push("select"); return true; } __ { verb_stk.pop(); return {type: "sel"}; }

ALT_update_statement
  = TODO "upd" &{ verb_stk.push("update"); return true; } __ { verb_stk.pop(); return {type: "upd"}; }

ALT_delete_statement
  = TODO "del" &{ verb_stk.push("delete"); return true; } __ { verb_stk.pop(); return {type: "del"}; }

ALT_insert_statement
  = TODO "ins" &{ verb_stk.push("insert"); return true; } __ { verb_stk.pop(); return {type: "ins"}; }


/////////////////////////////////////////////////////////////////////////////////

//put optional trailing whitespace on tokens to reduce clutter in grammar rules

//ALT_INTRODUCER = '_'
ALT_NEWLINE_EOF = ALT_NEWLINE / EOF
ALT_QUESTION_MARK = '?'
ALT_SIMPLE_LETTER = [A-Za-z]
ALT_FLOAT_FRAGMENT = ALT_UNSIGNED_INTEGER* '.'? ALT_UNSIGNED_INTEGER+ ALT_SPACE?
ALT_UNSIGNED_INTEGER = [0-9]+
ALT_NEWLINE = '\r'? '\n'
ALT_SPACE = [ \t]+
ALT_DELIMITED_ID = '"' (![*\r\n] / '"' '"')+ '"' ALT_SPACE?
ALT_REGULAR_ID = ALT_SIMPLE_LETTER (ALT_SIMPLE_LETTER / '$' / '_' / '#' / [0-9])* ALT_SPACE?
ALT_DOT = '.' ALT_SPACE?
ALT_IN = "in"i !ident ALT_SPACE?
ALT_OUT = "out"i !ident ALT_SPACE?
ALT_INOUT = "inout"i !ident ALT_SPACE?
ALT_NOCOPY = "nocopy"i !ident ALT_SPACE?
ALT_EXCEPTION = "exception"i !ident ALT_SPACE?
ALT_END = "end"i !ident ALT_SPACE?
ALT_ASSIGN_OP = ':=' ALT_SPACE?
ALT_DEFAULT = "default"i !ident ALT_SPACE?

ALT_function_name
//    : identifier ('.' id_expression)?
//    ;
  = ALT_identifier (ALT_DOT ALT_id_expression)?

ALT_identifier
//    : (INTRODUCER char_set_name)? id_expression
//    ;
//  = (ALT_INTRODUCER char_set_name)? ALT_id_expression
  = ALT_id_expression

ALT_parameter_name
  = ALT_identifier

ALT_id_expression
//    : regular_id
//    | DELIMITED_ID
//    ;
  = ALT_REGULAR_ID / ALT_DELIMITED_ID

ALT_parameter
//    : parameter_name (IN | OUT | INOUT | NOCOPY)* type_spec? default_value_part?
//    ;
  = ALT_parameter_name (ALT_IN / ALT_OUT / ALT_INOUT / ALT_NOCOPY)* ALT_type_spec? ALT_default_value_part?

ALT_type_spec
//    : datatype
//    | REF? type_name (PERCENT_ROWTYPE | PERCENT_TYPE)?
//    ;
  = ALT_datatype

ALT_default_value_part
  = (ALT_ASSIGN_OP / ALT_DEFAULT) ALT_expression

ALT_datatype
//    : native_datatype_element precision_part? (WITH LOCAL? TIME ZONE | CHARACTER SET char_set_name)?
//    | INTERVAL (YEAR | DAY) ('(' expression ')')? TO (MONTH | SECOND) ('(' expression ')')?
//    ;
  = ALT_native_datatype_element ALT_precision_part? //(WITH LOCAL? TIME ZONE | CHARACTER SET char_set_name)?

ALT_precision_part
//    : '(' (numeric | ASTERISK) (',' numeric)? (CHAR | BYTE)? ')'
//    ;
  = ALT_LPAREN (ALT_numeric / ALT_ASTERISK) (ALT_COMMA ALT_numeric)? (ALT_CHAR / ALT_BYTE)? ALT_RPAREN

ALT_seq_of_declare_specs
//    : declare_spec+
//    ;
  = ALT_declare_spec+
  
ALT_declare_spec
//    : pragma_declaration
//    | variable_declaration
//    | subtype_declaration
//    | cursor_declaration
//    | exception_declaration
//    | type_declaration
//    | procedure_spec
//    | function_spec
//    | procedure_body
//    | function_body
//    ;
  = ALT_pragma_declaration
  / ALT_variable_declaration
  / ALT_subtype_declaration
  / ALT_cursor_declaration
  / ALT_exception_declaration
  / ALT_type_declaration
  / ALT_procedure_spec
  / ALT_function_spec
  / ALT_procedure_body
  / ALT_function_body

ALT_body
//    : BEGIN seq_of_statements (EXCEPTION exception_handler+)? END label_name?
//    ;
  = ALT_BEGIN ALT_seq_of_statements (ALT_EXCEPTION ALT_exception_handler+)? ALT_END ALT_label_name?


ALT_native_datatype_element
//    : BINARY_INTEGER
//    | PLS_INTEGER
//    | NATURAL
//    | BINARY_FLOAT
//    | BINARY_DOUBLE
//    | NATURALN
//    | POSITIVE
//    | POSITIVEN
//    | SIGNTYPE
//    | SIMPLE_INTEGER
//    | NVARCHAR2
//    | DEC
//    | INTEGER
//    | INT
//    | NUMERIC
//    | SMALLINT
//    | NUMBER
//    | DECIMAL
//    | DOUBLE PRECISION?
//    | FLOAT
//    | REAL
//    | NCHAR
//    | LONG RAW?
//    | CHAR
//    | CHARACTER
//    | VARCHAR2
//    | VARCHAR
//    | STRING
//    | RAW
//    | BOOLEAN
//    | DATE
//    | ROWID
//    | UROWID
//    | YEAR
//    | MONTH
//    | DAY
//    | HOUR
//    | MINUTE
//    | SECOND
//    | TIMEZONE_HOUR
//    | TIMEZONE_MINUTE
//    | TIMEZONE_REGION
//    | TIMEZONE_ABBR
//    | TIMESTAMP
//    | TIMESTAMP_UNCONSTRAINED
//    | TIMESTAMP_TZ_UNCONSTRAINED
//    | TIMESTAMP_LTZ_UNCONSTRAINED
//    | YMINTERVAL_UNCONSTRAINED
//    | DSINTERVAL_UNCONSTRAINED
//    | BFILE
//    | BLOB
//    | CLOB
//    | NCLOB
//    | MLSLABEL
//    ;
  = ('NVARCHAR2' / 'DEC' / 'INTEGER' / 'INT' / 'NUMERIC' / 'SMALLINT' / 'NUMBER' / 'DECIMAL' / 'FLOAT' / 'REAL' / 'NCHAR' / 'CHAR' / 'CHARACTER' / 'VARCHAR2' / 'VARCHAR' / 'STRING' / 'RAW') ALT_SPACE?
*/

//////////////////////////////////////////////////////////////////////////////////


//eof