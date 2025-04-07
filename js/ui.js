// ui.js - HUD, scores, lives display - FIXED with standardized bars
class UIManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
    }
    
    draw() {
        // Update UI elements
        document.getElementById('lives').textContent = `Lives: ${this.game.player ? this.game.player.health.lives : 3}`;
        document.getElementById('score').textContent = `Score: ${this.game.score}`;
        document.getElementById('level').textContent = `Level: ${this.game.level}`;

        const minutes = Math.floor(this.game.gameTime / 60000);
        const seconds = Math.floor((this.game.gameTime % 60000) / 1000);
        document.getElementById('time').textContent = 
            `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        // Update God Mode indicator
        document.getElementById('godMode').textContent = `God Mode: ${this.game.godMode ? 'ON' : 'OFF'}`;
        
        // Draw all status bars in the upper right with consistent style
        this.drawStatusBars();
    }
    
    drawStatusBars() {
        // Common bar dimensions and positioning
        const barWidth = 150;
        const barHeight = 10;
        const barX = GAME_WIDTH - barWidth - 10;
        const labelOffsetX = 10; // Space between label and bar
        
        // Get values safely
        const shield = this.game.player ? this.game.player.health.shield : 100;
        const energy = this.game.player ? this.game.player.health.energy : 100;
        const progress = this.game.terrain ? this.game.terrain.levelProgress : 0;
        
        // Common text style
        this.ctx.font = '8px "Press Start 2P"';
        this.ctx.textAlign = 'right';
        
        // 1. SECTION PROGRESS BAR - Top position
        const sectionY = 30;
        
        // Section label
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('SECTION ' + (this.game.terrain ? this.game.terrain.currentSection : 'A'), barX - labelOffsetX, sectionY + 8); // Aligned with bar
        
        // Section progress background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(barX, sectionY, barWidth, barHeight);
        
        // Section progress fill
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(barX, sectionY, barWidth * (progress / 100), barHeight);
        
        // Section progress border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, sectionY, barWidth, barHeight);
        
        // 2. SHIELD BAR - Middle position
        const shieldY = sectionY + barHeight + 15;
        
        // Shield label
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('SHIELD', barX - labelOffsetX, shieldY + 8);
        
        // Shield background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(barX, shieldY, barWidth, barHeight);
        
        // Shield fill
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.fillRect(barX, shieldY, barWidth * (shield / 100), barHeight);
        
        // Shield border
        this.ctx.strokeStyle = '#00CCCC';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, shieldY, barWidth, barHeight);
        
        // 3. ENERGY BAR - Bottom position
        const energyY = shieldY + barHeight + 15;
        
        // Energy label
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('ENERGY', barX - labelOffsetX, energyY + 8);
        
        // Energy background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(barX, energyY, barWidth, barHeight);
        
        // Energy fill
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(barX, energyY, barWidth * (energy / 100), barHeight);
        
        // Energy border
        this.ctx.strokeStyle = '#CCCC00';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, energyY, barWidth, barHeight);
    }
        
    showLevelMessage() {
        // Create a level message overlay for better visibility
        const overlay = document.createElement('div');
        overlay.className = 'level-message-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '1000';
        
        // Create the message box
        const levelMsg = document.createElement('div');
        levelMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        levelMsg.style.color = '#FFFF00';
        levelMsg.style.padding = '30px';
        levelMsg.style.borderRadius = '10px';
        levelMsg.style.fontSize = '24px';
        levelMsg.style.fontWeight = 'bold';
        levelMsg.style.fontFamily = '"Press Start 2P", monospace';
        levelMsg.style.textAlign = 'center';
        levelMsg.style.border = '2px solid #FFFF00';
        levelMsg.style.boxShadow = '0 0 20px rgba(255, 255, 0, 0.5)';
        levelMsg.textContent = `LEVEL ${this.game.level}!`;
        
        // Add description of new enemies
        let description = '';
        switch (this.game.level) {
            case 2:
                description = 'High UFOs appear!';
                break;
            case 3:
                description = 'Mid-level UFOs appear!';
                break;
            case 4:
                description = 'Enemy buggies attack from behind!';
                break;
            case 5:
                description = 'Low UFOs with precision bombing!';
                break;
            case 6:
                description = 'More land mines!';
                break;
            default:
                description = 'Difficulty increases!';
        }
        
        // Add the description
        const descElem = document.createElement('div');
        descElem.style.fontSize = '16px';
        descElem.style.marginTop = '20px';
        descElem.textContent = description;
        levelMsg.appendChild(descElem);
        
        // Add message to overlay
        overlay.appendChild(levelMsg);
        
        // Add to document
        document.body.appendChild(overlay);
        
        // Auto-remove after a few seconds
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                overlay.remove();
            }
        }, 3000);
    }
}