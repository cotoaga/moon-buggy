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
        this._deathMessageElements = null;
        this._deathMessageTimeout = null;
        this._deathMessageKeyHandler = null;
    }

    initialize() {
        this.lives = 3;
        this.shield = 100;
        this.energy = 100;
        this.invulnerable = 2000;

        this.removeDeathMessage();
        this.deathMessageShown = false;
    }

    update(deltaTime) {
        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
            this.player.flash = Math.floor(this.invulnerable / 100) % 2 === 0;
        } else {
            this.player.flash = false;
        }

        if (this.energy < this.maxEnergy) {
            this.energy += this.energyRecoveryRate * deltaTime / 16;
            this.energy = Math.min(this.energy, this.maxEnergy);
        }

        if (this.energy >= this.maxEnergy && this.shield < this.maxShield) {
            this.shield += this.shieldRecoveryRate * deltaTime / 16;
            this.shield = Math.min(this.shield, this.maxShield);
        }
    }

    hit(hitType) {
        if (this.invulnerable > 0) return;

        if (hitType === 'crater') {
            this.lives--;
            this.invulnerable = 2000;

            if (this.game && this.game.gameRunning && !this.game.godMode) {
                this.showDeathMessage("You drove full speed ahead into a crater. That was unnecessarily dumb and even your sophisticated shields could not save you from your own stupidity.");
            }

            if (this.lives <= 0) {
                if (this.game) this.game.gameRunning = false;
            }
        }
        else if (hitType === OBSTACLE_TYPES.ROCK && this.shield > 0) {
            this.shield -= 25;
            this.invulnerable = 500;
            if (this.game.effects) {
                this.game.effects.createShieldEffect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        }
        else if (this.game && this.game.godMode) {
            this.invulnerable = 1000;
            if (this.game.effects) {
                this.game.effects.createShieldEffect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        }
        else {
            this.lives--;
            this.invulnerable = 2000;
            if (this.game.effects) {
                this.game.effects.createShieldEffect(this.player.x, this.player.y, this.player.width, this.player.height);
            }

            if (this.lives <= 0) {
                if (this.game) this.game.gameRunning = false;
            }
        }
    }

    showDeathMessage(message) {
        if (this.deathMessageShown || !this.game || !this.game.gameRunning) return;

        this.deathMessageShown = true;
        this.removeDeathMessage();

        const overlay = document.createElement('div');
        overlay.className = 'death-message-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.zIndex = '99999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';

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

        const messageP = document.createElement('p');
        messageP.textContent = message;
        dialog.appendChild(messageP);

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

        dialog.appendChild(button);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        this._deathMessageElements = { overlay, dialog, button };

        const dismissHandler = () => {
            this.removeDeathMessage();
            if (this._deathMessageTimeout) {
                clearTimeout(this._deathMessageTimeout);
                this._deathMessageTimeout = null;
            }
            window.removeEventListener('keydown', this._deathMessageKeyHandler);
            this._deathMessageKeyHandler = null;
        };

        button.onclick = dismissHandler;

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                dismissHandler();
            }
        });

        this._deathMessageKeyHandler = (e) => {
            dismissHandler();
        };
        window.addEventListener('keydown', this._deathMessageKeyHandler);

        this._deathMessageTimeout = setTimeout(dismissHandler, 5000);
    }

    removeDeathMessage() {
        this.deathMessageShown = false;

        const overlays = document.querySelectorAll('.death-message-overlay');
        overlays.forEach(overlay => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
            }
        });

        this._deathMessageElements = null;

        if (this._deathMessageTimeout) {
            clearTimeout(this._deathMessageTimeout);
            this._deathMessageTimeout = null;
        }

        if (this._deathMessageKeyHandler) {
            window.removeEventListener('keydown', this._deathMessageKeyHandler);
            this._deathMessageKeyHandler = null;
        }
    }
}