// Simple Sokoban implementation

const boardEl = document.getElementById('board');
const levelDisplay = document.getElementById('level-display');
const prevBtn = document.getElementById('prev');
const nextBtn = document.getElementById('next');
const restartBtn = document.getElementById('restart');

let levels = [];
let currentLevel = 0;
let board = [];
let player = { x: 0, y: 0 };

let timerInterval = null;
let startTime = 0;

let moveCount = 0;
const moveCountEl = document.getElementById('move-count');

const timerEl = document.getElementById('timer');
const bestTimeEl = document.getElementById('best-time');

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
      break;
    }
  }
}

function parseLevel(text) {
  board = text.trim().split('\n').map(line => line.trimEnd().split(''));
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

function startTimer() {
  startTime = Date.now();
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timerEl.textContent = `${elapsed.toFixed(1)}s`;
  }, 100);
}

function stopTimer() {
  clearInterval(timerInterval);
  const timeTaken = (Date.now() - startTime) / 1000;
  return timeTaken;
}

function loadBestTime(index) {
  const key = `sokoban_best_time_${index}`;
  const best = localStorage.getItem(key);
  bestTimeEl.textContent = best ? `${parseFloat(best).toFixed(1)}s` : '–';
}

function saveBestTime(index, time) {
  const key = `sokoban_best_time_${index}`;
  const best = localStorage.getItem(key);
  if (!best || time < parseFloat(best)) {
    localStorage.setItem(key, time.toFixed(1));
    bestTimeEl.textContent = `${time.toFixed(1)}s`;
  }
}

function loadLevel(index) {
  currentLevel = index;
  levelDisplay.textContent = `Level ${currentLevel + 1}`;
  parseLevel(levels[index]);
  drawBoard();
  startTimer();
  loadBestTime(index);
  moveCount = 0;
  moveCountEl.textContent = moveCount;
}


function isWin() {
  return board.every(row => row.every(cell => cell !== '$'));
}

function move(dx, dy) {
  const x1 = player.x + dx;
  const y1 = player.y + dy;
  const x2 = player.x + dx * 2;
  const y2 = player.y + dy * 2;
  const target = board[y1][x1];
  const beyond = board[y2] && board[y2][x2];

  if (target === '#') return; // wall

  if (target === '$' || target === '*') {
    if (beyond === ' ' || beyond === '.' ) {
      // move box
      board[y1][x1] = (target === '*') ? '.' : ' ';
      board[y2][x2] = (beyond === '.') ? '*' : '$';
    } else {
      return; // can't push
    }
  }

  // move player
  const onGoal = (board[player.y][player.x] === '+');
  board[player.y][player.x] = onGoal ? '.' : ' ';
  const targetGoal = (target === '.' || target === '*');
  board[y1][x1] = targetGoal ? '+' : '@';
  player.x = x1;
  player.y = y1;
  
  moveCount++;
  moveCountEl.textContent = moveCount;

  drawBoard();
  if (isWin()) {
    const time = stopTimer();
    saveBestTime(currentLevel, time);
    setTimeout(() => alert(`Level Complete!\nTime: ${time.toFixed(1)}s`), 100);
  }
}

function handleKey(e) {
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      move(0, -1); break;
    case 'ArrowDown':
    case 's':
    case 'S':
      move(0, 1); break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      move(-1, 0); break;
    case 'ArrowRight':
    case 'd':
    case 'D':
      move(1, 0); break;
  }
}

prevBtn.addEventListener('click', () => {
  if (currentLevel > 0) {
    loadLevel(currentLevel - 1);
  }
});

nextBtn.addEventListener('click', () => {
  if (currentLevel < levels.length - 1) {
    loadLevel(currentLevel + 1);
  }
});

restartBtn.addEventListener('click', () => loadLevel(currentLevel));

document.addEventListener('keydown', handleKey);

(async function init() {
  await fetchLevels();
  if (levels.length === 0) {
    boardEl.textContent = 'No levels found';
    return;
  }
  loadLevel(0);
})();
