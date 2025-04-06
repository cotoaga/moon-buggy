// terrain.js - Handles ground generation, obstacles, sections, mines
class TerrainManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.groundSegments = [];
        this.obstacles = [];
        this.mines = [];
        this.sectionWidth = 800;
        this.currentSection = 'A';
        this.levelProgress = 0;
        this.levelLength = 12; // A-L
        this.obstacleCounter = 0;
    }
    
    initialize() {
        this.generateInitialGround();
        
        // Set initial obstacle spawn frequency from level manager
        this.obstacleCounter = this.game.levels.getObstacleFrequency();
    }
    
    generateInitialGround() {
        // Generate initial ground segments for the full level
        const segmentWidth = 150;
        const segmentCount = Math.ceil((this.sectionWidth * this.levelLength) / segmentWidth);
        
        for (let i = 0; i < segmentCount; i++) {
            // Determine segment type and height
            let segmentType = 'flat';
            let segmentHeight = 0;
            
            // More obstacles in later sections
            const sectionIndex = Math.floor((i * segmentWidth) / this.sectionWidth);
            const obstacleChance = 0.03 + (sectionIndex * 0.005); // Increases difficulty
            
            const rand = Math.random();
            if (rand < obstacleChance) {
                segmentType = 'crater';
                segmentHeight = -55;
            } else {
                // No more bumps - just flat or crater
                segmentType = 'flat';
                segmentHeight = 0;
            }
            
            this.groundSegments.push({
                x: i * segmentWidth,
                height: segmentHeight,
                type: segmentType,
                width: segmentWidth,
                section: String.fromCharCode(65 + sectionIndex % this.levelLength)
            });
            
            // Add obstacles on flat segments occasionally
			if (segmentType === 'flat' && Math.random() < 0.08) {
			    // Only rocks, no small craters
			    const obstacleWidth = 40;
			    const obstacleHeight = 35;
    
			    this.obstacles.push({
			        x: i * segmentWidth + segmentWidth/2,
			        y: GAME_HEIGHT - GROUND_HEIGHT - obstacleHeight,
			        width: obstacleWidth,
			        height: obstacleHeight,
			        type: OBSTACLE_TYPES.ROCK,
			        destroyed: false
			    });
			}
        }
    }
    
    update(deltaTime) {
        // Update level progress as we scroll
        this.levelProgress += (SCROLL_SPEED * deltaTime / 16) / (this.sectionWidth * this.levelLength) * 100;
        
        // Calculate current section based on progress
        const sectionIndex = Math.floor((this.levelProgress / 100) * this.levelLength);
        this.currentSection = String.fromCharCode(65 + sectionIndex); // A-L
        
        // Update obstacles
        this.updateObstacles(deltaTime);
        
        // Update mines (player-dropped)
        this.updateMines(deltaTime);
        
        // Spawn new obstacles occasionally
        this.obstacleCounter -= deltaTime;
        if (this.obstacleCounter <= 0) {
            this.obstacleCounter = this.game.levels.getObstacleFrequency();
            
            // Add a new obstacle at the edge of the screen
            if (Math.random() < 0.4) { // Reduced frequency
                this.addObstacle({
                    x: GAME_WIDTH + 50,
                    y: GAME_HEIGHT - GROUND_HEIGHT - 20,
                    width: 20,
                    height: 20,
                    type: Math.random() < 0.7 ? OBSTACLE_TYPES.ROCK : OBSTACLE_TYPES.CRATER,
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
    
    updateMines(deltaTime) {
        for (let i = this.mines.length - 1; i >= 0; i--) {
            const mine = this.mines[i];
            
            // Update mine timer
            if (!mine.active) {
                mine.timer -= deltaTime;
                if (mine.timer <= 0) {
                    mine.active = true;
                }
            }
            
            // Move mine with scrolling
            mine.x -= SCROLL_SPEED * deltaTime / 16;
            
            // Remove mines that scroll off screen
            if (mine.x < -50) {
                this.mines.splice(i, 1);
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
    
    getGroundY(x) {
        // Get ground height at specific x coordinate
        const scrollOffset = (this.levelProgress / 100) * (this.sectionWidth * this.levelLength);
        
        for (let i = 0; i < this.groundSegments.length; i++) {
            const segment = this.groundSegments[i];
            const adjustedX = segment.x - scrollOffset;
            
            if (x >= adjustedX && x < adjustedX + segment.width) {
                return GAME_HEIGHT - GROUND_HEIGHT + segment.height;
            }
        }
        
        return GAME_HEIGHT - GROUND_HEIGHT;
    }
    
    draw() {
        const scrollOffset = (this.levelProgress / 100) * (this.sectionWidth * this.levelLength);
        
        // Draw base ground
        this.ctx.fillStyle = '#333333'; // Darker ground color for better contrast with mountains
        this.ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
        
        // Draw ground features
        for (let i = 0; i < this.groundSegments.length; i++) {
            const segment = this.groundSegments[i];
            const adjustedX = segment.x - scrollOffset;
            
            // Only draw visible segments
            if (adjustedX + segment.width < 0 || adjustedX > GAME_WIDTH) continue;
            
            if (segment.type === 'crater') {
                // Draw crater with moon-like appearance
                this.ctx.fillStyle = '#1A1A1A'; // Darker for depth
                
                // Main crater
                this.ctx.beginPath();
                this.ctx.arc(
                    adjustedX + segment.width/2, 
                    GAME_HEIGHT - GROUND_HEIGHT, 
                    segment.width/2, 
                    0, Math.PI
                );
                this.ctx.fill();
                
                // Add deeper inner crater
                this.ctx.fillStyle = '#0F0F0F';
                this.ctx.beginPath();
                this.ctx.arc(
                    adjustedX + segment.width/2, 
                    GAME_HEIGHT - GROUND_HEIGHT,
                    segment.width/3, 
                    0, Math.PI
                );
                this.ctx.fill();
                
                // Add impact marks (small lines radiating from crater)
                this.ctx.strokeStyle = '#333333';
                this.ctx.lineWidth = 1;
                for (let i = 0; i < 5; i++) {
                    const angle = (Math.PI / 6) + i * (Math.PI / 12);
                    const length = segment.width * 0.3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(
                        adjustedX + segment.width/2, 
                        GAME_HEIGHT - GROUND_HEIGHT
                    );
                    this.ctx.lineTo(
                        adjustedX + segment.width/2 + Math.cos(angle) * length,
                        GAME_HEIGHT - GROUND_HEIGHT + Math.sin(angle) * length
                    );
                    this.ctx.stroke();
                }
            } else if (segment.type === 'bump') {
                // Remove "bump" rendering - we don't need these
            }
        }
        
        // Draw section markers
        this.drawSectionMarkers(scrollOffset);
        
        // Draw obstacles
        this.drawObstacles();
        
        // Draw mines
        this.drawMines();
    }
    
    drawObstacles() {
        for (let i = 0; i < this.obstacles.length; i++) {
            const obstacle = this.obstacles[i];
            
            if (obstacle.destroyed) continue;
            
			if (obstacle.type === OBSTACLE_TYPES.ROCK) {
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
			} else if (obstacle.type === OBSTACLE_TYPES.CRATER) {
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
            } else if (obstacle.type === OBSTACLE_TYPES.MINE) {
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
            } else if (obstacle.type === 'bullet') {
                // Draw enemy bullet
                this.ctx.fillStyle = '#FF8800';
                this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                
                // Add trailing effect
                this.ctx.fillStyle = 'rgba(255, 136, 0, 0.5)';
                this.ctx.fillRect(obstacle.x - 10, obstacle.y, 10, obstacle.height);
            }
        }
    }
    
	drawMines() {
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
    
	    drawSectionMarkers(scrollOffset) {
	        // Draw section boundaries
	        this.ctx.strokeStyle = '#FFFFFF';
	        this.ctx.lineWidth = 2;
	        this.ctx.setLineDash([5, 5]);
        
	        for (let i = 0; i <= this.levelLength; i++) {
	            const boundaryX = i * this.sectionWidth - scrollOffset;
	            if (boundaryX >= 0 && boundaryX <= GAME_WIDTH) {
	                // Draw section boundary line
	                this.ctx.beginPath();
	                this.ctx.moveTo(boundaryX, GAME_HEIGHT - GROUND_HEIGHT);
	                this.ctx.lineTo(boundaryX, GAME_HEIGHT);
	                this.ctx.stroke();
                
	                // Draw section letter if it's a starting boundary
	                if (i < this.levelLength) {
	                    this.ctx.fillStyle = '#AAAAAA';
	                    this.ctx.font = '24px Arial';
	                    this.ctx.textAlign = 'center';
	                    this.ctx.fillText(
	                        String.fromCharCode(65 + i), 
	                        boundaryX + 50, 
	                        GAME_HEIGHT - 15
	                    );
	                }
	            }
	        }
        
	        // Reset line dash
	        this.ctx.setLineDash([]);
	    }
	}