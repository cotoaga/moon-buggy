// parallax.js - Handles background and parallax effects
class ParallaxManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.stars = [];
        this.frontMountains = [];
        this.backMountains = [];
    }
    
    initialize() {
        // Generate stars
        this.generateStars();
        
        // Generate mountains
        this.frontMountains = this.generateMountainRange(36, 100, 150, 0.8);
        this.backMountains = this.generateMountainRange(24, 60, 100, 0.6);
    }
    
    generateStars() {
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            this.stars.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - 50),
                size: Math.random() * 2 + 1
            });
        }
    }
    
    generateMountainRange(peakCount, minHeight, maxHeight, roughness) {
        // Full level length (12 sections)
        const totalWidth = 800 * 12; // sectionWidth * levelLength
        const segments = peakCount * 12; // More segments for smoother mountains
        const segmentWidth = totalWidth / segments;
        
        let points = [];
        let lastY = GAME_HEIGHT - GROUND_HEIGHT - (minHeight + maxHeight) / 2;
        
        // Generate all points for one complete level
        for (let i = 0; i <= segments; i++) {
            const x = i * segmentWidth;
            
            // Create smoother transitions between points
            const variation = (Math.random() - 0.5) * (maxHeight - minHeight) * roughness;
            const y = Math.max(
                GAME_HEIGHT - GROUND_HEIGHT - maxHeight,
                Math.min(GAME_HEIGHT - GROUND_HEIGHT - minHeight, lastY + variation)
            );
            
            points.push({ x, y });
            lastY = y;
        }
        
        return points;
    }
    
    update(deltaTime, levelProgress) {
        // Stars twinkle effect
        if (this.game.frameCount % 30 === 0) {
            // Make some stars twinkle by changing their size
            for (let i = 0; i < 10; i++) {
                const randomStar = Math.floor(Math.random() * this.stars.length);
                this.stars[randomStar].size = Math.random() * 2 + 1;
            }
        }
    }
    
    draw(levelProgress) {
        // Draw stars
        this.drawStars();
        
        // Draw mountains with parallax
        this.drawMountains(levelProgress);
    }
    
    drawStars() {
        this.ctx.fillStyle = '#FFFFFF';
        this.stars.forEach(star => {
            this.ctx.fillRect(star.x, star.y, star.size, star.size);
        });
    }
    
    drawMountains(levelProgress) {
        const scrollOffset = (levelProgress / 100) * (800 * 12); // sectionWidth * levelLength
        
        // Draw back mountains (far parallax)
        this.ctx.fillStyle = '#444444';
        this.ctx.beginPath();
        this.ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT);
        
        // Draw visible part of back mountains with parallax
        let drawnPoints = 0;
        for (let i = 0; i < this.backMountains.length; i++) {
            const adjustedX = this.backMountains[i].x - (scrollOffset * PARALLAX_FAR);
            // Only draw visible points
            if (adjustedX >= -100 && adjustedX <= GAME_WIDTH + 100) {
                this.ctx.lineTo(adjustedX, this.backMountains[i].y);
                drawnPoints++;
            }
        }
        
        // Ensure we have points to draw
        if (drawnPoints === 0) {
            this.ctx.lineTo(0, GAME_HEIGHT - GROUND_HEIGHT - 50);
            this.ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT - 50);
        }
        
        this.ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw front mountains (near parallax)
        this.ctx.fillStyle = '#666666';
        this.ctx.beginPath();
        this.ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT);
        
        // Draw visible part of front mountains with parallax
        drawnPoints = 0;
        for (let i = 0; i < this.frontMountains.length; i++) {
            const adjustedX = this.frontMountains[i].x - (scrollOffset * PARALLAX_NEAR);
            // Only draw visible points
            if (adjustedX >= -100 && adjustedX <= GAME_WIDTH + 100) {
                this.ctx.lineTo(adjustedX, this.frontMountains[i].y);
                drawnPoints++;
            }
        }
        
        // Ensure we have points to draw
        if (drawnPoints === 0) {
            this.ctx.lineTo(0, GAME_HEIGHT - GROUND_HEIGHT - 100);
            this.ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT - 100);
        }
        
        this.ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
        this.ctx.closePath();
        this.ctx.fill();
    }
}