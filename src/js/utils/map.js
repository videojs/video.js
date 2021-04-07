import window from 'global/window';

class MapSham {
  constructor() {
    this.map_ = {};
  }
  has(key) {
    return key in this.map_;
  }
  delete(key) {
    const has = this.has(key);

    delete this.map_[key];

    return has;
  }
  set(key, value) {
    this.map_[key] = value;
    return this;
  }
  forEach(callback, thisArg) {
    for (const key in this.map_) {
      callback.call(thisArg, this.map_[key], key, this);
    }
  }
}

export default window.Map ? window.Map : MapSham;
