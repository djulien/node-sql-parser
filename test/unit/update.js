var should = require('should');
var Parser = require('../../lib/parser');

function inspect(obj) {
  console.log(require('util').inspect(obj, false, 10, true));  
}

describe('update test',function(){
  it('can handle simple update', function() {
    var sql, ast;

    sql = "UPDATE db.user_info SET last_login_time = '2012-12-18 12:44:21', last_login_ip = 'hohoo', login_count = login_count+1 WHERE id = 334094";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.should.eql({
      type: 'update',
      db: 'db',
      table: 'user_info',
      set: [ 
        { 
          column: 'last_login_time',
          value:{ type: 'string', value: '2012-12-18 12:44:21' } 
        },
        { 
          column: 'last_login_ip',
          value: { type: 'string', value: 'hohoo' } 
        },
        { 
          column: 'login_count',
          value:{ 
            type: 'binary_expr',
            operator: '+',
            left: { 
              type: 'column_ref',
              table: '',
              column: 'login_count',
              "location": {
                "end": {
                  "column": 116,
                  "line": 1,
                  "offset": 115
                },
                "start": {
                  "column": 105,
                  "line": 1,
                  "offset": 104
                }
              }
            },
            right: { 
              type: 'number', value: 1 
            } 
          } 
        } 
      ],
      where: { 
        type: 'binary_expr',
        operator: '=',
        left: { 
          type: 'column_ref',
          table: '',
          column: 'id',
          "location": {
            "end": {
              "column": 127,
              "line": 1,
              "offset": 126
            },
            "start": {
              "column": 125,
              "line": 1,
              "offset": 124
            }
          }
        },
        right: { 
          type: 'number', value: 334094 
        } 
      } 
    })

  });

  it('can handle simple update referencing table', function() {
    var sql, ast;

    sql = "UPDATE db.user_info SET user_info.last_login_time = '2012-12-18 12:44:21', user_info.last_login_ip = 'hohoo', user_info.login_count = user_info.login_count+1 WHERE user_info.id = 334094";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.should.eql({
      type: 'update',
      db: 'db',
      table: 'user_info',
      set: [
        {
          column: 'last_login_time',
          table: 'user_info',
          value:{ type: 'string', value: '2012-12-18 12:44:21' }
        },
        {
          column: 'last_login_ip',
          table: 'user_info',
          value: { type: 'string', value: 'hohoo' }
        },
        {
          column: 'login_count',
          table: 'user_info',
          value:{
            type: 'binary_expr',
            operator: '+',
            left: {
              type: 'column_ref',
              table: 'user_info',
              column: 'login_count',
              "location": {
                "end": {
                  "column": 156,
                  "line": 1,
                  "offset": 155
                },
                "start": {
                  "column": 135,
                  "line": 1,
                  "offset": 134
                }
              }
            },
            right: {
              type: 'number', value: 1
            }
          }
        }
      ],
      where: {
        type: 'binary_expr',
        operator: '=',
        left: {
          type: 'column_ref',
          table: 'user_info',
          column: 'id',
          location: {
            end: { "column": 177, "line": 1, "offset": 176 },
            start: { "column": 165, "line": 1, "offset": 164 }
          }
        },
        right: {
          type: 'number', value: 334094
        }
      }
    });

  });

  it('can handle simple update with back ticks', function() {
    var sql, ast;

    sql = "UPDATE db.`user_info` SET `last_login_time` = '2012-12-18 12:44:21', `last_login_ip` = 'hohoo', `login_count` = `login_count`+1 WHERE `id` = 334094";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.should.eql({
      type: 'update',
      db: 'db',
      table: 'user_info',
      set: [
        {
          column: 'last_login_time',
          value:{ type: 'string', value: '2012-12-18 12:44:21' }
        },
        {
          column: 'last_login_ip',
          value: { type: 'string', value: 'hohoo' }
        },
        {
          column: 'login_count',
          value:{
            type: 'binary_expr',
            operator: '+',
            left: {
              type: 'column_ref',
              table: '',
              column: 'login_count',
              "location": {
                "end": {
                  "column": 126,
                  "line": 1,
                  "offset": 125
                },
                "start": {
                  "column": 113,
                  "line": 1,
                  "offset": 112
                }
              }
            },
            right: {
              type: 'number', value: 1
            }
          }
        }
      ],
      where: {
        type: 'binary_expr',
        operator: '=',
        left: {
          type: 'column_ref',
          table: '',
          column: 'id',
          "location": {
            "end": {
              "column": 139,
              "line": 1,
              "offset": 138
            },
            "start": {
              "column": 135,
              "line": 1,
              "offset": 134
            }
          }
        },
        right: {
          type: 'number', value: 334094
        }
      }
    })

  });

  it('can handle simple update with back ticks using table reference', function() {
    var sql, ast;

    sql = "UPDATE db.`user_info` SET `user_info`.`last_login_time` = '2012-12-18 12:44:21', `user_info`.`last_login_ip` = 'hohoo', `user_info`.`login_count` = `user_info`.`login_count`+1 WHERE `user_info`.`id` = 334094";
    ast = Parser.parse(sql);

    //inspect(ast);
    ast.should.eql({
      type: 'update',
      db: 'db',
      table: 'user_info',
      set: [
        {
          column: 'last_login_time',
          table: 'user_info',
          value:{ type: 'string', value: '2012-12-18 12:44:21' }
        },
        {
          column: 'last_login_ip',
          table: 'user_info',
          value: { type: 'string', value: 'hohoo' }
        },
        {
          column: 'login_count',
          table: 'user_info',
          value:{
            type: 'binary_expr',
            operator: '+',
            left: {
              type: 'column_ref',
              table: 'user_info',
              column: 'login_count',
              "location": {
                "end": {
                  "column": 174,
                  "line": 1,
                  "offset": 173
                },
                "start": {
                  "column": 149,
                  "line": 1,
                  "offset": 148
                }
              }
            },
            right: {
              type: 'number', value: 1
            }
          }
        }
      ],
      where: {
        type: 'binary_expr',
        operator: '=',
        left: {
          type: 'column_ref',
          table: 'user_info',
          column: 'id',
          "location": {
            "end": {
              "column": 199,
              "line": 1,
              "offset": 198
            },
            "start": {
              "column": 183,
              "line": 1,
              "offset": 182
            }
          }
        },
        right: {
          type: 'number', value: 334094
        }
      }
    });

  });
});

