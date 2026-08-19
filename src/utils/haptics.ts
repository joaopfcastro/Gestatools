// Haptic feedback utility with high-fidelity vibration patterns and Web Audio API fallback for iOS

export type HapticType =
  | 'success'
  | 'error'
  | 'warning'
  | 'light'
  | 'medium'
  | 'heavy'
  | 'selection';

export const HAPTIC_PATTERNS = {
  // Positive confirmation (calculation completed, saved, copied)
  SUCCESS: [30, 45, 30] as number[],
  // Error alert (validation failure, invalid dates, out-of-range clinical parameters)
  ERROR: [70, 50, 70, 50, 90] as number[],
  // Warning / cautionary state (destructive confirmation, limit warning)
  WARNING: [50, 40, 50] as number[],
  // Subtle UI selection (tab switch, mode toggle, chips)
  SELECTION: 15,
  // Light touch feedback
  LIGHT: 15,
  // Standard button press
  MEDIUM: 35,
  // Heavy action (delete, reset form, clear history)
  HEAVY: [70, 40, 70] as number[],
};

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  try {
    if (typeof window === 'undefined') return null;
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }

    return audioCtx;
  } catch (e) {
    return null;
  }
};

const playAudioTone = (
  type: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning' | 'selection'
) => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (type === 'success') {
      // Pleasant double micro-pulse (180Hz -> 280Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.frequency.setValueAtTime(180, now);
      osc1.frequency.exponentialRampToValueAtTime(280, now + 0.05);
      gain1.gain.setValueAtTime(0.05, now);
      gain1.gain.linearRampToValueAtTime(0, now + 0.05);
      osc1.start(now);
      osc1.stop(now + 0.05);

      // Second pulse
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.frequency.setValueAtTime(260, now + 0.06);
      osc2.frequency.exponentialRampToValueAtTime(360, now + 0.11);
      gain2.gain.setValueAtTime(0.06, now + 0.06);
      gain2.gain.linearRampToValueAtTime(0, now + 0.11);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.11);
    } else if (type === 'error') {
      // Low dual warning buzz (90Hz -> 50Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.frequency.setValueAtTime(90, now);
      osc1.frequency.linearRampToValueAtTime(45, now + 0.08);
      gain1.gain.setValueAtTime(0.07, now);
      gain1.gain.linearRampToValueAtTime(0, now + 0.08);
      osc1.start(now);
      osc1.stop(now + 0.08);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.frequency.setValueAtTime(75, now + 0.1);
      osc2.frequency.linearRampToValueAtTime(40, now + 0.2);
      gain2.gain.setValueAtTime(0.08, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0, now + 0.2);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.2);
    } else if (type === 'warning') {
      // Warning notch (110Hz -> 65Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(110, now);
      osc.frequency.linearRampToValueAtTime(60, now + 0.1);
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'light' || type === 'selection') {
      // Light tick (160Hz -> 10Hz, 30ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.03);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.03);
      osc.start(now);
      osc.stop(now + 0.03);
    } else if (type === 'medium') {
      // Medium tap (120Hz -> 10Hz, 50ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.05);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'heavy') {
      // Heavy thud (90Hz -> 10Hz, 80ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.08);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (e) {
    // Ignore audio errors gracefully
  }
};

/**
 * Triggers haptic feedback with native vibration API when supported,
 * with high-quality fallback for iOS WebKit devices.
 */
export const triggerHaptic = (
  patternOrType: number | number[] | HapticType = 'medium'
) => {
  let vibrationPattern: number | number[] = 30;
  let audioType: 'light' | 'medium' | 'heavy' | 'error' | 'success' | 'warning' | 'selection' =
    'medium';

  if (typeof patternOrType === 'string') {
    switch (patternOrType) {
      case 'success':
        vibrationPattern = HAPTIC_PATTERNS.SUCCESS;
        audioType = 'success';
        break;
      case 'error':
        vibrationPattern = HAPTIC_PATTERNS.ERROR;
        audioType = 'error';
        break;
      case 'warning':
        vibrationPattern = HAPTIC_PATTERNS.WARNING;
        audioType = 'warning';
        break;
      case 'selection':
        vibrationPattern = HAPTIC_PATTERNS.SELECTION;
        audioType = 'selection';
        break;
      case 'light':
        vibrationPattern = HAPTIC_PATTERNS.LIGHT;
        audioType = 'light';
        break;
      case 'heavy':
        vibrationPattern = HAPTIC_PATTERNS.HEAVY;
        audioType = 'heavy';
        break;
      case 'medium':
      default:
        vibrationPattern = HAPTIC_PATTERNS.MEDIUM;
        audioType = 'medium';
        break;
    }
  } else if (Array.isArray(patternOrType)) {
    vibrationPattern = patternOrType;
    if (patternOrType.length >= 4 || (patternOrType.length >= 3 && patternOrType[0] >= 60)) {
      audioType = 'error';
    } else if (patternOrType.length >= 2 && patternOrType[0] <= 35) {
      audioType = 'success';
    } else {
      audioType = 'medium';
    }
  } else {
    vibrationPattern = patternOrType;
    if (patternOrType <= 20) {
      audioType = 'light';
    } else if (patternOrType <= 50) {
      audioType = 'medium';
    } else {
      audioType = 'heavy';
    }
  }

  const hasVibrate =
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    typeof window.navigator.vibrate === 'function';

  if (hasVibrate) {
    try {
      window.navigator.vibrate(vibrationPattern);
    } catch (e) {
      // Ignore vibration errors
    }
  }

  // iOS Web Audio fallback
  if (typeof window !== 'undefined') {
    playAudioTone(audioType);
  }
};

/** Shortcut for positive / success feedback */
export const hapticSuccess = () => triggerHaptic('success');

/** Shortcut for validation / error feedback */
export const hapticError = () => triggerHaptic('error');

/** Shortcut for warning / cautionary feedback */
export const hapticWarning = () => triggerHaptic('warning');

/** Shortcut for light button tap */
export const hapticLight = () => triggerHaptic('light');

/** Shortcut for selection / tab switch */
export const hapticSelection = () => triggerHaptic('selection');

/** Shortcut for standard medium click */
export const hapticMedium = () => triggerHaptic('medium');

/** Shortcut for heavy action / deletion */
export const hapticHeavy = () => triggerHaptic('heavy');
