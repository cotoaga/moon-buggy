// obstacles.js - Obstacle management
class ObstacleManager {
    constructor(terrainManager) {
        this.terrain = terrainManager;
        this.game = terrainManager.game;
        this.ctx = terrainManager.ctx;
        
        // Obstacle storage and timing
        this.obstacles = [];
        this.obstacleCounter = 120; // Default, will be updated from level manager
    }
    
    update(deltaTime) {
        // Update existing obstacles
        this.updateObstacles(deltaTime);
        
        // Spawn new obstacles occasionally
        this.obstacleCounter -= deltaTime;
        if (this.obstacleCounter <= 0) {
            if (this.game.levels) {
                this.obstacleCounter = this.game.levels.getObstacleFrequency();
            } else {
                this.obstacleCounter = 120; // Default
            }
            
            // Add a new obstacle at the edge of the screen - only large rocks
            if (Math.random() < 0.1) { // Significantly reduced frequency
                // Constants for rock size
                const rockWidth = 90;
                const rockHeight = 80;
                
                this.addObstacle({
                    x: GAME_WIDTH + 50,
                    y: GAME_HEIGHT - GROUND_HEIGHT - rockHeight,
                    width: rockWidth,
                    height: rockHeight,
                    type: OBSTACLE_TYPES.ROCK,
                    destroyed: false
                });
            }
        }
    }
    
    updateObstacles(deltaTime) {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            // Move obstacle with scrolling
            obstacle.x -= SCROLL_SPEED * deltaTime / 16;
            
            // Update falling bombs if they have velocity
            if (obstacle.velocityY) {
                obstacle.y += obstacle.velocityY;
                
                // Check if bomb hit ground
                if (obstacle.y > GAME_HEIGHT - GROUND_HEIGHT - obstacle.height) {
                    obstacle.y = GAME_HEIGHT - GROUND_HEIGHT - obstacle.height;
                    obstacle.velocityY = 0;  // Stop falling
                    
                    // Convert to ground mine
                    obstacle.type = OBSTACLE_TYPES.MINE;
                    obstacle.width = 25;
                    obstacle.height = 25;
                }
            }
            
            // Update moving bullets
            if (obstacle.velocityX) {
                obstacle.x += obstacle.velocityX;
                
                // Remove bullets that go offscreen
                if (obstacle.x > GAME_WIDTH || obstacle.x < 0) {
                    obstacle.destroyed = true;
                }
            }
            
            // Remove obstacles that go offscreen or are destroyed
            if (obstacle.x < -50 || obstacle.destroyed) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    addObstacle(obstacle) {
        this.obstacles.push(obstacle);
    }
    
    addBomb(x, y) {
        this.addObstacle({
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
        this.addObstacle({
            x: x,
            y: y,
            width: 15,
            height: 5,
            velocityX: 7,
            type: 'bullet',
            destroyed: false
        });
    }
    
    draw() {
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            
            if (obstacle.destroyed) continue;
            
            if (obstacle.type === OBSTACLE_TYPES.ROCK) {
                this.drawRock(obstacle);
            } else if (obstacle.type === OBSTACLE_TYPES.CRATER) {
                this.drawCrater(obstacle);
            } else if (obstacle.type === OBSTACLE_TYPES.MINE) {
                this.drawMine(obstacle);
            } else if (obstacle.type === 'bullet') {
                this.drawBullet(obstacle);
            }
        }
    }
    
	drawRock(obstacle) {
	    this.ctx.save();

	    const offsetY = 20; // sink rock into ground
	    const { x, y, width, height } = obstacle;
	    const topY = y + offsetY;

	    // Color palette
	    const baseColor = '#4A5A66';
	    const darkFacet = '#2C3E50';
	    const midFacet = '#556670';
	    const lightFacet = '#7F8C8D';

	    // Base polygon
	    this.ctx.fillStyle = baseColor;
	    this.ctx.beginPath();
	    this.ctx.moveTo(x + width * 0.1, topY + height * 0.6);
	    this.ctx.lineTo(x + width * 0.3, topY + height * 0.2);
	    this.ctx.lineTo(x + width * 0.6, topY + height * 0.1);
	    this.ctx.lineTo(x + width * 0.8, topY + height * 0.4);
	    this.ctx.lineTo(x + width * 0.7, topY + height * 0.8);
	    this.ctx.lineTo(x + width * 0.2, topY + height * 0.9);
	    this.ctx.closePath();
	    this.ctx.fill();

	    // Dark facet
	    this.ctx.fillStyle = darkFacet;
	    this.ctx.beginPath();
	    this.ctx.moveTo(x + width * 0.3, topY + height * 0.2);
	    this.ctx.lineTo(x + width * 0.5, topY + height * 0.3);
	    this.ctx.lineTo(x + width * 0.4, topY + height * 0.7);
	    this.ctx.lineTo(x + width * 0.2, topY + height * 0.9);
	    this.ctx.closePath();
	    this.ctx.fill();

	    // Light facet
	    this.ctx.fillStyle = lightFacet;
	    this.ctx.beginPath();
	    this.ctx.moveTo(x + width * 0.6, topY + height * 0.1);
	    this.ctx.lineTo(x + width * 0.8, topY + height * 0.4);
	    this.ctx.lineTo(x + width * 0.5, topY + height * 0.3);
	    this.ctx.closePath();
	    this.ctx.fill();

	    // Midtone facet
	    this.ctx.fillStyle = midFacet;
	    this.ctx.beginPath();
	    this.ctx.moveTo(x + width * 0.5, topY + height * 0.3);
	    this.ctx.lineTo(x + width * 0.4, topY + height * 0.7);
	    this.ctx.lineTo(x + width * 0.7, topY + height * 0.8);
	    this.ctx.lineTo(x + width * 0.8, topY + height * 0.4);
	    this.ctx.closePath();
	    this.ctx.fill();

	    this.ctx.restore();
	}
		    
	drawCrater(ctx, x, y, radius) {
	    ctx.save();

	    // Outer shadowed ring
	    const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius);
	    gradient.addColorStop(0, '#3A3A3A');
	    gradient.addColorStop(1, '#1A1A1A');

	    ctx.fillStyle = gradient;
	    ctx.beginPath();
	    ctx.arc(x, y, radius, 0, Math.PI, true);
	    ctx.fill();

	    // Inner core – lighter dust
	    ctx.fillStyle = '#444';
	    ctx.beginPath();
	    ctx.arc(x, y, radius * 0.7, 0, Math.PI, true);
	    ctx.fill();

	    // Optional: draw cracks
	    ctx.strokeStyle = '#222';
	    ctx.lineWidth = 1;
	    ctx.beginPath();
	    ctx.moveTo(x - radius * 0.4, y);
	    ctx.lineTo(x - radius * 0.1, y - 5);
	    ctx.moveTo(x + radius * 0.1, y - 3);
	    ctx.lineTo(x + radius * 0.3, y);
	    ctx.stroke();

	    ctx.restore();
	}
    
    drawMine(obstacle) {
        // Draw mine as a rectangular device with blinking light
        const mineWidth = obstacle.width;
        const mineHeight = obstacle.height * 0.7; // Make it shorter than wide
        
        // Main mine body
        this.ctx.fillStyle = '#AA3333';
        this.ctx.fillRect(
            obstacle.x, 
            obstacle.y + obstacle.height - mineHeight,
            mineWidth,
            mineHeight
        );
        
        // Add panel lines
        this.ctx.strokeStyle = '#661111';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + mineWidth*0.33, obstacle.y + obstacle.height - mineHeight);
        this.ctx.lineTo(obstacle.x + mineWidth*0.33, obstacle.y + obstacle.height);
        this.ctx.moveTo(obstacle.x + mineWidth*0.66, obstacle.y + obstacle.height - mineHeight);
        this.ctx.lineTo(obstacle.x + mineWidth*0.66, obstacle.y + obstacle.height);
        this.ctx.stroke();
        
        // Blinking light on top
        const blinkingOn = this.game.frameCount % 20 < 10;
        this.ctx.fillStyle = blinkingOn ? '#FFFF00' : '#AA5500';
        this.ctx.beginPath();
        this.ctx.arc(
            obstacle.x + mineWidth/2,
            obstacle.y + obstacle.height - mineHeight - 5,
            4,
            0, Math.PI*2
        );
        this.ctx.fill();
        
        // Light glow when blinking
        if (blinkingOn) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.arc(
                obstacle.x + mineWidth/2,
                obstacle.y + obstacle.height - mineHeight - 5,
                8,
                0, Math.PI*2
            );
            this.ctx.fill();
        }
    }
    
    drawBullet(obstacle) {
        // Draw enemy bullet
        this.ctx.fillStyle = '#FF8800';
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Add trailing effect
        this.ctx.fillStyle = 'rgba(255, 136, 0, 0.5)';
        this.ctx.fillRect(obstacle.x - 10, obstacle.y, 10, obstacle.height);
    }
}