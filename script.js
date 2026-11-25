(() => {
  'use strict';

  const STORAGE_KEY = 'piece-of-me.v1';
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const beatOptions = {
    'House Beats': ['After Hours', 'Concrete Heart', 'Side Street'],
    'Seasonal Beats': ['First Light', 'Heatwave', 'Autumn Static', 'Cold Front'],
    'Guest Producers': ['M. Rivers', 'June Park', 'The Quiet Ones']
  };

  // Array-backed LIFO stack: push and pop are O(1) amortized; removing a
  // specifically chosen entry is O(n), since later items must shift left.
  class Stack {
    constructor(items = []) { this.items = items; }
    push(item) { return this.items.push(item); }
    pop() { return this.items.pop(); }
    peek() { return this.items[this.items.length - 1]; }
    get size() { return this.items.length; }
    get isEmpty() { return this.items.length === 0; }
    removeById(id) {
      const index = this.items.findIndex(item => item.id === id);
      if (index < 0) return false;
      this.items.splice(index, 1);
      return true;
    }
  }

  const nowYear = new Date().getFullYear();
  let galleryIds = new Set();
  let beatSelections = {};
  let albumYear = nowYear;
  let storageAvailable = true;

  const form = document.querySelector('#entry-form');
  const input = document.querySelector('#entry-input');
  const formStatus = document.querySelector('#form-status');
  const entriesList = document.querySelector('#entries-list');
  const entriesEmpty = document.querySelector('#entries-empty');
  const displayList = document.querySelector('#display-list');
  const displayEmpty = document.querySelector('#display-empty');
  const displayCount = document.querySelector('#display-count');
  const undoButton = document.querySelector('#undo-button');
  const trackList = document.querySelector('#track-list');
  const yearSelect = document.querySelector('#album-year');
  const recordYear = document.querySelector('#record-year');
  const albumTitle = document.querySelector('#album-title');
  const benchmarkResults = document.querySelector('#benchmark-results');

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      const entries = Array.isArray(saved.entries) ? saved.entries.filter(entry => entry && typeof entry.id === 'string' && typeof entry.text === 'string' && typeof entry.createdAt === 'string') : [];
      galleryIds = new Set(Array.isArray(saved.galleryIds) ? saved.galleryIds.filter(id => typeof id === 'string') : []);
      beatSelections = saved.beatSelections && typeof saved.beatSelections === 'object' && !Array.isArray(saved.beatSelections) ? saved.beatSelections : {};
      return new Stack(entries);
    } catch (error) {
      storageAvailable = false;
      formStatus.textContent = 'Local storage is unavailable. Entries may not be saved.';
      return new Stack();
    }
  }

  const entries = loadState();

  function saveState() {
    if (!storageAvailable) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: entries.items, galleryIds: [...galleryIds], beatSelections }));
    } catch (error) {
      storageAvailable = false;
      formStatus.textContent = 'Could not save on this device. Check available browser storage.';
    }
  }

  function dateLabel(isoDate) {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return 'DATE UNKNOWN';
    return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date).toUpperCase();
  }

  function makeTextButton(label, action, className = '') {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `text-button ${className}`.trim();
    button.textContent = label;
    button.addEventListener('click', action);
    return button;
  }

  function renderEntries() {
    entriesList.replaceChildren();
    const newestFirst = [...entries.items].reverse();
    entriesEmpty.hidden = newestFirst.length > 0;
    undoButton.disabled = entries.isEmpty;

    for (const entry of newestFirst) {
      const card = document.createElement('article');
      card.className = 'entry-card';
      const meta = document.createElement('div');
      meta.className = 'entry-meta';
      const time = document.createElement('time');
      time.dateTime = entry.createdAt;
      time.textContent = dateLabel(entry.createdAt);
      const index = document.createElement('span');
      index.textContent = `NO. ${String(entries.items.indexOf(entry) + 1).padStart(2, '0')}`;
      meta.append(time, index);
      const copy = document.createElement('p');
      copy.className = 'entry-copy';
      copy.textContent = entry.text;
      const actions = document.createElement('div');
      actions.className = 'entry-actions';
      const isDisplayed = galleryIds.has(entry.id);
      actions.append(
        makeTextButton(isDisplayed ? 'REMOVE FROM DISPLAY −' : 'ADD TO DISPLAY +', () => toggleDisplay(entry.id)),
        makeTextButton('DELETE ×', () => deleteEntry(entry.id))
      );
      card.append(meta, copy, actions);
      entriesList.append(card);
    }
    renderDisplay();
    renderAlbumYears();
  }

  function renderDisplay() {
    const selected = entries.items.filter(entry => galleryIds.has(entry.id)).reverse();
    displayList.replaceChildren();
    displayEmpty.hidden = selected.length > 0;
    displayCount.textContent = `${String(selected.length).padStart(2, '0')} ${selected.length === 1 ? 'PIECE' : 'PIECES'}`;
    for (const entry of selected) {
      const card = document.createElement('article');
      card.className = 'display-card';
      const meta = document.createElement('div');
      meta.className = 'entry-meta';
      const time = document.createElement('time');
      time.dateTime = entry.createdAt;
      time.textContent = dateLabel(entry.createdAt);
      meta.append(time, makeTextButton('TAKE OFF WALL −', () => toggleDisplay(entry.id)));
      const copy = document.createElement('p');
      copy.className = 'entry-copy';
      copy.textContent = entry.text;
      card.append(meta, copy);
      displayList.append(card);
    }
  }

  function toggleDisplay(id) {
    if (galleryIds.has(id)) galleryIds.delete(id);
    else galleryIds.add(id);
    saveState();
    renderEntries();
  }

  function deleteEntry(id) {
    entries.removeById(id);
    galleryIds.delete(id);
    saveState();
    renderEntries();
  }

  function undoLatest() {
    const removed = entries.pop();
    if (!removed) return;
    galleryIds.delete(removed.id);
    formStatus.textContent = 'Last submission undone.';
    saveState();
    renderEntries();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      formStatus.textContent = 'Write something first.';
      input.focus();
      return;
    }
    entries.push({ id: makeId(), text, createdAt: new Date().toISOString() });
    input.value = '';
    formStatus.textContent = 'Dropped. It stays right here.';
    saveState();
    renderEntries();
    input.focus();
  });

  function makeId() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }

  undoButton.addEventListener('click', undoLatest);

  function renderAlbumYears() {
    const years = new Set([nowYear]);
    for (const entry of entries.items) {
      const year = new Date(entry.createdAt).getFullYear();
      if (Number.isFinite(year)) years.add(year);
    }
    if (!years.has(albumYear)) albumYear = nowYear;
    const sortedYears = [...years].sort((a, b) => b - a);
    yearSelect.replaceChildren();
    for (const year of sortedYears) {
      const option = document.createElement('option');
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.append(option);
    }
    yearSelect.value = String(albumYear);
    recordYear.textContent = String(albumYear);
    albumTitle.textContent = `The Year, ${albumYear === nowYear ? 'So Far' : 'In Review'}`;
    renderTracks();
  }

  function renderTracks() {
    trackList.replaceChildren();
    monthNames.forEach((month, index) => {
      const row = document.createElement('div');
      row.className = 'track-row';
      const number = document.createElement('span');
      number.className = 'track-number';
      number.textContent = String(index + 1).padStart(2, '0');
      const title = document.createElement('span');
      title.className = 'track-month';
      title.textContent = month;
      const duration = document.createElement('span');
      duration.className = 'track-duration';
      duration.textContent = '03:00';
      const select = document.createElement('select');
      select.className = 'beat-select';
      select.setAttribute('aria-label', `Choose a beat for ${month} ${albumYear}`);
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Choose a beat';
      select.append(defaultOption);
      for (const [group, choices] of Object.entries(beatOptions)) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = group;
        for (const choice of choices) {
          const option = document.createElement('option');
          option.value = `${group}::${choice}`;
          option.textContent = choice;
          optgroup.append(option);
        }
        select.append(optgroup);
      }
      const key = `${albumYear}-${String(index + 1).padStart(2, '0')}`;
      select.value = beatSelections[key] || '';
      select.addEventListener('change', () => {
        if (select.value) beatSelections[key] = select.value;
        else delete beatSelections[key];
        saveState();
      });
      row.append(number, title, duration, select);
      trackList.append(row);
    });
  }

  yearSelect.addEventListener('change', () => {
    albumYear = Number(yearSelect.value) || nowYear;
    renderAlbumYears();
  });

  // Compare real browser timings over identical synthetic data. The stack
  // removes with pop(); the alternative scans every row to locate the newest
  // active item for each undo (O(n) per undo). Setup is outside timed sections.
  function runBenchmark() {
    benchmarkResults.innerHTML = '<span class="benchmark-loading">RUNNING A SMALL TEST…</span>';
    const count = 10000;
    const undoCount = 250;
    const trials = 3;
    const stackTimes = [];
    const linearTimes = [];

    for (let trial = 0; trial < trials; trial += 1) {
      const stack = new Stack(Array.from({ length: count }, (_, id) => ({ id })));
      const stackStart = performance.now();
      for (let i = 0; i < undoCount; i += 1) stack.pop();
      stackTimes.push(performance.now() - stackStart);

      const linearItems = Array.from({ length: count }, (_, id) => ({ id, active: true }));
      const linearStart = performance.now();
      for (let undo = 0; undo < undoCount; undo += 1) {
        let newestActive = -1;
        for (let i = 0; i < linearItems.length; i += 1) {
          if (linearItems[i].active) newestActive = i;
        }
        if (newestActive >= 0) linearItems[newestActive].active = false;
      }
      linearTimes.push(performance.now() - linearStart);
    }

    const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const stackMs = median(stackTimes);
    const linearMs = median(linearTimes);
    const ratio = stackMs > 0 ? Math.max(1, Math.round(linearMs / stackMs)) : '—';
    benchmarkResults.replaceChildren(
      metric(`${stackMs.toFixed(2)} ms`, `STACK · ${undoCount} POPS`),
      metric(`${linearMs.toFixed(2)} ms`, `LINEAR · ${undoCount} SCANS`),
      metric(`${ratio}×`, 'STACK FASTER')
    );
  }

  function metric(value, label) {
    const container = document.createElement('div');
    container.className = 'benchmark-metric';
    const strong = document.createElement('strong');
    strong.textContent = value;
    const caption = document.createElement('span');
    caption.textContent = label;
    container.append(strong, caption);
    return container;
  }

  document.querySelector('#benchmark-button').addEventListener('click', runBenchmark);
  const orderDialog = document.querySelector('#order-dialog');
  document.querySelector('#order-preview').addEventListener('click', () => orderDialog.showModal());
  document.querySelector('#dialog-close').addEventListener('click', () => orderDialog.close());
  document.querySelector('#dialog-done').addEventListener('click', () => orderDialog.close());
  orderDialog.addEventListener('click', event => {
    if (event.target === orderDialog) orderDialog.close();
  });

  renderEntries();
  window.setTimeout(runBenchmark, 150);
})();
