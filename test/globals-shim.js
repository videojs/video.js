import document from 'global/document';
import window from 'global/window';
import sinon from 'sinon';

window.q = QUnit;
window.sinon = sinon;

// This may not be needed anymore, but double check before removing
window.fixture = document.createElement('div');
window.fixture.id = 'qunit-fixture';
document.body.appendChild(window.fixture);
