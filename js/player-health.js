// player-health.js - Player health and status effects - FIXED
class PlayerHealth {
    constructor(player) {
        this.player = player;
        this.game = player.game;
        
        // Health state
        this.lives = 3;
        this.shield = 100;
        this.energy = 100;
        this.invulnerable = 0;
        
        // Energy and shield properties
        this.maxEnergy = 100;
        this.maxShield = 100;
        this.energyRecoveryRate = 0.2; // per frame
        this.shieldRecoveryRate = 0.05; // per frame
        
        // Death message tracking
        this.deathMessageShown = false;
        this._deathMessageElements = null; // To store references to dialog elements
        this._deathMessageTimeout = null; // To store timeout reference
    }
    
    initialize() {
        // Reset health state
        this.lives = 3;
        this.shield = 100;
        this.energy = 100;
        this.invulnerable = 2000; // 2 seconds of invulnerability on start
        
        // Clear any existing death message
        this.removeDeathMessage();
        this.deathMessageShown = false;
    }
    
    update(deltaTime) {
        // Update invulnerability and flashing
        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
            // Flash effect every 100ms
            if (Math.floor(this.invulnerable / 100) % 2 === 0) {
                this.player.flash = true;
            } else {
                this.player.flash = false;
            }
        } else {
            this.player.flash = false;
        }
        
        // Energy recovery
        if (this.energy < this.maxEnergy) {
            this.energy += this.energyRecoveryRate * deltaTime / 16;
            this.energy = Math.min(this.energy, this.maxEnergy);
        }
        
        // Shield recovery only when energy is full
        if (this.energy >= this.maxEnergy && this.shield < this.maxShield) {
            this.shield += this.shieldRecoveryRate * deltaTime / 16;
            this.shield = Math.min(this.shield, this.maxShield);
        }
    }
    
    hit(hitType) {
        if (this.invulnerable > 0) return;
        
        // Different hit handling based on hit type
        if (hitType === 'crater') {
            // Instant death from craters regardless of shield/godmode
            this.lives--;
            this.invulnerable = 2000;
            
            // Only show death message if game is still running
            if (this.game && this.game.gameRunning) {
                this.showDeathMessage("You drove full speed ahead into a crater. That was unnecessarily dumb and even your sophisticated shields could not save you from your own stupidity.");
            }
            
            if (this.lives <= 0) {
                if (this.game) this.game.gameRunning = false;
            }
        }
        else if (hitType === OBSTACLE_TYPES.ROCK && this.shield > 0) {
            // Rocks drain shield
            this.shield -= 25;
            this.invulnerable = 500;
            if (this.game && this.game.effects) {
                this.game.effects.createShieldEffect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        }
        else if (this.game && this.game.godMode) {
            // God mode prevents damage from everything except craters
            this.invulnerable = 1000;
            if (this.game.effects) {
                this.game.effects.createShieldEffect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        }
        else {
            // No shield or god mode, lose a life
            this.lives--;
            this.invulnerable = 2000;
            if (this.game && this.game.effects) {
                this.game.effects.createShieldEffect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
            
            if (this.lives <= 0) {
                if (this.game) this.game.gameRunning = false;
            }
        }
    }
    
    showDeathMessage(message) {
        // Prevent showing multiple death messages
        if (this.deathMessageShown || !this.game || !this.game.gameRunning) return;
        
        // Set flag
        this.deathMessageShown = true;
        
        // Remove any existing death messages first
        this.removeDeathMessage();
        
        // Create a full-screen overlay div that captures all clicks
        const overlay = document.createElement('div');
        overlay.className = 'death-message-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent background
        overlay.style.zIndex = '99999'; // Very high z-index
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        
        // Create the dialog box
        const dialog = document.createElement('div');
        dialog.className = 'death-message-dialog';
        dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        dialog.style.color = '#FF3333';
        dialog.style.padding = '30px';
        dialog.style.borderRadius = '10px';
        dialog.style.fontFamily = '"Press Start 2P", monospace';
        dialog.style.fontSize = '16px';
        dialog.style.maxWidth = '500px';
        dialog.style.textAlign = 'center';
        dialog.style.boxShadow = '0 0 20px rgba(255, 0, 0, 0.5)';
        dialog.style.border = '2px solid #FF3333';
        
        // Message text
        const messageP = document.createElement('p');
        messageP.textContent = message;
        dialog.appendChild(messageP);
        
        // Button
        const button = document.createElement('button');
        button.id = 'deathMessageButton';
        button.textContent = 'Continue';
        button.style.background = '#FF3333';
        button.style.color = '#FFF';
        button.style.border = 'none';
        button.style.padding = '10px 20px';
        button.style.marginTop = '20px';
        button.style.cursor = 'pointer';
        button.style.fontFamily = '"Press Start 2P", monospace';
        button.style.fontSize = '16px';
        button.style.borderRadius = '5px';
        
        // Add the button to the dialog
        dialog.appendChild(button);
        
        // Add the dialog to the overlay
        overlay.appendChild(dialog);
        
        // Add the overlay to the document body
        document.body.appendChild(overlay);
        
        // Store references to both elements for easy cleanup
        this._deathMessageElements = { overlay, dialog, button };
        
        // Define a handler function for dismissing the dialog
        const dismissHandler = () => {
            this.removeDeathMessage();
            
            // Clear timeout if it exists
            if (this._deathMessageTimeout) {
                clearTimeout(this._deathMessageTimeout);
                this._deathMessageTimeout = null;
            }
        };
        
        // Add click event to button with direct function to avoid reference issues
        button.onclick = dismissHandler;
        
        // Also close when clicking directly on the overlay (not its children)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                dismissHandler();
            }
        });
        
        // Auto-close after 5 seconds
        this._deathMessageTimeout = setTimeout(dismissHandler, 5000);
    }
    
    // Properly remove death message
    removeDeathMessage() {
        // Clear the flag immediately
        this.deathMessageShown = false;
        
        // Remove any existing death message elements
        const overlays = document.querySelectorAll('.death-message-overlay');
        overlays.forEach(overlay => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        });
        
        // Clear element references
        this._deathMessageElements = null;
        
        // Clear timeout if it exists
        if (this._deathMessageTimeout) {
            clearTimeout(this._deathMessageTimeout);
            this._deathMessageTimeout = null;
        }
    }
}