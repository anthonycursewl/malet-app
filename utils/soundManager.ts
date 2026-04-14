// Re-export the SoundManager implementation located under `app/utils`
// This lets imports like `@/utils/soundManager` (which resolve to ./utils/...)
// work without changing path aliases or moving files.
import SoundManagerDefault, { playSound, preloadSounds, unloadAllSounds } from "@/app/utils/soundManager"

export default SoundManagerDefault
export { playSound, preloadSounds, unloadAllSounds }

