var should = require('should');
var Parser = require('../../lib/parser');

function inspect(obj) {
  //console.log(require('util').inspect(obj, false, 10, true));
}

describe('select test',function(){

  it('clauses test', function() {
    var sql, ast;

    sql = "SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 3";
    ast = Parser.parse(sql);

    ast.distinct.should.eql('DISTINCT');
    ast.from.should.not.eql(null);
    ast.where.should.not.eql(null);
    ast.groupby.should.not.eql(null);
    ast.orderby.should.not.eql(null);
    ast.limit.should.not.eql(null);
  });

  it('limit test', function() {
    var sql, ast;

    sql = "SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 3";
    ast = Parser.parse(sql);

    ast.limit.should.eql([{type :'number', value : 0}, {type :'number', value : 3}]);

    sql = "SELECT DISTINCT a FROM b WHERE c = 0 GROUP BY d ORDER BY e limit 0, 3";
    ast = Parser.parse(sql);

    ast.limit.should.eql([{type :'number', value : 0}, {type :'number', value : 3}]);
  });

  it('group by test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c = 0 GROUP BY d, t.b, t.c";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.groupby.should.eql([
      {
        type: 'column_ref',
        table: '',
        column: 'd',
        "location": {
          "end": {
            "column": 39,
            "line": 1,
            "offset": 38
          },
          "start": {
            "column": 38,
            "line": 1,
            "offset": 37
          }
        }
      },
      {
        type: 'column_ref',
        table: 't',
        column: 'b',
        "location": {
          "end": {
            "column": 44,
            "line": 1,
            "offset": 43
          },
          "start": {
            "column": 41,
            "line": 1,
            "offset": 40
          }
        }
      },
      {
        type: 'column_ref',
        table: 't',
        column: 'c',
        "location": {
          "end": {
            "column": 49,
            "line": 1,
            "offset": 48
          },
          "start": {
            "column": 46,
            "line": 1,
            "offset": 45
          }
        }
      }
    ]);
  });

  it('order by test', function() {
    var sql, ast;

    sql = "SELECT a FROM b WHERE c = 0 order BY d, t.b dEsc, t.c, SuM(e)";
    ast = Parser.parse(sql);

    inspect(ast.orderby);
    ast.orderby.should.eql([
      {
        expr: {
          type: 'column_ref',
          table: '',
          column: 'd',
          "location": {
            "end": {
              "column": 39,
              "line": 1,
              "offset": 38
            },
            "start": {
              "column": 38,
              "line": 1,
              "offset": 37
            }
          }
        },
        type: 'ASC'
      },
      {
        expr: {
          type: 'column_ref',
          table: 't',
          column: 'b',
          "location": {
            "end": {
              "column": 44,
              "line": 1,
              "offset": 43
            },
            "start": {
              "column": 41,
              "line": 1,
              "offset": 40
            }
          }
        },
        type: 'DESC'
      },
      {
        expr: {
          type: 'column_ref',
          table: 't',
          column: 'c',
          "location": {
            "end": {
              "column": 54,
              "line": 1,
              "offset": 53
            },
            "start": {
              "column": 51,
              "line": 1,
              "offset": 50
            }
          }
        },
        type: 'ASC'
      },
      {
        expr: {
          type: 'aggr_func',
          name: 'SUM',
          args: {
            expr: {
              type: 'column_ref',
              table: '',
              column: 'e',
              "location": {
                "end": {
                  "column": 61,
                  "line": 1,
                  "offset": 60
                },
                "start": {
                  "column": 60,
                  "line": 1,
                  "offset": 59
                }
              }
            }
          }
        },
        type: 'ASC'
      }
    ]);
  });

  it('column clause test', function() {
    var sql, ast;

    sql = "SELECT * FROM  t";
    ast = Parser.parse(sql);
    ast.columns.should.eql('*');

    sql = "SELECT a aa, b.c as bc, fun(d), 1+3 FROM  t";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.columns.should.eql([
      {
        expr: {
          type: 'column_ref',
          table: '',
          column: 'a',
          "location": {
            "end": {
              "column": 9,
              "line": 1,
              "offset": 8
            },
            "start": {
              "column": 8,
              "line": 1,
              "offset": 7
            }
          }
        },
        as: 'aa'
      },
      {
        expr: {
          type: 'column_ref',
          table: 'b',
          column: 'c',
          "location": {
            "end": {
              "column": 17,
              "line": 1,
              "offset": 16
            },
            "start": {
              "column": 14,
              "line": 1,
              "offset": 13
            }
          }
        },
        as: 'bc'
      },
      {
        expr: {
          type: 'function',
          name: 'fun',
          args: {
            type  : 'expr_list',
            value : [
              {
                type: 'column_ref',
                table: '',
                column: 'd',
                "location": {
                  "end": {
                    "column": 30,
                    "line": 1,
                    "offset": 29
                  },
                  "start": {
                    "column": 29,
                    "line": 1,
                    "offset": 28
                  }
                }
              }
            ]
          }
        },
        as: null
      },
      {
        expr: {
          type: 'binary_expr',
          operator: '+',
          left: {
            type  : 'number',
            value : 1
          },
          right: {
            type  : 'number',
            value : 3
          }
        },
        as: null
      }
    ]);
  });

  it('where clause test', function() {
    var sql, ast;

    sql = "SELECT * FROM  t where t.a > 0 AND t.c between 1 and 't' AND Not true";
    ast = Parser.parse(sql);

    //inspect(ast.where);
    ast.where.should.eql({
      type: 'binary_expr',
      operator: 'AND',
      left: {
        type: 'binary_expr',
        operator: 'AND',
        left: {
          type: 'binary_expr',
          operator: '>',
          left: {
            type: 'column_ref',
            table: 't',
            column: 'a',
            "location": {
              "end": {
                "column": 27,
                "line": 1,
                "offset": 26
              },
              "start": {
                "column": 24,
                "line": 1,
                "offset": 23
              }
            }
          },
          right: {
            type: 'number', value: 0
          }
        },
        right: {
          type: 'binary_expr',
          operator: 'BETWEEN',
          left: {
            type: 'column_ref',
            table: 't',
            column: 'c',
            "location": {
              "end": {
                "column": 39,
                "line": 1,
                "offset": 38
              },
              "start": {
                "column": 36,
                "line": 1,
                "offset": 35
              }
            }
          },
          right: {
            type : 'expr_list',
            value : [
              { type: 'number', value: 1 },
              { type: 'string', value: 't' } 
            ]
          } 
        } 
      },
      right: { 
        type: 'unary_expr',
        operator: 'NOT',
        expr: { 
          type: 'bool', value: true } 
        } 
      });

  });   

  it('from clause test', function() {
    var sql, ast;

    sql = "SELECT * FROM  t, a.b b, c.d as cd";
    ast = Parser.parse(sql);

    //inspect(ast.from);
    ast.from.should.eql([
      {
        type: 'table',
        db: '',
        table: 't',
        as: null,
        "location": {
          "end": {
            "column": 17,
            "line": 1,
            "offset": 16
          },
          "start": {
            "column": 16,
            "line": 1,
            "offset": 15
          }
        }
      },
      {
        type: 'table',
        db: 'a',
        table: 'b',
        as: 'b',
        "location": {
          "end": {
            "column": 24,
            "line": 1,
            "offset": 23
          },
          "start": {
            "column": 19,
            "line": 1,
            "offset": 18
          }
        }
      },
      {
        type: 'table',
        db: 'c',
        table: 'd',
        as: 'cd',
        "location": {
          "end": {
            "column": 35,
            "line": 1,
            "offset": 34
          },
          "start": {
            "column": 26,
            "line": 1,
            "offset": 25
          }
        }
      }
    ]);


    sql = "SELECT * FROM t join a.b b on t.a = b.c left join d on d.d = d.a";
    ast = Parser.parse(sql);

    //inspect(ast.from);
    ast.from.should.eql([
      {
        type: 'table',
        db: '',
        table: 't',
        as: null,
        "location": {
          "end": {
            "column": 17,
            "line": 1,
            "offset": 16
          },
          "start": {
            "column": 15,
            "line": 1,
            "offset": 14
          }
        }
      },
      {
        type: 'table',
        db: 'a',
        table: 'b',
        as: 'b',
        "location": {
          "end": {
            "column": 27,
            "line": 1,
            "offset": 26
          },
          "start": {
            "column": 22,
            "line": 1,
            "offset": 21
          }
        },
        join: 'INNER JOIN',
        on: {
          type: 'binary_expr',
          operator: '=',
          left: {
            type: 'column_ref',
            table: 't',
            column: 'a',
            "location": {
              "end": {
                "column": 34,
                "line": 1,
                "offset": 33
              },
              "start": {
                "column": 31,
                "line": 1,
                "offset": 30
              }
            }
          },
          right: {
            type: 'column_ref',
            table: 'b',
            column: 'c',
            "location": {
              "end": {
                "column": 40,
                "line": 1,
                "offset": 39
              },
              "start": {
                "column": 37,
                "line": 1,
                "offset": 36
              }
            }
          }
        }
      },
      {
        type: 'table',
        db: '',
        table: 'd',
        as: null,
        join: 'LEFT JOIN',
        "location": {
          "end": {
            "column": 53,
            "line": 1,
            "offset": 52
          },
          "start": {
            "column": 51,
            "line": 1,
            "offset": 50
          }
        },
        on: {
          type: 'binary_expr',
          operator: '=',
          left: {
            type: 'column_ref',
            table: 'd',
            column: 'd',
            "location": {
              "end": {
                "column": 59,
                "line": 1,
                "offset": 58
              },
              "start": {
                "column": 56,
                "line": 1,
                "offset": 55
              }
            }
          },
          right: {
            type: 'column_ref',
            table: 'd',
            column: 'a',
            "location": {
              "end": {
                "column": 65,
                "line": 1,
                "offset": 64
              },
              "start": {
                "column": 62,
                "line": 1,
                "offset": 61
              }
            }
          }
        }
      }
    ]);
  });

  it('from clause test', function() {
    var sql, ast;

    sql = "select i_item_id, i_list_price, avg(ss_sales_price) agg1 FROM store_sales JOIN item on (store_sales.ss_item_id = item.i_item_id) JOIN customer on (store_sales.ss_customer_id = customer.c_id)";
    ast = Parser.parse(sql);

    //inspect(ast);
    //ast.from.should.eql([});   
  });

  it('keyword as table test', function() {
    var sql, ast, rmTable = Parser.reservedMap.TABLE, e = {};
    Parser.reservedMap.TABLE = false;

    sql = 'select * from service_a.table as sa inner join service_b.table as sb on sa.id=sb.id where sa.fm=f and sb.id=3';
    ast = Parser.parse(sql);
    Parser.reservedMap.TABLE = rmTable;

    try {
      Parser.parse(sql);
    } catch (_e) {
      e = _e;
    }
console.log(e.name);
    (e.name).should.eql('SyntaxError');
  });

  it('IN operation subquery test', function() {
    var sql, ast;

    sql = "SELECT columnnames FROM tablename1 WHERE value IN (SELECT columnname FROM tablename2 WHERE condition)";
    ast = Parser.parse(sql);
    ast.where.right.type.should.eql('select')
  });

  it('FROM clause subquery test', function() {
    var sql, ast;

    sql = "SELECT sub FROM (SELECT * FROM tutorial.sf_crime_incidents_2014_01 WHERE day_of_week = 'Friday') sub WHERE sub.resolution = 'NONE'";
    ast = Parser.parse(sql);
    ast.from[0].type.should.eql('subquery')
    ast.from[0].as.should.eql('sub')
  });

  it('incomplete FROM clause subquery test', function() {
    var sql, ast;
    sql = "SELECT sub FROM ( SELECT e. FROM employees e ) sub";
    ast = Parser.parse(sql);
    ast.from[0].type.should.eql('incomplete_subquery')
    ast.from[0].as.should.eql('sub')
    ast.from[0].text.should.eql('( SELECT e. FROM employees e )')
  });

  it('incomplete FROM clause nested subquery test', function() {
    var sql, ast;
    sql = "SELECT sub FROM (SELECT e.employee_id FROM (SELECT e2. FROM employees e2) e) sub";
    ast = Parser.parse(sql);
    ast.from[0].type.should.eql('subquery')
    ast.from[0].as.should.eql('sub')
    ast.from[0].subquery.from[0].type.should.eql('incomplete_subquery')
    ast.from[0].subquery.from[0].text.should.eql('(SELECT e2. FROM employees e2)')
    ast.from[0].subquery.from[0].as.should.eql('e')
  });
})

