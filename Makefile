# Using makefile temporarily to run tests on Travis CI

test:
	jshint src/*.js --config .jshintrc
	node test/server.js &
	phantomjs test/phantom.js "http://localhost:3000/test/unit.html"
	kill -9 `cat test/pid.txt`
	rm test/pid.txt

.PHONY: test
