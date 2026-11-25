(() => {
  'use strict';

  const STORAGE_KEY = 'piece-of-me.v1';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const beatOptions = {
    'House Beats': ['After Hours', 'Concrete Heart', 'Side Street'],
    'Seasonal Beats': ['First Light', 'Heatwave', 'Autumn Static', 'Cold Front'],
    'Guest Producers': ['M. Rivers', 'June Park', 'The Quiet Ones']
  };
  const goldDemo = [
    { id: 'demo-gold-01', insight: 'A slower start keeps finding its way back to you.', sourceText: 'I keep saying I want a quiet morning, then I fill every minute before I even get out of bed.' },
    { id: 'demo-gold-02', insight: 'Making things with your hands sounds like a kind of home.', sourceText: 'I miss making things just because I want to see what happens, not because anyone asked for it.' },
    { id: 'demo-gold-03', insight: 'You want room to change your mind without a speech.', sourceText: 'I wish I could say no to the plan and not have to turn it into a whole explanation.' }
  ];

  // Array-backed LIFO stack: push and pop are O(1) amortized; removing a
  // specifically chosen entry is O(n), since later items must shift left.
  class Stack {
    constructor(items = []) { this.items = items; }
    push(item) { return this.items.push(item); }
    pop() { return this.items.pop(); }
    peek() { return this.items[this.items.length - 1]; }
    get size() { return this.items.length; }
    get isEmpty() { return this.items.length === 0; }
    removeById(id) { const index = this.items.findIndex(item => item.id === id); if (index < 0) return false; this.items.splice(index, 1); return true; }
  }

  const nowYear = new Date().getFullYear();
  let galleryIds = new Set();
  let goldPieces = [];
  let beatSelections = {};
  let albumYear = nowYear;
  let storageAvailable = true;
  const form = document.querySelector('#entry-form');
  const input = document.querySelector('#entry-input');
  const formStatus = document.querySelector('#form-status');
  const entriesList = document.querySelector('#entries-list');
  const entriesEmpty = document.querySelector('#entries-empty');
  const goldList = document.querySelector('#gold-list');
  const goldEmpty = document.querySelector('#gold-empty');
  const goldCount = document.querySelector('#gold-count');
  const displayList = document.querySelector('#display-list');
  const displayEmpty = document.querySelector('#display-empty');
  const displayCount = document.querySelector('#display-count');
  const undoButton = document.querySelector('#undo-button');
  const trackList = document.querySelector('#track-list');
  const yearSelect = document.querySelector('#album-year');
  const recordYear = document.querySelector('#record-year');
  const albumTitle = document.querySelector('#album-title');
  const albumEntryCount = document.querySelector('#album-entry-count');
  const benchmarkResults = document.querySelector('#benchmark-results');

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const savedEntries = Array.isArray(saved.entries) ? saved.entries.filter(entry => entry && typeof entry.id === 'string' && typeof entry.text === 'string' && typeof entry.createdAt === 'string') : [];
      galleryIds = new Set(Array.isArray(saved.galleryIds) ? saved.galleryIds.filter(id => typeof id === 'string') : []);
      beatSelections = saved.beatSelections && typeof saved.beatSelections === 'object' && !Array.isArray(saved.beatSelections) ? saved.beatSelections : {};
      const savedGold = Array.isArray(saved.goldPieces) ? saved.goldPieces.filter(piece => piece && typeof piece.id === 'string' && typeof piece.insight === 'string' && typeof piece.sourceText === 'string' && ['pending', 'saved', 'dismissed'].includes(piece.status)) : null;
      goldPieces = savedGold || goldDemo.map(piece => ({ ...piece, sourceId: null, status: 'pending', demo: true }));
      return new Stack(savedEntries);
    } catch (error) {
      storageAvailable = false;
      formStatus.textContent = 'Local storage is unavailable. Entries may not be saved.';
      goldPieces = goldDemo.map(piece => ({ ...piece, sourceId: null, status: 'pending', demo: true }));
      return new Stack();
    }
  }
  const entries = loadState();

  function saveState() {
    if (!storageAvailable) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: entries.items, galleryIds: [...galleryIds], beatSelections, goldPieces })); }
    catch (error) { storageAvailable = false; formStatus.textContent = 'Could not save on this device. Check available browser storage.'; }
  }
  function dateLabel(isoDate) {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return 'DATE UNKNOWN';
    return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date).toUpperCase();
  }
  function makeTextButton(label, action, className = '') {
    const button = document.createElement('button'); button.type = 'button'; button.className = `text-button ${className}`.trim(); button.textContent = label; button.addEventListener('click', action); return button;
  }

  function renderEntries() {
    entriesList.replaceChildren();
    const newestFirst = [...entries.items].reverse();
    entriesEmpty.hidden = newestFirst.length > 0;
    undoButton.disabled = entries.isEmpty;
    for (const entry of newestFirst) {
      const card = document.createElement('article'); card.className = 'entry-card';
      const meta = document.createElement('div'); meta.className = 'entry-meta';
      const time = document.createElement('time'); time.dateTime = entry.createdAt; time.textContent = dateLabel(entry.createdAt);
      const index = document.createElement('span'); index.textContent = `NO. ${String(entries.items.indexOf(entry) + 1).padStart(2, '0')}`; meta.append(time, index);
      const copy = document.createElement('p'); copy.className = 'entry-copy'; copy.textContent = entry.text;
      const actions = document.createElement('div'); actions.className = 'entry-actions';
      const isDisplayed = galleryIds.has(entry.id);
      actions.append(makeTextButton(isDisplayed ? 'REMOVE FROM DISPLAY −' : 'ADD TO DISPLAY +', () => toggleDisplay(entry.id)), makeTextButton('DELETE ×', () => deleteEntry(entry.id)));
      card.append(meta, copy, actions); entriesList.append(card);
    }
    renderGold(); renderDisplay(); renderAlbumYears();
  }

  function renderGold() {
    const pending = goldPieces.filter(piece => piece.status === 'pending');
    goldList.replaceChildren(); goldEmpty.hidden = pending.length > 0;
    goldCount.textContent = `${String(pending.length).padStart(2, '0')} ${pending.length === 1 ? 'PIECE' : 'PIECES'}`;
    for (const piece of pending) {
      const card = document.createElement('article'); card.className = 'gold-card';
      const label = document.createElement('div'); label.className = 'gold-card-label';
      const spark = document.createElement('span'); spark.className = 'gold-spark'; spark.setAttribute('aria-hidden', 'true'); spark.textContent = '✳';
      const labelText = document.createElement('span'); labelText.textContent = piece.demo ? 'DEMO GOLD PIECE' : 'GOLD PIECE'; label.append(spark, labelText);
      const insight = document.createElement('p'); insight.className = 'gold-insight'; insight.textContent = piece.insight;
      const source = document.createElement('blockquote'); source.className = 'gold-source';
      const sourceLabel = document.createElement('span'); sourceLabel.className = 'gold-source-label'; sourceLabel.textContent = 'SOURCE NOTE · ORIGINAL WORDS';
      const sourceText = document.createElement('p'); sourceText.textContent = piece.sourceText; source.append(sourceLabel, sourceText);
      const actions = document.createElement('div'); actions.className = 'gold-actions';
      actions.append(makeTextButton('SAVE TO ON DISPLAY +', () => saveGoldPiece(piece.id)), makeTextButton('DISMISS ×', () => dismissGoldPiece(piece.id)));
      card.append(label, insight, source, actions); goldList.append(card);
    }
  }

  function renderDisplay() {
    const selectedEntries = entries.items.filter(entry => galleryIds.has(entry.id)).reverse();
    const selectedGold = goldPieces.filter(piece => piece.status === 'saved').reverse();
    displayList.replaceChildren();
    const total = selectedEntries.length + selectedGold.length;
    displayEmpty.hidden = total > 0;
    displayCount.textContent = `${String(total).padStart(2, '0')} ${total === 1 ? 'PIECE' : 'PIECES'}`;
    for (const piece of selectedGold) {
      const card = document.createElement('article'); card.className = 'gold-display-card';
      const meta = document.createElement('div'); meta.className = 'entry-meta'; meta.textContent = 'GOLD PIECE · DEMO EXAMPLE'; meta.append(makeTextButton('REMOVE FROM DISPLAY −', () => removeGoldFromDisplay(piece.id)));
      const insight = document.createElement('p'); insight.className = 'gold-insight'; insight.textContent = piece.insight;
      const source = document.createElement('blockquote'); source.className = 'gold-source';
      const sourceLabel = document.createElement('span'); sourceLabel.className = 'gold-source-label'; sourceLabel.textContent = 'SOURCE NOTE · ORIGINAL WORDS';
      const sourceText = document.createElement('p'); sourceText.textContent = piece.sourceText; source.append(sourceLabel, sourceText);
      card.append(meta, insight, source); displayList.append(card);
    }
    for (const entry of selectedEntries) {
      const card = document.createElement('article'); card.className = 'display-card';
      const meta = document.createElement('div'); meta.className = 'entry-meta'; const time = document.createElement('time'); time.dateTime = entry.createdAt; time.textContent = dateLabel(entry.createdAt);
      meta.append(time, makeTextButton('TAKE OFF WALL −', () => toggleDisplay(entry.id)));
      const copy = document.createElement('p'); copy.className = 'entry-copy'; copy.textContent = entry.text;
      card.append(meta, copy); displayList.append(card);
    }
  }
  function toggleDisplay(id) { if (galleryIds.has(id)) galleryIds.delete(id); else galleryIds.add(id); saveState(); renderEntries(); }
  function saveGoldPiece(id) { const piece = goldPieces.find(item => item.id === id); if (!piece || piece.status !== 'pending') return; piece.status = 'saved'; saveState(); renderEntries(); }
  function dismissGoldPiece(id) { const piece = goldPieces.find(item => item.id === id); if (!piece || piece.status !== 'pending') return; piece.status = 'dismissed'; saveState(); renderEntries(); }
  function removeGoldFromDisplay(id) { const piece = goldPieces.find(item => item.id === id); if (!piece || piece.status !== 'saved') return; piece.status = 'pending'; saveState(); renderEntries(); }
  function deleteEntry(id) { entries.removeById(id); galleryIds.delete(id); saveState(); renderEntries(); }
  function undoLatest() { const removed = entries.pop(); if (!removed) return; galleryIds.delete(removed.id); formStatus.textContent = 'Last submission undone.'; saveState(); renderEntries(); }

  form.addEventListener('submit', event => {
    event.preventDefault(); const text = input.value.trim();
    if (!text) { formStatus.textContent = 'Write something first.'; input.focus(); return; }
    entries.push({ id: makeId(), text, createdAt: new Date().toISOString() }); input.value = ''; formStatus.textContent = 'Dropped. It stays right here.'; saveState(); renderEntries(); input.focus();
  });
  function makeId() { if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID(); return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; }
  undoButton.addEventListener('click', undoLatest);

  function renderAlbumYears() {
    const years = new Set([nowYear]);
    for (const entry of entries.items) { const year = new Date(entry.createdAt).getFullYear(); if (Number.isFinite(year)) years.add(year); }
    if (!years.has(albumYear)) albumYear = nowYear;
    yearSelect.replaceChildren();
    for (const year of [...years].sort((a, b) => b - a)) { const option = document.createElement('option'); option.value = String(year); option.textContent = String(year); yearSelect.append(option); }
    yearSelect.value = String(albumYear); recordYear.textContent = String(albumYear);
    albumTitle.textContent = 'Your Life. On Record.';
    const yearEntries = entries.items.filter(entry => new Date(entry.createdAt).getFullYear() === albumYear);
    albumEntryCount.textContent = `${yearEntries.length} raw ${yearEntries.length === 1 ? 'thought' : 'thoughts'} across ${new Set(yearEntries.map(entry => new Date(entry.createdAt).getMonth())).size} ${new Set(yearEntries.map(entry => new Date(entry.createdAt).getMonth())).size === 1 ? 'month' : 'months'} · the whole year counts`;
    renderTracks(yearEntries);
  }

  function renderTracks(yearEntries) {
    trackList.replaceChildren();
    monthNames.forEach((month, index) => {
      const monthEntries = yearEntries.filter(entry => new Date(entry.createdAt).getMonth() === index);
      const card = document.createElement('article'); card.className = 'track-card';
      const cover = document.createElement('div'); cover.className = `cover-art cover-${String(index + 1).padStart(2, '0')}`; cover.setAttribute('aria-label', `Original artwork for ${month}`);
      const coverNum = document.createElement('span'); coverNum.className = 'cover-number'; coverNum.textContent = `PM—${String(index + 1).padStart(2, '0')}`;
      const coverMark = document.createElement('span'); coverMark.className = 'cover-mark'; coverMark.textContent = month.slice(0, 3).toUpperCase();
      const coverMonth = document.createElement('span'); coverMonth.className = 'cover-month'; coverMonth.textContent = 'PIECE OF ME · ORIGINAL ART'; cover.append(coverNum, coverMark, coverMonth);
      const info = document.createElement('div'); info.className = 'track-info';
      const number = document.createElement('span'); number.className = 'track-number'; number.textContent = `TRACK ${String(index + 1).padStart(2, '0')}`;
      const duration = document.createElement('span'); duration.className = 'track-duration'; duration.textContent = '03:00';
      const title = document.createElement('span'); title.className = 'track-month'; title.textContent = month;
      const noteCount = document.createElement('span'); noteCount.className = 'track-entry-count'; noteCount.textContent = `${monthEntries.length} raw ${monthEntries.length === 1 ? 'thought' : 'thoughts'} in this month's cut`;
      info.append(number, duration, title, noteCount);
      const select = document.createElement('select'); select.className = 'beat-select'; select.setAttribute('aria-label', `Choose a beat for ${month} ${albumYear}`);
      const defaultOption = document.createElement('option'); defaultOption.value = ''; defaultOption.textContent = 'Choose a beat'; select.append(defaultOption);
      for (const [group, choices] of Object.entries(beatOptions)) { const optgroup = document.createElement('optgroup'); optgroup.label = group; for (const choice of choices) { const option = document.createElement('option'); option.value = `${group}::${choice}`; option.textContent = choice; optgroup.append(option); } select.append(optgroup); }
      const key = `${albumYear}-${String(index + 1).padStart(2, '0')}`; select.value = beatSelections[key] || '';
      select.addEventListener('change', () => { if (select.value) beatSelections[key] = select.value; else delete beatSelections[key]; saveState(); });
      card.append(cover, info, select); trackList.append(card);
    });
  }
  yearSelect.addEventListener('change', () => { albumYear = Number(yearSelect.value) || nowYear; renderAlbumYears(); });

  // Browser benchmark: stack pop versus a full linear scan for each undo.
  function runBenchmark() {
    benchmarkResults.innerHTML = '<span class="benchmark-loading">RUNNING A SMALL TEST…</span>';
    const count = 10000, undoCount = 250, trials = 3, stackTimes = [], linearTimes = [];
    for (let trial = 0; trial < trials; trial += 1) {
      const stack = new Stack(Array.from({ length: count }, (_, id) => ({ id })));
      const stackStart = performance.now(); for (let i = 0; i < undoCount; i += 1) stack.pop(); stackTimes.push(performance.now() - stackStart);
      const linearItems = Array.from({ length: count }, (_, id) => ({ id, active: true }));
      const linearStart = performance.now();
      for (let undo = 0; undo < undoCount; undo += 1) { let newestActive = -1; for (let i = 0; i < linearItems.length; i += 1) if (linearItems[i].active) newestActive = i; if (newestActive >= 0) linearItems[newestActive].active = false; }
      linearTimes.push(performance.now() - linearStart);
    }
    const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const stackMs = median(stackTimes), linearMs = median(linearTimes), ratio = stackMs > 0 ? Math.max(1, Math.round(linearMs / stackMs)) : '—';
    benchmarkResults.replaceChildren(metric(`${stackMs.toFixed(2)} ms`, `STACK · ${undoCount} POPS`), metric(`${linearMs.toFixed(2)} ms`, `LINEAR · ${undoCount} SCANS`), metric(`${ratio}×`, 'STACK FASTER'));
  }
  function metric(value, label) { const container = document.createElement('div'); container.className = 'benchmark-metric'; const strong = document.createElement('strong'); strong.textContent = value; const caption = document.createElement('span'); caption.textContent = label; container.append(strong, caption); return container; }
  document.querySelector('#benchmark-button').addEventListener('click', runBenchmark);
  const orderDialog = document.querySelector('#order-dialog');
  document.querySelector('#order-preview').addEventListener('click', () => orderDialog.showModal());
  document.querySelector('#dialog-close').addEventListener('click', () => orderDialog.close());
  document.querySelector('#dialog-done').addEventListener('click', () => orderDialog.close());
  orderDialog.addEventListener('click', event => { if (event.target === orderDialog) orderDialog.close(); });
  renderEntries(); saveState(); window.setTimeout(runBenchmark, 150);
})();
