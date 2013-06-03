test:
	@node node_modules/lab/bin/lab
test-cov:
	@node node_modules/lab/bin/lab -r threshold -t 42
test-cov-html:
	@node node_modules/lab/bin/lab -r html -o coverage.html
