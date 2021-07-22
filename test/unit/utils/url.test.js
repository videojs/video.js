/* eslint-env qunit */
import document from 'global/document';
import window from 'global/window';
import * as Url from '../../../src/js/utils/url.js';

QUnit.module('url');
QUnit.test('should parse the details of a url correctly', function(assert) {
  assert.equal(Url.parseUrl('#').protocol, window.location.protocol, 'parsed relative url protocol');
  assert.equal(Url.parseUrl('#').host, window.location.host, 'parsed relative url host');
  assert.equal(Url.parseUrl('#foo').hash, '#foo', 'parsed relative url hash');

  assert.equal(Url.parseUrl('http://example.com').protocol, 'http:', 'parsed example url protocol');
  assert.equal(Url.parseUrl('http://example.com').hostname, 'example.com', 'parsed example url hostname');

  assert.equal(Url.parseUrl('http://example.com:1234').port, '1234', 'parsed example url port');
});

QUnit.test('should strip port from hosts using http or https', function(assert) {
  const origDocCreate = document.createElement;

  // attempts to create elements will return an anchor tag that
  // misbehaves like IE9
  document.createElement = function() {
    return {
      hostname: 'example.com',
      host: 'example.com:80',
      protocol: 'http:',
      port: '80',
      pathname: '/domain/relative/url',
      hash: ''
    };
  };

  const url = Url.parseUrl('/domain/relative/url');

  document.createElement = origDocCreate;

  assert.ok(!(/.*:80$/).test(url.host), ':80 is not appended to the host');

});

QUnit.test('should get an absolute URL', function(assert) {
  // Errors on compiled tests that don't use unit.html. Need a better solution.
  // assert.ok(Url.getAbsoluteURL('unit.html') === window.location.href);
  assert.ok(Url.getAbsoluteURL('http://asdf.com') === 'http://asdf.com');
  assert.ok(Url.getAbsoluteURL('https://asdf.com/index.html') === 'https://asdf.com/index.html');
});

// getFileExtension tests
QUnit.test('should get the file extension of the passed path', function(assert) {
  assert.equal(Url.getFileExtension('/foo/bar/test.video.wgg'), 'wgg');
  assert.equal(Url.getFileExtension('test./video.mp4'), 'mp4');
  assert.equal(Url.getFileExtension('.bar/test.video.m4v'), 'm4v');
  assert.equal(Url.getFileExtension('foo/.bar/test.video.flv'), 'flv');
  assert.equal(Url.getFileExtension('foo/.bar/test.video.flv?foo=bar'), 'flv');
  assert.equal(Url.getFileExtension('http://www.test.com/video.mp4'), 'mp4');
  assert.equal(Url.getFileExtension('http://foo/bar/test.video.wgg'), 'wgg');

  // edge cases
  assert.equal(Url.getFileExtension('http://...'), '');
  assert.equal(Url.getFileExtension('foo/.bar/testvideo'), '');
  assert.equal(Url.getFileExtension(''), '');
  assert.equal(Url.getFileExtension(null), '');
  assert.equal(Url.getFileExtension(undefined), '');

  // with capital letters
  assert.equal(Url.getFileExtension('test.video.MP4'), 'mp4');
  assert.equal(Url.getFileExtension('test.video.FLV'), 'flv');
});

// isCrossOrigin tests
QUnit.test('isCrossOrigin can identify cross origin urls', function(assert) {

  assert.ok(!Url.isCrossOrigin(`http://${window.location.host}/example.vtt`), 'http://google.com from http://google.com is not cross origin');
  assert.ok(Url.isCrossOrigin(`https://${window.location.host}/example.vtt`), 'https://google.com from http://google.com is cross origin');
  assert.ok(!Url.isCrossOrigin(`//${window.location.host}/example.vtt`), '//google.com from http://google.com is not cross origin');
  assert.ok(Url.isCrossOrigin('http://example.com/example.vtt'), 'http://example.com from http://google.com is cross origin');
  assert.ok(Url.isCrossOrigin('https://example.com/example.vtt'), 'https://example.com from http://google.com is cross origin');
  assert.ok(Url.isCrossOrigin('//example.com/example.vtt'), '//example.com from http://google.com is cross origin');
  // we cannot test that relative urls work on https, though
  assert.ok(!Url.isCrossOrigin('example.vtt'), 'relative url is not cross origin');

  const location = {
    protocol: 'https:',
    host: 'google.com'
  };

  assert.ok(!Url.isCrossOrigin('https://google.com/example.vtt', location), 'http://google.com from https://google.com is not cross origin');
  assert.ok(Url.isCrossOrigin('http://google.com/example.vtt', location), 'http://google.com from https://google.com is cross origin');
  assert.ok(Url.isCrossOrigin('http://example.com/example.vtt', location), 'http://example.com from https://google.com is cross origin');
  assert.ok(Url.isCrossOrigin('https://example.com/example.vtt', location), 'https://example.com from https://google.com is cross origin');
  assert.ok(Url.isCrossOrigin('//example.com/example.vtt', location), '//example.com from https://google.com is cross origin');
});
