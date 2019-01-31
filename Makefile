TESTS = test/unit/*.js
REPORTER = spec
test: clean
	@npm install
	@./node_modules/pegjs/bin/pegjs -o ./base/nquery.js peg/nquery.pegjs
	@npm run generateFromClauseParser
	@./node_modules/mocha/bin/mocha  $(TESTS) --reporter spec

clean:

peg: clean
	@./node_modules/pegjs/bin/pegjs -o ./base/nquery.js peg/nquery.pegjs
	@npm run generateFromClauseParser


plsql.pegjs: peg/PlSql*.g4
#	if [ -f peg/PlSqlLexer.pegjs ]; then mv peg/PlSqlLexer.pegjs peg/PlSqlLexer-BK.pegjs; fi
#	peg/ant2peg.js peg/PlSqlLexer.g4 > peg/PlSqlLexer.pegjs
#	if [ -f peg/PlSqlParser.pegjs ]; then mv peg/PlSqlParser.pegjs peg/PlSqlParser-BK.pegjs; fi
#	peg/ant2peg.js peg/PlSqlParser.g4 > peg/PlSqlParser.pegjs
	if [ -f peg/plsql.pegjs ]; then mv peg/plsql.pegjs peg/plsql-BK.pegjs; fi
	cat peg/custom.js > peg/plsql.pegjs
	peg/extract.js peg/*.g4 | peg/ant2peg.js - >> peg/plsql.pegjs
#	#manual fixups (comment out stuff near top)

plsql: peg/PlSql*.g4 plsql.pegjs
#	ls peg/PlSql*[!BK].pegjs
#	@cat peg/PlSql*[!BK].pegjs > peg/plsql.pegjs
	./node_modules/pegjs/bin/pegjs -o ./base/plsql.js peg/plsql.pegjs

.PHONY: test
