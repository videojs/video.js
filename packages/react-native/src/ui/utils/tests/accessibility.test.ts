import { describe, expect, it } from 'vite-plus/test';

import { toNativeA11yProps } from '../accessibility';

describe('toNativeA11yProps', () => {
  it('resolves text descriptors with their placeholders', () => {
    const props = toNativeA11yProps(
      { 'aria-label': { key: 'seek.forward', text: 'Seek forward {seconds} seconds' } },
      { label: { seconds: 10 } }
    );

    expect(props).toEqual({ 'aria-label': 'Seek forward 10 seconds' });
  });

  it('converts the DOM string boolean and drops absent attributes', () => {
    expect(toNativeA11yProps({ 'aria-label': 'Play', 'aria-disabled': 'true' })).toEqual({
      'aria-label': 'Play',
      'aria-disabled': true,
    });
    expect(toNativeA11yProps({ 'aria-label': 'Play', 'aria-disabled': undefined })).toEqual({ 'aria-label': 'Play' });
  });

  it('keeps slider role and values, including a zero value', () => {
    const props = toNativeA11yProps(
      {
        role: 'slider',
        'aria-label': 'Seek',
        'aria-valuemin': 0,
        'aria-valuemax': 60,
        'aria-valuenow': 0,
        'aria-valuetext': { key: 'time.position', text: '{current} of {duration}' },
      },
      { valueText: { current: '0 seconds', duration: '1 minute' } }
    );

    expect(props).toEqual({
      role: 'slider',
      'aria-label': 'Seek',
      'aria-valuemin': 0,
      'aria-valuemax': 60,
      'aria-valuenow': 0,
      'aria-valuetext': '0 seconds of 1 minute',
    });
  });

  it('ignores attributes without a native equivalent', () => {
    const attrs = { 'aria-label': 'Seek', tabIndex: 0, autoComplete: 'off' };

    expect(toNativeA11yProps(attrs)).toEqual({ 'aria-label': 'Seek' });
  });
});
