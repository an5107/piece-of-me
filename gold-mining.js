(() => {
  'use strict';

  const GOLD_KEY = 'piece-of-me.gold-prototype.v1';
  const SAMPLE_INSIGHTS = [
    {
      id: 'quick-find-01',
      insight: 'The best ideas show up before the plan does.',
      source: 'DEMO SOURCE NOTE · NOT YOUR WRITING',
      text: 'I sketched a little neighborhood map on a receipt while waiting for the bus. It was more fun than the app I was supposed to be planning.'
    },
    {
      id: 'quick-find-02',
      insight: 'You keep choosing the long way home.',
      source: 'DEMO SOURCE NOTE · NOT YOUR WRITING',
      text: 'Took the long route again, just to see what was happening on the side streets. Found a tiny record shop I never knew was there.'
    }
  ];

  const insightsContainer = document.querySelector('#gold-insights');
  const displayList = document.querySelector('#display-list');
  const displayEmpty = document.querySelector('#display-empty');
  const displayCount = document.querySelector('#display-count');
  if (!insightsContainer || !displayList) return;

  function loadGoldState() {
    try {
      const state = JSON.parse(localStorage.getItem(GOLD_KEY) || '{}');
      return {
        dismissed: Array.isArray(state.dismissed) ? state.dismissed : [],
        saved: Array.isArray(state.saved) ? state.saved.filter(piece => piece && typeof piece.id === 'string' && typeof piece.insight === 'string' && typeof piece.sourceText === 'string') : [],
        roughDismissed: state.roughDismissed === true,
        developed: state.developed && typeof state.developed.insight === 'string' ? state.developed : null
      };
    } catch (error) {
      return { dismissed: [], saved: [], roughDismissed: false, developed: null };
    }
  }

  const state = loadGoldState();
  function persist() {
    try { localStorage.setItem(GOLD_KEY, JSON.stringify(state)); } catch (error) { /* Keep this demo usable if storage is blocked. */ }
  }
  function makeButton(text, className, handler) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = text;
    button.addEventListener('click', handler);
    return button;
  }
  function makeSource(label, text) {
    const quote = document.createElement('blockquote');
    quote.className = 'gold-source';
    const sourceLabel = document.createElement('span');
    sourceLabel.textContent = label;
    const sourceText = document.createElement('p');
    sourceText.textContent = text;
    quote.append(sourceLabel, sourceText);
    return quote;
  }

  function renderQuickFinds() {
    insightsContainer.replaceChildren();
    const visible = SAMPLE_INSIGHTS.filter(piece => !state.dismissed.includes(piece.id));
    for (const piece of visible) {
      const card = document.createElement('article');
      card.className = 'gold-card';
      const top = document.createElement('div');
      top.className = 'gold-card-top';
      const kind = document.createElement('span');
      kind.className = 'gold-kind';
      kind.textContent = 'QUICK FIND · AI PROTOTYPE';
      const spark = document.createElement('span');
      spark.className = 'gold-spark';
      spark.setAttribute('aria-hidden', 'true');
      spark.textContent = '✳';
      top.append(kind, spark);
      const insight = document.createElement('p');
      insight.className = 'gold-insight';
      insight.textContent = piece.insight;
      card.append(top, insight, makeSource(piece.source, piece.text));
      const actions = document.createElement('div');
      actions.className = 'gold-actions';
      const alreadySaved = state.saved.some(saved => saved.id === piece.id);
      actions.append(
        makeButton(alreadySaved ? 'SAVED TO ON DISPLAY ✓' : 'SAVE TO ON DISPLAY +', 'gold-text-button', () => savePiece(piece)),
        makeButton('PASS ×', 'gold-text-button', () => dismissPiece(piece.id))
      );
      card.append(actions);
      insightsContainer.append(card);
    }
  }

  function savePiece(piece) {
    if (state.saved.some(saved => saved.id === piece.id)) return;
    state.saved.push({ id: piece.id, insight: piece.insight, sourceText: piece.text, sourceLabel: piece.source });
    persist();
    renderQuickFinds();
    renderSavedInDisplay();
  }

  function dismissPiece(id) {
    if (!state.dismissed.includes(id)) state.dismissed.push(id);
    persist();
    renderQuickFinds();
  }

  const roughCard = document.querySelector('#rough-card');
  const roughActions = document.querySelector('#rough-actions');
  const digSession = document.querySelector('#dig-session');
  const digDeeperButton = document.querySelector('#dig-deeper');
  const dismissRoughButton = document.querySelector('#dismiss-rough');
  const digSteps = [
    {
      prompt: 'What part of that still has a little spark?',
      choices: ['The odd little map', 'Making it just for fun', 'Skip this bit'],
      response: 'A tiny map of places you stumble into—not a big app, just a pocket-sized field guide.'
    },
    {
      prompt: 'Nice. What would make it feel like yours?',
      choices: ['Drawn on scraps', 'Made for wandering', 'That’s enough'],
      response: 'A hand-drawn city guide made from the places you find when you take the long way.'
    }
  ];
  let digStep = 0;
  let finalPiece = state.developed;

  function revealDigSession() {
    if (!digSession) return;
    roughActions.hidden = true;
    digSession.hidden = false;
    if (finalPiece) {
      renderFinalPiece();
      return;
    }
    showDigStep();
  }

  function showDigStep() {
    digSession.replaceChildren();
    const step = digSteps[digStep];
    const label = document.createElement('p');
    label.className = 'dig-step-label';
    label.textContent = `AI PROTOTYPE DEMO · ${digStep + 1} / ${digSteps.length}`;
    const prompt = document.createElement('p');
    prompt.className = 'dig-prompt';
    prompt.textContent = step.prompt;
    const choices = document.createElement('div');
    choices.className = 'dig-choices';
    step.choices.forEach(choice => {
      choices.append(makeButton(choice, 'dig-choice', () => {
        if (digStep < digSteps.length - 1) {
          digStep += 1;
          showDigStep();
        } else {
          finalPiece = { insight: digSteps[1].response, sourceText: document.querySelector('#rough-card .gold-source p').textContent };
          state.developed = finalPiece;
          persist();
          renderFinalPiece();
        }
      }));
    });
    const skip = makeButton('Leave it here ×', 'gold-text-button', () => {
      digSession.hidden = true;
      roughActions.hidden = false;
    });
    const disclaimer = document.createElement('p');
    disclaimer.className = 'prototype-disclaimer';
    disclaimer.textContent = 'Scripted demo replies—not a live AI. Your original note is unchanged.';
    digSession.append(label, prompt, choices, skip, disclaimer);
  }

  function renderFinalPiece() {
    digSession.replaceChildren();
    digSession.hidden = false;
    const label = document.createElement('p');
    label.className = 'dig-step-label';
    label.textContent = 'ROUGH CUT → GOLD PIECE · AI PROTOTYPE DEMO';
    const insight = document.createElement('p');
    insight.className = 'dig-response';
    insight.textContent = finalPiece.insight;
    const source = makeSource('DEMO SOURCE NOTE · ORIGINAL EXAMPLE, UNCHANGED', finalPiece.sourceText);
    const saved = state.saved.some(piece => piece.id === 'developed-rough-cut');
    const save = makeButton(saved ? 'SAVED TO ON DISPLAY ✓' : 'SAVE GOLD PIECE TO ON DISPLAY +', 'gold-button', () => {
      if (!state.saved.some(piece => piece.id === 'developed-rough-cut')) {
        state.saved.push({ id: 'developed-rough-cut', insight: finalPiece.insight, sourceText: finalPiece.sourceText, sourceLabel: 'DEMO SOURCE NOTE · ORIGINAL EXAMPLE, UNCHANGED' });
        persist();
        renderSavedInDisplay();
        renderFinalPiece();
      }
    });
    const restart = makeButton('START THAT DEMO AGAIN ↶', 'gold-text-button', () => {
      digStep = 0;
      finalPiece = null;
      state.developed = null;
      persist();
      showDigStep();
    });
    const disclaimer = document.createElement('p');
    disclaimer.className = 'prototype-disclaimer';
    disclaimer.textContent = 'This is a scripted prototype, not AI output. Nothing was inferred from your notes.';
    digSession.append(label, insight, source, save, restart, disclaimer);
  }

  if (state.roughDismissed && roughCard) roughCard.hidden = true;
  if (dismissRoughButton) dismissRoughButton.addEventListener('click', () => {
    state.roughDismissed = true;
    persist();
    roughCard.hidden = true;
  });
  if (digDeeperButton) digDeeperButton.addEventListener('click', revealDigSession);

  function renderSavedInDisplay() {
    const savedIds = new Set(state.saved.map(piece => piece.id));
    displayList.querySelectorAll('.gold-saved-card').forEach(card => {
      if (!savedIds.has(card.dataset.goldId)) card.remove();
    });
    for (const piece of state.saved) {
      if (displayList.querySelector(`[data-gold-id="${CSS.escape(piece.id)}"]`)) continue;
      const card = document.createElement('article');
      card.className = 'gold-saved-card';
      card.dataset.goldId = piece.id;
      const meta = document.createElement('div');
      meta.className = 'entry-meta';
      meta.textContent = 'GOLD PIECE · PROTOTYPE DEMO';
      meta.append(makeButton('REMOVE FROM DISPLAY −', 'gold-text-button', () => {
        state.saved = state.saved.filter(item => item.id !== piece.id);
        persist();
        renderQuickFinds();
        renderSavedInDisplay();
      }));
      const insight = document.createElement('p');
      insight.className = 'gold-insight';
      insight.textContent = piece.insight;
      card.append(meta, insight, makeSource(piece.sourceLabel || 'DEMO SOURCE NOTE · ORIGINAL EXAMPLE, UNCHANGED', piece.sourceText));
      displayList.append(card);
    }
    const rawDisplayCards = [...displayList.children].some(child => !child.classList.contains('gold-saved-card'));
    displayEmpty.hidden = rawDisplayCards || state.saved.length > 0;
    const rawCount = Number.parseInt(displayCount.textContent, 10) || 0;
    const rawPieces = Math.max(0, rawCount - displayList.querySelectorAll('.gold-saved-card').length);
    const total = rawPieces + state.saved.length;
    displayCount.textContent = `${String(total).padStart(2, '0')} ${total === 1 ? 'PIECE' : 'PIECES'}`;
  }

  // Existing app redraws its gallery after raw-entry actions. Restore the
  // independent Gold Pieces after those redraws without changing raw entries.
  const observer = new MutationObserver(() => renderSavedInDisplay());
  observer.observe(displayList, { childList: true });
  renderQuickFinds();
  if (finalPiece && digSession && !state.roughDismissed) {
    // Keep the demo card compact until the user chooses Dig Deeper.
  }
  renderSavedInDisplay();
})();
