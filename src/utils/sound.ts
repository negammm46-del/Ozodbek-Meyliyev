class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  setEnabled(value: boolean) {
    this.enabled = value;
  }

  isEnabled() {
    return this.enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.08,
    delay = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playClick() {
    this.playTone(540, 0.07, 'sine', 0.045);
  }

  playFlip() {
    this.playTone(420, 0.08, 'triangle', 0.05);
    this.playTone(620, 0.09, 'triangle', 0.04, 0.04);
  }

  playSuccess() {
    this.playTone(523.25, 0.14, 'sine', 0.08, 0);
    this.playTone(659.25, 0.18, 'sine', 0.08, 0.09);
  }

  playError() {
    this.playTone(260, 0.16, 'triangle', 0.07, 0);
    this.playTone(210, 0.2, 'triangle', 0.06, 0.1);
  }

  playLevelUp() {
    this.playTone(523.25, 0.12, 'sine', 0.08, 0);
    this.playTone(659.25, 0.12, 'sine', 0.08, 0.09);
    this.playTone(783.99, 0.14, 'sine', 0.08, 0.18);
    this.playTone(1046.5, 0.28, 'sine', 0.09, 0.28);
  }
}

export const soundEngine = new SoundEngine();
