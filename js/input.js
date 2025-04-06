// input.js - Input handling (keyboard/touch)
class InputManager {
    constructor(game) {
        this.game = game;
        this.keys = {
            left: false,
            right: false,
            jump: false,
            shoot: false,
            shootUp: false,
            mine: false
        };
        
        // Restart handling
        this.restartListener = false;
    }
    
    initialize() {
        // Set up keyboard listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
    	// Set up God Mode toggle
        const godModeElement = document.getElementById('godMode');
        if (godModeElement) {
            godModeElement.addEventListener('click', () => {
                this.game.godMode = !this.game.godMode;
                godMode = this.game.godMode; // Update the global variable
            });
        }
		// Set up Freeze Mode toggle
		const freezeModeElement = document.getElementById('freezeMode');
		if (freezeModeElement) {
		    freezeModeElement.addEventListener('click', () => {
		        this.game.freezeMode = !this.game.freezeMode;
		        freezeModeElement.textContent = `Freeze: ${this.game.freezeMode ? 'ON' : 'OFF'}`;
		    });
		}
		
        // Set up mobile controls if they exist
        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');
        const jumpBtn = document.getElementById('jumpBtn');
        const shootBtn = document.getElementById('shootBtn');
        const upBtn = document.getElementById('upBtn');
        const mineBtn = document.getElementById('mineBtn');
        
        if (leftBtn) {
            leftBtn.addEventListener('touchstart', () => { this.keys.left = true; });
            leftBtn.addEventListener('touchend', () => { this.keys.left = false; });
        }
        
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', () => { this.keys.right = true; });
            rightBtn.addEventListener('touchend', () => { this.keys.right = false; });
        }
        
        if (jumpBtn) {
            jumpBtn.addEventListener('touchstart', () => { 
                this.game.player.jump();
            });
        }
        
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', () => { 
                this.game.player.shoot();
            });
        }
        
        if (upBtn) {
            upBtn.addEventListener('touchstart', () => { 
                this.game.player.shootUp();
            });
        }
        
        if (mineBtn) {
            mineBtn.addEventListener('touchstart', () => { 
                this.game.player.dropMine();
            });
        }
    }
    
    handleKeyDown(event) {
        switch (event.code) {
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'KeyS':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'Space':
                if (this.game.gameRunning) {
                    this.game.player.jump();
                }
                break;
            case 'KeyZ':
            case 'KeyP':
                if (this.game.gameRunning) {
                    this.game.player.shoot();
                }
                break;
            case 'KeyO':
            case 'ArrowUp':
                if (this.game.gameRunning) {
                    this.game.player.shootUp();
                }
                break;
            case 'KeyK':
            case 'KeyM':
                if (this.game.gameRunning) {
                    this.game.player.dropMine();
                }
                break;
            case 'KeyR':
                if (!this.game.gameRunning) {
                    this.restartGame();
                }
                break;
        }
    }
    
    handleKeyUp(event) {
        switch (event.code) {
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'KeyS':
            case 'ArrowRight':
                this.keys.right = false;
                break;
        }
    }
    
    restartGame() {
        // Reset game state
        this.game.gameRunning = true;
        this.game.level = 1;
        this.game.score = 0;
        this.game.gameTime = 0;
        
        // Reset player
        this.game.player.x = 200;
        this.game.player.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
        this.game.player.velocityY = 0;
        this.game.player.isJumping = false;
        this.game.player.lives = 3;
        this.game.player.invulnerable = 0;
        this.game.player.bullets = [];
        
        // Reset terrain
        this.game.terrain.levelProgress = 0;
        this.game.terrain.currentSection = 'A';
        this.game.terrain.obstacles = [];
        this.game.terrain.mines = [];
        
        // Reset enemies
        this.game.enemies.enemies = [];
        
        // Reset spawn counters
        this.game.enemies.spawnCounters = {
            ufoHigh: 3000,
            ufoMid: 5000,
            ufoLow: 7000,
            buggy: 10000
        };
    }
}