// mines.js - Player-placed mine management
class MineManager {
    constructor(terrainManager) {
        this.terrain = terrainManager;
        this.game = terrainManager.game;
        this.ctx = terrainManager.ctx;
        
        // Mine storage
        this.mines = [];
    }
    
	update(deltaTime) {
	    for (let i = this.mines.length - 1; i >= 0; i--) {
	        const mine = this.mines[i];

	        if (!mine.active) {
	            mine.timer -= deltaTime;
	            if (mine.timer <= 0) {
	                mine.active = true;
	            }
	        }

	        mine.x -= SCROLL_SPEED * deltaTime / 16;

	        if (mine.explode) {
	            this.game.effects.createExplosion(mine.x, mine.y);
	            this.mines.splice(i, 1);
	            continue;
	        }

	        if (mine.x < -50) {
	            this.mines.splice(i, 1);
	        }
	    }
	}
	    
    draw() {
        // Draw player mines (dropped by player)
        this.mines.forEach(mine => {
            // Inactive mines are dimmer
            if (!mine.active) {
                this.ctx.globalAlpha = 0.5;
            }
            
            // Draw mine as a rectangular device with blinking light
            const mineWidth = mine.width;
            const mineHeight = mine.height * 0.7;
            
            // Main mine body
            this.ctx.fillStyle = '#3355FF'; // Blue to distinguish from enemy mines
            this.ctx.fillRect(
                mine.x, 
                mine.y + mine.height - mineHeight,
                mineWidth,
                mineHeight
            );
            
            // Add panel lines
            this.ctx.strokeStyle = '#1133AA';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.moveTo(mine.x + mineWidth*0.33, mine.y + mine.height - mineHeight);
            this.ctx.lineTo(mine.x + mineWidth*0.33, mine.y + mine.height);
            this.ctx.moveTo(mine.x + mineWidth*0.66, mine.y + mine.height - mineHeight);
            this.ctx.lineTo(mine.x + mineWidth*0.66, mine.y + mine.height);
            this.ctx.stroke();
            
            // Activation status indicator
            if (mine.active) {
                // Active: blinking light
                const blinkingOn = (this.game.frameCount % 10 < 5);
                this.ctx.fillStyle = blinkingOn ? '#00FFFF' : '#0088AA';
                this.ctx.beginPath();
                this.ctx.arc(
                    mine.x + mineWidth/2,
                    mine.y + mine.height - mineHeight - 5,
                    4,
                    0, Math.PI*2
                );
                this.ctx.fill();
                
                // Light glow when blinking
                if (blinkingOn) {
                    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.3)';
                    this.ctx.beginPath();
                    this.ctx.arc(
                        mine.x + mineWidth/2,
                        mine.y + mine.height - mineHeight - 5,
                        8,
                        0, Math.PI*2
                    );
                    this.ctx.fill();
                }
            } else {
                // Inactive: timer display
                this.ctx.fillStyle = '#223366';
                this.ctx.beginPath();
                this.ctx.arc(
                    mine.x + mineWidth/2,
                    mine.y + mine.height - mineHeight - 5,
                    4,
                    0, Math.PI*2
                );
                this.ctx.fill();
            }
            
            // Reset alpha
            this.ctx.globalAlpha = 1.0;
        });
    }
    
    addMine(x, y) {
        this.mines.push({
            x: x,
            y: y,
            width: 20,
            height: 20,
            timer: 1000, // Activation timer
            active: false
        });
    }
}