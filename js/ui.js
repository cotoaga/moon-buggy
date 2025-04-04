// ui.js - HUD, scores, lives display
class UIManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
    }
    
    draw() {
        // Update UI elements
        document.getElementById('lives').textContent = `Lives: ${this.game.player.lives}`;
        document.getElementById('score').textContent = `Score: ${this.game.score}`;
        document.getElementById('level').textContent = `Level: ${this.game.level}`;
        
        const minutes = Math.floor(this.game.gameTime / 60000);
        const seconds = Math.floor((this.game.gameTime % 60000) / 1000);
        document.getElementById('time').textContent = 
            `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        // Draw current section indicator
        this.drawSectionIndicator();
    }
    
    drawSectionIndicator() {
        // Display current section more prominently
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`SECTION ${this.game.terrain.currentSection}`, GAME_WIDTH - 20, 30);
        
        // Draw progress bar
        const barWidth = 200;
        const barHeight = 10;
        const x = GAME_WIDTH - barWidth - 20;
        const y = 40;
        
        // Background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(x, y, barWidth, barHeight);
        
        // Progress
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillRect(x, y, barWidth * (this.game.terrain.levelProgress / 100), barHeight);
        
        // Border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, barWidth, barHeight);
    }
    
    showLevelMessage() {
        // Create a level message div
        const levelMsg = document.createElement('div');
        levelMsg.style.position = 'absolute';
        levelMsg.style.top = '50%';
        levelMsg.style.left = '50%';
        levelMsg.style.transform = 'translate(-50%, -50%)';
        levelMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        levelMsg.style.color = '#FFFF00';
        levelMsg.style.padding = '20px';
        levelMsg.style.borderRadius = '10px';
        levelMsg.style.fontSize = '24px';
        levelMsg.style.fontWeight = 'bold';
        levelMsg.style.zIndex = '100';
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
        descElem.style.marginTop = '10px';
        descElem.textContent = description;
        levelMsg.appendChild(descElem);
        
        // Add to document
        document.getElementById('gameContainer').appendChild(levelMsg);
        
        // Remove after a few seconds
        setTimeout(() => {
            levelMsg.remove();
        }, 3000);
    }
}