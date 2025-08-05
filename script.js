const boardEl = document.getElementById('board');
const levelDisplay = document.getElementById('level-display');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const restartBtn = document.getElementById('restart');
const timeEl = document.getElementById('time');
const bestTimeEl = document.getElementById('best-time');

let levels = [];
let currentLevel = 0;
let board = [];
let player = { x: 0, y: 0 };

let timerInterval = null;
let levelStartTime = 0;

// === Fetch Level Files ===
async function fetchLevels() {
  let num = 1;
  while (true) {
    try {
      const res = await fetch(`levels/level${num}.txt`);
      if (!res.ok) break;
      const text = await res.text();
      levels.push(text);
      num++;
    } catch (e) {
      console.error("Error fetching level " + num, e);
      break;
    }
  }
}

// === Parse Level Text ===
function parseLevel(text) {
  board = text.trim().split('\n').map(line => line.split(''));
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const cell = board[y][x];
      if (cell === '@' || cell === '+') {
        player.x = x;
        player.y = y;
      }
    }
  }
}

// === Draw Board ===
function drawBoard() {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateRows = `repeat(${board.length}, 32px)`;
  boardEl.style.gridTemplateColumns = `repeat(${board[0].length}, 32px)`;

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      const char = board[y][x];
      switch (char) {
        case '#': cell.classList.add('wall'); break;
        case '.': cell.classList.add('goal'); break;
        case '$': cell.classList.add('box'); break;
        case '*': cell.classList.add('box-goal'); break;
        case '@': cell.classList.add('player'); break;
        case '+': cell.classList.add('player-goal'); break;
        default: cell.classList.add('floor');
      }
      boardEl.appendChild(cell);
    }
  }
}

// === Load Level ===
function loadLevel(index) {
  currentLevel = index;
  if (index >= levels.length) return;
  levelDisplay.textContent = `Level ${currentLevel + 1}`;
  parseLevel(levels[index]);
  drawBoard();
  startTimer();
  updateBestTimeDisplay();
}

// === Win Condition ===
function isWin() {
  return board.every(row => row.every(cell => cell !== '$'));
}

// === Movement ===
function move(dx, dy) {
  const x1 = player.x + dx;
  const y1 = player.y + dy;
  const x2 = player.x + dx * 2;
  const y2 = player.y + dy * 2;
  const target = board[y1]?.[x1];
  const beyond = board[y2]?.[x2];

  if (!target || target === '#') return;

  if (target === '$' || target === '*') {
    if (beyond === ' ' || beyond === '.') {
      board[y1][x1] = (target === '*') ? '.' : ' ';
      board[y2][x2] = (beyond === '.') ? '*' : '$';
    } else {
      return;
    }
  }

  const onGoal = board[player.y][player.x] === '+';
  board[player.y][player.x] = onGoal ? '.' : ' ';
  board[y1][x1] = (target === '.' || target === '*') ? '+' : '@';
  player.x = x1;
  player.y = y1;

  drawBoard();

  if (isWin()) {
    stopTimer();
    saveBestTime(currentLevel, getElapsedSeconds());
    setTimeout(() => alert("Level Complete!"), 100);
  }
}

// === Timer ===
function startTimer() {
  stopTimer();
  levelStartTime = Date.now();
  timerInterval = setInterval(() => {
    timeEl.textContent = getElapsedSeconds().toFixed(2);
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function getElapsedSeconds() {
  return (Date.now() - levelStartTime) / 1000;
}

// === Best Time ===
function getBestTimeKey(levelIndex) {
  return `sokoban_best_time_level${levelIndex}`;
}

function saveBestTime(levelIndex, time) {
  const key = getBestTimeKey(levelIndex);
  const best = parseFloat(localStorage.getItem(key));
  if (!best || time < best) {
    localStorage.setItem(key, time.toFixed(2));
    updateBestTimeDisplay();
  }
}

function updateBestTimeDisplay() {
  const best = localStorage.getItem(getBestTimeKey(currentLevel));
  bestTimeEl.textContent = best ?? '–';
}

// === Key Controls ===
function handleKey(e) {
  switch (e.key.toLowerCase()) {
    case 'arrowup':
    case 'w': move(0, -1); break;
    case 'arrowdown':
    case 's': move(0, 1); break;
    case 'arrowleft':
    case 'a': move(-1, 0); break;
    case 'arrowright':
    case 'd': move(1, 0); break;
  }
}

// === Navigation Buttons ===
prevBtn.addEventListener('click', () => {
  if (currentLevel > 0) loadLevel(currentLevel - 1);
});
nextBtn.addEventListener('click', () => {
  if (currentLevel < levels.length - 1) loadLevel(currentLevel + 1);
});
restartBtn.addEventListener('click', () => loadLevel(currentLevel));
document.addEventListener('keydown', handleKey);

// === Initialization ===
(async function init() {
  await fetchLevels();
  if (levels.length === 0) {
    boardEl.textContent = 'No levels found';
    return;
  }
  loadLevel(0);
})();
