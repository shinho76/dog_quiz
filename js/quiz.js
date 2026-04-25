'use strict';

const TOTAL_QUESTIONS = 10;
const TIMER_SECONDS   = 15;
const MAX_SCORE       = TOTAL_QUESTIONS * 10; // 글자만 맞추면 10점 × 10문제 = 100점

const state = {
  questions:     [],
  currentIndex:  0,
  score:         0,
  timerInterval: null,
  timeLeft:      TIMER_SECONDS,
  answered:      false,
  choices:       [],
  correctIndex:  -1,
  flipped:       false, // 사진을 봤는지 여부
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

// ── 음향 ─────────────────────────────────
const sfx = {
  bark:  new Audio('audio/bark.mp3'),
  growl: new Audio('audio/growl.mp3'),
};
sfx.bark.volume  = 0.85;
sfx.growl.volume = 0.80;
sfx.bark.load();
sfx.growl.load();

function playCorrect() {
  try { sfx.bark.currentTime = 0;  sfx.bark.play().catch(() => {}); } catch (_) {}
}

function playWrong() {
  try { sfx.growl.currentTime = 0; sfx.growl.play().catch(() => {}); } catch (_) {}
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
    x:     Math.random() * canvas.width,
    y:    -Math.random() * canvas.height * 0.5,
    w:     Math.random() * 13 + 6,
    h:     Math.random() * 7  + 4,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rot:   Math.random() * 360,
    rotV:  (Math.random() - 0.5) * 9,
    vy:    Math.random() * 3.5 + 2,
    vx:    (Math.random() - 0.5) * 2.5,
    opacity: 1,
  }));

  const start = Date.now(); let raf;
  (function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const e = Date.now() - start; let alive = false;
    for (const p of particles) {
      p.y += p.vy; p.x += p.vx; p.rot += p.rotV;
      if (e > 1800) p.opacity -= 0.022;
      if (p.opacity <= 0) continue;
      alive = true;
      ctx.save(); ctx.globalAlpha = p.opacity;
      ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color; ctx.beginPath();
      if (p.w > 14) ctx.arc(0, 0, p.h / 2, 0, Math.PI * 2);
      else ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.fill(); ctx.restore();
    }
    if (alive && e < 3200) raf = requestAnimationFrame(draw);
    else { canvas.style.display = 'none'; cancelAnimationFrame(raf); }
  })();
}

// ── 사진 글로우 ───────────────────────────
function glowPhoto(type) {
  const back = document.querySelector('.flip-card-back');
  back.classList.remove('glow-correct', 'glow-wrong');
  void back.offsetWidth;
  back.classList.add(type === 'correct' ? 'glow-correct' : 'glow-wrong');
}

// ── 카드 뒤집기 ───────────────────────────
function flipCard() {
  if (state.answered || state.flipped) return;
  state.flipped = true;
  $('flip-card-inner').classList.add('flipped');
}

// ── Image fetching ────────────────────────
function fetchWikiImage(wikiTitle) {
  const url = 'https://en.wikipedia.org/w/api.php?action=query&titles=' +
    encodeURIComponent(wikiTitle) +
    '&prop=pageimages&format=json&pithumbsize=800&origin=*';
  return fetch(url).then(r => r.json()).then(data => {
    const page = Object.values(data.query.pages)[0];
    if (!page.thumbnail) throw new Error('no image');
    return page.thumbnail.source;
  });
}

function fetchDogCeoImage(apiPath) {
  return fetch('https://dog.ceo/api/breed/' + apiPath + '/images/random')
    .then(r => r.json()).then(d => {
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
  img.onload  = () => { $('loading-spinner').classList.add('hidden'); img.classList.add('loaded'); };
  img.onerror = showFallback;
  img.src = src;
}

function showFallback() {
  $('loading-spinner').classList.add('hidden');
  $('dog-photo').classList.remove('loaded');
  $('photo-fallback').classList.add('visible');
}

function resetPhoto() {
  const img = $('dog-photo');
  img.src = ''; img.classList.remove('loaded');
  document.querySelector('.flip-card-back').classList.remove('glow-correct', 'glow-wrong');
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

  $('info-next-btn').onclick = () => {
    $('breed-info-sheet').classList.remove('visible');
    onNext();
  };
}

// ── Load a question ───────────────────────
function loadQuestion(index) {
  state.answered = false;
  state.flipped  = false;

  const breed = state.questions[index];
  const { choices, correctIndex } = generateChoices(breed);
  state.choices      = choices;
  state.correctIndex = correctIndex;

  // 헤더 업데이트
  $('q-current').textContent = index + 1;
  $('q-total').textContent   = TOTAL_QUESTIONS;
  $('score').textContent     = state.score;

  // 카드 앞면으로 초기화 (즉시, 애니메이션 없이)
  const inner = $('flip-card-inner');
  inner.style.transition = 'none';
  inner.classList.remove('flipped');
  void inner.offsetWidth; // reflow
  inner.style.transition = '';

  // 힌트 텍스트 표시
  $('clue-content').textContent = breed.description;

  // 선택지 버튼 (즉시 활성화 — 글자만 보고 바로 답할 수 있음)
  document.querySelectorAll('.btn-answer').forEach((btn, i) => {
    btn.disabled  = false;
    btn.className = 'btn-answer';
    btn.innerHTML =
      `<span>${choices[i].korean}</span><br>` +
      `<span style="font-size:0.7rem;font-weight:400;opacity:0.6">${choices[i].english}</span>`;
  });

  // 백그라운드에서 사진 로딩 시작 (뒤집을 때 바로 나오도록)
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

  const wasFlipped   = state.flipped; // 답하기 전 사진을 봤는지 기록
  const btns         = document.querySelectorAll('.btn-answer');
  const ci           = state.correctIndex;
  const correctBreed = state.questions[state.currentIndex];

  // 아직 안 뒤집었으면 자동으로 뒤집어 사진 공개
  if (!state.flipped) {
    state.flipped = true;
    setTimeout(() => $('flip-card-inner').classList.add('flipped'), 180);
  }

  if (selectedBtn !== null) {
    const idx = parseInt(selectedBtn.dataset.index, 10);

    if (idx === ci) {
      // ── 정답 ──────────────────────────────
      const points = wasFlipped ? 5 : 10; // 글자만 = 10점, 사진 봄 = 5점
      state.score += points;
      $('score').textContent = state.score;
      btns[ci].classList.add('correct');
      playCorrect();
      setTimeout(() => { glowPhoto('correct'); launchConfetti(); }, 220);
      setTimeout(() => showBreedInfo(correctBreed, 'correct', advance), 350);

    } else {
      // ── 오답 ──────────────────────────────
      selectedBtn.classList.add('wrong');
      btns[ci].classList.add('correct');
      playWrong();
      setTimeout(() => glowPhoto('wrong'), 220);
      setTimeout(() => showBreedInfo(correctBreed, 'wrong', advance), 750);
    }

  } else {
    // ── 타임오버 ───────────────────────────
    btns[ci].classList.add('correct');
    setTimeout(() => showBreedInfo(correctBreed, 'timeout', advance), 600);
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

// ── Grade (최대 100점 기준) ────────────────
function getGrade(score) {
  if (score >= 100) return { emoji: '🏆', title: '강아지 마스터!', msg: '만점! 진짜 강아지 박사님이에요! 🎉' };
  if (score >= 75)  return { emoji: '🦮', title: '강아지 전문가',   msg: '대단해요! 거의 다 맞혔어요! 👏' };
  if (score >= 40)  return { emoji: '🐕', title: '강아지 팬',       msg: '잘했어요! 조금만 더 공부해봐요! 📚' };
  return               { emoji: '🐾', title: '강아지 입문자',   msg: '괜찮아요! 다시 도전해봐요! 💪' };
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
  state.flipped      = false;
  stopTimer();
  buildQuestions();
  showScreen('quiz');
  loadQuestion(0);
}

// ── Init ──────────────────────────────────
function initApp() {
  $('btn-start').addEventListener('click', startQuiz);
  $('btn-restart').addEventListener('click', startQuiz);

  // 카드 탭 → 뒤집기
  $('flip-card').addEventListener('click', flipCard);

  // 선택지 버튼
  $('answer-grid').addEventListener('click', e => {
    const btn = e.target.closest('.btn-answer');
    if (btn && !btn.disabled) handleAnswer(btn);
  });
}

document.addEventListener('DOMContentLoaded', initApp);
