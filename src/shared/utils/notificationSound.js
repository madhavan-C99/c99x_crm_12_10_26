/**
 * Notification sound (Web Audio API - mp3 file thevai illa)
 */

// const MUTE_KEY = "notification_sound_muted";
const THROTTLE_MS = 1500;

let audioCtx = null;
let lastPlayedAt = 0;

let soundEnabled = true;

export const setSoundEnabled = (enabled) => {
  soundEnabled = !!enabled;
};

export const isSoundEnabled = () => soundEnabled;

// export const isSoundMuted = () => {
//   try {
//     return localStorage.getItem(MUTE_KEY) === "1";
//   } catch {
//     return false;
//   }
// };

// export const setSoundMuted = (muted) => {
//   try {
//     localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
//   } catch {
//     // ignore
//   }
// };

const getCtx = () => {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
};

// First click / key press la sound unlock pannum
export const initNotificationSound = () => {
  const unlock = () => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };

  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);

  return () => {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
};

const beep = (ctx, freq, startAt, duration, volume = 0.25) => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startAt);
  osc.stop(startAt + duration + 0.05);
};

const TONES = {
  // 2 note chime: pudhu notification
  notification: [
    { freq: 1080, at: 0, dur: 1.38 },
    { freq: 5175, at: 0.18, dur: 0.28 },
  ],
  // 3 short beep: reminder
  reminder: [
    { freq: 1000, at: 0, dur: 0.12 },
    { freq: 1000, at: 0.2, dur: 0.12 },
    { freq: 1000, at: 0.4, dur: 0.12 },
  ],
};

export const playNotificationSound = (
  type = "notification",
  { force = false } = {},
) => {
  if (!isSoundEnabled() && !force) return;

  const nowMs = Date.now();
  if (!force && nowMs - lastPlayedAt < THROTTLE_MS) return;

  const ctx = getCtx();
  if (!ctx) return;

  const run = () => {
    lastPlayedAt = Date.now();
    const t0 = ctx.currentTime + 0.02;
    (TONES[type] || TONES.notification).forEach((t) =>
      beep(ctx, t.freq, t0 + t.at, t.dur),
    );
  };

  if (ctx.state === "running") {
    run();
  } else {
    ctx
      .resume()
      .then(() => {
        if (Date.now() - nowMs < 2000) run();
      })
      .catch(() => {});
  }
};

/**
 * Pudhu items vandhaa mattum sound.
 * - fromList : backend list (page open / 10 sec poll). Mudhal list la sound illa.
 * - fromPush : live socket push. Already paartha id na sound illa.
 */
export const createNewItemSoundGate = (type = "notification") => {
  const known = new Set();
  let initialized = false;

  return {
    fromList(items) {
      const fresh = items.filter((n) => !known.has(n.id));
      items.forEach((n) => known.add(n.id));

      if (initialized && fresh.length > 0) playNotificationSound(type);
      initialized = true;
    },

    fromPush(item) {
      if (known.has(item.id)) return;
      known.add(item.id);
      playNotificationSound(type);
    },
  };
};
