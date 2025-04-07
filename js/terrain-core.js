// terrain-core.js - Core terrain management
class TerrainManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        
        // Core terrain properties
        this.sectionWidth = 800;
        this.currentSection = 'A';
        this.levelProgress = 0;
        this.levelLength = 12; // A-L
        
        // Create component managers
        this.generator = new TerrainGenerator(this);
        this.obstacleManager = new ObstacleManager(this);
        this.mineManager = new MineManager(this);
    }
    
    initialize() {
        // Generate initial terrain
        this.generator.generateInitialGround();
        
        // Set initial obstacle spawn frequency from level manager
        if (this.game.levels) {
            this.obstacleManager.obstacleCounter = this.game.levels.getObstacleFrequency();
        }
    }
    
    update(deltaTime) {
        // Update level progress as we scroll
        this.levelProgress += (SCROLL_SPEED * deltaTime / 16) / (this.sectionWidth * this.levelLength) * 100;
        
        // Calculate current section based on progress
        const sectionIndex = Math.floor((this.levelProgress / 100) * this.levelLength);
        this.currentSection = String.fromCharCode(65 + sectionIndex); // A-L
        
        // Update obstacles and mines
        this.obstacleManager.update(deltaTime);
        this.mineManager.update(deltaTime);
    }
    
    draw() {
        const scrollOffset = (this.levelProgress / 100) * (this.sectionWidth * this.levelLength);
        
        // Draw base ground
        this.ctx.fillStyle = '#333333'; // Darker ground color for better contrast with mountains
        this.ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);
        
        // Draw ground segments and features
        this.generator.drawGroundFeatures(scrollOffset);
        
        // Draw section markers
        this.drawSectionMarkers(scrollOffset);
        
        // Draw obstacles and mines
        this.obstacleManager.draw();
        this.mineManager.draw();
    }
    
    getGroundY(x) {
        // Get ground height at specific x coordinate
        const scrollOffset = (this.levelProgress / 100) * (this.sectionWidth * this.levelLength);
        
        for (let i = 0; i < this.generator.groundSegments.length; i++) {
            const segment = this.generator.groundSegments[i];
            const adjustedX = segment.x - scrollOffset;
            
            if (x >= adjustedX && x < adjustedX + segment.width) {
                return GAME_HEIGHT - GROUND_HEIGHT + segment.height;
            }
        }
        
        return GAME_HEIGHT - GROUND_HEIGHT;
    }
    
    addObstacle(obstacle) {
        this.obstacleManager.addObstacle(obstacle);
    }
    
    addBomb(x, y) {
        this.obstacleManager.addBomb(x, y);
    }
    
    addEnemyBullet(x, y) {
        this.obstacleManager.addEnemyBullet(x, y);
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