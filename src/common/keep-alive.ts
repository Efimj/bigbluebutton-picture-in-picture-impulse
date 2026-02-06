/**
 * Prevents the browser from aggressively throttling the background tab
 * when the PiP window is open. Uses two mechanisms:
 *
 * 1. Web Locks API — prevents the tab from being frozen entirely
 *    (Page Lifecycle API "frozen" state).
 * 2. Silent AudioContext oscillator — browsers avoid throttling tabs that
 *    produce audio output, keeping timers and rendering closer to real-time.
 */

let lockResolver: (() => void) | null = null;
let oscillator: OscillatorNode | null = null;
let audioCtx: AudioContext | null = null;

export function acquireKeepAlive(): void {
  // Web Lock — prevents tab freezing
  if (navigator.locks) {
    const lockPromise = new Promise<void>((resolve) => {
      lockResolver = resolve;
    });
    navigator.locks.request('pip-keep-alive', () => lockPromise).catch(() => {});
  }

  // Silent oscillator — prevents aggressive background throttling
  try {
    audioCtx = audioCtx || new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const gain = audioCtx.createGain();
    gain.gain.value = 0;
    oscillator = audioCtx.createOscillator();
    oscillator.frequency.value = 0;
    oscillator.connect(gain).connect(audioCtx.destination);
    oscillator.start();
  } catch {
    // AudioContext may be unavailable in some environments
  }
}

export function releaseKeepAlive(): void {
  if (lockResolver) {
    lockResolver();
    lockResolver = null;
  }

  if (oscillator) {
    try {
      oscillator.stop();
      oscillator.disconnect();
    } catch { /* already stopped */ }
    oscillator = null;
  }

  if (audioCtx) {
    audioCtx.suspend().catch(() => {});
  }
}

/**
 * Force-resumes any paused <video> elements in the main document.
 * Called when the user returns to the meeting tab after PiP was active.
 */
export function resumeMainTabVideos(): void {
  // Use rAF to let the browser fully activate the tab first
  requestAnimationFrame(() => {
    document.querySelectorAll('video').forEach((video) => {
      if (video.paused && video.srcObject) {
        video.play().catch(() => {});
      }
    });
  });
}
