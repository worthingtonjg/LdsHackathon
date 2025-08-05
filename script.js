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

  // Remove optional title lines and pad rows so the board is rectangular
  const lines = text
    .trim()
    .split('\n')
    .filter(line => !line.startsWith('Title:'));
  const width = Math.max(...lines.map(line => line.length));
  board = lines.map(line => line.padEnd(width, ' ').split(''));

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

function loadLevel(index) {
  currentLevel = index;
  levelDisplay.textContent = `Level ${currentLevel + 1}`;
  parseLevel(levels[index]);
  drawBoard();
}

function isWin() {
  return board.every(row =>
    row.every(cell => cell !== '$' && cell !== '.' && cell !== '+'));
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

  drawBoard();
  if (isWin()) {
    setTimeout(() => alert('Level Complete!'), 100);
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
