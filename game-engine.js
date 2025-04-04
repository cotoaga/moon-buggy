// Main game variables
let gameRunning = true;
let lastTime = 0;
let gameTime = 0;
let frameCount = 0;

// Get the canvas and context
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let player = {
    x: 200,
    y: GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT,
    velocityY: 0,
    isJumping: false,
    isMovingLeft: false,
    isMovingRight: false,
    lives: 3
};

// Background elements
let stars = [];

// Initialize game
function initGame() {
    console.log("Initializing game...");
    
    // Generate stars
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - 50),
            size: Math.random() * 2 + 1
        });
    }
    
    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    console.log("Game initialized, starting game loop");
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
}

// Handle keydown events
function handleKeyDown(event) {
    switch (event.code) {
        case 'KeyA':
        case 'ArrowLeft':
            player.isMovingLeft = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            player.isMovingRight = true;
            break;
        case 'Space':
            if (!player.isJumping) {
                player.isJumping = true;
                player.velocityY = -JUMP_FORCE;
            }
            break;
    }
}

// Handle keyup events
function handleKeyUp(event) {
    switch (event.code) {
        case 'KeyA':
        case 'ArrowLeft':
            player.isMovingLeft = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            player.isMovingRight = false;
            break;
    }
}

// Update player
function updatePlayer(deltaTime) {
    // Horizontal movement
    if (player.isMovingLeft) {
        player.x -= PLAYER_SPEED;
        if (player.x < 0) player.x = 0;
    }
    if (player.isMovingRight) {
        player.x += PLAYER_SPEED;
        if (player.x > GAME_WIDTH - PLAYER_WIDTH) player.x = GAME_WIDTH - PLAYER_WIDTH;
    }
    
    // Simple jumping physics
    if (player.isJumping) {
        player.y += player.velocityY;
        player.velocityY += GRAVITY;
        
        // Check if landed
        if (player.y >= GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT) {
            player.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
            player.velocityY = 0;
            player.isJumping = false;
        }
    }
}

// Draw player as a Cybertruck-inspired lunar rover
function drawPlayer() {
    // Calculate wheel wobble based on frame count
    const wheelOffset1 = Math.sin(frameCount / 4) * 2;
    const wheelOffset2 = Math.sin(frameCount / 4 + 1) * 2;
    const wheelOffset3 = Math.sin(frameCount / 4 + 2) * 2;
    
    // Draw vehicle body (Cybertruck-inspired angular design)
    ctx.fillStyle = '#C0C0C0'; // Metallic silver
    
    // Main body (trapezoid)
    ctx.beginPath();
    ctx.moveTo(player.x, player.y + 10);
    ctx.lineTo(player.x + PLAYER_WIDTH - 15, player.y);
    ctx.lineTo(player.x + PLAYER_WIDTH, player.y + 8);
    ctx.lineTo(player.x + PLAYER_WIDTH, player.y + PLAYER_HEIGHT - 8);
    ctx.lineTo(player.x, player.y + PLAYER_HEIGHT - 5);
    ctx.closePath();
    ctx.fill();
    
    // Add metallic sheen
    const gradient = ctx.createLinearGradient(
        player.x, player.y, 
        player.x + PLAYER_WIDTH, player.y + PLAYER_HEIGHT
    );
    gradient.addColorStop(0, '#A0A0A0');
    gradient.addColorStop(0.5, '#E0E0E0');
    gradient.addColorStop(1, '#A0A0A0');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(player.x + 5, player.y + 12);
    ctx.lineTo(player.x + PLAYER_WIDTH - 18, player.y + 3);
    ctx.lineTo(player.x + PLAYER_WIDTH - 5, player.y + 10);
    ctx.lineTo(player.x + PLAYER_WIDTH - 5, player.y + PLAYER_HEIGHT - 12);
    ctx.lineTo(player.x + 5, player.y + PLAYER_HEIGHT - 8);
    ctx.closePath();
    ctx.fill();
    
    // Add window
    ctx.fillStyle = '#88CCFF';
    ctx.beginPath();
    ctx.moveTo(player.x + 15, player.y + 13);
    ctx.lineTo(player.x + PLAYER_WIDTH - 25, player.y + 6);
    ctx.lineTo(player.x + PLAYER_WIDTH - 20, player.y + 15);
    ctx.lineTo(player.x + 20, player.y + 20);
    ctx.closePath();
    ctx.fill();
    
    // Draw six wheels with independent wobble
    ctx.fillStyle = '#333333';
    
    // Front wheels
    ctx.beginPath();
    ctx.arc(player.x + 10, player.y + PLAYER_HEIGHT + wheelOffset1, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Middle wheels
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_WIDTH/2 - 5, player.y + PLAYER_HEIGHT + wheelOffset2, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Rear wheels
    ctx.beginPath();
    ctx.arc(player.x + PLAYER_WIDTH - 15, player.y + PLAYER_HEIGHT + wheelOffset3, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw gun/laser cannon
    ctx.fillStyle = '#CC3333';
    ctx.fillRect(player.x + PLAYER_WIDTH - 10, player.y + 8, 12, 6);
    
    // Add some tech details
    ctx.fillStyle = '#444444';
    ctx.fillRect(player.x + 5, player.y + PLAYER_HEIGHT - 12, 10, 4); // Side detail
    ctx.fillRect(player.x + PLAYER_WIDTH - 20, player.y + PLAYER_HEIGHT - 12, 10, 4); // Side detail
    
    // Add lunar rover antenna
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(player.x + 15, player.y + 8);
    ctx.lineTo(player.x + 15, player.y - 10);
    ctx.stroke();
    
    // Antenna top
    ctx.fillStyle = '#FFFF00';
    ctx.beginPath();
    ctx.arc(player.x + 15, player.y - 10, 2, 0, Math.PI * 2);
    ctx.fill();
}

// Draw stars
function drawStars() {
    ctx.fillStyle = '#FFFFFF';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
    });
}

// Draw ground
function drawGround() {
    ctx.fillStyle = '#555555';
    ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
}

// Draw UI
function drawUI() {
    document.getElementById('lives').textContent = `Lives: ${player.lives}`;
    document.getElementById('score').textContent = `Score: 0`;
    document.getElementById('level').textContent = `Level: 1`;
    
    const minutes = Math.floor(gameTime / 60000);
    const seconds = Math.floor((gameTime % 60000) / 1000);
    document.getElementById('time').textContent = 
        `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Main game loop
function gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = lastTime ? timestamp - lastTime : 0;
    lastTime = timestamp;
    gameTime += deltaTime;
    
    // Clear canvas
    ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
    if (gameRunning) {
        // Update game elements
        updatePlayer(deltaTime);
        
        // Draw game elements
        drawStars();
        drawGround();
        drawPlayer();
        drawUI();
        
        // Increment frame counter
        frameCount++;
    }
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Initialize game when the page loads
window.onload = initGame;