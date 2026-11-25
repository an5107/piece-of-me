(() => {
  'use strict';

  const startButton = document.querySelector('#voice-start');
  const stopButton = document.querySelector('#voice-stop');
  const saveButton = document.querySelector('#voice-save');
  const discardButton = document.querySelector('#voice-discard');
  const panel = document.querySelector('#voice-panel');
  const stateLabel = document.querySelector('#voice-state');
  const timerLabel = document.querySelector('#voice-timer');
  const buttonTimer = document.querySelector('.voice-button-time');
  const transcriptStatus = document.querySelector('#voice-transcript-status');
  const keepAudio = document.querySelector('#keep-audio');
  const preview = document.querySelector('#voice-preview');
  const finishedActions = document.querySelector('#voice-finished-actions');
  const textarea = document.querySelector('#entry-input');
  const form = document.querySelector('#entry-form');
  const formStatus = document.querySelector('#form-status');
  const entriesList = document.querySelector('#entries-list');
  const DB_NAME = 'piece-of-me-audio';
  const STORE_NAME = 'recordings';
  let stream = null;
  let recorder = null;
  let chunks = [];
  let clip = null;
  let clipUrl = null;
  let recognition = null;
  let recognitionDone = Promise.resolve();
  let transcript = '';
  let timer = null;
  let pending = null;
  let startedAt = 0;

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) return reject(new Error('Audio storage is unavailable in this browser.'));
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Could not open local audio storage.'));
    });
  }
  async function putAudio(id, blob) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite'); transaction.objectStore(STORE_NAME).put(blob, id);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error || new Error('Could not save audio on this device.')); };
      transaction.onabort = () => { db.close(); reject(transaction.error || new Error('Audio save was cancelled.')); };
    });
  }
  async function getAudio(id) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
      request.onsuccess = () => { db.close(); resolve(request.result || null); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  }
  async function deleteAudio(id) {
    if (!id) return;
    try {
      const db = await openDb();
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite'); transaction.objectStore(STORE_NAME).delete(id);
        transaction.oncomplete = resolve; transaction.onerror = () => reject(transaction.error);
      });
      db.close();
    } catch (error) { /* A missing clip does not affect its saved transcript. */ }
  }
  function setStatus(message) { transcriptStatus.textContent = message; }
  function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function updateTimer() {
    const value = formatTime(Date.now() - startedAt);
    timerLabel.textContent = value;
    buttonTimer.textContent = value;
  }
  function clearPreview() {
    preview.pause(); preview.removeAttribute('src'); preview.load(); preview.hidden = true;
    if (clipUrl) URL.revokeObjectURL(clipUrl);
    clipUrl = null;
  }
  function setRecordingButton(recording) {
    startButton.classList.toggle('is-recording', recording);
    startButton.classList.toggle('is-requesting', !recording && startButton.disabled);
    startButton.disabled = recording;
    buttonTimer.hidden = !recording;
    startButton.querySelector('.voice-button-label').textContent = recording ? 'Recording' : 'Say it.';
  }
  function showFinished() {
    stopButton.hidden = true;
    finishedActions.hidden = false;
    preview.hidden = false;
    clipUrl = URL.createObjectURL(clip);
    preview.src = clipUrl;
    stateLabel.textContent = 'READY TO SAVE';
    document.querySelector('#voice-indicator').classList.remove('is-recording');
    setRecordingButton(false);
    if (transcript.trim()) {
      textarea.value = transcript.trim();
      setStatus('Transcript is ready in the text field. Edit it if you like, or keep it exactly as spoken.');
    } else if (recognitionSupported()) setStatus('No words came through. Replay, try again, or type your note below.');
    else setStatus('Speech-to-text is not supported here. Type a transcript below, or keep the original audio.');
  }
  function recognitionSupported() { return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition); }
  function startSpeechRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { recognitionDone = Promise.resolve(); setStatus('Recording is working. Speech-to-text is not supported in this browser; you can type below.'); return; }
    let markEnded; recognitionDone = new Promise(resolve => { markEnded = resolve; });
    try {
      recognition = new Recognition(); recognition.continuous = true; recognition.interimResults = true; recognition.lang = navigator.language || 'en-US';
      recognition.onresult = event => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i += 1) { const phrase = event.results[i][0].transcript; if (event.results[i].isFinal) transcript += phrase; else interim += phrase; }
        textarea.value = `${transcript}${interim}`;
        setStatus(interim ? 'Listening. Speech-to-text is a browser feature; words stay as recognized.' : 'Speech-to-text is on. No cleanup or rewriting.');
      };
      recognition.onerror = event => { if (event.error !== 'no-speech' && event.error !== 'aborted') setStatus('Audio recording continues. Browser speech-to-text is unavailable for this take.'); };
      recognition.onend = () => markEnded(); recognition.start(); setStatus('Recording. Browser speech-to-text is on where supported.');
    } catch (error) { markEnded(); setStatus('Audio recording continues. Speech-to-text could not start in this browser.'); }
  }
  async function finishRecording() {
    if (stream) stream.getTracks().forEach(track => track.stop()); stream = null;
    if (recognition) { try { recognition.stop(); } catch (error) {} }
    await Promise.race([recognitionDone, new Promise(resolve => window.setTimeout(resolve, 1200))]);
    recognition = null; showFinished();
  }
  async function beginRecording() {
    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') { panel.hidden = false; setStatus('Microphone access needs HTTPS (or localhost). You can still type below.'); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) { panel.hidden = false; setStatus('Voice recording is not supported here. Try a current browser over HTTPS, or use the text field.'); return; }
    startButton.disabled = true; startButton.classList.add('is-requesting'); panel.hidden = false;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type));
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined); chunks = []; clip = null; transcript = ''; recognitionDone = Promise.resolve(); textarea.value = ''; clearPreview(); finishedActions.hidden = true;
      stopButton.hidden = false; stateLabel.textContent = 'RECORDING'; document.querySelector('#voice-indicator').classList.add('is-recording');
      recorder.ondataavailable = event => { if (event.data && event.data.size) chunks.push(event.data); };
      recorder.onerror = () => setStatus('The browser stopped the recording unexpectedly. You can try again.');
      recorder.onstop = async () => { clip = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }); if (timer) { clearInterval(timer); timer = null; } await finishRecording(); };
      startedAt = Date.now(); timerLabel.textContent = '00:00'; buttonTimer.textContent = '00:00'; setRecordingButton(true);
      timer = window.setInterval(updateTimer, 250); startSpeechRecognition(); recorder.start(250);
    } catch (error) {
      startButton.disabled = false; startButton.classList.remove('is-requesting'); panel.hidden = false;
      const message = error && error.name === 'NotAllowedError' ? 'Microphone permission was denied. Allow mic access in browser settings, then try again.' : error && error.name === 'NotFoundError' ? 'No microphone was found. You can still type below.' : 'Could not start the microphone. Check browser permission and try again, or use text.';
      if (stream) stream.getTracks().forEach(track => track.stop()); stream = null; setStatus(message); stateLabel.textContent = 'MIC UNAVAILABLE';
    }
  }
  function stopRecording() {
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    else if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
    if (!recorder || recorder.state === 'inactive') { if (timer) { clearInterval(timer); timer = null; } if (recognition) { try { recognition.stop(); } catch (error) {} } }
  }
  function discardRecording() {
    if (timer) { clearInterval(timer); timer = null; }
    if (stream) { stream.getTracks().forEach(track => track.stop()); stream = null; }
    if (recorder && recorder.state !== 'inactive') { try { recorder.stop(); } catch (error) {} }
    if (recognition) { try { recognition.abort(); } catch (error) {} recognition = null; }
    if (clipUrl) URL.revokeObjectURL(clipUrl); clipUrl = null; clip = null; chunks = []; transcript = '';
    preview.pause(); preview.removeAttribute('src'); preview.load(); preview.hidden = true; textarea.value = '';
    panel.hidden = true; startButton.disabled = false; startButton.classList.remove('is-recording', 'is-requesting'); stopButton.hidden = true; finishedActions.hidden = true; buttonTimer.hidden = true;
    document.querySelector('#voice-indicator').classList.remove('is-recording'); stateLabel.textContent = 'READY'; timerLabel.textContent = '00:00'; buttonTimer.textContent = '00:00'; setStatus('Recording discarded.');
  }

  startButton.addEventListener('click', beginRecording);
  stopButton.addEventListener('click', stopRecording);
  discardButton.addEventListener('click', discardRecording);
  saveButton.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text && !keepAudio.checked) { setStatus('No transcript to save. Type something above, or choose to keep the original audio on this device.'); textarea.focus(); return; }
    let audioId = null;
    if (keepAudio.checked) {
      try { audioId = `voice-${globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`}`; await putAudio(audioId, clip); }
      catch (error) { setStatus('Could not keep audio locally. Uncheck audio retention to save transcript only, or try again.'); return; }
    }
    pending = { audioId };
    if (!text) textarea.value = 'Voice recording (transcription unavailable).';
    form.requestSubmit();
    const saved = formStatus.textContent.startsWith('Dropped.') || formStatus.textContent.startsWith('Voice note dropped.');
    pending = null; if (!saved && audioId) await deleteAudio(audioId); if (saved) discardRecording();
  });

  function mountAudioPlayers(container) {
    container.querySelectorAll('audio[data-audio-id]').forEach(async audio => {
      if (audio.dataset.loaded === 'true') return; audio.dataset.loaded = 'true';
      try { const blob = await getAudio(audio.dataset.audioId); if (!blob || !audio.isConnected) { if (!blob) audio.replaceWith(makeMissingAudioMessage()); return; } const url = URL.createObjectURL(blob); audio.src = url; audio.addEventListener('emptied', () => URL.revokeObjectURL(url), { once: true }); }
      catch (error) { if (audio.isConnected) audio.replaceWith(makeMissingAudioMessage()); }
    });
  }
  function makeMissingAudioMessage() { const message = document.createElement('p'); message.className = 'voice-missing-audio'; message.textContent = 'Original audio is no longer available on this device.'; return message; }
  const observer = new MutationObserver(() => mountAudioPlayers(entriesList)); observer.observe(entriesList, { childList: true, subtree: true });
  window.PieceOfMeVoice = { takePending: () => pending, mountAudioPlayers, deleteAudio }; mountAudioPlayers(entriesList);
})();
