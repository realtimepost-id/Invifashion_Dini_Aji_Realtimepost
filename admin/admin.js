const $ = s => document.querySelector(s), esc = t => String(t ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
let key = sessionStorage.getItem('adm') || '', items = [];
const api = (path = '', opt = {}) => fetch('/api/admin' + path, { ...opt, headers: { 'x-admin-key': key } });

async function load() {
  const r = await api(); const d = await r.json();
  if (!r.ok) { sessionStorage.removeItem('adm'); $('#login').hidden = false; $('#app').hidden = true; $('#err').textContent = d.error || 'Gagal'; return false; }
  items = d.items; $('#login').hidden = true; $('#app').hidden = false;
  $('#mode').textContent = 'Penyimpanan: ' + (d.mode === 'upstash' ? 'Upstash Redis (online)' : 'File lokal data/rsvp.json');
  draw(); return true;
}
function draw() {
  const yes = items.filter(i => i.status === 'Hadir');
  $('#sTotal').textContent = items.length; $('#sYes').textContent = yes.length; $('#sPax').textContent = yes.reduce((a, i) => a + (+i.qty || 0), 0);
  $('#sNo').textContent = items.filter(i => i.status === 'Tidak Hadir').length; $('#sMaybe').textContent = items.filter(i => i.status === 'Masih Ragu').length;
  const q = $('#q').value.toLowerCase(), f = $('#f').value;
  $('#rows').innerHTML = items.filter(i => (!f || i.status === f) && (i.name + ' ' + i.wish).toLowerCase().includes(q)).map(i =>
    `<tr><td>${new Date(i.time).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td><td><b>${esc(i.name)}</b></td><td><span class="tag ${i.status === 'Tidak Hadir' ? 'no' : i.status === 'Masih Ragu' ? 'ra' : ''}">${esc(i.status)}</span></td><td>${i.qty || ''}</td><td>${esc(i.wish)}</td><td><button class="del" data-id="${esc(i.id)}">Hapus</button></td></tr>`).join('') || '<tr><td colspan="6">Belum ada data.</td></tr>';
}
$('#loginBtn').onclick = async () => { key = $('#pw').value; sessionStorage.setItem('adm', key); await load(); };
$('#pw').onkeydown = e => e.key === 'Enter' && $('#loginBtn').click();
$('#refresh').onclick = load; $('#q').oninput = $('#f').onchange = draw;
$('#out').onclick = () => { sessionStorage.removeItem('adm'); location.reload(); };
$('#rows').onclick = async e => { const id = e.target.dataset.id; if (id && confirm('Hapus RSVP ini?')) { await api('?id=' + encodeURIComponent(id), { method: 'DELETE' }); load(); } };
$('#csv').onclick = () => {
  const c = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = [['Waktu', 'Nama', 'Status', 'Jumlah', 'Ucapan', 'Link Tamu'], ...items.map(i => [i.time, i.name, i.status, i.qty, i.wish, i.guest])];
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + rows.map(r => r.map(c).join(',')).join('\n')], { type: 'text/csv' })); a.download = 'rsvp-aji-dini.csv'; a.click();
};
$('#base').value = location.origin + '/';
$('#gen').onclick = () => {
  const base = $('#base').value.trim().replace(/\/?$/, '/');
  $('#links').innerHTML = $('#names').value.split('\n').map(n => n.trim()).filter(Boolean).map(n => { const u = base + '?to=' + encodeURIComponent(n).replace(/%20/g, '+');
    return `<tr><td><b>${esc(n)}</b></td><td style="word-break:break-all">${esc(u)}</td><td><button onclick="navigator.clipboard.writeText('${esc(u)}');this.textContent='✓ Tersalin'">Salin</button></td></tr>`; }).join('');
};
if (key) load();
