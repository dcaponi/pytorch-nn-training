/* Place each narration clip at its logged offset and mux with the recording.
 * Requires tour.js to have run (video/*.webm + timeline.json). */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const here = __dirname;
const timeline = JSON.parse(fs.readFileSync(path.join(here, 'timeline.json'), 'utf8'));
const webm = fs.readdirSync(path.join(here, 'video')).find(f => f.endsWith('.webm'));
if (!webm) throw new Error('no recording in video/ — run `npm run tour` first');
const video = path.join(here, 'video', webm);

const dur = parseFloat(execSync(
  `ffprobe -v error -show_entries format=duration -of csv=p=0 ${JSON.stringify(video)}`
).toString().trim());
console.log(`video: ${dur.toFixed(1)}s, ${timeline.length} narration beats`);

// one delayed input per clip, mixed over a silent bed the length of the video
const inputs = timeline.map(t =>
  `-i ${JSON.stringify(path.join(here, 'audio', t.id + '.aiff'))}`).join(' ');
const filters = timeline.map((t, i) =>
  `[${i + 1}:a]adelay=${Math.round(t.at * 1000)}|${Math.round(t.at * 1000)},` +
  `aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[a${i}]`).join(';');
const mixIn = timeline.map((_, i) => `[a${i}]`).join('');

const out = path.join(here, 'book-tour.mp4');
const cmd = [
  'ffmpeg -y',
  `-i ${JSON.stringify(video)}`,
  inputs,
  `-filter_complex "${filters};${mixIn}amix=inputs=${timeline.length}:normalize=0:dropout_transition=0,`,
  `alimiter=limit=0.95,aresample=48000[aout]"`,
  '-map 0:v -map "[aout]"',
  '-c:v libx264 -pix_fmt yuv420p -crf 23 -preset slow -movflags +faststart',
  '-c:a aac -b:a 160k',
  `-t ${dur.toFixed(2)}`,
  JSON.stringify(out),
  '-loglevel error',
].join(' ');

execSync(cmd, { stdio: 'inherit' });
const size = fs.statSync(out).size / 1048576;
const finalDur = parseFloat(execSync(
  `ffprobe -v error -show_entries format=duration -of csv=p=0 ${JSON.stringify(out)}`
).toString().trim());
console.log(`wrote ${path.relative(process.cwd(), out)} — ${size.toFixed(1)} MB, ${finalDur.toFixed(0)}s`);
