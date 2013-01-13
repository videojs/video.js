module( "testSuites tests", (function(){
	var asyncTest = QUnit.asyncTest,
		runSuite = QUnit.runSuite;

	return {
		setup: function(){
			//proxy asyncTest and runSuite
			QUnit.asyncTest = window.asyncTest = function( name, callback ){
				ok( true, "asyncTestCalled for each suite" );
				callback(); //don't acutally create tests, just call callback
			};
			QUnit.runSuite = window.runSuite = function(){
				ok( true, "runSuite called for each suite" );
			};
			//ensure that subsuite's done doesn't run
			this.oldDone = QUnit.done;
		},
		teardown: function(){
			//restore
			QUnit.asyncTest = window.asyncTest = asyncTest;
			QUnit.runSuite = window.runSuite = runSuite;
			QUnit.done = this.oldDone;
		}
	};
})());

test( "proper number of asyncTest and runSuite calls", function(){
	expect( 6 );
	QUnit.testSuites( ["one.html", "two.html", "three.html"] );
});

test( "done callback changed", function(){
	QUnit.testSuites( ["dummy.html"] );
	notEqual( this.oldDone, QUnit.done, "done callback should be set" );
});

module( "testStart tests", (function(){
	var id = QUnit.id;
	return {
		setup: function(){
			//proxy id
			var fakeElem = this.fakeElem = document.createElement( "div" );

			QUnit.id = function(){
				return fakeElem;
			}
		},
		teardown: function(){
			QUnit.id = id;
		}
	};
})());

test( "running message printed", function(){
	var hello = "hello world",
	expected = "Running " + hello + "...<br>&nbsp;";
	QUnit.testStart( {name: hello} );
	equal( this.fakeElem.innerHTML, expected, "innerHTML was set correctly by testStart" );
});

module( "testDone tests", (function(){
	var id = QUnit.id;
	return {
		setup: function(){
			//proxy id
			var fakeElem = this.fakeElem = document.createElement( "div" );
			fakeElem.appendChild( document.createElement( "ol" ) );
			fakeElem.appendChild( document.createElement( "ol" ) );
			QUnit.id = function(){
				return fakeElem;
			}
		},
		teardown: function(){
			QUnit.id = id;
		}
	};
})());

test( "test expansions are hidden", function(){
	QUnit.testDone();
	equal( this.fakeElem.children[0].style.display, "none", "first ol display is none" );
	equal( this.fakeElem.children[1].style.display, "none", "second ol display is none" );
});

test( "non-ol elements aren't hidden", function(){
	this.fakeElem.appendChild( document.createElement( "span" ) );

	QUnit.testDone();
	notEqual( this.fakeElem.children[2].style.display, "none", "first ol display is none" );
});

module( "runSuite tests", (function(){
	var getElementsByTagName = document.getElementsByTagName,
		createElement = document.createElement,
		runSuite = QUnit.runSuite;

	return {
		setup: function(){
			//proxy getElementsByTagName and createElement
			var setAttributeCall = this.setAttributeCall = {},
				appendChildCall = this.appendChildCall = {called: 0},
				iframeLoad = this.iframeLoad = {},
				iframeQUnitObject = this.iframeQUnitObject = {},
				fakeElement = {
					appendChild: function(){appendChildCall.called++},
					setAttribute: function(){setAttributeCall.args = arguments},
					addEventListener: function( type, callback ){iframeLoad.callback = callback;},
					contentWindow: {QUnit: iframeQUnitObject},
					className: "",
				};

			document.getElementsByTagName = function(){
				return [fakeElement];
			};
			document.createElement = function(){
				return fakeElement;
			}

		},
		teardown: function(){
			document.getElementsByTagName = getElementsByTagName;
			document.createElement = createElement;
			//must restore even though we didn't proxy; the runner overwrites upon first call
			QUnit.runSuite = runSuite;
		}
	};
})());

test( "runSuite different after first run", function(){
	var before = QUnit.runSuite,
		after;
	QUnit.runSuite();
	after = QUnit.runSuite;
	notEqual( before, after, "runSuite changed after initial run" );
});

test( "iframe only created once", function(){
	QUnit.runSuite();
	equal( this.appendChildCall.called, 1, "append child called once" );
	QUnit.runSuite();
	equal( this.appendChildCall.called, 1, "append child only ever called once" );
});

test( "iframe's QUnit object is modified when iframe source loads", function(){
	var before = this.iframeQUnitObject,
		after;
	QUnit.runSuite();
	this.iframeLoad.callback();
	notEqual( before, after, "iframe's qunit object is modified upon load");
});

test( "iframe src set to suite passed", function(){
	var pages = ["testing.html", "subsuiteRunner.html"];
	QUnit.runSuite( pages[0] );
	equal( this.setAttributeCall.args[0], "src", "src attribute set" );
	equal( this.setAttributeCall.args[1], pages[0], "src attribute set" );
	QUnit.runSuite( pages[1] );
	equal( this.setAttributeCall.args[1], pages[1], "src attribute set" );
});