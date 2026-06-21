/* eslint-env qunit */
import VolumeTransfer, {
  LinearVolumeTransfer,
  LogarithmicVolumeTransfer
} from '../../../src/js/utils/volume-transfer.js';

import QUnit from 'qunit';

QUnit.module('VolumeTransfer');

QUnit.test('VolumeTransfer base class throws errors', function(assert) {
  const transfer = new VolumeTransfer();

  assert.throws(
    () => transfer.sliderToVolume(0.5),
    /Must be implemented by subclass/,
    'sliderToVolume throws error on base class'
  );

  assert.throws(
    () => transfer.volumeToSlider(0.5),
    /Must be implemented by subclass/,
    'volumeToSlider throws error on base class'
  );
});

QUnit.test('LinearVolumeTransfer is identity function', function(assert) {
  const transfer = new LinearVolumeTransfer();

  [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0].forEach(value => {
    assert.strictEqual(
      transfer.sliderToVolume(value),
      value,
      `sliderToVolume(${value}) returns ${value}`
    );

    assert.strictEqual(
      transfer.volumeToSlider(value),
      value,
      `volumeToSlider(${value}) returns ${value}`
    );
  });
});

QUnit.test('LogarithmicVolumeTransfer constructor sets dbRange and offset', function(assert) {
  const transfer1 = new LogarithmicVolumeTransfer();

  assert.strictEqual(transfer1.dbRange, 50, 'default dbRange is 50');
  assert.ok(transfer1.offset > 0, 'offset is calculated and > 0');

  const transfer2 = new LogarithmicVolumeTransfer(60);

  assert.strictEqual(transfer2.dbRange, 60, 'custom dbRange is set');
});

QUnit.test('LogarithmicVolumeTransfer passes through (0,0)', function(assert) {
  const transfer = new LogarithmicVolumeTransfer(50);

  assert.strictEqual(
    transfer.sliderToVolume(0),
    0,
    'sliderToVolume(0) returns exactly 0'
  );

  assert.strictEqual(
    transfer.volumeToSlider(0),
    0,
    'volumeToSlider(0) returns exactly 0'
  );
});

QUnit.test('LogarithmicVolumeTransfer passes through (1,1)', function(assert) {
  const transfer = new LogarithmicVolumeTransfer(50);

  assert.strictEqual(
    transfer.sliderToVolume(1),
    1,
    'sliderToVolume(1) returns exactly 1'
  );

  assert.strictEqual(
    transfer.volumeToSlider(1),
    1,
    'volumeToSlider(1) returns exactly 1'
  );
});

QUnit.test('LogarithmicVolumeTransfer is invertible', function(assert) {
  const transfer = new LogarithmicVolumeTransfer(50);
  const tolerance = 0.001;

  [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0].forEach(slider => {
    const linear = transfer.sliderToVolume(slider);
    const back = transfer.volumeToSlider(linear);
    const diff = Math.abs(back - slider);

    assert.true(
      diff < tolerance,
      `Round trip for ${slider}: ${slider} -> ${linear.toFixed(4)} -> ${back.toFixed(4)} (diff: ${diff.toExponential(2)})`
    );
  });
});

QUnit.test('LogarithmicVolumeTransfer with different dbRanges', function(assert) {
  const transfer40 = new LogarithmicVolumeTransfer(40);
  const transfer50 = new LogarithmicVolumeTransfer(50);
  const transfer60 = new LogarithmicVolumeTransfer(60);

  const linear40 = transfer40.sliderToVolume(0.5);
  const linear50 = transfer50.sliderToVolume(0.5);
  const linear60 = transfer60.sliderToVolume(0.5);

  assert.ok(
    linear40 > linear50 && linear50 > linear60,
    `Higher dbRange gives more control at low volumes: ${linear40.toFixed(4)} > ${linear50.toFixed(4)} > ${linear60.toFixed(4)}`
  );
});

QUnit.test('LogarithmicVolumeTransfer handles edge cases', function(assert) {
  const transfer = new LogarithmicVolumeTransfer(50);

  assert.strictEqual(
    transfer.sliderToVolume(-0.1),
    0,
    'Negative slider values return 0'
  );

  assert.strictEqual(
    transfer.sliderToVolume(1.1),
    1,
    'Slider values > 1 return 1'
  );

  assert.strictEqual(
    transfer.volumeToSlider(-0.1),
    0,
    'Negative linear values return 0'
  );

  assert.strictEqual(
    transfer.volumeToSlider(1.1),
    1,
    'Linear values > 1 return 1'
  );
});
