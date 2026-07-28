let audioCtx: AudioContext | null = null;

const playAudioClick = (type: 'light' | 'medium' | 'heavy' | 'error') => {
  try {
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    const now = audioCtx.currentTime;
    
    if (type === 'light') {
      // Light tap (e.g. key press, tab switch)
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.04);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'medium') {
      // Medium tap (e.g. calculation success)
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.06);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'heavy') {
      // Heavy tap (e.g. action deletion, saving to history)
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(10, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'error') {
      // Error double-tap or low buzz
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.12);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {
    // Ignore audio errors (e.g. autoplay restrictions)
  }
};

export const triggerHaptic = (pattern: number | number[] = 50) => {
  const hasVibrate = typeof window !== 'undefined' && window.navigator && typeof window.navigator.vibrate === 'function';
  
  if (hasVibrate) {
    try {
      window.navigator.vibrate(pattern);
    } catch (e) {
      // Ignore vibration errors
    }
  }
  
  // iOS Fallback using ultra-short audio tics (Web Audio API)
  if (typeof window !== 'undefined') {
    // Determine the tap intensity/type based on the pattern
    if (Array.isArray(pattern)) {
      if (pattern.length >= 3 && pattern[0] > 50) {
        // Error pattern like [60, 40, 60]
        playAudioClick('error');
      } else if (pattern.length === 2) {
        playAudioClick('medium');
        setTimeout(() => playAudioClick('medium'), pattern[0] + pattern[1]);
      } else {
        playAudioClick('light');
        setTimeout(() => playAudioClick('light'), pattern[0] + (pattern[1] || 40));
      }
    } else {
      if (pattern <= 20) {
        playAudioClick('light');
      } else if (pattern <= 60) {
        playAudioClick('medium');
      } else {
        playAudioClick('heavy');
      }
    }
  }
};
