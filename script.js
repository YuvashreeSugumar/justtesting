// Pink Pals Memory — kid-friendly PWA game
// No tracking, no ads. Suitable for ages 5–15.

const gridEl = document.getElementById('grid');
const movesEl = document.getElementById('moves');
const timeEl = document.getElementById('time');
const bestEl = document.getElementById('best');
const newGameBtn = document.getElementById('newGameBtn');
const difficultySel = document.getElementById('difficulty');
const winModal = document.getElementById('winModal');
const winStats = document.getElementById('winStats');
const playAgainBtn = document.getElementById('playAgainBtn');
const soundBtn = document.getElementById('soundBtn');
const installBtn = document.getElementById('installBtn');

let first, second, lock = false, moves = 0, matched = 0;
let startTime = null, timerId = null;
let soundOn = true;
let deferredPrompt = null;

const allCards = [
  'crown','heart','star','butterfly','unicorn','lipstick',
  'purse','mirror','shoe','rainbow','flower','dress'
];

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function pad(n){ return String(n).padStart(2,'0'); }

function startTimer(){
  startTime = Date.now();
  timerId = setInterval(()=>{
    const s = Math.floor((Date.now() - startTime)/1000);
    timeEl.textContent = pad(Math.floor(s/60)) + ':' + pad(s%60);
  }, 500);
}

function stopTimer(){
  clearInterval(timerId);
  timerId = null;
}

function playTone(freq=600, dur=80){
  if(!soundOn) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    osc.start();
    setTimeout(()=>{ osc.stop(); ctx.close(); }, dur);
  } catch(e){ /* ignore */ }
}

function getPairsByDifficulty(diff){
  if(diff === 'easy') return 6;
  if(diff === 'hard') return 10;
  return 8; // medium
}

function buildDeck(){
  const pairs = getPairsByDifficulty(difficultySel.value);
  const chosen = shuffle([...allCards]).slice(0, pairs);
  const deck = shuffle([...chosen, ...chosen]);
  return deck;
}

function renderGrid(){
  gridEl.innerHTML = '';
  const deck = buildDeck();
  deck.forEach(name=>{
    const card = document.createElement('button');
    card.className = 'card';
    card.setAttribute('aria-label', 'Memory card');
    card.innerHTML = `
      <div class="inner">
        <div class="back"><span>🩷</span></div>
        <div class="face"><img alt="${name}" src="assets/cards/${name}.svg"/></div>
      </div>
    `;
    card.addEventListener('click', ()=> flip(card, name));
    gridEl.appendChild(card);
  });
}

function reset(){
  first = null; second = null; lock = false; moves = 0; matched = 0;
  movesEl.textContent = '0';
  timeEl.textContent = '00:00';
  stopTimer();
  renderGrid();
}

function flip(card, name){
  if(lock || card.classList.contains('flipped') || card.classList.contains('matched')) return;
  if(!timerId) startTimer();
  card.classList.add('flipped');
  playTone(700, 70);
  if(!first){ first = { card, name }; return; }
  if(!second){ second = { card, name }; moves++; movesEl.textContent = moves; checkMatch(); }
}

function checkMatch(){
  if(!first || !second) return;
  lock = true;
  if(first.name === second.name){
    playTone(900, 100);
    setTimeout(()=>{
      first.card.classList.add('matched');
      second.card.classList.add('matched');
      first = second = null;
      lock = false;
      matched += 2;
      if(matched === document.querySelectorAll('.card').length){
        win();
      }
    }, 400);
  } else {
    playTone(300, 100);
    setTimeout(()=>{
      first.card.classList.remove('flipped');
      second.card.classList.remove('flipped');
      first = second = null;
      lock = false;
    }, 700);
  }
}

function win(){
  stopTimer();
  const totalTime = timeEl.textContent;
  const pairs = getPairsByDifficulty(difficultySel.value);
  winStats.textContent = `You matched ${pairs} pairs in ${moves} moves and ${totalTime}.`;
  winModal.hidden = false;
  // Save best score locally
  const key = 'best-' + difficultySel.value;
  const prev = localStorage.getItem(key);
  const score = JSON.stringify({moves, time: totalTime});
  if(!prev || JSON.parse(prev).moves > moves) {
    localStorage.setItem(key, score);
  }
  const best = JSON.parse(localStorage.getItem(key) || score);
  bestEl.textContent = best ? (best.moves + ' moves, ' + best.time) : '—';
}

function newGame(){
  reset();
  winModal.hidden = true;
  const key = 'best-' + difficultySel.value;
  const best = localStorage.getItem(key);
  bestEl.textContent = best ? (JSON.parse(best).moves + ' moves, ' + JSON.parse(best).time) : '—';
}

newGameBtn.addEventListener('click', newGame);
playAgainBtn.addEventListener('click', newGame);
difficultySel.addEventListener('change', newGame);
soundBtn.addEventListener('click', ()=>{
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? '🔈' : '🔇';
});

// PWA install
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'inline-block';
});
installBtn.addEventListener('click', async () => {
  if(!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.style.display = 'none';
});

// Service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js');
  });
}

// Start first game
newGame();
