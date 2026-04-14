/* Lightweight SoundManager using expo-av Audio.Sound.
   Uses lazy imports so the app doesn't crash if expo-av isn't installed during development.
   API: preload(map), play(name), unloadAll()
*/
type SoundMap = { [key: string]: any };

const sounds: SoundMap = {};
let Audio: any = null;

export async function preloadSounds(map: { [key: string]: number | string }) {
  try {
    if (!Audio) Audio = require('expo-av').Audio;
  } catch (e) {
    // expo-av not installed — skip
    return;
  }

  const entries = Object.entries(map);
  await Promise.all(entries.map(async ([name, asset]) => {
    try {
      if (!asset) return;
      const s = new Audio.Sound();
      // asset can be a require(...) or uri string
      await s.loadAsync(typeof asset === 'number' ? asset : { uri: String(asset) });
      sounds[name] = s;
    } catch (err) {
      console.warn('Sound preload failed', name, err);
    }
  }));
}

export async function playSound(name: string) {
  try {
    if (!Audio) Audio = require('expo-av').Audio;
  } catch (e) {
    return;
  }

  const s = sounds[name];
  if (!s) return;
  try {
    await s.replayAsync();
  } catch (err) {
    try {
      await s.setPositionAsync(0);
      await s.playAsync();
    } catch (e) {
      // ignore
    }
  }
}

export async function unloadAllSounds() {
  const keys = Object.keys(sounds);
  await Promise.all(keys.map(async (k) => {
    try {
      await sounds[k].unloadAsync();
    } catch (e) {
      // ignore
    }
    delete sounds[k];
  }));
}

export default {
  preloadSounds,
  playSound,
  unloadAllSounds,
};
