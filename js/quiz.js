'use strict';

const TOTAL_QUESTIONS = 10;
const TIMER_SECONDS   = 15;

const state = {
  questions:     [],
  currentIndex:  0,
  score:         0,
  timerInterval: null,
  timeLeft:      TIMER_SECONDS,
  answered:      false,
  choices:       [],
  correctIndex:  -1,
};

// ── DOM refs ──────────────────────────────
const screens = {
  welcome: document.getElementById('screen-welcome'),
  quiz:    document.getElementById('screen-quiz'),
  end:     document.getElementById('screen-end'),
};

const $ = id => document.getElementById(id);

// ── Screen management ─────────────────────
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ── Fisher-Yates shuffle ──────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Build question list ───────────────────
function buildQuestions() {
  state.questions = shuffle(BREEDS).slice(0, TOTAL_QUESTIONS);
}

// ── Generate 4 choices for a question ─────
function generateChoices(correctBreed) {
  const pool   = shuffle(BREEDS.filter(b => b !== correctBreed));
  const wrong  = pool.slice(0, 3);
  const all    = shuffle([correctBreed, ...wrong]);
  return {
    choices:      all,
    correctIndex: all.indexOf(correctBreed),
  };
}

// ── Timer ─────────────────────────────────
function startTimer() {
  state.timeLeft = TIMER_SECONDS;
  renderTimer();

  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    renderTimer();
    if (state.timeLeft <= 0) {
      stopTimer();
      handleAnswer(null);
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}

function renderTimer() {
  const pct     = (state.timeLeft / TIMER_SECONDS) * 100;
  const bar     = $('timer-bar');
  const label   = $('timer-count');
  const wrapper = document.querySelector('.timer-label');

  bar.style.width  = pct + '%';
  label.textContent = state.timeLeft;

  const urgent = state.timeLeft <= 5;
  bar.classList.toggle('urgent', urgent);
  wrapper.classList.toggle('urgent', urgent);
}

// ── Fetch dog image ───────────────────────
function fetchDogImage(apiPath) {
  const url = 'https://dog.ceo/api/breed/' + apiPath + '/images/random';

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('timeout')), 6000)
  );

  return Promise.race([fetch(url), timeout])
    .then(r => r.json())
    .then(data => {
      if (data.status !== 'success') throw new Error('no image');
      return data.message;
    });
}

function showImage(src) {
  const img      = $('dog-photo');
  const spinner  = $('loading-spinner');
  const fallback = $('photo-fallback');

  img.onload = () => {
    spinner.classList.add('hidden');
    fallback.classList.remove('visible');
    img.classList.add('loaded');
    enableButtons();
  };
  img.onerror = () => showFallback();
  img.src = src;
}

function showFallback() {
  $('loading-spinner').classList.add('hidden');
  $('dog-photo').classList.remove('loaded');
  $('photo-fallback').classList.add('visible');
  enableButtons();
}

function resetPhoto() {
  const img      = $('dog-photo');
  const spinner  = $('loading-spinner');
  const fallback = $('photo-fallback');

  img.src = '';
  img.classList.remove('loaded');
  spinner.classList.remove('hidden');
  fallback.classList.remove('visible');
}

// ── Buttons ───────────────────────────────
function enableButtons() {
  document.querySelectorAll('.btn-answer').forEach(b => {
    b.disabled = false;
  });
}

function disableButtons() {
  document.querySelectorAll('.btn-answer').forEach(b => {
    b.disabled = true;
  });
}

// ── Load a question ───────────────────────
function loadQuestion(index) {
  state.answered = false;

  const breed = state.questions[index];
  const { choices, correctIndex } = generateChoices(breed);
  state.choices      = choices;
  state.correctIndex = correctIndex;

  // Header
  $('q-current').textContent = index + 1;
  $('q-total').textContent   = TOTAL_QUESTIONS;
  $('score').textContent     = state.score;

  // Buttons: disable until image loads, clear old state
  const btns = document.querySelectorAll('.btn-answer');
  btns.forEach((btn, i) => {
    btn.disabled = true;
    btn.className  = 'btn-answer';
    btn.innerHTML  = `<span class="kr">${choices[i].korean}</span><br><span class="en" style="font-size:0.75rem;font-weight:400;opacity:0.65">${choices[i].english}</span>`;
  });

  // Photo
  resetPhoto();

  // Fetch image, retry once on failure
  fetchDogImage(breed.apiPath)
    .then(showImage)
    .catch(() => fetchDogImage(breed.apiPath)
      .then(showImage)
      .catch(showFallback)
    );

  startTimer();
}

// ── Handle answer ─────────────────────────
function handleAnswer(selectedBtn) {
  if (state.answered) return;
  state.answered = true;
  stopTimer();
  disableButtons();

  const btns = document.querySelectorAll('.btn-answer');
  const ci   = state.correctIndex;

  if (selectedBtn !== null) {
    const selectedIndex = parseInt(selectedBtn.dataset.index, 10);
    if (selectedIndex === ci) {
      state.score++;
      $('score').textContent = state.score;
      btns[ci].classList.add('correct');
    } else {
      selectedBtn.classList.add('wrong');
      btns[ci].classList.add('correct');
    }
  } else {
    // Timed out
    btns[ci].classList.add('correct');
  }

  setTimeout(advance, 1500);
}

// ── Advance to next question or end ───────
function advance() {
  state.currentIndex++;
  if (state.currentIndex < TOTAL_QUESTIONS) {
    loadQuestion(state.currentIndex);
  } else {
    showEndScreen();
  }
}

// ── Grade system ──────────────────────────
function getGrade(score) {
  if (score === 10) return { emoji: '🏆', title: '강아지 마스터!',   msg: '완벽해요! 진짜 강아지 박사님이에요! 🎉' };
  if (score >= 8)  return { emoji: '🦮', title: '강아지 전문가',     msg: '대단해요! 거의 다 맞혔어요! 👏' };
  if (score >= 5)  return { emoji: '🐕', title: '강아지 팬',         msg: '잘했어요! 조금만 더 공부해봐요! 📚' };
  return              { emoji: '🐾', title: '강아지 입문자',     msg: '괜찮아요! 다시 도전해봐요! 💪' };
}

// ── End screen ────────────────────────────
function showEndScreen() {
  const grade = getGrade(state.score);
  $('end-emoji').textContent     = grade.emoji;
  $('end-title').textContent     = grade.title;
  $('end-score-val').textContent = state.score;
  $('end-message').textContent   = grade.msg;
  showScreen('end');
}

// ── Start / restart ───────────────────────
function startQuiz() {
  state.currentIndex = 0;
  state.score        = 0;
  state.answered     = false;
  stopTimer();

  buildQuestions();
  showScreen('quiz');
  loadQuestion(0);
}

// ── Init ──────────────────────────────────
function initApp() {
  $('btn-start').addEventListener('click', startQuiz);
  $('btn-restart').addEventListener('click', startQuiz);

  document.getElementById('answer-grid').addEventListener('click', e => {
    const btn = e.target.closest('.btn-answer');
    if (btn && !btn.disabled) handleAnswer(btn);
  });
}

document.addEventListener('DOMContentLoaded', initApp);
