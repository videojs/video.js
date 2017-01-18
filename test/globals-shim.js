/* eslint-env qunit */
import 'es5-shim';
import 'es6-shim';
import document from 'global/document';
import window from 'global/window';
import sinon from 'sinon';

window.q = QUnit;
window.sinon = sinon;

// There's nowhere we require completing xhr requests
// and raynos/xhr doesn't want to make stubbing easy (Raynos/xhr#11)
// so we need to stub XHR before the xhr module is included anywhere else.
window.xhr = sinon.useFakeXMLHttpRequest();

// This may not be needed anymore, but double check before removing
window.fixture = document.createElement('div');
window.fixture.id = 'qunit-fixture';
document.body.appendChild(window.fixture);
