/* eslint-env qunit */
import VolumeTransfer, {
  LinearVolumeTransfer,
  LogarithmicVolumeTransfer
} from '../../../src/js/utils/volume-transfer.js';

import QUnit from 'qunit';

QUnit.module('VolumeTransfer');

// Base class tests
QUnit.test('VolumeTransfer base class throws errors', function(assert) {
  const transfer = new VolumeTransfer();

  assert.throws(
    () => transfer.toLinear(0.5),
    /Must be implemented by subclass/,
    'toLinear throws error on base class'
  );

  assert.throws(
    () => transfer.toLogarithmic(0.5),
    /Must be implemented by subclass/,
    'toLogarithmic throws error on base class'
  );

  assert.strictEqual(
    transfer.getName(),
    'base',
    'getName returns "base"'
  );
});

QUnit.test('LinearVolumeTransfer is identity function', function(assert) {
  const transfer = new LinearVolumeTransfer();

  [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0].forEach(value => {
    assert.strictEqual(
      transfer.toLinear(value),
      value,
      `toLinear(${value}) returns ${value}`
    );

    assert.strictEqual(
      transfer.toLogarithmic(value),
      value,
      `toLogarithmic(${value}) returns ${value}`
    );
  });

  assert.strictEqual(
    transfer.getName(),
    'linear',
    'getName returns "linear"'
  );
});

QUnit.test('LogarithmicVolumeTransfer constructor sets dbRange and offset', function(assert) {
  const transfer1 = new LogarithmicVolumeTransfer();

  assert.strictEqual(transfer1.dbRange, 50, 'default dbRange is 50');
  assert.ok(transfer1.offset > 0, 'offset is calculated and > 0');

  const transfer2 = new LogarithmicVolumeTransfer(60);

  assert.strictEqual(transfer2.dbRange, 60, 'custom dbRange is set');

  assert.strictEqual(
    transfer1.getName(),
    'logarithmic',
    'getName returns "logarithmic"'
  );
});

QUnit.test('LogarithmicVolumeTransfer passes through (0,0)', function(assert) {
  const transfer = new LogarithmicVolumeTransfer(50);

  assert.strictEqual(
    transfer.toLinear(0),
    0,
    'toLinear(0) returns exactly 0'
  );

  assert.strictEqual(
    transfer.toLogarithmic(0),
    0,
    'toLogarithmic(0) returns exactly 0'
  );
});

QUnit.test('LogarithmicVolumeTransfer passes through (1,1)', function(assert) {
  const transfer = new LogarithmicVolumeTransfer(50);

  assert.strictEqual(
    transfer.toLinear(1),
    1,
    'toLinear(1) returns exactly 1'
  );

  assert.strictEqual(
    transfer.toLogarithmic(1),
    1,
    'toLogarithmic(1) returns exactly 1'
  );
});

QUnit.test('LogarithmicVolumeTransfer is invertible', function(assert) {
  const transfer = new LogarithmicVolumeTransfer(50);

  [0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0].forEach(slider => {
    const linear = transfer.toLinear(slider);
    const back = transfer.toLogarithmic(linear);

    assert.close(
      back,
      slider,
      0.00001,
      `Round trip for ${slider}: ${slider} -> ${linear.toFixed(4)} -> ${back.toFixed(4)}`
    );
  });
});

QUnit.test('LogarithmicVolumeTransfer provides finer control at low volumes', function(assert) {
  const transfer = new LogarithmicVolumeTransfer(50);

  const linear50 = transfer.toLinear(0.5);

  assert.ok(
    linear50 < 0.1,
    `Slider at 50% gives linear < 10%: ${(linear50 * 100).toFixed(2)}%`
  );

  const linear25 = transfer.toLinear(0.25);

  assert.ok(
    linear25 < 0.01,
    `Slider at 25% gives linear < 1%: ${(linear25 * 100).toFixed(2)}%`
  );

  const delta1 = transfer.toLinear(0.1) - transfer.toLinear(0);
  const delta2 = transfer.toLinear(0.2) - transfer.toLinear(0.1);

  assert.ok(
    delta1 < 0.01 && delta2 < 0.01,
    'Small slider movements at low volumes give small linear changes'
  );
});

QUnit.test('LogarithmicVolumeTransfer with different dbRanges', function(assert) {
  const transfer40 = new LogarithmicVolumeTransfer(40);
  const transfer50 = new LogarithmicVolumeTransfer(50);
  const transfer60 = new LogarithmicVolumeTransfer(60);

  const linear40 = transfer40.toLinear(0.5);
  const linear50 = transfer50.toLinear(0.5);
  const linear60 = transfer60.toLinear(0.5);

  assert.ok(
    linear40 > linear50 && linear50 > linear60,
    `Higher dbRange gives more control at low volumes: ${linear40.toFixed(4)} > ${linear50.toFixed(4)} > ${linear60.toFixed(4)}`
  );
});

QUnit.test('LogarithmicVolumeTransfer handles edge cases', function(assert) {
  const transfer = new LogarithmicVolumeTransfer(50);

  assert.strictEqual(
    transfer.toLinear(-0.1),
    0,
    'Negative slider values return 0'
  );

  assert.strictEqual(
    transfer.toLinear(1.1),
    1,
    'Slider values > 1 return 1'
  );

  assert.strictEqual(
    transfer.toLogarithmic(-0.1),
    0,
    'Negative linear values return 0'
  );

  assert.strictEqual(
    transfer.toLogarithmic(1.1),
    1,
    'Linear values > 1 return 1'
  );
});
