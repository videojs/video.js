/* eslint-env qunit */
import document from 'global/document';
import window from 'global/window';
import * as Url from '../../../src/js/utils/url.js';
import proxyquireify from 'proxyquireify';
const proxyquire = proxyquireify(require);

QUnit.module('url');
QUnit.test('should parse the details of a url correctly', function() {
  QUnit.equal(Url.parseUrl('#').protocol,
              window.location.protocol,
              'parsed relative url protocol');
  QUnit.equal(Url.parseUrl('#').host, window.location.host, 'parsed relative url host');

  QUnit.equal(Url.parseUrl('http://example.com').protocol, 'http:', 'parsed example url protocol');
  QUnit.equal(Url.parseUrl('http://example.com').hostname, 'example.com', 'parsed example url hostname');

  QUnit.equal(Url.parseUrl('http://example.com:1234').port, '1234', 'parsed example url port');
});

QUnit.test('should strip port from hosts using http or https', function() {
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

  QUnit.ok(!(/.*:80$/).test(url.host), ':80 is not appended to the host');

});

QUnit.test('should get an absolute URL', function() {
  // Errors on compiled tests that don't use unit.html. Need a better solution.
  // QUnit.ok(Url.getAbsoluteURL('unit.html') === window.location.href);
  QUnit.ok(Url.getAbsoluteURL('http://asdf.com') === 'http://asdf.com');
  QUnit.ok(Url.getAbsoluteURL('https://asdf.com/index.html') === 'https://asdf.com/index.html');
});

// getFileExtension tests
QUnit.test('should get the file extension of the passed path', function() {
  QUnit.equal(Url.getFileExtension('/foo/bar/test.video.wgg'), 'wgg');
  QUnit.equal(Url.getFileExtension('test./video.mp4'), 'mp4');
  QUnit.equal(Url.getFileExtension('.bar/test.video.m4v'), 'm4v');
  QUnit.equal(Url.getFileExtension('foo/.bar/test.video.flv'), 'flv');
  QUnit.equal(Url.getFileExtension('foo/.bar/test.video.flv?foo=bar'), 'flv');
  QUnit.equal(Url.getFileExtension('http://www.test.com/video.mp4'), 'mp4');
  QUnit.equal(Url.getFileExtension('http://foo/bar/test.video.wgg'), 'wgg');

  // edge cases
  QUnit.equal(Url.getFileExtension('http://...'), '');
  QUnit.equal(Url.getFileExtension('foo/.bar/testvideo'), '');
  QUnit.equal(Url.getFileExtension(''), '');
  QUnit.equal(Url.getFileExtension(null), '');
  QUnit.equal(Url.getFileExtension(undefined), '');

  // with capital letters
  QUnit.equal(Url.getFileExtension('test.video.MP4'), 'mp4');
  QUnit.equal(Url.getFileExtension('test.video.FLV'), 'flv');
});

// isCrossOrigin tests
QUnit.test('isCrossOrigin can identify cross origin urls', function() {
  const win = {
    location: {}
  };
  const Url_ = proxyquire('../../../src/js/utils/url.js', {
    'global/window': win
  });

  win.location.protocol = window.location.protocol;
  win.location.host = window.location.host;
  QUnit.ok(!Url_.isCrossOrigin(`http://${win.location.host}/example.vtt`), 'http://google.com from http://google.com is not cross origin');
  QUnit.ok(Url_.isCrossOrigin(`https://${win.location.host}/example.vtt`), 'https://google.com from http://google.com is cross origin');
  QUnit.ok(!Url_.isCrossOrigin(`//${win.location.host}/example.vtt`), '//google.com from http://google.com is not cross origin');
  QUnit.ok(Url_.isCrossOrigin('http://example.com/example.vtt'), 'http://example.com from http://google.com is cross origin');
  QUnit.ok(Url_.isCrossOrigin('https://example.com/example.vtt'), 'https://example.com from http://google.com is cross origin');
  QUnit.ok(Url_.isCrossOrigin('//example.com/example.vtt'), '//example.com from http://google.com is cross origin');
  // we cannot test that relative urls work on https, though
  QUnit.ok(!Url_.isCrossOrigin('example.vtt'), 'relative url is not cross origin');

  win.location.protocol = 'https:';
  win.location.host = 'google.com';
  QUnit.ok(Url_.isCrossOrigin('http://google.com/example.vtt'), 'http://google.com from https://google.com is cross origin');
  QUnit.ok(Url_.isCrossOrigin('http://example.com/example.vtt'), 'http://example.com from https://google.com is cross origin');
  QUnit.ok(Url_.isCrossOrigin('https://example.com/example.vtt'), 'https://example.com from https://google.com is cross origin');
  QUnit.ok(Url_.isCrossOrigin('//example.com/example.vtt'), '//example.com from https://google.com is cross origin');
});
