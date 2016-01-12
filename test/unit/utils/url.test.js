import document from 'global/document';
import window from 'global/window';
import * as Url from '../../../src/js/utils/url.js';
import proxyquireify from 'proxyquireify';
const proxyquire = proxyquireify(require);

q.module('url');

test('should parse the details of a url correctly', function(){
  equal(Url.parseUrl('#').protocol, window.location.protocol, 'parsed relative url protocol');
  equal(Url.parseUrl('#').host, window.location.host, 'parsed relative url host');

  equal(Url.parseUrl('http://example.com').protocol, 'http:', 'parsed example url protocol');
  equal(Url.parseUrl('http://example.com').hostname, 'example.com', 'parsed example url hostname');

  equal(Url.parseUrl('http://example.com:1234').port, '1234', 'parsed example url port');
});

test('should strip port from hosts using http or https', function() {
  var url;
  var origDocCreate = document.createElement;

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

  url = Url.parseUrl('/domain/relative/url');

  document.createElement = origDocCreate;

  ok(!(/.*:80$/).test(url.host), ':80 is not appended to the host');

});

test('should get an absolute URL', function(){
  // Errors on compiled tests that don't use unit.html. Need a better solution.
  // ok(Url.getAbsoluteURL('unit.html') === window.location.href);
  ok(Url.getAbsoluteURL('http://asdf.com') === 'http://asdf.com');
  ok(Url.getAbsoluteURL('https://asdf.com/index.html') === 'https://asdf.com/index.html');
});

//getFileExtension tests
test('should get the file extension of the passed path', function() {
  equal(Url.getFileExtension('/foo/bar/test.video.wgg'), 'wgg');
  equal(Url.getFileExtension('test./video.mp4'), 'mp4');
  equal(Url.getFileExtension('.bar/test.video.m4v'), 'm4v');
  equal(Url.getFileExtension('foo/.bar/test.video.flv'), 'flv');
  equal(Url.getFileExtension('foo/.bar/test.video.flv?foo=bar'), 'flv');
  equal(Url.getFileExtension('http://www.test.com/video.mp4'), 'mp4');
  equal(Url.getFileExtension('http://foo/bar/test.video.wgg'), 'wgg');

  //edge cases
  equal(Url.getFileExtension('http://...'), '');
  equal(Url.getFileExtension('foo/.bar/testvideo'), '');
  equal(Url.getFileExtension(''), '');
  equal(Url.getFileExtension(null), '');
  equal(Url.getFileExtension(undefined), '');

  //with capital letters
  equal(Url.getFileExtension('test.video.MP4'), 'mp4');
  equal(Url.getFileExtension('test.video.FLV'), 'flv');
});

// isCrossOrigin tests
test('isCrossOrigin can identify cross origin urls', function() {
  let win = {
    location: {}
  };
  let Url = proxyquire('../../../src/js/utils/url.js', {
    'global/window': win
  });

  win.location.protocol = window.location.protocol;
  win.location.host = window.location.host;
  ok(!Url.isCrossOrigin(`http://${win.location.host}/example.vtt`), 'http://google.com from http://google.com is not cross origin');
  ok(Url.isCrossOrigin(`https://${win.location.host}/example.vtt`), 'https://google.com from http://google.com is cross origin');
  ok(!Url.isCrossOrigin(`//${win.location.host}/example.vtt`), '//google.com from http://google.com is not cross origin');
  ok(Url.isCrossOrigin('http://example.com/example.vtt'), 'http://example.com from http://google.com is cross origin');
  ok(Url.isCrossOrigin('https://example.com/example.vtt'), 'https://example.com from http://google.com is cross origin');
  ok(Url.isCrossOrigin('//example.com/example.vtt'), '//example.com from http://google.com is cross origin');
  // we cannot test that relative urls work on https, though
  ok(!Url.isCrossOrigin('example.vtt'), 'relative url is not cross origin');

  win.location.protocol = 'https:';
  win.location.host = 'google.com';
  ok(Url.isCrossOrigin('http://google.com/example.vtt'), 'http://google.com from https://google.com is cross origin');
  ok(Url.isCrossOrigin('http://example.com/example.vtt'), 'http://example.com from https://google.com is cross origin');
  ok(Url.isCrossOrigin('https://example.com/example.vtt'), 'https://example.com from https://google.com is cross origin');
  ok(Url.isCrossOrigin('//example.com/example.vtt'), '//example.com from https://google.com is cross origin');
});
