TESTS = test/unit/*.js
REPORTER = spec

#from http://stackoverflow.com/questions/5947742/how-to-change-the-output-color-of-echo-in-linux
#NOTE: node-gyp requires single quotes, no spaces around "=" below
#RED :=  #`tput setaf 1`#"\x1b[1;31m" #too dark: "\e[0;31m"
GREEN := `tput setaf 2`#"\\x1b[1;32m"
#YELLOW := `tput setaf 3`#"\x1b[1;33m"
#BLUE := `tput setaf 4`#"\x1b[1;34m"
#PINK := `tput setaf 5`#"\x1b[1;35m"
CYAN := `tput setaf 6`#"\\x1b[1;36m"
#GRAY = "\x1b[0;37m"
ENDCOLOR := `tput sgr0`#"\\x1b[0m"


default: plsql #set default target

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
	@if [ -f peg/plsql.pegjs ]; then mv peg/plsql.pegjs peg/plsql-BK.pegjs; fi
	@echo "//parser generated `date +"%x %X"`" > peg/plsql.pegjs
#	cat peg/custom.js >> peg/plsql.pegjs
	@echo "$(CYAN)extracting minimum rule set ...$(ENDCOLOR)"
	@peg/extract.js peg/*.g4 | peg/ant2peg.js peg/custom.js - >> peg/plsql.pegjs
#	#manual fixups (comment out stuff near top)

plsql: peg/PlSql*.g4 plsql.pegjs
#	ls peg/PlSql*[!BK].pegjs
#	@cat peg/PlSql*[!BK].pegjs > peg/plsql.pegjs
	@echo "$(CYAN)generating parser ...$(ENDCOLOR)"
	@./node_modules/pegjs/bin/pegjs -o ./base/plsql.js peg/plsql.pegjs
	@echo "$(GREEN)new parser generated ok.$(ENDCOLOR)"

#djsql: peg/djsql.pegjs
#	echo "//parser generated `date +"%x %X"`" > ../scripts/djsql.pegjs
#	./node_modules/pegjs/bin/pegjs peg/djsql.pegjs >> ../scripts/djsql.js

.PHONY: test

#eof