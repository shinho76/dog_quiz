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

function buildQuestions() {
  state.questions = shuffle(BREEDS).slice(0, TOTAL_QUESTIONS);
}

function generateChoices(correctBreed) {
  const pool = shuffle(BREEDS.filter(b => b !== correctBreed));
  const all  = shuffle([correctBreed, ...pool.slice(0, 3)]);
  return { choices: all, correctIndex: all.indexOf(correctBreed) };
}

// ── Timer ─────────────────────────────────
function startTimer() {
  state.timeLeft = TIMER_SECONDS;
  renderTimer();
  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    renderTimer();
    if (state.timeLeft <= 0) { stopTimer(); handleAnswer(null); }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerInterval = null;
}

function renderTimer() {
  const pct   = (state.timeLeft / TIMER_SECONDS) * 100;
  const bar   = $('timer-bar');
  const label = document.querySelector('.timer-label');
  bar.style.width              = pct + '%';
  $('timer-count').textContent = state.timeLeft;
  const urgent = state.timeLeft <= 5;
  bar.classList.toggle('urgent', urgent);
  label.classList.toggle('urgent', urgent);
}

// ── Web Audio 음향 ────────────────────────
let audioCtx = null;

function getAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function beep(freq, startTime, duration, vol = 0.22, type = 'sine') {
  try {
    const ctx  = getAudio();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  } catch (_) {}
}

function playCorrect() {
  try {
    const ctx = getAudio();
    const t   = ctx.currentTime;
    beep(523, t,        0.18, 0.22);          // C5
    beep(659, t + 0.11, 0.18, 0.22);          // E5
    beep(784, t + 0.22, 0.30, 0.26);          // G5
  } catch (_) {}
}

function playWrong() {
  try {
    const ctx = getAudio();
    const t   = ctx.currentTime;
    beep(311, t,        0.16, 0.20, 'triangle'); // Eb4
    beep(233, t + 0.13, 0.24, 0.18, 'triangle'); // Bb3
  } catch (_) {}
}

// ── 폭죽 confetti ─────────────────────────
function launchConfetti() {
  const canvas = $('confetti-canvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const COLORS = ['#FF6B6B','#FFD93D','#6BCB77','#4ECDC4','#FF85A1','#A8D8EA','#FFB347','#B39DDB'];
  const particles = Array.from({ length: 150 }, () => ({
    x:    Math.random() * canvas.width,
    y:    -Math.random() * canvas.height * 0.5,
    w:    Math.random() * 13 + 6,
    h:    Math.random() * 7  + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot:  Math.random() * 360,
    rotV: (Math.random() - 0.5) * 9,
    vy:   Math.random() * 3.5 + 2,
    vx:   (Math.random() - 0.5) * 2.5,
    opacity: 1,
  }));

  const start = Date.now();
  let raf;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - start;
    let alive = false;
    for (const p of particles) {
      p.y += p.vy; p.x += p.vx; p.rot += p.rotV;
      if (elapsed > 1800) p.opacity -= 0.022;
      if (p.opacity <= 0) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.w > 14) { ctx.arc(0, 0, p.h / 2, 0, Math.PI * 2); }
      else          { ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h); }
      ctx.fill();
      ctx.restore();
    }
    if (alive && elapsed < 3200) { raf = requestAnimationFrame(draw); }
    else { canvas.style.display = 'none'; cancelAnimationFrame(raf); }
  })();
}

// ── 사진 글로우 ───────────────────────────
function glowPhoto(type) {
  const container = document.querySelector('.photo-container');
  container.classList.remove('glow-correct', 'glow-wrong');
  void container.offsetWidth; // reflow to restart animation
  container.classList.add(type === 'correct' ? 'glow-correct' : 'glow-wrong');
}

// ── Image fetching ────────────────────────
function fetchWikiImage(wikiTitle) {
  const url = 'https://en.wikipedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(wikiTitle) +
    '&prop=pageimages&format=json&pithumbsize=800&origin=*';
  return fetch(url)
    .then(r => r.json())
    .then(data => {
      const page = Object.values(data.query.pages)[0];
      if (!page.thumbnail) throw new Error('no image');
      return page.thumbnail.source;
    });
}

function fetchDogCeoImage(apiPath) {
  return fetch('https://dog.ceo/api/breed/' + apiPath + '/images/random')
    .then(r => r.json())
    .then(d => {
      if (d.status !== 'success') throw new Error('no image');
      return d.message;
    });
}

function fetchImage(breed) {
  const timeout = ms => new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms));
  return Promise.race([fetchWikiImage(breed.wikiTitle), timeout(7000)])
    .catch(() => fetchDogCeoImage(breed.apiPath));
}

function showImage(src) {
  const img = $('dog-photo');
  img.onload  = () => { $('loading-spinner').classList.add('hidden'); img.classList.add('loaded'); enableButtons(); };
  img.onerror = showFallback;
  img.src = src;
}

function showFallback() {
  $('loading-spinner').classList.add('hidden');
  $('dog-photo').classList.remove('loaded');
  $('photo-fallback').classList.add('visible');
  enableButtons();
}

function resetPhoto() {
  const img = $('dog-photo');
  img.src = '';
  img.classList.remove('loaded');
  document.querySelector('.photo-container').classList.remove('glow-correct', 'glow-wrong');
  $('loading-spinner').classList.remove('hidden');
  $('photo-fallback').classList.remove('visible');
}

// ── Buttons ───────────────────────────────
function enableButtons()  { document.querySelectorAll('.btn-answer').forEach(b => { b.disabled = false; }); }
function disableButtons() { document.querySelectorAll('.btn-answer').forEach(b => { b.disabled = true;  }); }

// ── 견종 정보 카드 ─────────────────────────
function showBreedInfo(breed, type, onNext) {
  const badge = $('info-badge');
  if (type === 'correct') {
    badge.textContent = '✅ 정답!';
    badge.className   = 'info-badge correct';
  } else if (type === 'timeout') {
    badge.textContent = '⏰ 시간 초과! 정답은:';
    badge.className   = 'info-badge timeout';
  } else {
    badge.textContent = '❌ 틀렸어요! 정답은:';
    badge.className   = 'info-badge wrong';
  }

  $('info-breed-name').textContent  = breed.korean;
  $('info-breed-en').textContent    = breed.english;
  $('info-description').textContent = breed.description;

  $('breed-info-sheet').classList.add('visible');

  // 버튼 클릭으로만 다음 문제 진행 (자동 진행 없음)
  $('info-next-btn').onclick = () => {
    $('breed-info-sheet').classList.remove('visible');
    onNext();
  };
}

// ── Load a question ───────────────────────
function loadQuestion(index) {
  state.answered = false;

  const breed = state.questions[index];
  const { choices, correctIndex } = generateChoices(breed);
  state.choices      = choices;
  state.correctIndex = correctIndex;

  $('q-current').textContent = index + 1;
  $('q-total').textContent   = TOTAL_QUESTIONS;
  $('score').textContent     = state.score;

  document.querySelectorAll('.btn-answer').forEach((btn, i) => {
    btn.disabled  = true;
    btn.className = 'btn-answer';
    btn.innerHTML =
      `<span>${choices[i].korean}</span><br>` +
      `<span style="font-size:0.72rem;font-weight:400;opacity:0.6">${choices[i].english}</span>`;
  });

  resetPhoto();
  fetchImage(breed).then(showImage).catch(showFallback);
  startTimer();
}

// ── Handle answer ─────────────────────────
function handleAnswer(selectedBtn) {
  if (state.answered) return;
  state.answered = true;
  stopTimer();
  disableButtons();

  const btns         = document.querySelectorAll('.btn-answer');
  const ci           = state.correctIndex;
  const correctBreed = state.questions[state.currentIndex];

  if (selectedBtn !== null) {
    const idx = parseInt(selectedBtn.dataset.index, 10);

    if (idx === ci) {
      // ── 정답 ──────────────────────────────
      state.score++;
      $('score').textContent = state.score;
      btns[ci].classList.add('correct');
      playCorrect();
      glowPhoto('correct');
      launchConfetti();
      setTimeout(() => showBreedInfo(correctBreed, 'correct', advance), 300);

    } else {
      // ── 오답 ──────────────────────────────
      selectedBtn.classList.add('wrong');
      btns[ci].classList.add('correct');
      playWrong();
      glowPhoto('wrong');
      setTimeout(() => showBreedInfo(correctBreed, 'wrong', advance), 700);
    }

  } else {
    // ── 타임오버 ───────────────────────────
    btns[ci].classList.add('correct');
    setTimeout(() => showBreedInfo(correctBreed, 'timeout', advance), 500);
  }
}

// ── Advance ───────────────────────────────
function advance() {
  state.currentIndex++;
  if (state.currentIndex < TOTAL_QUESTIONS) {
    loadQuestion(state.currentIndex);
  } else {
    showEndScreen();
  }
}

// ── Grade ─────────────────────────────────
function getGrade(score) {
  if (score === 10) return { emoji: '🏆', title: '강아지 마스터!',  msg: '완벽해요! 진짜 강아지 박사님이에요! 🎉' };
  if (score >= 8)  return { emoji: '🦮', title: '강아지 전문가',    msg: '대단해요! 거의 다 맞혔어요! 👏' };
  if (score >= 5)  return { emoji: '🐕', title: '강아지 팬',        msg: '잘했어요! 조금만 더 공부해봐요! 📚' };
  return              { emoji: '🐾', title: '강아지 입문자',    msg: '괜찮아요! 다시 도전해봐요! 💪' };
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
  $('breed-info-sheet').classList.remove('visible');
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
  $('answer-grid').addEventListener('click', e => {
    const btn = e.target.closest('.btn-answer');
    if (btn && !btn.disabled) handleAnswer(btn);
  });
}

document.addEventListener('DOMContentLoaded', initApp);
