const ctx = new(window.AudioContext || window.webkitAudioContext)();

const osc = ctx.createOscillator();

osc.type = 'sawtooth';

const filter = ctx.createBiquadFilter();
osc.connect(filter);
filter.connect(ctx.destination);


osc.connect(ctx.destination);