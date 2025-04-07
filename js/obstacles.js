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
        // Draw more realistic rocks
        const rockCenterX = obstacle.x + obstacle.width/2;
        const rockBottomY = obstacle.y + obstacle.height;
        
        // Rock base (dark gray)
        this.ctx.fillStyle = '#555555';
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x, rockBottomY);
        this.ctx.lineTo(obstacle.x + obstacle.width*0.3, rockBottomY - obstacle.height*0.5);
        this.ctx.lineTo(obstacle.x + obstacle.width*0.7, rockBottomY - obstacle.height*0.7);
        this.ctx.lineTo(obstacle.x + obstacle.width, rockBottomY);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Rock highlights (lighter gray)
        this.ctx.fillStyle = '#999999';
        this.ctx.beginPath();
        this.ctx.moveTo(obstacle.x + obstacle.width*0.3, rockBottomY - obstacle.height*0.5);
        this.ctx.lineTo(obstacle.x + obstacle.width*0.5, rockBottomY - obstacle.height*0.9);
        this.ctx.lineTo(obstacle.x + obstacle.width*0.7, rockBottomY - obstacle.height*0.7);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.4)';
        this.ctx.beginPath();
        this.ctx.ellipse(rockCenterX, rockBottomY - 2, obstacle.width/2, 4, 0, 0, Math.PI*2);
        this.ctx.fill();
    }
    
    drawCrater(obstacle) {
        // Draw small crater obstacles (similar to ground craters but smaller)
        obstacle.width = Math.max(obstacle.width, 30); // Ensure craters are visible
        
        // Main crater bowl
        this.ctx.fillStyle = '#1A1A1A';
        this.ctx.beginPath();
        this.ctx.arc(
            obstacle.x + obstacle.width/2, 
            obstacle.y + obstacle.height/2, 
            obstacle.width/2,
            0, Math.PI*2
        );
        this.ctx.fill();
        
        // Inner crater (deeper part)
        this.ctx.fillStyle = '#0F0F0F';
        this.ctx.beginPath();
        this.ctx.arc(
            obstacle.x + obstacle.width/2, 
            obstacle.y + obstacle.height/2 + 3, 
            obstacle.width/3,
            0, Math.PI*2
        );
        this.ctx.fill();
        
        // Add impact marks (small lines radiating from crater)
        this.ctx.strokeStyle = '#444444';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI / 3) * i;
            const length = obstacle.width * 0.3;
            this.ctx.beginPath();
            this.ctx.moveTo(
                obstacle.x + obstacle.width/2, 
                obstacle.y + obstacle.height/2
            );
            this.ctx.lineTo(
                obstacle.x + obstacle.width/2 + Math.cos(angle) * length,
                obstacle.y + obstacle.height/2 + Math.sin(angle) * length
            );
            this.ctx.stroke();
        }
        
        // Add shadow/highlight
        this.ctx.strokeStyle = '#444444';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(
            obstacle.x + obstacle.width/2, 
            obstacle.y + obstacle.height/2, 
            obstacle.width/2 - 2,
            Math.PI*1.7, Math.PI*0.3
        );
        this.ctx.stroke();
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