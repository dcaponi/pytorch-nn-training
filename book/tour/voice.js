/* Generate one audio clip per beat with macOS `say`, and measure each duration.
 * Writes audio/<id>.aiff and durations.json, which tour.js uses to pace itself. */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VOICE = process.env.VOICE || 'Samantha';
const RATE = process.env.RATE || '168';
const OUT = path.join(__dirname, 'audio');

fs.mkdirSync(OUT, { recursive: true });
const beats = JSON.parse(fs.readFileSync(path.join(__dirname, 'beats.json'), 'utf8'));

const durations = {};
for (const b of beats) {
  const aiff = path.join(OUT, `${b.id}.aiff`);
  execSync(`say -v ${JSON.stringify(VOICE)} -r ${RATE} -o ${JSON.stringify(aiff)} ` +
           JSON.stringify(b.speech));
  const d = parseFloat(execSync(
    `ffprobe -v error -show_entries format=duration -of csv=p=0 ${JSON.stringify(aiff)}`
  ).toString().trim());
  durations[b.id] = d;
  console.log(`  ${b.id.padEnd(11)} ${d.toFixed(2)}s  ${b.speech.slice(0, 52)}…`);
}
fs.writeFileSync(path.join(__dirname, 'durations.json'), JSON.stringify(durations, null, 2));
const total = Object.values(durations).reduce((a, b) => a + b, 0);
console.log(`\n  ${beats.length} clips, ${total.toFixed(1)}s of speech (voice: ${VOICE} @ ${RATE} wpm)`);
