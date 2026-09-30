import type { DeriveCustomStatus, StatusIndicatorState } from '../status-indicator/core';
import type { BuiltInIndicatorStatus, StatusDetails } from '../status-indicator/status';

const builtIn = { status: 'play', label: 'Playing', value: null } satisfies StatusDetails;

void builtIn;

// @ts-expect-error - Built-in details only accept built-in statuses, so typos in `deriveStatus` fail.
const builtInTypo = { status: 'plya', label: 'Playing', value: null } satisfies StatusDetails;

void builtInTypo;

const deriveCustomStatus: DeriveCustomStatus = () => ({ status: 'rate-up', label: '1.5x', value: null });

void deriveCustomStatus;

// Indicator state carries custom statuses, so it is wider than the built-in union.
const customState: StatusIndicatorState['status'] = 'rate-up';

void customState;

function builtInIcon(status: BuiltInIndicatorStatus): string {
  switch (status) {
    case 'pause':
    case 'play':
    case 'volume-off':
    case 'volume-low':
    case 'volume-high':
    case 'captions-on':
    case 'captions-off':
    case 'fullscreen':
    case 'exit-fullscreen':
    case 'pip':
    case 'exit-pip':
      return status;
  }
}

void builtInIcon;
