/* eslint-env qunit */
import c from '../../../src/js/tracks/text-track-list-converter.js';
import TextTrack from '../../../src/js/tracks/text-track.js';
import TextTrackList from '../../../src/js/tracks/text-track-list.js';
import Html5 from '../../../src/js/tech/html5.js';
import document from 'global/document';

QUnit.module('Text Track List Converter', {});

const clean = (item) => {
  delete item.id;
  delete item.inBandMetadataTrackDispatchType;
  delete item.cues;
};

const cleanup = (item) => {
  if (Array.isArray(item)) {
    item.forEach(clean);
  } else {
    clean(item);
  }

  return item;
};

if (Html5.supportsNativeTextTracks()) {
  QUnit.test('trackToJson_ produces correct representation for native track object', function(assert) {
    const track = document.createElement('track');

    track.src = 'example.com/english.vtt';
    track.kind = 'captions';
    track.srclang = 'en';
    track.label = 'English';

    assert.deepEqual(cleanup(c.trackToJson_(track.track)), {
      kind: 'captions',
      label: 'English',
      language: 'en',
      mode: 'disabled'
    }, 'the json output is same');
  });

  QUnit.test('textTracksToJson produces good json output', function(assert) {
    const emulatedTrack = new TextTrack({
      kind: 'captions',
      label: 'English',
      language: 'en',
      tech: {}
    });

    const nativeTrack = document.createElement('track');

    nativeTrack.kind = 'captions';
    nativeTrack.srclang = 'es';
    nativeTrack.label = 'Spanish';

    const tt = new TextTrackList();

    tt.addTrack(nativeTrack.track);
    tt.addTrack(emulatedTrack);

    const tech = {
      $$() {
        return [nativeTrack];
      },

      el() {
        return {
          querySelectorAll() {
            return [nativeTrack];
          }
        };
      },
      textTracks() {
        return tt;
      }
    };

    assert.deepEqual(cleanup(c.textTracksToJson(tech)), [{
      kind: 'captions',
      label: 'Spanish',
      language: 'es',
      mode: 'disabled'
    }, {
      kind: 'captions',
      label: 'English',
      language: 'en',
      mode: 'disabled'
    }], 'the output is correct');
  });

  QUnit.test('jsonToTextTracks calls addRemoteTextTrack on the tech with mixed tracks', function(assert) {
    const emulatedTrack = new TextTrack({
      kind: 'captions',
      label: 'English',
      language: 'en',
      src: 'example.com/english.vtt',
      tech: {}
    });

    const nativeTrack = document.createElement('track');

    nativeTrack.src = 'example.com/spanish.vtt';
    nativeTrack.kind = 'captions';
    nativeTrack.srclang = 'es';
    nativeTrack.label = 'Spanish';

    const tt = new TextTrackList();

    tt.addTrack(nativeTrack.track);
    tt.addTrack(emulatedTrack);

    let addRemotes = 0;
    const tech = {
      $$() {
        return [nativeTrack];
      },

      el() {
        return {
          querySelectorAll() {
            return [nativeTrack];
          }
        };
      },
      textTracks() {
        return tt;
      },
      addRemoteTextTrack() {
        addRemotes++;
        return {
          track: {}
        };
      }
    };

    c.jsonToTextTracks(cleanup(c.textTracksToJson(tech)), tech);

    assert.equal(addRemotes, 2, 'we added two text tracks');
  });
}

QUnit.test('trackToJson_ produces correct representation for emulated track object', function(assert) {
  const track = new TextTrack({
    kind: 'captions',
    label: 'English',
    language: 'en',
    src: 'example.com/english.vtt',
    tech: {}
  });

  assert.deepEqual(cleanup(c.trackToJson_(track)), {
    src: 'example.com/english.vtt',
    kind: 'captions',
    label: 'English',
    language: 'en',
    mode: 'disabled'
  }, 'the json output is same');
});

QUnit.test('textTracksToJson produces good json output for emulated only', function(assert) {
  const emulatedTrack = new TextTrack({
    kind: 'captions',
    label: 'English',
    language: 'en',
    src: 'example.com/english.vtt',
    tech: {}
  });

  const anotherTrack = new TextTrack({
    src: 'example.com/spanish.vtt',
    kind: 'captions',
    srclang: 'es',
    label: 'Spanish',
    tech: {}
  });

  const tt = new TextTrackList();

  tt.addTrack(anotherTrack);
  tt.addTrack(emulatedTrack);

  const tech = {
    $$() {
      return [];
    },

    el() {
      return {
        querySelectorAll() {
          return [];
        }
      };
    },
    textTracks() {
      return tt;
    }
  };

  assert.deepEqual(cleanup(c.textTracksToJson(tech)), [{
    src: 'example.com/spanish.vtt',
    kind: 'captions',
    label: 'Spanish',
    language: 'es',
    mode: 'disabled'
  }, {
    src: 'example.com/english.vtt',
    kind: 'captions',
    label: 'English',
    language: 'en',
    mode: 'disabled'
  }], 'the output is correct');
});

QUnit.test('jsonToTextTracks calls addRemoteTextTrack on the tech with emulated tracks only', function(assert) {
  const emulatedTrack = new TextTrack({
    kind: 'captions',
    label: 'English',
    language: 'en',
    src: 'example.com/english.vtt',
    tech: {}
  });

  const anotherTrack = new TextTrack({
    src: 'example.com/spanish.vtt',
    kind: 'captions',
    srclang: 'es',
    label: 'Spanish',
    tech: {}
  });

  const tt = new TextTrackList();

  tt.addTrack(anotherTrack);
  tt.addTrack(emulatedTrack);

  let addRemotes = 0;
  const tech = {
    $$() {
      return [];
    },

    el() {
      return {
        querySelectorAll() {
          return [];
        }
      };
    },
    textTracks() {
      return tt;
    },
    addRemoteTextTrack() {
      addRemotes++;
      return {
        track: {}
      };
    }
  };

  c.jsonToTextTracks(cleanup(c.textTracksToJson(tech)), tech);

  assert.equal(addRemotes, 2, 'we added two text tracks');
});
