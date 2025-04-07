// parallax.js - Handles background and parallax effects
class ParallaxManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.stars = [];
        this.frontMountains = [];
        this.backMountains = [];
        this.twinkleTimer = 0;
    }
    
    initialize() {
        // Generate stars
        this.generateStars();
        
        // Generate mountains with increased height for back mountains
        this.generateMountainRange(36, 100, 150, 0.8, this.frontMountains);
        this.generateMountainRange(24, 120, 180, 0.6, this.backMountains); // Taller back mountains
    }
    
    generateStars() {
        this.stars = [];
        // Generate different sizes/brightnesses of stars for more visual interest
        for (let i = 0; i < 120; i++) {
            this.stars.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * (GAME_HEIGHT - GROUND_HEIGHT - 50),
                size: Math.random() * 2 + 1,
                brightness: Math.random(), // Used for twinkling effect
                twinkleSpeed: Math.random() * 0.05 + 0.01 // Different speeds for twinkling
            });
        }
    }
    
    generateMountainRange(peakCount, minHeight, maxHeight, roughness, mountainArray) {
        // Full level length (12 sections)
        const totalWidth = 800 * 12; // sectionWidth * levelLength
        const segments = peakCount * 12; // More segments for smoother mountains
        const segmentWidth = totalWidth / segments;
        
        mountainArray.length = 0; // Clear existing mountains
        
        let lastY = GAME_HEIGHT - GROUND_HEIGHT - (minHeight + maxHeight) / 2;
        
        // Generate all points for one complete level
        for (let i = 0; i <= segments; i++) {
            const x = i * segmentWidth;
            
            // Create smoother transitions between points
            const variation = (Math.random() - 0.5) * (maxHeight - minHeight) * roughness;
            let y = Math.max(
                GAME_HEIGHT - GROUND_HEIGHT - maxHeight,
                Math.min(GAME_HEIGHT - GROUND_HEIGHT - minHeight, lastY + variation)
            );
            
            // Add occasional sharper peaks for more interesting silhouettes
            if (Math.random() < 0.1) {
                const peakHeight = Math.random() * 15 + 10;
                y = Math.max(GAME_HEIGHT - GROUND_HEIGHT - maxHeight - peakHeight, y - peakHeight);
            }
            
            mountainArray.push({ x, y });
            lastY = y;
        }
        
        // Ensure smooth wrapping by making start and end points match
        const smoothFactor = 5; // Number of points to smooth at each end
        for (let i = 0; i < smoothFactor; i++) {
            const weight = i / smoothFactor;
            const startPoint = mountainArray[i];
            const endPoint = mountainArray[mountainArray.length - smoothFactor + i];
            
            // Blend the heights
            const avgY = startPoint.y * (1 - weight) + endPoint.y * weight;
            startPoint.y = avgY;
            endPoint.y = avgY;
        }
    }
    
    update(deltaTime, levelProgress) {
        // Update twinkle timer
        this.twinkleTimer += deltaTime;
        
        // Stars twinkle effect - more natural than random changes
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            // Each star twinkles at its own rate
            star.brightness = 0.5 + 0.5 * Math.sin(this.twinkleTimer * star.twinkleSpeed);
        }
        
        // Occasionally generate a shooting star
        if (Math.random() < 0.001) {
            this.createShootingStar();
        }
    }
    
    createShootingStar() {
        // Create a shooting star that will be visible for a brief moment
        this.stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * (GAME_HEIGHT / 2), // Only in the upper half of the sky
            size: 3, // Larger than regular stars
            brightness: 1,
            isShooting: true,
            angle: Math.PI / 4 + (Math.random() * Math.PI / 2), // Diagonal trajectory
            speed: 5 + Math.random() * 10,
            trail: [],
            lifetime: 0,
            maxLifetime: 30 + Math.random() * 20 // Frames to live
        });
    }
    
    draw(levelProgress) {
        // Draw starfield with twinkling
        this.drawStars();
        
        // Draw mountains with parallax
        this.drawMountains(levelProgress);
    }
    
    drawStars() {
        // Regular stars
        for (let i = 0; i < this.stars.length; i++) {
            const star = this.stars[i];
            
            // Handle shooting stars separately
            if (star.isShooting) {
                // Draw shooting star trail
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${1 - star.lifetime / star.maxLifetime})`;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(star.x, star.y);
                
                // Move the shooting star
                star.x += Math.cos(star.angle) * star.speed;
                star.y += Math.sin(star.angle) * star.speed;
                
                this.ctx.lineTo(star.x, star.y);
                this.ctx.stroke();
                
                // Draw the star head
                this.ctx.fillStyle = `rgba(255, 255, 255, ${1 - star.lifetime / star.maxLifetime})`;
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Increment lifetime and remove if too old
                star.lifetime++;
                if (star.lifetime > star.maxLifetime || 
                    star.x < 0 || star.x > GAME_WIDTH || 
                    star.y < 0 || star.y > GAME_HEIGHT) {
                    this.stars.splice(i, 1);
                    i--;
                }
            } else {
                // Normal twinkling stars
                const alpha = 0.5 + star.brightness * 0.5;
                this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                this.ctx.fillRect(star.x, star.y, star.size, star.size);
            }
        }
    }
    
    drawMountains(levelProgress) {
        const scrollOffset = (levelProgress / 100) * (800 * 12); // sectionWidth * levelLength
        
        // Add subtle vertical movement to mountains based on level progress
        const backMountainWave = Math.sin(levelProgress * 0.05) * 10;
        const frontMountainWave = Math.sin(levelProgress * 0.08) * 15;
        
        // Draw back mountains (far parallax) - make them more bluish
        // Create gradient for back mountains for better separation
        const backGradient = this.ctx.createLinearGradient(
            0, GAME_HEIGHT - GROUND_HEIGHT - 180, 
            0, GAME_HEIGHT - GROUND_HEIGHT
        );
        backGradient.addColorStop(0, '#444466'); // Slightly blue at the top
        backGradient.addColorStop(1, '#333344'); // Darker blue-gray at the bottom
        
        this.ctx.fillStyle = backGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT);
        
        // Draw visible part of back mountains with parallax
        let drawnPoints = 0;
        for (let i = 0; i < this.backMountains.length; i++) {
            const adjustedX = this.backMountains[i].x - (scrollOffset * PARALLAX_FAR);
            // Only draw visible points
            if (adjustedX >= -100 && adjustedX <= GAME_WIDTH + 100) {
                // Add subtle wave to mountain height
                const adjustedY = this.backMountains[i].y + backMountainWave;
                this.ctx.lineTo(adjustedX, adjustedY);
                drawnPoints++;
            }
        }
        
        // Ensure we have points to draw
        if (drawnPoints === 0) {
            this.ctx.lineTo(0, GAME_HEIGHT - GROUND_HEIGHT - 100 + backMountainWave);
            this.ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT - 100 + backMountainWave);
        }
        
        this.ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw front mountains (near parallax)
        const frontGradient = this.ctx.createLinearGradient(
            0, GAME_HEIGHT - GROUND_HEIGHT - 150, 
            0, GAME_HEIGHT - GROUND_HEIGHT
        );
        frontGradient.addColorStop(0, '#666666'); // Lighter gray at the top
        frontGradient.addColorStop(1, '#444444'); // Darker gray at the bottom
        
        this.ctx.fillStyle = frontGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(0, GAME_HEIGHT - GROUND_HEIGHT);
        
        // Draw visible part of front mountains with parallax
        drawnPoints = 0;
        for (let i = 0; i < this.frontMountains.length; i++) {
            const adjustedX = this.frontMountains[i].x - (scrollOffset * PARALLAX_NEAR);
            // Only draw visible points
            if (adjustedX >= -100 && adjustedX <= GAME_WIDTH + 100) {
                // Add subtle wave to mountain height
                const adjustedY = this.frontMountains[i].y + frontMountainWave;
                this.ctx.lineTo(adjustedX, adjustedY);
                drawnPoints++;
            }
        }
        
        // Ensure we have points to draw
        if (drawnPoints === 0) {
            this.ctx.lineTo(0, GAME_HEIGHT - GROUND_HEIGHT - 100 + frontMountainWave);
            this.ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT - 100 + frontMountainWave);
        }
        
        this.ctx.lineTo(GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
        this.ctx.closePath();
        this.ctx.fill();
    }
}

// DEBUGGING, sorry...
console.log("Loading parallax.js");