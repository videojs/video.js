/**
 * Base class for volume transfer functions.
 *
 * Volume transfer functions convert between slider position (UI space) and
 * player volume (audio space). This allows different scaling behaviors like
 * linear or logarithmic (decibel-based) volume control.
 */
class VolumeTransfer {
  /**
   * Convert slider position to player volume.
   *
   * @param {number} sliderPosition - Slider position from 0-1
   * @return {number} Player volume from 0-1
   */
  sliderToVolume(sliderPosition) {
    throw new Error('Must be implemented by subclass');
  }

  /**
   * Convert player volume to slider position.
   *
   * @param {number} volume - Player volume from 0-1
   * @return {number} Slider position from 0-1
   */
  volumeToSlider(volume) {
    throw new Error('Must be implemented by subclass');
  }
}

/**
 * Linear volume transfer - direct 1:1 mapping between slider and volume.
 *
 * This is the default behavior where moving the slider linearly adjusts
 * the volume linearly. Simple but may not match human perception of loudness.
 */
class LinearVolumeTransfer extends VolumeTransfer {
  /**
   * Convert slider position to player volume (1:1 mapping).
   *
   * @param {number} sliderPosition - Slider position from 0-1
   * @return {number} Player volume from 0-1
   */
  sliderToVolume(sliderPosition) {
    return sliderPosition;
  }

  /**
   * Convert player volume to slider position (1:1 mapping).
   *
   * @param {number} volume - Player volume from 0-1
   * @return {number} Slider position from 0-1
   */
  volumeToSlider(volume) {
    return volume;
  }
}

/**
 * Logarithmic volume transfer using decibel scaling.
 *
 * Provides exponential volume changes as the slider moves linearly, which
 * better matches human perception of loudness. Uses decibel (dB) scaling
 * where volume = 10^(dB/20).
 */
class LogarithmicVolumeTransfer extends VolumeTransfer {
  /**
   * Creates a logarithmic volume transfer function.
   *
   * @param {number} [dbRange=50] - The decibel range for the transfer function.
   *        Larger values create a more dramatic curve. Typical range: 40-60 dB.
   */
  constructor(dbRange = 50) {
    super();
    this.dbRange = dbRange;
    this.offset = Math.pow(10, -dbRange / 20);
  }

  /**
   * Convert slider position to player volume using logarithmic scaling.
   *
   * Applies exponential scaling so that linear slider movement produces
   * logarithmic volume changes, matching human loudness perception.
   *
   * @param {number} sliderPosition - Slider position from 0-1
   * @return {number} Player volume from 0-1
   */
  sliderToVolume(sliderPosition) {
    if (sliderPosition <= 0) {
      return 0;
    }

    if (sliderPosition >= 1) {
      return 1;
    }

    const dB = sliderPosition * this.dbRange - this.dbRange;

    return Math.pow(10, dB / 20) * (1 + this.offset);
  }

  /**
   * Convert player volume to slider position using logarithmic scaling.
   *
   * Inverse of sliderToVolume - converts linear volume back to the
   * corresponding logarithmic slider position.
   *
   * @param {number} volume - Player volume from 0-1
   * @return {number} Slider position from 0-1
   */
  volumeToSlider(volume) {
    if (volume <= 0) {
      return 0;
    }

    if (volume >= 1) {
      return 1;
    }

    const dB = 20 * Math.log10(volume);
    const position = (dB + this.dbRange) / this.dbRange;

    return position;
  }
}

export default VolumeTransfer;
export { LinearVolumeTransfer, LogarithmicVolumeTransfer };
