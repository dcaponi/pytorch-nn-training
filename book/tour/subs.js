/* Write an SRT subtitle track from beats.json + timeline.json + durations.json. */
const fs = require('fs');
const path = require('path');

const beats = Object.fromEntries(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'beats.json'), 'utf8')).map(b => [b.id, b]));
const timeline = JSON.parse(fs.readFileSync(path.join(__dirname, 'timeline.json'), 'utf8'));
const durations = JSON.parse(fs.readFileSync(path.join(__dirname, 'durations.json'), 'utf8'));

const stamp = s => {
  const ms = Math.round((s % 1) * 1000);
  const t = Math.floor(s);
  return `${String(Math.floor(t / 3600)).padStart(2, '0')}:` +
         `${String(Math.floor(t / 60) % 60).padStart(2, '0')}:` +
         `${String(t % 60).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

// wrap the spoken text to two readable lines per cue
const wrap = (text, width = 42) => {
  const words = text.split(' ');
  const lines = [['']];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur[0] + ' ' + w).trim().length > width) lines.push([w]);
    else cur[0] = (cur[0] + ' ' + w).trim();
  }
  return lines.map(l => l[0]);
};

const cues = [];
let n = 0;
for (const t of timeline) {
  const speech = beats[t.id].speech;
  const total = durations[t.id];
  const sentences = speech.match(/[^.?!]+[.?!]+/g) || [speech];
  const chars = sentences.reduce((a, s) => a + s.length, 0);
  let at = t.at;
  for (const s of sentences) {
    const d = total * (s.length / chars);
    cues.push(`${++n}\n${stamp(at)} --> ${stamp(at + d - 0.05)}\n` +
              `${wrap(s.trim()).join('\n')}\n`);
    at += d;
  }
}
fs.writeFileSync(path.join(__dirname, 'book-tour.srt'), cues.join('\n'));
console.log(`wrote book-tour.srt — ${n} cues`);
