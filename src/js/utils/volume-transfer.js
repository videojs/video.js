/**
 * Base class for volume transfer functions
 */
class VolumeTransfer {
  /**
   * Convert logarithmic (slider) to linear (tech)
   *
   * @param {number} logarithmic - Volume from 0-1
   * @return {number} Linear volume from 0-1
   */
  toLinear(logarithmic) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Convert linear (tech) to logarithmic (slider)
   *
   * @param {number} linear - Volume from 0-1
   * @return {number} Logarithmic volume from 0-1
   */
  toLogarithmic(linear) {
    throw new Error('Must be implemented by subclass');
  }

  getName() {
    return 'base';
  }
}

/**
 * Linear transfer - no conversion (current default behavior)
 */
class LinearVolumeTransfer extends VolumeTransfer {
  toLinear(value) {
    return value;
  }

  toLogarithmic(value) {
    return value;
  }

  getName() {
    return 'linear';
  }
}

/**
 * Logarithmic transfer using decibel scaling
 */
class LogarithmicVolumeTransfer extends VolumeTransfer {
  constructor(dbRange = 50) {
    super();
    this.dbRange = dbRange;
    this.offset = Math.pow(10, -dbRange / 20);
  }

  /**
   * Convert logarithmic slider position to linear volume for tech
   *
   * @param {number} sliderPosition - Slider position (0-1)
   * @return {number} Linear volume (0-1)
   */
  toLinear(sliderPosition) {
    if (sliderPosition <= 0) {
      return 0;
    }

    if (sliderPosition >= 1) {
      return 1;
    }

    const dB = sliderPosition * this.dbRange - this.dbRange;
    const linear = Math.pow(10, dB / 20);

    return linear;
  }

  /**
   * Convert linear volume from tech to logarithmic slider position
   *
   * @param {number} linear - Linear volume (0-1)
   * @return {number} Slider position (0-1)
   */
  toLogarithmic(linear) {
    if (linear <= 0) {
      return 0;
    }

    if (linear >= 1) {
      return 1;
    }

    const dB = 20 * Math.log10(linear);
    const position = (dB + this.dbRange) / this.dbRange;

    return position;
  }

  getName() {
    return 'logarithmic';
  }
}

export default VolumeTransfer;
export { LinearVolumeTransfer, LogarithmicVolumeTransfer };
