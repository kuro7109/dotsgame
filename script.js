// Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive canvas size - maintains aspect ratio
function resizeCanvas() {
    const maxWidth = window.innerWidth - 200;
    const maxHeight = window.innerHeight - 250;
    const size = Math.min(maxWidth, maxHeight, 700);
    canvas.width = size;
    canvas.height = size;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// DOM Elements
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const startOverlay = document.getElementById('startOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScore = document.getElementById('finalScore');
const finalHighScore = document.getElementById('finalHighScore');

// Game Variables
const gridSize = 20;
let tileCount;
let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;
let isPlaying = false;
let isPaused = false;
let gameSpeed = 100;

highScoreElement.textContent = highScore;

// Audio Context - Minimal sounds
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration, type = 'sine') {
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        // Silently fail
    }
}

// Initialize Game
function initGame() {
    tileCount = Math.floor(canvas.width / gridSize);
    snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];
    dx = 0;
    dy = 0;
    score = 0;
    scoreElement.textContent = score;
    generateFood();
    drawGame();
}

// Generate Food
function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    for (let segment of snake) {
        if (food.x === segment.x && food.y === segment.y) {
            generateFood();
            return;
        }
    }
}

// Draw Game - Clean & Minimal
function drawGame() {
    if (isPaused) return;

    // Move snake
    if (dx !== 0 || dy !== 0) {
        const head = { x: snake[0].x + dx, y: snake[0].y + dy };

        // Check wall collision
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            playSound(200, 150, 'sine');
            gameOver();
            return;
        }

        // Check self collision
        for (let segment of snake) {
            if (head.x === segment.x && head.y === segment.y) {
                playSound(200, 150, 'sine');
                gameOver();
                return;
            }
        }

        snake.unshift(head);

        // Check food collision
        if (head.x === food.x && head.y === food.y) {
            score++;
            scoreElement.textContent = score;
            scoreElement.classList.add('score-change');
            setTimeout(() => scoreElement.classList.remove('score-change'), 300);
            playSound(600, 80, 'sine');

            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                highScoreElement.classList.add('score-change');
                setTimeout(() => highScoreElement.classList.remove('score-change'), 300);
                localStorage.setItem('snakeHighScore', highScore);
            }

            generateFood();
        } else {
            snake.pop();
        }
    }

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
        ctx.beginPath();
        ctx.moveTo(i * gridSize, 0);
        ctx.lineTo(i * gridSize, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * gridSize);
        ctx.lineTo(canvas.width, i * gridSize);
        ctx.stroke();
    }

    // Draw snake - clean white with subtle fade
    snake.forEach((segment, index) => {
        const opacity = 1 - (index / snake.length) * 0.6;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;

        const padding = 2;
        ctx.fillRect(
            segment.x * gridSize + padding,
            segment.y * gridSize + padding,
            gridSize - padding * 2,
            gridSize - padding * 2
        );
    });

    // Draw food - simple white circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(
        food.x * gridSize + gridSize / 2,
        food.y * gridSize + gridSize / 2,
        gridSize / 2 - 4,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

// Game Over
function gameOver() {
    clearInterval(gameLoop);
    isPlaying = false;
    gameOverOverlay.classList.add('active');
    startBtn.textContent = 'Start';
    startBtn.classList.remove('hidden');
    pauseBtn.classList.add('hidden');
    finalScore.textContent = score;
    finalHighScore.textContent = highScore;

    // Enable difficulty selection
    document.querySelectorAll('.difficulty-option').forEach(btn => {
        btn.disabled = false;
    });
}

// Start Game
function startGame() {
    if (isPlaying && !isPaused) return;

    if (!isPlaying) {
        initGame();
        isPlaying = true;
        isPaused = false;
        startOverlay.classList.remove('active');
        gameOverOverlay.classList.remove('active');
        startBtn.classList.add('hidden');
        pauseBtn.classList.remove('hidden');
        playSound(800, 60, 'sine');

        // Disable difficulty selection during game
        document.querySelectorAll('.difficulty-option').forEach(btn => {
            btn.disabled = true;
        });
    } else if (isPaused) {
        isPaused = false;
        pauseOverlay.classList.remove('active');
        pauseBtn.textContent = 'Pause';
    }

    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(drawGame, gameSpeed);
}

// Pause Game
function pauseGame() {
    if (!isPlaying) return;
    isPaused = !isPaused;

    if (isPaused) {
        pauseOverlay.classList.add('active');
        pauseBtn.textContent = 'Resume';
        playSound(500, 60, 'sine');
    } else {
        pauseOverlay.classList.remove('active');
        pauseBtn.textContent = 'Pause';
        playSound(600, 60, 'sine');
    }
}

// Change Direction
function changeDirection(newDx, newDy) {
    if (!isPlaying || isPaused) return;

    // Prevent reversing into self
    if (newDx !== 0 && dx === 0) {
        dx = newDx;
        dy = 0;
    } else if (newDy !== 0 && dy === 0) {
        dx = 0;
        dy = newDy;
    }
}

// Keyboard Controls
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            changeDirection(0, -1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            changeDirection(0, 1);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            changeDirection(-1, 0);
            break;
        case 'ArrowRight':
            e.preventDefault();
            changeDirection(1, 0);
            break;
        case ' ':
            e.preventDefault();
            if (!isPlaying || gameOverOverlay.classList.contains('active')) {
                startGame();
            } else {
                pauseGame();
            }
            break;
        case 'Escape':
            e.preventDefault();
            if (isPlaying && !isPaused) {
                pauseGame();
            }
            break;
    }
});

// Button Events
startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);

// Difficulty Selection
document.querySelectorAll('.difficulty-option').forEach(btn => {
    btn.addEventListener('click', () => {
        if (isPlaying) return;

        document.querySelectorAll('.difficulty-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameSpeed = parseInt(btn.dataset.speed);
        playSound(400, 40, 'sine');
    });
});

// Initialize
initGame();

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration.scope);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    });
}
