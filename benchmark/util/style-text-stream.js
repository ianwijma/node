'use strict';

// Measures styleText() with stream validation enabled (the default), against
// a stream that does or does not support colors.

const common = require('../common.js');

const { styleText } = require('node:util');
const { Writable } = require('node:stream');
const { WriteStream } = require('node:tty');
const assert = require('node:assert');

const bench = common.createBenchmark(main, {
  stream: ['tty', 'pipe'],
  format: ['red', 'bold,red', '#ff0000'],
  n: [1e5],
});

function main({ stream: streamType, format, n }) {
  const stream = new Writable({ write(chunk, enc, cb) { cb(); } });
  if (streamType === 'tty') {
    // Behaves like a TTY WriteStream for color detection purposes.
    stream.isTTY = true;
    stream.getColorDepth = WriteStream.prototype.getColorDepth;
  }
  // Color detection is environment dependent; make it deterministic.
  for (const name of ['FORCE_COLOR', 'NO_COLOR', 'NODE_DISABLE_COLORS', 'CI', 'TMUX', 'COLORTERM']) {
    delete process.env[name];
  }
  process.env.TERM = 'xterm-256color';

  const fmt = format.includes(',') ? format.split(',') : format;
  const options = { stream };
  let colored = '';

  bench.start();
  for (let i = 0; i < n; i++) {
    colored = styleText(fmt, 'hello world', options);
  }
  bench.end(n);

  assert.ok(colored); // Attempt to avoid dead-code elimination
}
