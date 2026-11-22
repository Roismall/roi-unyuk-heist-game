// audio.js — every sound is synthesised live with WebAudio. No audio files,
// no network: a tiny synth for footsteps, pickups, coins, camera beeps,
// the alarm siren and the win fanfare.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.alarmNodes = null;
    this.stepTimer = 0;
  }

  // Browsers only allow audio after a user gesture; call from the first input.
  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.4;
    this.master.connect(this.ctx.destination);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.4;
    if (muted) this.stopAlarm();
  }

  tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  noise(dur, vol, when = 0, lowpass = 1200) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
  }

  footstep(sneaking) {
    this.noise(0.07, sneaking ? 0.05 : 0.11, 0, sneaking ? 500 : 900);
  }

  pickup() {
    this.tone(880, 0.1, 'sine', 0.22);
    this.tone(1318, 0.16, 'sine', 0.2, 0.07);
  }

  coinThrow() {
    this.noise(0.08, 0.12, 0, 3000);
  }

  coinLand() {
    this.tone(1567, 0.09, 'triangle', 0.18);
    this.tone(2093, 0.12, 'triangle', 0.14, 0.06);
  }

  hack() {
    this.tone(220, 0.35, 'square', 0.1, 0, 880);
    this.tone(440, 0.2, 'sine', 0.14, 0.3);
  }

  cameraBeep() {
    this.tone(1180, 0.08, 'square', 0.09);
  }

  spotted() {
    this.tone(330, 0.22, 'sawtooth', 0.16, 0, 660);
  }

  crackTick() {
    this.tone(520, 0.05, 'square', 0.08);
  }

  safeOpen() {
    this.tone(392, 0.12, 'sine', 0.2);
    this.tone(523, 0.12, 'sine', 0.2, 0.1);
    this.tone(659, 0.2, 'sine', 0.2, 0.2);
  }

  caught() {
    this.tone(220, 0.5, 'sawtooth', 0.22, 0, 55);
    this.noise(0.4, 0.2, 0, 700);
  }

  levelClear() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, i) => this.tone(n, 0.22, 'triangle', 0.2, i * 0.11));
  }

  winFanfare() {
    const notes = [523, 659, 784, 1046, 784, 1046, 1318];
    notes.forEach((n, i) => this.tone(n, 0.3, 'triangle', 0.2, i * 0.13));
  }

  startAlarm() {
    if (!this.ctx || this.muted || this.alarmNodes) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 620;
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 1.6;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 260;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    lfo.start();
    this.alarmNodes = { osc, lfo, gain };
  }

  stopAlarm() {
    if (!this.alarmNodes) return;
    try {
      this.alarmNodes.osc.stop();
      this.alarmNodes.lfo.stop();
    } catch (e) { /* already stopped */ }
    this.alarmNodes = null;
  }
}
