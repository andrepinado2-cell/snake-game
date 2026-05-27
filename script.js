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

const grid = 20;
const cells = canvas.width / grid;
const bestKey = "codex-snake-best";
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
  scoreEl.textContent = score;
  food = placeFood();
  draw();
}

function placeFood() {
  let nextFood;
  do {
    nextFood = {
      x: Math.floor(Math.random() * cells),
      y: Math.floor(Math.random() * cells),
    };
  } while (snake.some((part) => part.x === nextFood.x && part.y === nextFood.y));
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
  drawCell(food, "#ffcf48", 3);
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
  const hitWall = newHead.x < 0 || newHead.x >= cells || newHead.y < 0 || newHead.y >= cells;
  const hitSnake = snake.some((part) => part.x === newHead.x && part.y === newHead.y);

  if (hitWall || hitSnake) {
    gameOver();
    return;
  }

  snake.unshift(newHead);
  const ateFood = newHead.x === food.x && newHead.y === food.y;
  if (ateFood) {
    score += 10;
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
  setOverlay("Fin del juego", `Puntuación: ${score}`, "Jugar de nuevo");
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

resetGame();
