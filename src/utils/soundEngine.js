// Procedural Web Audio API Sound Engine for the Damaged Omnitrix Experience

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.ambientGain = null;
    this.ambientOsc = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.muted ? 0 : 0.04, this.ctx.currentTime, 0.1);
    }
    return this.muted;
  }

  // Subtle electrical spark / glitch crackle when watch is damaged
  playGlitchSpark() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    // White noise burst
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2800 + Math.random() * 2000, now);
    filter.Q.setValueAtTime(4, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Classic Omnitrix Wake-up / Boot Sequence chime
  playWakeUp() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    const notes = [220, 330, 440, 660, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + idx * 0.07 + 0.18);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1800, now + idx * 0.07);

      gain.gain.setValueAtTime(0.001, now + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.26);
    });
  }

  // Mechanical + Sci-fi Beep when pressing the dial or popping up the core
  playDialPress(isPopup = true) {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    // Mechanical thud
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(160, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.12);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.13);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.14);

    // Iconic Omnitrix dual-tone chirp
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'square';
    if (isPopup) {
      osc2.frequency.setValueAtTime(520, now + 0.05);
      osc2.frequency.setValueAtTime(780, now + 0.13);
      osc2.frequency.setValueAtTime(1040, now + 0.21);
    } else {
      osc2.frequency.setValueAtTime(980, now + 0.05);
      osc2.frequency.setValueAtTime(640, now + 0.14);
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);

    gain2.gain.setValueAtTime(0.09, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.34);

    osc2.connect(filter);
    filter.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.35);
  }

  // Dial rotation click + holographic pitch shift
  playDialRotate(index = 0) {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    const baseFreq = 600 + (index % 7) * 65;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Inspection node click sound
  playInspectPing(isDamaged = true) {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = isDamaged ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isDamaged ? 310 : 880, now);
    osc.frequency.exponentialRampToValueAtTime(isDamaged ? 240 : 1320, now + 0.15);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.17);
  }

  // Dramatic Transformation Sequence sound
  playTransformation() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    // 1. Rising DNA charge sweep
    const sweep = this.ctx.createOscillator();
    const sweepGain = this.ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(110, now);
    sweep.frequency.exponentialRampToValueAtTime(1480, now + 0.85);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(2200, now + 0.85);
    filter.Q.setValueAtTime(3, now);

    sweepGain.gain.setValueAtTime(0.02, now);
    sweepGain.gain.linearRampToValueAtTime(0.18, now + 0.7);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    sweep.connect(filter);
    filter.connect(sweepGain);
    sweepGain.connect(this.ctx.destination);
    sweep.start(now);
    sweep.stop(now + 1.25);

    // 2. Sub-bass energy impact pulse at peak
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, now + 0.45);
    sub.frequency.exponentialRampToValueAtTime(32, now + 1.4);

    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.setValueAtTime(0.32, now + 0.45);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.45);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now + 0.45);
    sub.stop(now + 1.5);
  }

  // Alien-specific ability sound effects
  playAbilitySound(alienId) {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    if (alienId === 'heatblast') {
      // Fireball whoosh
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(250, now + 0.35);
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } else if (alienId === 'xlr8') {
      // Sonic zip
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.22);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } else if (alienId === 'fourarms' || alienId === 'cannonbolt') {
      // Heavy seismic slam / kinetic shell impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(alienId === 'cannonbolt' ? 165 : 120, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.32);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    } else if (alienId === 'diamondhead') {
      // Crystalline chime
      [1200, 1650, 2100].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.04);
        gain.gain.setValueAtTime(0.1, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.32);
      });
    } else {
      // Cosmic / Upgrade synth pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(990, now + 0.25);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  // Warm emotional unlock chord for Memory/Birthday Gift reveal
  playMemoryUnlock() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;

    const chord = [261.63, 329.63, 392.00, 523.25, 659.25]; // C Major 9th warm pad
    chord.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.001, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.07, now + i * 0.08 + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.08 + 2.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 2.9);
    });
  }
}

export const soundEngine = new SoundEngine();
