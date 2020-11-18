import asyncTimers from './mixins/async-timers.js';
import EventTarget from './event-target.js';

class AsyncEventTarget extends EventTarget {
  constructor(options = {}) {
    super();
    asyncTimers(this);

    if (options.disposeWith) {
      const disposeWith = Array.isArray(options.disposeWith) ? options.disposeWith : [options.disposeWith];
      const dispose = () => {
        disposeWith.forEach(function(target) {
          target.off('dispose', dispose);
        });
        this.dispose();
      };

      disposeWith.forEach(function(target) {
        target.one('dispose', dispose);
      });
    }
  }

  dispose() {
    if (this.isDisposed_) {
      return;
    }
    this.isDisposed_ = true;
    this.trigger('dispose');
  }
}

export default AsyncEventTarget;
