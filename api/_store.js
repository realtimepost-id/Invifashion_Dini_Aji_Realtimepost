// Penyimpanan RSVP: Upstash Redis (produksi di Vercel) atau file JSON (lokal).
const fs = require('fs'), path = require('path');
const URL_ = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KEY = 'undangan:aji-dini:rsvp';
const FILE = path.join(process.cwd(), 'data', 'rsvp.json');

const redis = async cmd => {
  const r = await fetch(URL_, { method: 'POST', headers: { Authorization: 'Bearer ' + TOKEN }, body: JSON.stringify(cmd) });
  const j = await r.json(); if (j.error) throw new Error(j.error); return j.result;
};
const readFile = () => { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return []; } };

exports.mode = () => (URL_ && TOKEN ? 'upstash' : 'file');

exports.list = async () => {
  if (URL_ && TOKEN) return (await redis(['LRANGE', KEY, 0, -1])).map(s => JSON.parse(s));
  return readFile();
};
exports.add = async item => {
  if (URL_ && TOKEN) return redis(['LPUSH', KEY, JSON.stringify(item)]);
  if (process.env.VERCEL) throw new Error('Database belum terhubung (lihat README bagian Vercel).');
  const all = readFile(); all.unshift(item); fs.writeFileSync(FILE, JSON.stringify(all, null, 2));
};
exports.remove = async id => {
  if (URL_ && TOKEN) { const hit = (await redis(['LRANGE', KEY, 0, -1])).find(s => JSON.parse(s).id === id); return hit && redis(['LREM', KEY, 0, hit]); }
  fs.writeFileSync(FILE, JSON.stringify(readFile().filter(x => x.id !== id), null, 2));
};
