// terrain-generator.js - Terrain feature generation
class TerrainGenerator {
    constructor(terrainManager) {
        this.terrain = terrainManager;
        this.game = terrainManager.game;
        this.ctx = terrainManager.ctx;
        
        // Ground segment storage
        this.groundSegments = [];
        
        // Rock properties - standardized to only use large rocks
        this.rockWidth = 90;
        this.rockHeight = 80;
        this.rockProbability = 0.02; // Base probability - keep low for fewer obstacles
    }
    
    generateInitialGround() {
        // Clear existing ground segments
        this.groundSegments = [];
        
        // Generate initial ground segments for the full level
        const segmentWidth = 150;
        const segmentCount = Math.ceil((this.terrain.sectionWidth * this.terrain.levelLength) / segmentWidth);
        
        for (let i = 0; i < segmentCount; i++) {
            // Determine segment type and height
            let segmentType = 'flat';
            let segmentHeight = 0;
            
            // More obstacles in later sections
            const sectionIndex = Math.floor((i * segmentWidth) / this.terrain.sectionWidth);
            
            // No craters in the first section to give player a safer start
            if (sectionIndex === 0) {
                segmentType = 'flat';
                segmentHeight = 0;
            } else {
                // Add craters in later sections
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
            }
            
            this.groundSegments.push({
                x: i * segmentWidth,
                height: segmentHeight,
                type: segmentType,
                width: segmentWidth,
                section: String.fromCharCode(65 + sectionIndex % this.terrain.levelLength)
            });
            
            // Add rocks on flat segments occasionally
            // No obstacles in the first two screen widths to give player a safe start
            if (segmentType === 'flat' && Math.random() < this.rockProbability && i * segmentWidth > GAME_WIDTH * 1.5) {
                // Only rocks, no small craters
                this.terrain.obstacleManager.addObstacle({
                    x: i * segmentWidth + segmentWidth/2,
                    y: GAME_HEIGHT - GROUND_HEIGHT - this.rockHeight,
                    width: this.rockWidth,
                    height: this.rockHeight,
                    type: OBSTACLE_TYPES.ROCK,
                    destroyed: false
                });
            }
        }
    }
    
    generateSection(sectionIndex) {
        // Generate a new section when we need more ground
        const segmentWidth = 150;
        const segmentsPerSection = Math.ceil(this.terrain.sectionWidth / segmentWidth);
        const startX = this.groundSegments.length > 0 
            ? this.groundSegments[this.groundSegments.length - 1].x + segmentWidth
            : 0;
        
        for (let i = 0; i < segmentsPerSection; i++) {
            // Determine segment type and height
            let segmentType = 'flat';
            let segmentHeight = 0;
            
            // Add craters based on section difficulty
            const obstacleChance = 0.03 + (sectionIndex * 0.005);
            
            const rand = Math.random();
            if (rand < obstacleChance) {
                segmentType = 'crater';
                segmentHeight = -55;
            } else {
                segmentType = 'flat';
                segmentHeight = 0;
            }
            
            this.groundSegments.push({
                x: startX + i * segmentWidth,
                height: segmentHeight,
                type: segmentType,
                width: segmentWidth,
                section: String.fromCharCode(65 + sectionIndex % this.terrain.levelLength)
            });
            
            // Add rocks on flat segments based on section difficulty
            if (segmentType === 'flat' && Math.random() < (this.rockProbability * (1 + sectionIndex * 0.2))) {
                this.terrain.obstacleManager.addObstacle({
                    x: startX + i * segmentWidth + segmentWidth/2,
                    y: GAME_HEIGHT - GROUND_HEIGHT - this.rockHeight,
                    width: this.rockWidth,
                    height: this.rockHeight,
                    type: OBSTACLE_TYPES.ROCK,
                    destroyed: false
                });
            }
        }
    }
    
    drawGroundFeatures(scrollOffset) {
        // Draw ground segments with their features
        for (let i = 0; i < this.groundSegments.length; i++) {
            const segment = this.groundSegments[i];
            const adjustedX = segment.x - scrollOffset;
            
            // Only draw visible segments
            if (adjustedX + segment.width < 0 || adjustedX > GAME_WIDTH) continue;
            
            if (segment.type === 'crater') {
                this.drawCrater(adjustedX, segment);
            }
        }
        
        // Check if we need to generate more ground
        const lastSegment = this.groundSegments[this.groundSegments.length - 1];
        const lastSegmentScreenPos = lastSegment.x - scrollOffset;
        
        if (lastSegmentScreenPos < GAME_WIDTH * 2) {
            // Need to generate more ground
            const nextSectionIndex = Math.floor(lastSegment.x / this.terrain.sectionWidth) + 1;
            this.generateSection(nextSectionIndex);
        }
        
        // Clean up old segments that are far behind us
        while (this.groundSegments.length > 0 && 
              (this.groundSegments[0].x - scrollOffset) < -GAME_WIDTH) {
            this.groundSegments.shift();
        }
    }
    
    drawCrater(x, segment) {
        // Draw crater with moon-like appearance
        this.ctx.fillStyle = '#1A1A1A'; // Darker for depth
        
        // Main crater
        this.ctx.beginPath();
        this.ctx.arc(
            x + segment.width/2, 
            GAME_HEIGHT - GROUND_HEIGHT, 
            segment.width/2, 
            0, Math.PI
        );
        this.ctx.fill();
        
        // Add deeper inner crater
        this.ctx.fillStyle = '#0F0F0F';
        this.ctx.beginPath();
        this.ctx.arc(
            x + segment.width/2, 
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
                x + segment.width/2, 
                GAME_HEIGHT - GROUND_HEIGHT
            );
            this.ctx.lineTo(
                x + segment.width/2 + Math.cos(angle) * length,
                GAME_HEIGHT - GROUND_HEIGHT + Math.sin(angle) * length
            );
            this.ctx.stroke();
        }
    }
}