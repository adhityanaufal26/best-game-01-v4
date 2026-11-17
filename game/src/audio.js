// DEEPHOOK audio: all sounds synthesized with WebAudio, no audio files.
// A breezy pentatonic music loop plus plucks, splashes and fanfares.
'use strict';

const AudioSys = {
  ctx: null, master: null, musicGain: null, muted: false, musicTimer: null, step: 0,

  ensure() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.35;
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.5;
        this.musicGain.connect(this.master);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { /* audio is optional; the game plays silent */ }
  },

  tone(freq, dur, type, vol, when, slideTo) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + (when || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.master);
      o.start(t0); o.stop(t0 + dur + 0.05);
    } catch (e) { /* ignore */ }
  },

  pluck()   { this.tone(660, 0.12, 'triangle', 0.25, 0, 990); },
  splash()  { this.tone(300, 0.25, 'sine', 0.18, 0, 90); this.tone(520, 0.15, 'sine', 0.1, 0.02, 180); },
  coin()    { this.tone(880, 0.09, 'square', 0.12); this.tone(1318, 0.14, 'square', 0.1, 0.07); },
  pop()     { this.tone(420, 0.1, 'sawtooth', 0.14, 0, 140); },
  hurt()    { this.tone(180, 0.3, 'sawtooth', 0.2, 0, 70); },
  net()     { this.tone(500, 0.2, 'triangle', 0.2, 0, 900); this.tone(750, 0.18, 'triangle', 0.16, 0.08, 1200); },
  harpoon() { this.tone(220, 0.35, 'sawtooth', 0.22, 0, 1100); },
  boss()    { this.tone(65, 1.2, 'sawtooth', 0.3, 0, 40); this.tone(98, 1.2, 'sawtooth', 0.2, 0.1, 55); },
  fanfare() {
    const seq = [523, 659, 784, 1046, 784, 1046];
    seq.forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.22, i * 0.11));
  },
  lose() {
    const seq = [392, 330, 262, 196];
    seq.forEach((f, i) => this.tone(f, 0.3, 'sine', 0.2, i * 0.16));
  },

  startMusic() {
    this.ensure();
    if (!this.ctx || this.musicTimer) return;
    // C major pentatonic lilt, one bar per tick, bass underneath.
    const melody = [523, 587, 659, 784, 659, 587, 523, 440, 523, 659, 784, 880, 784, 659, 587, 523];
    const bass = [131, 131, 175, 196, 131, 175, 196, 262];
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return;
      const i = this.step % melody.length;
      const b = this.step % bass.length;
      try {
        const t0 = this.ctx.currentTime;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = melody[i];
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
        o.connect(g); g.connect(this.musicGain); o.start(t0); o.stop(t0 + 0.55);
        if (this.step % 2 === 0) {
          const o2 = this.ctx.createOscillator(), g2 = this.ctx.createGain();
          o2.type = 'triangle'; o2.frequency.value = bass[b];
          g2.gain.setValueAtTime(0.0001, t0);
          g2.gain.exponentialRampToValueAtTime(0.12, t0 + 0.03);
          g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
          o2.connect(g2); g2.connect(this.musicGain); o2.start(t0); o2.stop(t0 + 0.75);
        }
      } catch (e) { /* ignore */ }
      this.step++;
    }, 300);
  },
};
