// engine.js - Core game loop and initialization
class Game {
    constructor() {
        // Get the canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameRunning = true;
        this.lastTime = 0;
        this.gameTime = 0;
        this.frameCount = 0;
        this.score = 0;
        this.level = 1;
        
        // Game modules
        this.input = null;
        this.player = null;
        this.parallax = null;
        this.terrain = null;
        this.enemies = null;
        this.effects = null;
        this.ui = null;
        this.levels = null;
        this.collision = null;
    }
    
    init() {
        console.log("Initializing game...");
        
        // Initialize modules in the correct order
        this.effects = new EffectsManager(this);
        this.input = new InputManager(this);
        this.levels = new LevelManager(this);
        this.parallax = new ParallaxManager(this);
        this.terrain = new TerrainManager(this);
        this.player = new Player(this);
        this.enemies = new EnemyManager(this);
        this.ui = new UIManager(this);
        this.collision = new CollisionManager(this);
        
        // Initialize all modules that need initialization
        this.input.initialize();
        this.player.initialize();
        this.parallax.initialize();
        this.terrain.initialize();
        
        // Apply level 1 settings
        this.levels.setLevel(1);
        
        console.log("Game initialized, starting game loop");
        
        // Start the game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // Game updating methods
    gameLoop(timestamp) {
        try {
            // Calculate delta time
            const deltaTime = this.lastTime ? timestamp - this.lastTime : 0;
            this.lastTime = timestamp;
            this.gameTime += deltaTime;
            
            // Limit delta time to prevent jumps after tab is inactive
            const maxDelta = 100; // ms
            const limitedDelta = Math.min(deltaTime, maxDelta);
            
            // Clear canvas
            this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            
            if (this.gameRunning) {
                // Update game elements
                this.updateGame(limitedDelta);
                
                // Draw game elements in proper order
                this.drawGame();
                
                // Increment frame counter
                this.frameCount++;
            } else {
                // Game over screen
                this.drawGameOver();
            }
            
            // Continue the game loop
            requestAnimationFrame(this.gameLoop.bind(this));
        } catch (error) {
            console.error("Error in game loop:", error);
            this.showErrorMessage(error);
        }
    }
    
    updateGame(deltaTime) {
        // Update all game components
        this.player.update(deltaTime, this.input.keys);
        this.terrain.update(deltaTime);
        this.enemies.update(deltaTime, this.level);
        this.parallax.update(deltaTime, this.terrain.levelProgress);
        this.effects.update(deltaTime);
        
        // Check for collisions
        this.collision.checkCollisions();
        
        // Check level progression
        this.checkLevelProgression();
    }
    
    drawGame() {
        // Draw all game components in correct order (back to front)
        this.parallax.draw(this.terrain.levelProgress);
        this.terrain.draw();
        this.enemies.draw();
        this.player.draw();
        this.effects.draw();
        this.ui.draw();
    }
    
    checkLevelProgression() {
        // Check if level has been completed
        if (this.terrain.levelProgress >= 100) {
            // Progress to next level
            this.level++;
            this.terrain.levelProgress = 0; // Reset progress
            
            // Apply new level settings
            this.levels.setLevel(this.level);
            
            // Award extra life on level up
            this.player.lives = Math.min(this.player.lives + 1, 5);
            
            // Show level completion message
            this.ui.showLevelMessage();
        }
    }
    
    // Handle score updates
    addScore(points) {
        this.score += points;
    }
    
    // Methods for other modules to call
    addExplosion(x, y, size, type = 'standard') {
        this.effects.createExplosion(x, y, size, type);
    }
    
    addBomb(x, y) {
        // Add a UFO bomb to obstacles
        this.terrain.addObstacle({
            x: x,
            y: y,
            width: 10,
            height: 20,
            velocityY: 3,
            type: OBSTACLE_TYPES.MINE,
            destroyed: false
        });
    }
    
    addEnemyBullet(x, y) {
        // Add enemy bullet
        this.terrain.addObstacle({
            x: x,
            y: y,
            width: 15,
            height: 5,
            velocityX: 7,
            type: 'bullet',
            destroyed: false
        });
    }
    
    drawGameOver() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '40px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', GAME_WIDTH/2, GAME_HEIGHT/2);
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Press R to restart', GAME_WIDTH/2, GAME_HEIGHT/2 + 40);
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Final Score: ${this.score}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 70);
    }
    
    showErrorMessage(error) {
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '20px';
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.background = 'rgba(0,0,0,0.8)';
        errorDiv.style.zIndex = '100';
        errorDiv.innerHTML = `<h3>Game Error</h3><p>${error.message}</p>`;
        document.getElementById('gameContainer').appendChild(errorDiv);
    }
}

// Initialize game when the page loads
window.onload = function() {
    const game = new Game();
    game.init();
};