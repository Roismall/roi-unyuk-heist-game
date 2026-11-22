// Meridian Heist — synthesized sound effects.
// Every sound is built with the Web Audio API: no audio files, no network.
export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }
  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
  }
  tone(freq, dur, type, vol, when) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + (when || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  pickup() {
    this.tone(880, 0.09, "sine", 0.14);
    this.tone(1318, 0.12, "sine", 0.12, 0.07);
  }
  coin() {
    this.tone(1568, 0.07, "triangle", 0.1);
  }
  gadget() {
    this.tone(520, 0.08, "square", 0.07);
    this.tone(780, 0.1, "square", 0.06, 0.06);
  }
  spotted() {
    this.tone(220, 0.16, "sawtooth", 0.14);
    this.tone(165, 0.2, "sawtooth", 0.12, 0.1);
  }
  alarm() {
    this.tone(660, 0.12, "square", 0.09);
    this.tone(440, 0.12, "square", 0.09, 0.14);
  }
  caught() {
    this.tone(196, 0.3, "sawtooth", 0.16);
    this.tone(98, 0.5, "sawtooth", 0.16, 0.22);
  }
  levelClear() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.16, "triangle", 0.13, i * 0.11));
  }
  win() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => this.tone(f, 0.22, "triangle", 0.13, i * 0.12));
  }
  click() {
    this.tone(700, 0.05, "sine", 0.08);
  }
}
