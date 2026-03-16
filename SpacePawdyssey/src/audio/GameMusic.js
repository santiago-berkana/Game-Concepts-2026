'use strict';

// ═══════════════════════════════════════════════════════════
//  MUSIC ENGINE
// ═══════════════════════════════════════════════════════════
const MEL = [
  523.25, null, 659.25, null, 783.99, null, 659.25, null,
  587.33, null, 523.25, null, 440.00, null, null,   null,
  392.00, null, 440.00, null, 523.25, null, 659.25, null,
  783.99, null, null,   null, 659.25, null, 523.25, null,
  440.00, null, 392.00, null, 329.63, null, 392.00, null,
  440.00, null, 523.25, null, 392.00, null, null,   null,
];

const BAS = [
  130.81, null, 130.81, null,
  220.00, null, 220.00, null,
  196.00, null, 196.00, null,
  130.81, null, 130.81, null,
  220.00, null, 220.00, null,
  196.00, null, 130.81, null,
];

class GameMusic {
  constructor() {
    this.ctx    = null;
    this.master = null;
    this.muted  = false;
    this.live   = false;
    this.mSlot  = 0; this.bSlot = 0; this.kSlot = 0;
    this.mNext  = 0; this.bNext = 0; this.kNext = 0;
  }

  start() {
    if (this.live) { this.ctx?.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.45;
      this.master.connect(this.ctx.destination);
      this.live = true;
      const t = this.ctx.currentTime + 0.05;
      this.mNext = t; this.bNext = t; this.kNext = t;
      this._loop();
    } catch (e) { console.warn('Web Audio unavailable', e); }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setValueAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime);
    }
    return this.muted;
  }

  _loop() {
    if (!this.live) return;
    const now = this.ctx.currentTime, ahead = 0.15;
    const S8 = 60 / BPM / 2, S4 = 60 / BPM;
    while (this.mNext < now + ahead) {
      const f = MEL[this.mSlot];
      if (f) this._osc(f, this.mNext, S8 * 0.78, 'square', 0.08);
      this.mNext += S8;
      this.mSlot = (this.mSlot + 1) % MEL.length;
    }
    while (this.bNext < now + ahead) {
      const f = BAS[this.bSlot];
      if (f) this._osc(f, this.bNext, S4 * 0.65, 'triangle', 0.11);
      this.bNext += S4;
      this.bSlot = (this.bSlot + 1) % BAS.length;
    }
    while (this.kNext < now + ahead) {
      if (this.kSlot % 2 === 0) this._kick(this.kNext);
      this.kNext += S4;
      this.kSlot = (this.kSlot + 1) % 24;
    }
    setTimeout(() => this._loop(), 25);
  }

  _osc(freq, t, dur, type, vol) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.connect(g); g.connect(this.master);
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.01);
  }

  _kick(t) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.connect(g); g.connect(this.master); o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(28, t + 0.20);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.start(t); o.stop(t + 0.23);
  }
}

// Singleton — available globally to all scenes
const music = new GameMusic();
