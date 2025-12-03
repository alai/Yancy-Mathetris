
export class AudioController {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getCtx() {
    if (!this.ctx) {
      // Create context on first use (singleton pattern behavior)
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContext();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  // Call this on a user interaction (click) to unlock audio in browsers
  public async ensureContext() {
     const ctx = this.getCtx();
     if (ctx.state === 'suspended') {
       await ctx.resume();
     }
  }

  public playCorrect() {
    if (this.isMuted) return;
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      
      // Nice high chime (Major 3rd interval: C5 -> E5)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, t); // C5
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, t); // E5
      
      // Envelope
      gain.gain.setValueAtTime(0.0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.05); // Attack
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5); // Decay
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start(t);
      osc1.stop(t + 0.5);
      osc2.start(t);
      osc2.stop(t + 0.5);
    } catch (e) {
      console.error("Audio error", e);
    }
  }

  public playIncorrect() {
    if (this.isMuted) return;
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      
      // Low buzz / Error thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.3); // Slide down
      
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    } catch (e) {
      console.error("Audio error", e);
    }
  }

  public playSpawn() {
    if (this.isMuted) return;
    try {
      const ctx = this.getCtx();
      const t = ctx.currentTime;
      
      // Soft pop / swoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      
      gain.gain.setValueAtTime(0.02, t); // Lower volume
      gain.gain.linearRampToValueAtTime(0.001, t + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch (e) {
      console.error("Audio error", e);
    }
  }
}

export const audioManager = new AudioController();
