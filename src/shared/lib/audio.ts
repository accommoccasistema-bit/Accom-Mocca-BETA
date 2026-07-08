
/**
 * Utility to generate beeps using Web Audio API
 */

let audioCtx: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const playBeep = (durationMs: number, frequency: number = 440, type: OscillatorType = 'sine', volume: number = 0.1) => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    
    // Smooth start and end to avoid clicks
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start();
    oscillator.stop(ctx.currentTime + durationMs / 1000);
  } catch (error) {
    console.error("Error playing beep:", error);
  }
};

/**
 * Alert beep (5 seconds)
 */
export const playAlertBeep = () => {
  const duration = 5000;
  // Pulsing alert sound
  const interval = setInterval(() => {
    playBeep(400, 660, 'triangle', 0.1);
  }, 600);
  
  setTimeout(() => {
    clearInterval(interval);
  }, duration);
};
