/* eslint-env qunit */
import QualityLevel from '../../../src/js/quality-levels/quality-level';

QUnit.module('QualityLevel', {
  beforeEach() {
    let levelEnabled = true;

    this.representation = {
      bandwidth: 100,
      frameRate: 30,
      height: 100,
      id: '0',
      width: 100,
      enabled(value) {
        if (value === undefined) {
          return levelEnabled;
        }
        levelEnabled = value;
      }
    };
  }
});

QUnit.test('Properly initialize a quality level from a representation object', function(assert) {
  const qualityLevel = new QualityLevel(this.representation);

  assert.strictEqual(qualityLevel.bitrate, this.representation.bandwidth, 'bitrate has correct value');
  assert.strictEqual(qualityLevel.frameRate, this.representation.frameRate, 'frameRate has correct value');
  assert.strictEqual(qualityLevel.height, this.representation.height, 'height has correct value');
  assert.strictEqual(qualityLevel.id, this.representation.id, 'id has correct value');
  assert.strictEqual(qualityLevel.label, this.representation.id, 'label has correct value');
  assert.strictEqual(qualityLevel.width, this.representation.width, 'label has correct value');
  assert.strictEqual(qualityLevel.enabled, true, 'enabled has correct value');
});

QUnit.test('Properly enable/disable a quality level', function(assert) {
  const qualityLevel = new QualityLevel(this.representation);

  assert.equal(qualityLevel.enabled, true, 'quality level is enabled');

  qualityLevel.enabled = false;

  assert.equal(qualityLevel.enabled, false, 'quality level is disabled');

  qualityLevel.enabled = true;

  assert.equal(qualityLevel.enabled, true, 'quality level is enabled again');
});
