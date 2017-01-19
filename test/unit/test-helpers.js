import * as Dom from '../../src/js/utils/dom';
import Player from '../../src/js/player.js';
import document from 'global/document';

const TestHelpers = {
  makeTag() {
    const videoTag = document.createElement('video');

    videoTag.id = 'example_1';
    videoTag.className = 'video-js vjs-default-skin';
    return videoTag;
  },

  makePlayer(playerOptions, videoTag) {
    videoTag = videoTag || TestHelpers.makeTag();

    const fixture = document.getElementById('qunit-fixture');

    fixture.appendChild(videoTag);

    playerOptions = playerOptions || {};
    playerOptions.techOrder = playerOptions.techOrder || ['techFaker'];

    const player = new Player(videoTag, playerOptions);

    player.middleware_ = [player.tech_];

    return player;
  },

  getComputedStyle(el, rule) {
    if (document.defaultView && document.defaultView.getComputedStyle) {
      return document.defaultView.getComputedStyle(el, null).getPropertyValue(rule);
    }

    // IE8
    if (el.currentStyle) {
      if (rule === 'width' || rule === 'height') {
        // return clientWidth or clientHeight instead for better accuracy
        rule = 'client' + rule.substr(0, 1).toUpperCase() + rule.substr(1);
        return el[rule] + 'px';
      }
      return el.currentStyle[rule];
    }
  },

  /**
   * Runs a range of assertions on a DOM element.
   *
   * @param  {QUnit.Assert} assert
   * @param  {Element} el
   * @param  {Object} spec
   *         An object from which assertions are generated.
   *
   * @param  {Object} [spec.attrs]
   *         An object mapping attribute names (keys) to strict values.
   *
   * @param  {Array} [spec.classes]
   *         An array of classes that are expected on the element.
   *
   * @param  {String} [spec.innerHTML]
   *         A string of text/html that is expected as the content of element.
   *         Both values will be trimmed, but remains case-sensitive.
   *
   * @param  {Object} [spec.props]
   *         An object mapping property names (keys) to strict values.
   *
   * @param  {String} [spec.tagName]
   *         A string (case-insensitive) representing that element's tagName.
   *
   * @return {Function}
   *         Invoke the returned function to run the assertions. This
   *         function has a `count` property which can be used to
   *         reference how many assertions will be run (e.g. for use
   *         with `assert.expect()`).
   */
  assertEl(assert, el, spec) {
    const attrs = spec.attrs ? Object.keys(spec.attrs) : [];
    const classes = spec.classes || [];
    const innerHTML = spec.innerHTML ? spec.innerHTML.trim() : '';
    const props = spec.props ? Object.keys(spec.props) : [];
    const tagName = spec.tagName ? spec.tagName.toLowerCase() : '';

    // Return value is a function, which runs through all the combined
    // assertions. This is done so that the count can be attached dynamically
    // and run whenever desired.
    const run = () => {
      if (tagName) {
        const elTagName = el.tagName.toLowerCase();
        const msg = `el should have been a <${tagName}> and was a <${elTagName}>`;

        assert.strictEqual(elTagName, tagName, msg);
      }

      if (innerHTML) {
        const elInnerHTML = el.innerHTML.trim();
        const msg = 'el should have expected HTML content';

        assert.strictEqual(elInnerHTML, innerHTML, msg);
      }

      attrs.forEach(a => {
        const actual = el.getAttribute(a);
        const expected = spec.attrs[a];
        const msg = `el should have the "${a}" attribute with ` +
                    `the value "${expected}" and it was "${actual}"`;

        assert.strictEqual(actual, expected, msg);
      });

      classes.forEach(c => {
        const msg = `el should have the "${c}" class in its ` +
                    `className, which is "${el.className}"`;

        assert.ok(Dom.hasClass(el, c), msg);
      });

      props.forEach(p => {
        const actual = el[p];
        const expected = spec.props[p];
        const msg = `el should have the "${p}" property with the ` +
                    `value "${expected}" and it was "${actual}"`;

        assert.strictEqual(actual, expected, msg);
      });
    };

    // Include the number of assertions to run, so it can be used to set
    // expectations (via `assert.expect()`).
    run.count = Number(!!tagName) +
      Number(!!innerHTML) +
      classes.length +
      attrs.length +
      props.length;

    return run;
  },

  /**
   * Triggers an event on a DOM node natively.
   *
   * @param  {Element} element
   * @param  {string} eventType
   */
  triggerDomEvent(element, eventType) {
    let event;

    if (document.createEvent) {
      event = document.createEvent('HTMLEvents');
      event.initEvent(eventType, true, true);
    } else {
      event = document.createEventObject();
      event.eventType = eventType;
    }

    event.eventName = eventType;

    if (document.createEvent) {
      element.dispatchEvent(event);
    } else {
      element.fireEvent('on' + event.eventType, event);
    }
  }
};

export default TestHelpers;
