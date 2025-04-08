// engine.js - Core game loop and initialization with double buffering
class Game {
    constructor() {
        // Get the canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Create offscreen canvas for double buffering
        this.offscreenCanvas = document.createElement('canvas');
        this.offscreenCanvas.width = this.canvas.width;
        this.offscreenCanvas.height = this.canvas.height;
        this.offscreenCtx = this.offscreenCanvas.getContext('2d');
        
        // Game state
        this.gameRunning = true;
        this.lastTime = 0;
        this.gameTime = 0;
        this.frameCount = 0;
        this.score = 0;
        this.level = 1;
        this.godMode = window.godMode || false; // Initialize from global variable
        this.freezeMode = false;
        
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
		
		// Add this property to the Game class constructor
		this.debugMode = false; // Will be toggled with a key
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
        
        // Clear any existing death messages or overlays
        this.cleanupOverlays();
        
        // Initialize all modules that need initialization
        if (this.input && typeof this.input.initialize === 'function') {
            this.input.initialize();
        }
        
        if (this.player && typeof this.player.initialize === 'function') {
            this.player.initialize();
        }
        
        if (this.parallax && typeof this.parallax.initialize === 'function') {
            this.parallax.initialize();
        }
        
        if (this.terrain && typeof this.terrain.initialize === 'function') {
            this.terrain.initialize();
        }
        
        // Set initial god mode UI
        const godModeElement = document.getElementById('godMode');
        if (godModeElement) {
            godModeElement.textContent = `God Mode: ${this.godMode ? 'ON' : 'OFF'}`;
        }
        
        // Apply level 1 settings
        if (this.levels) {
            this.levels.setLevel(1);
        }
		
		// Add this to engine.js init method
		this.updateContextReferences = function() {
		    if (this.parallax) this.parallax.ctx = this.ctx;
		    if (this.terrain) this.terrain.ctx = this.ctx;
		    if (this.player) this.player.ctx = this.ctx;
		    if (this.enemies) this.enemies.ctx = this.ctx;
		    if (this.effects) this.effects.ctx = this.ctx;
		    if (this.ui) this.ui.ctx = this.ctx;
		};
        
        console.log("Game initialized, starting game loop");
        
        // Start the game loop
        requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    // Clean up any UI overlays that might be active
    cleanupOverlays() {
        // Remove death message overlays
        const overlays = document.querySelectorAll('.death-message-overlay, .level-message-overlay');
        overlays.forEach(overlay => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        });
        
        // Remove death messages
        const messages = document.querySelectorAll('.death-message');
        messages.forEach(msg => {
            if (document.body.contains(msg)) {
                document.body.removeChild(msg);
            }
        });
        
        // Remove other dialog elements
        const dialogs = document.querySelectorAll('.game-dialog');
        dialogs.forEach(dialog => {
            if (document.body.contains(dialog)) {
                document.body.removeChild(dialog);
            }
        });
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
            
            if (this.gameRunning && !this.freezeMode) {
                // Update game elements
                this.updateGame(limitedDelta);
                
                // Increment frame counter
                this.frameCount++;
            }

            // Double buffering: draw everything to offscreen canvas first
            this.renderOffscreen(deltaTime);
            
            // Then copy the completed frame to the visible canvas
            this.presentToScreen();
            
            // Draw game over screen if game not running
            if (!this.gameRunning) {
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
        // Update all game components with null checks
        if (this.player) {
            this.player.update(deltaTime, this.input ? this.input.keys : {});
        }
        
        if (this.terrain) {
            this.terrain.update(deltaTime);
        }
        
        if (this.enemies) {
            this.enemies.update(deltaTime, this.level);
        }
        
        if (this.parallax && this.terrain) {
            this.parallax.update(deltaTime, this.terrain.levelProgress);
        }
        
        if (this.effects) {
            this.effects.update(deltaTime);
        }
        
        // Check for collisions
        if (this.collision) {
            this.collision.checkMineEnemyCollisions();
            this.collision.checkCollisions();
        }
        
        // Check level progression
        this.checkLevelProgression();
    }
    
    // NEW: Draw to offscreen canvas
	renderOffscreen(deltaTime) {
	    // Create a fresh offscreen canvas every frame
	    const tempCanvas = document.createElement('canvas');
	    tempCanvas.width = GAME_WIDTH;
	    tempCanvas.height = GAME_HEIGHT;
	    const tempCtx = tempCanvas.getContext('2d');
    
	    // Store original context and set to the temporary one
	    const originalCtx = this.ctx;
	    this.ctx = tempCtx;
    
	    // Clear the temporary canvas with black
	    this.ctx.fillStyle = '#000000';
	    this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
	    // Propagate the context
	    this.propagateContext();
    
	    // Draw the game
		this.drawGame(deltaTime);
    
	    // Restore original context
	    this.ctx = originalCtx;
	    this.propagateContext();
    
	    // Store the completed frame
	    this.completedFrame = tempCanvas;
	}

	presentToScreen() {
	    // Clear the screen
	    this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    
	    // Draw the completed frame
	    if (this.completedFrame) {
	        this.ctx.drawImage(this.completedFrame, 0, 0);
	    }
	}
		        
    drawGame(deltaTime) {
        // Draw all game components in correct order (back to front)
        if (this.parallax) {
            this.parallax.draw(this.terrain ? this.terrain.levelProgress : 0);
        }
        
        if (this.terrain) {
            this.terrain.draw();
        }
        
        if (this.enemies) {
            this.enemies.draw(this.ctx);
        }
        
        if (this.player) {
            this.player.draw();
        }
        
        if (this.effects) {
            this.effects.draw();
        }
        
        if (this.ui) {
            this.ui.draw();
        }
		
		// Debug enemy info
		if (this.frameCount % 300 === 0 && this.enemies) { // Every 5 seconds
		    const enemyCounts = this.enemies.debugEnemies();
		}

		// Modify the drawGame method to add this at the end
		// Debug overlay - only shown when debug mode is enabled
		if (this.debugMode) {
		    // Semi-transparent background
		    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
		    this.ctx.fillRect(GAME_WIDTH/2 - 100, GAME_HEIGHT/2 - 60, 200, 120);
    
		    // Debug info
		    this.ctx.fillStyle = '#FFFFFF';
		    this.ctx.font = '16px "Press Start 2P"';
		    this.ctx.textAlign = 'center';
		    this.ctx.fillText(`DEBUG`, GAME_WIDTH/2, GAME_HEIGHT/2 - 40);
		    this.ctx.fillText(`Frame: ${this.frameCount}`, GAME_WIDTH/2, GAME_HEIGHT/2 - 10);
		    this.ctx.fillText(`Enemies: ${this.enemies ? this.enemies.enemies.length : 0}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 20);
		    this.ctx.fillText(`FPS: ${Math.round(1000 / (deltaTime || 16))}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 50);
		}
    }
    
    checkLevelProgression() {
        // Check if level has been completed
        if (!this.terrain) return;
        
        if (this.terrain.levelProgress >= 100) {
            // Progress to next level
            this.level++;
            this.terrain.levelProgress = 0; // Reset progress
            
            // Level 42 Easter Egg
            if (this.level === 42) {
                this.showLevel42EasterEgg();
                return; // Don't continue normal level progression
            }
            
            // Apply new level settings
            if (this.levels) {
                this.levels.setLevel(this.level);
            }
            
            // Award extra life on level up
            if (this.player && this.player.health) {
                this.player.health.lives = Math.min(this.player.health.lives + 1, 5);
            }
            
            // Show level completion message
            if (this.ui) {
                this.ui.showLevelMessage();
            }
        }
    }
    
    showLevel42EasterEgg() {
        // Pause the game
        this.gameRunning = false;
        
        // Remove any existing dialogs
        this.cleanupOverlays();
        
        // Create easter egg dialog
        const easterEggDiv = document.createElement('div');
        easterEggDiv.className = 'game-dialog'; // Add a class for easy removal
        easterEggDiv.style.position = 'fixed';
        easterEggDiv.style.top = '0';
        easterEggDiv.style.left = '0';
        easterEggDiv.style.width = '100%';
        easterEggDiv.style.height = '100%';
        easterEggDiv.style.display = 'flex';
        easterEggDiv.style.justifyContent = 'center';
        easterEggDiv.style.alignItems = 'center';
        easterEggDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        easterEggDiv.style.zIndex = '1000';
        
        // Dialog content
        const dialogContent = document.createElement('div');
        dialogContent.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        dialogContent.style.color = '#33FF33';
        dialogContent.style.padding = '30px';
        dialogContent.style.borderRadius = '10px';
        dialogContent.style.maxWidth = '600px';
        dialogContent.style.textAlign = 'center';
        dialogContent.style.fontFamily = '"Press Start 2P", monospace';
        dialogContent.style.fontSize = '18px';
        dialogContent.style.boxShadow = '0 0 20px #33FF33';
        dialogContent.style.border = '2px solid #33FF33';
        
        // Add message
        dialogContent.innerHTML = `
            <h2 style="color: #33FF33;">LEVEL 42</h2>
            <p>Maximal improbability level reached</p>
            <p>Yes, the result is still: 42</p>
            <p>Press RERUN to start over reasoning on the life, the universe, and everything question.</p>
            <button id="rerunButton" style="margin-top: 20px; padding: 10px 20px; background-color: #33FF33; color: black; border: none; cursor: pointer; font-weight: bold; font-size: 16px;">RERUN</button>
        `;
        
        // Add dialog content to dialog
        easterEggDiv.appendChild(dialogContent);
        
        // Add to document
        document.body.appendChild(easterEggDiv);
        
        // Add event listener to restart button
        const rerunButton = document.getElementById('rerunButton');
        if (rerunButton) {
            rerunButton.addEventListener('click', () => {
                easterEggDiv.remove();
                this.restartGame();
            });
        }
    }
    
    // Handle score updates
    addScore(points) {
        this.score += points;
    }
    
    // Methods for other modules to call
    addExplosion(x, y, size, type = 'standard') {
        if (this.effects) {
            this.effects.createExplosion(x, y, size, type);
        }
    }
    
    addBomb(x, y) {
        // Add a UFO bomb to obstacles
        if (this.terrain && this.terrain.obstacleManager) {
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
    }
    
    addEnemyBullet(x, y) {
        // Add enemy bullet
        if (this.terrain && this.terrain.obstacleManager) {
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
    }
    
    drawGameOver() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Game over text with glow effect
        this.ctx.shadowColor = '#FF3333';
        this.ctx.shadowBlur = 20;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '40px "Press Start 2P"';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', GAME_WIDTH/2, GAME_HEIGHT/2);
        
        // Instructions
        this.ctx.font = '20px "Press Start 2P"';
        this.ctx.fillText('Press R to restart', GAME_WIDTH/2, GAME_HEIGHT/2 + 60);
        
        // Score display
        this.ctx.font = '16px "Press Start 2P"';
        this.ctx.fillText(`Final Score: ${this.score}`, GAME_WIDTH/2, GAME_HEIGHT/2 + 100);
        
        // Reset shadow effects
        this.ctx.shadowBlur = 0;
    }
    
    restartGame() {
        console.log("Restarting game...");
        
        // First, clear any death messages or dialogs that might be stuck
        this.cleanupOverlays();
        
        // Reset game state
        this.gameRunning = true;
        this.level = 1;
        this.score = 0;
        this.gameTime = 0;
        
        // Reset player with proper initialization if it exists
        if (this.player) {
            this.player.x = 200;
            this.player.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
            
            // Reset player components with proper initialization
            if (this.player.movement) {
                this.player.movement.velocityY = 0;
                this.player.movement.isJumping = false;
                this.player.movement.jumpPeakReached = false;
            }
            
            if (this.player.health) {
                // Reset health state
                this.player.health.lives = 3;
                this.player.health.shield = 100;
                this.player.health.energy = 100;
                this.player.health.invulnerable = 2000; // 2 seconds of invulnerability
                
                // Clear any death message state
                if (typeof this.player.health.removeDeathMessage === 'function') {
                    this.player.health.removeDeathMessage();
                }
                this.player.health.deathMessageShown = false;
            }
            
            if (this.player.weapons) {
                this.player.weapons.bullets = [];
            }
        }
        
        // Reset terrain if it exists
        if (this.terrain) {
            this.terrain.levelProgress = 0;
            this.terrain.currentSection = 'A';
            
            if (this.terrain.obstacleManager) {
                this.terrain.obstacleManager.obstacles = [];
            }
            
            if (this.terrain.mineManager) {
                this.terrain.mineManager.mines = [];
            }
            
            // Regenerate terrain
            if (this.terrain.generator) {
                this.terrain.generator.generateInitialGround();
            }
        }
        
        // Reset enemies if they exist
        if (this.enemies) {
            this.enemies.enemies = [];
            
            // Reset spawn counters
            this.enemies.spawnCounters = {
                ufoHigh: 3000,
                ufoMid: 5000,
                ufoLow: 7000,
                buggy: 10000
            };
        }
        
        // Apply level 1 settings
        if (this.levels) {
            this.levels.setLevel(1);
        }
        
        console.log("Game restart complete");
    }
    
    showErrorMessage(error) {
        // Create error message container
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '50%';
        errorDiv.style.left = '50%';
        errorDiv.style.transform = 'translate(-50%, -50%)';
        errorDiv.style.backgroundColor = 'rgba(0,0,0,0.9)';
        errorDiv.style.color = 'red';
        errorDiv.style.padding = '20px';
        errorDiv.style.borderRadius = '10px';
        errorDiv.style.zIndex = '1000';
        errorDiv.style.border = '2px solid red';
        errorDiv.style.fontFamily = '"Press Start 2P", monospace';
        errorDiv.style.fontSize = '14px';
        errorDiv.style.maxWidth = '80%';
        errorDiv.innerHTML = `<h3>Game Error</h3><p>${error.message}</p>`;
        
        // Add close button
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.backgroundColor = '#555';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.padding = '10px 20px';
        closeButton.style.marginTop = '15px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => {
            if (document.body.contains(errorDiv)) {
                document.body.removeChild(errorDiv);
            }
        };
        errorDiv.appendChild(closeButton);
        
        // Add to document
        document.body.appendChild(errorDiv);
    }
	
	// Add to Game class
	propagateContext() {
	    // Ensure all objects have the current context
	    if (this.parallax) this.parallax.ctx = this.ctx;
	    if (this.terrain) {
	        this.terrain.ctx = this.ctx;
	        if (this.terrain.obstacleManager) this.terrain.obstacleManager.ctx = this.ctx;
	        if (this.terrain.mineManager) this.terrain.mineManager.ctx = this.ctx;
	        if (this.terrain.generator) this.terrain.generator.ctx = this.ctx;
	    }
	    if (this.enemies) this.enemies.ctx = this.ctx;
	    if (this.player) {
	        this.player.ctx = this.ctx;
	        if (this.player.weapons) this.player.weapons.ctx = this.ctx;
	    }
	    if (this.effects) this.effects.ctx = this.ctx;
	    if (this.ui) this.ui.ctx = this.ctx;
	}
	
	// Add this method to the Game class
	toggleDebug() {
	    this.debugMode = !this.debugMode;
	    console.log(`Debug mode: ${this.debugMode ? 'ON' : 'OFF'}`);
	}
	
}

// Initialize game when the page loads
window.onload = function() {
    const game = new Game();
    game.init();
    
    // Make game instance available for debug mode
    window.game = game;
};