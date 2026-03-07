// Web Audio API sound effects for cricket scoring events

function getAudioContext() {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

export function playBoundaryFourSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Crisp bat-on-ball crack
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
  }
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.3, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 2000;
  noise.connect(hp).connect(noiseGain).connect(ctx.destination);
  noise.start(now);

  // Rising celebratory tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(600, now + 0.05);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
  gain.gain.setValueAtTime(0.15, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now + 0.05);
  osc.stop(now + 0.4);

  // Second tone for richness
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(800, now + 0.08);
  osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.25);
  gain2.gain.setValueAtTime(0.08, now + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.35);
}

export function playSixSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Big crack
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
  }
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.4, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
  noise.connect(noiseGain).connect(ctx.destination);
  noise.start(now);

  // Dramatic ascending fanfare
  [0, 0.1, 0.2].forEach((delay, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i === 2 ? "square" : "sine";
    const freqs = [600, 900, 1200];
    osc.frequency.setValueAtTime(freqs[i], now + delay);
    osc.frequency.exponentialRampToValueAtTime(freqs[i] * 1.5, now + delay + 0.25);
    gain.gain.setValueAtTime(0.12 - i * 0.02, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + delay);
    osc.stop(now + delay + 0.4);
  });

  // Crowd roar simulation
  const crowd = ctx.createBufferSource();
  const crowdBuf = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
  const crowdData = crowdBuf.getChannelData(0);
  for (let i = 0; i < crowdData.length; i++) {
    crowdData[i] = (Math.random() * 2 - 1) * 0.5;
  }
  crowd.buffer = crowdBuf;
  const crowdGain = ctx.createGain();
  const crowdFilter = ctx.createBiquadFilter();
  crowdFilter.type = "bandpass";
  crowdFilter.frequency.value = 800;
  crowdFilter.Q.value = 0.5;
  crowdGain.gain.setValueAtTime(0, now + 0.15);
  crowdGain.gain.linearRampToValueAtTime(0.06, now + 0.3);
  crowdGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
  crowd.connect(crowdFilter).connect(crowdGain).connect(ctx.destination);
  crowd.start(now + 0.15);
  crowd.stop(now + 0.9);
}

export function playWicketSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;

  // Stumps hitting / sharp crack
  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 4);
  }
  noise.buffer = buf;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.35, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  noise.connect(noiseGain).connect(ctx.destination);
  noise.start(now);

  // Descending dramatic tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(2000, now);
  lp.frequency.exponentialRampToValueAtTime(400, now + 0.5);
  osc.connect(lp).connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.6);

  // Bails rattling
  [0.03, 0.08, 0.14].forEach((delay, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 3000 - i * 400;
    g.gain.setValueAtTime(0.08 - i * 0.02, now + delay);
    g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);
    o.connect(g).connect(ctx.destination);
    o.start(now + delay);
    o.stop(now + delay + 0.04);
  });
}
