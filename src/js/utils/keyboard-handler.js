import KeyCode from 'keycode';

export const eventMatchesKeys = (event, keys) => {
  if (Array.isArray(keys)) {
    for (const key of keys) {
      if (KeyCode.isEventKey(event, key)) {
        return true;
      }
    }
    return false;
  }
  return KeyCode.isEventKey(event, keys);
};
