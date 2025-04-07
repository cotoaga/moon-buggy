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
            godModeElement.textContent = `God Mode: ${this.game.godMode ? 'ON' : 'OFF'}`;
            godModeElement.addEventListener('click', () => {
                this.toggleGodMode();
            });
        }
        
        // Set up Freeze Mode toggle
        const freezeModeElement = document.getElementById('freezeMode');
        if (freezeModeElement) {
            freezeModeElement.textContent = `Freeze: ${this.game.freezeMode ? 'ON' : 'OFF'}`;
            freezeModeElement.addEventListener('click', () => {
                this.game.freezeMode = !this.game.freezeMode;
                freezeModeElement.textContent = `Freeze: ${this.game.freezeMode ? 'ON' : 'OFF'}`;
            });
        }
        
        // Set up mobile controls if they exist
        this.setupMobileControls();
    }
    
    setupMobileControls() {
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
                if (this.game.player) {
                    this.game.player.jump();
                }
            });
        }
        
        if (shootBtn) {
            shootBtn.addEventListener('touchstart', () => { 
                if (this.game.player) {
                    this.game.player.shoot();
                }
            });
        }
        
        if (upBtn) {
            upBtn.addEventListener('touchstart', () => { 
                if (this.game.player) {
                    this.game.player.shootUp();
                }
            });
        }
        
        if (mineBtn) {
            mineBtn.addEventListener('touchstart', () => { 
                if (this.game.player) {
                    this.game.player.dropMine();
                }
            });
        }
    }
    
    handleKeyDown(event) {
        if (!this.game) return;
        
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
                if (this.game.gameRunning && this.game.player) {
                    this.game.player.jump();
                }
                break;
            case 'KeyZ':
            case 'KeyP':
                if (this.game.gameRunning && this.game.player) {
                    this.game.player.shoot();
                }
                break;
            case 'KeyO':
            case 'ArrowUp':
                if (this.game.gameRunning && this.game.player) {
                    this.game.player.shootUp();
                }
                break;
            case 'KeyK':
            case 'KeyM':
                if (this.game.gameRunning && this.game.player) {
                    this.game.player.dropMine();
                }
                break;
            case 'KeyR':
                if (!this.game.gameRunning) {
                    this.restartGame();
                }
                break;
            case 'KeyG':
                // Toggle God Mode with G key
                this.toggleGodMode();
                break;
            case 'KeyF':
                // Toggle Freeze Mode with F key
                if (this.game) {
                    this.game.freezeMode = !this.game.freezeMode;
                    const freezeModeElement = document.getElementById('freezeMode');
                    if (freezeModeElement) {
                        freezeModeElement.textContent = `Freeze: ${this.game.freezeMode ? 'ON' : 'OFF'}`;
                    }
                }
                break;
        }
    }
    
    handleKeyUp(event) {
        if (!this.game) return;
        
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
    
    toggleGodMode() {
        if (!this.game) return;
        
        // Toggle god mode
        this.game.godMode = !this.game.godMode;
        
        // Update global variable to ensure consistency
        window.godMode = this.game.godMode;
        
        // Update UI
        const godModeElement = document.getElementById('godMode');
        if (godModeElement) {
            godModeElement.textContent = `God Mode: ${this.game.godMode ? 'ON' : 'OFF'}`;
            
            // Visual feedback for toggle
            godModeElement.style.color = this.game.godMode ? '#00FF00' : '#FFFFFF';
            setTimeout(() => {
                godModeElement.style.color = '';
            }, 300);
        }
        
        console.log(`God Mode ${this.game.godMode ? 'enabled' : 'disabled'}`);
    }
    
    restartGame() {
        if (!this.game) return;
        if (typeof this.game.restartGame === 'function') {
            this.game.restartGame();
        }
    }
}