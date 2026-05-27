const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayText = document.querySelector("#overlayText");
const startBtn = document.querySelector("#startBtn");
const pauseBtn = document.querySelector("#pauseBtn");
const speedSelect = document.querySelector("#speedSelect");
const modeSelect = document.querySelector("#modeSelect");
const foodSelect = document.querySelector("#foodSelect");

const grid = 20;
const cells = canvas.width / grid;
const bestKey = "codex-snake-best";
const portalPair = [
  { x: 1, y: 1 },
  { x: cells - 2, y: cells - 2 },
];
const obstacleLayouts = [
  [
    { x: 6, y: 6 },
    { x: 7, y: 6 },
    { x: 8, y: 6 },
    { x: 18, y: 6 },
    { x: 19, y: 6 },
    { x: 20, y: 6 },
    { x: 6, y: 19 },
    { x: 7, y: 19 },
    { x: 8, y: 19 },
    { x: 18, y: 19 },
    { x: 19, y: 19 },
    { x: 20, y: 19 },
  ],
  [
    { x: 12, y: 4 },
    { x: 12, y: 5 },
    { x: 12, y: 6 },
    { x: 12, y: 19 },
    { x: 12, y: 20 },
    { x: 12, y: 21 },
    { x: 4, y: 12 },
    { x: 5, y: 12 },
    { x: 6, y: 12 },
    { x: 19, y: 12 },
    { x: 20, y: 12 },
    { x: 21, y: 12 },
  ],
];
const directions = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

let snake;
let food;
let dir;
let nextDir;
let score;
let obstacles = [];
let specialFood = false;
let best = Number(localStorage.getItem(bestKey) || 0);
let timer = null;
let running = false;
let paused = false;

bestEl.textContent = best;

function resetGame() {
  snake = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  dir = directions.right;
  nextDir = directions.right;
  score = 0;
  obstacles = getObstacles();
  specialFood = false;
  scoreEl.textContent = score;
  food = placeFood();
  draw();
}

function getObstacles() {
  if (modeSelect.value !== "obstacles") return [];
  const layout = obstacleLayouts[Math.floor(Math.random() * obstacleLayouts.length)];
  return layout.map((part) => ({ ...part }));
}

function isSameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isBlocked(cell) {
  return snake.some((part) => isSameCell(part, cell)) || obstacles.some((part) => isSameCell(part, cell));
}

function placeFood() {
  let nextFood;
  do {
    nextFood = {
      x: Math.floor(Math.random() * cells),
      y: Math.floor(Math.random() * cells),
    };
  } while (isBlocked(nextFood) || portalPair.some((portal) => isSameCell(portal, nextFood)));
  specialFood = foodSelect.value === "golden" || (foodSelect.value === "mystery" && Math.random() < 0.35);
  return nextFood;
}

function drawCell(cell, color, inset = 1) {
  const size = grid - inset * 2;
  ctx.fillStyle = color;
  ctx.fillRect(cell.x * grid + inset, cell.y * grid + inset, size, size);
}

function draw() {
  ctx.fillStyle = "#151a19";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= cells; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * grid, 0);
    ctx.lineTo(i * grid, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * grid);
    ctx.lineTo(canvas.width, i * grid);
    ctx.stroke();
  }

  snake.forEach((part, index) => {
    drawCell(part, index === 0 ? "#8edb63" : "#4f9e38", 2);
  });
  obstacles.forEach((part) => drawCell(part, "#6e7781", 1));

  if (modeSelect.value === "portal") {
    portalPair.forEach((portal) => {
      drawCell(portal, "#b46cff", 1);
      drawCell(portal, "#151a19", 6);
    });
  }

  drawCell(food, specialFood ? "#ff9f1c" : "#ffcf48", specialFood ? 2 : 3);
}

function setOverlay(title, text, buttonText = "Iniciar") {
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  startBtn.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function setDirection(newDir) {
  const candidate = directions[newDir];
  if (!candidate) return;
  const reversing = candidate.x + dir.x === 0 && candidate.y + dir.y === 0;
  if (!reversing) {
    nextDir = candidate;
  }
}

function tick() {
  dir = nextDir;
  const head = snake[0];
  const newHead = { x: head.x + dir.x, y: head.y + dir.y };
  const outside = newHead.x < 0 || newHead.x >= cells || newHead.y < 0 || newHead.y >= cells;

  if (modeSelect.value === "wrap" && outside) {
    newHead.x = (newHead.x + cells) % cells;
    newHead.y = (newHead.y + cells) % cells;
  }

  if (modeSelect.value === "portal") {
    if (isSameCell(newHead, portalPair[0])) {
      newHead.x = portalPair[1].x;
      newHead.y = portalPair[1].y;
    } else if (isSameCell(newHead, portalPair[1])) {
      newHead.x = portalPair[0].x;
      newHead.y = portalPair[0].y;
    }
  }

  const hitWall = outside && modeSelect.value !== "wrap";
  const ateFood = isSameCell(newHead, food);
  const snakeBody = ateFood ? snake : snake.slice(0, -1);
  const hitSnake = snakeBody.some((part) => isSameCell(part, newHead));
  const hitObstacle = obstacles.some((part) => isSameCell(part, newHead));

  if (hitWall || hitSnake || hitObstacle) {
    gameOver();
    return;
  }

  snake.unshift(newHead);
  if (ateFood) {
    score += specialFood ? 30 : 10;
    scoreEl.textContent = score;
    if (score > best) {
      best = score;
      localStorage.setItem(bestKey, String(best));
      bestEl.textContent = best;
    }
    food = placeFood();
  } else {
    snake.pop();
  }

  draw();
}

function startLoop() {
  clearInterval(timer);
  timer = setInterval(tick, Number(speedSelect.value));
}

function startGame() {
  resetGame();
  running = true;
  paused = false;
  hideOverlay();
  pauseBtn.textContent = "Pausa";
  startLoop();
}

function gameOver() {
  clearInterval(timer);
  running = false;
  paused = false;
  draw();
  setOverlay("Fin del juego", `Puntuación: ${score}. Cambia los mods y juega otra vez.`, "Jugar de nuevo");
}

function togglePause() {
  if (!running) {
    startGame();
    return;
  }

  paused = !paused;
  if (paused) {
    clearInterval(timer);
    pauseBtn.textContent = "Continuar";
    setOverlay("Pausa", "Presiona espacio para continuar.", "Continuar");
  } else {
    hideOverlay();
    pauseBtn.textContent = "Pausa";
    startLoop();
  }
}

document.addEventListener("keydown", (event) => {
  const keyMap = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right",
  };

  if (event.code === "Space") {
    event.preventDefault();
    if (running) {
      togglePause();
    } else {
      startGame();
    }
    return;
  }

  if (keyMap[event.key]) {
    event.preventDefault();
    setDirection(keyMap[event.key]);
  }
});

document.querySelectorAll("[data-dir]").forEach((button) => {
  button.addEventListener("click", () => {
    setDirection(button.dataset.dir);
    if (!running) startGame();
  });
});

startBtn.addEventListener("click", () => {
  if (running && paused) {
    togglePause();
  } else {
    startGame();
  }
});

pauseBtn.addEventListener("click", togglePause);

speedSelect.addEventListener("change", () => {
  if (running && !paused) startLoop();
});

[modeSelect, foodSelect].forEach((select) => {
  select.addEventListener("change", () => {
    if (running) {
      clearInterval(timer);
      running = false;
      paused = false;
      pauseBtn.textContent = "Pausa";
      resetGame();
      setOverlay("Mods cambiados", "Presiona iniciar para jugar con esta configuración.", "Iniciar");
    } else {
      resetGame();
    }
  });
});

resetGame();
