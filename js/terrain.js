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
            } else if (rand < obstacleChance * 2) {
                segmentType = 'bump';
                segmentHeight = 30;
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
                this.obstacles.push({
                    x: i * segmentWidth + segmentWidth/2,
                    y: GAME_HEIGHT - GROUND_HEIGHT - 25,
                    width: 30,
                    height: 25,
                    type: Math.random() < 0.6 ? OBSTACLE_TYPES.ROCK : OBSTACLE_TYPES.CRATER,
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
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
        
        // Draw ground features
        for (let i = 0; i < this.groundSegments.length; i++) {
            const segment = this.groundSegments[i];
            const adjustedX = segment.x - scrollOffset;
            
            // Only draw visible segments
            if (adjustedX + segment.width < 0 || adjustedX > GAME_WIDTH) continue;
            
            if (segment.type === 'crater') {
                // Draw crater with better visibility
                this.ctx.fillStyle = '#222222';
                this.ctx.beginPath();
                this.ctx.arc(
                    adjustedX + segment.width/2, 
                    GAME_HEIGHT - GROUND_HEIGHT, 
                    segment.width/2, 
                    0, Math.PI
                );
                this.ctx.fill();
                
                // Add highlight
                this.ctx.strokeStyle = '#333333';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(
                    adjustedX + segment.width/2, 
                    GAME_HEIGHT - GROUND_HEIGHT, 
                    segment.width/2, 
                    Math.PI * 0.2, Math.PI * 0.8
                );
                this.ctx.stroke();
            } else if (segment.type === 'bump') {
                // Draw bump with better visibility
                this.ctx.fillStyle = '#777777'; // Lighter color for visibility
                this.ctx.beginPath();
                this.ctx.arc(
                    adjustedX + segment.width/2, 
                    GAME_HEIGHT - GROUND_HEIGHT, 
                    segment.width/2, 
                    Math.PI, Math.PI * 2
                );
                this.ctx.fill();
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
                // Draw rock as a clear pyramid/triangle
                this.ctx.fillStyle = '#888888';
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x, obstacle.y + obstacle.height);
                this.ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y - 5); // Make it taller
                this.ctx.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height);
                this.ctx.fill();
                
                // Add rock details with better contrast
                this.ctx.strokeStyle = '#666666';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(obstacle.x + obstacle.width/3, obstacle.y + obstacle.height - 10);
                this.ctx.lineTo(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height - 15);
                this.ctx.stroke();
            } else if (obstacle.type === OBSTACLE_TYPES.CRATER) {
                // Draw crater with better visibility
                this.ctx.fillStyle = '#111111'; // Darker color for visibility
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                         obstacle.width/2, 0, Math.PI);
                this.ctx.fill();
                
                // Add crater edge highlighting
                this.ctx.strokeStyle = '#555555';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                         obstacle.width/2, Math.PI * 0.8, Math.PI * 0.2, true);
                this.ctx.stroke();
            } else if (obstacle.type === OBSTACLE_TYPES.MINE) {
                // Draw mine with pulsing effect
                const pulseSize = Math.sin(this.game.frameCount / 10) * 2;
                
                this.ctx.fillStyle = '#FF0000';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                         obstacle.width/2 + pulseSize, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Add spikes
                this.ctx.strokeStyle = '#FFFF00';
                this.ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const angle = i * Math.PI / 4;
                    this.ctx.moveTo(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2);
                    this.ctx.lineTo(
                        obstacle.x + obstacle.width/2 + Math.cos(angle) * (obstacle.width/1.5 + pulseSize),
                        obstacle.y + obstacle.height/2 + Math.sin(angle) * (obstacle.height/1.5 + pulseSize)
                    );
                }
                this.ctx.stroke();
                
                // Add blinking light
                this.ctx.fillStyle = this.game.frameCount % 20 < 10 ? '#FFFFFF' : '#FFFF00';
                this.ctx.beginPath();
                this.ctx.arc(obstacle.x + obstacle.width/2, obstacle.y + obstacle.height/2, 
                         obstacle.width/5, 0, Math.PI * 2);
                this.ctx.fill();
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
        // Draw player mines
        this.mines.forEach(mine => {
            // Inactive mines are dimmer
            if (!mine.active) {
                this.ctx.globalAlpha = 0.5;
            }
            
            // Draw mine circle
            this.ctx.fillStyle = '#FF0000';
            this.ctx.beginPath();
            this.ctx.arc(mine.x + mine.width/2, mine.y + mine.height/2, mine.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add crosshairs
            this.ctx.strokeStyle = '#FFFF00';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(mine.x, mine.y + mine.height/2);
            this.ctx.lineTo(mine.x + mine.width, mine.y + mine.height/2);
            this.ctx.moveTo(mine.x + mine.width/2, mine.y);
            this.ctx.lineTo(mine.x + mine.width/2, mine.y + mine.height);
            this.ctx.stroke();
            
            // Add blinking light
            if (mine.active) {
                this.ctx.fillStyle = (this.game.frameCount % 10 < 5) ? '#FFFFFF' : '#FFFF00';
                this.ctx.beginPath();
                this.ctx.arc(mine.x + mine.width/2, mine.y + mine.height/2, mine.width/4, 0, Math.PI * 2);
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