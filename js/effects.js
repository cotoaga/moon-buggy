// effects.js - Handles explosions and visual effects
class EffectsManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.explosions = [];
    }
    
    createExplosion(x, y, maxSize, type = 'standard') {
        this.explosions.push({
            x: x,
            y: y,
            size: 5,
            maxSize: maxSize || 50,
            phase: 0, // 0-1 for lifecycle
            growing: true,
            type: type // 'standard', 'ground', 'sky', 'buggy'
        });
    }
    
    update(deltaTime) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            
            if (explosion.growing) {
                // Growing phase
                explosion.size += deltaTime / 5;
                explosion.phase += deltaTime / 1000;
                
                if (explosion.size >= explosion.maxSize) {
                    explosion.growing = false;
                }
            } else {
                // Fading phase
                explosion.phase += deltaTime / 1000;
                
                // Remove old explosions
                if (explosion.phase >= 1) {
                    this.explosions.splice(i, 1);
                }
            }
        }
    }
    
    draw() {
        this.explosions.forEach(explosion => {
            switch (explosion.type) {
                case 'standard':
                    this.drawStandardExplosion(explosion);
                    break;
                case 'ground':
                    this.drawGroundExplosion(explosion);
                    break;
                case 'sky':
                    this.drawSkyExplosion(explosion);
                    break;
                case 'buggy':
                    this.drawBuggyExplosion(explosion);
                    break;
            }
        });
    }
    
    drawStandardExplosion(explosion) {
        // Calculate color based on phase
        let color;
        const phase = explosion.phase;
        
        if (phase < 0.2) {
            // Bright light blue to white
            const t = phase / 0.2;
            color = `rgba(${Math.floor(200 + t * 55)}, ${Math.floor(200 + t * 55)}, 255, 0.8)`;
        } else if (phase < 0.5) {
            // White to yellow
            const t = (phase - 0.2) / 0.3;
            color = `rgba(255, 255, ${Math.floor(255 - t * 200)}, 0.8)`;
        } else if (phase < 0.8) {
            // Yellow to orange
            const t = (phase - 0.5) / 0.3;
            color = `rgba(255, ${Math.floor(255 - t * 155)}, 0, 0.8)`;
        } else {
            // Orange to red, fading out
            const t = (phase - 0.8) / 0.2;
            color = `rgba(255, ${Math.floor(100 - t * 100)}, 0, ${0.8 - t * 0.8})`;
        }
        
        // Draw explosion circle
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(explosion.x, explosion.y, explosion.size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawGroundExplosion(explosion) {
        // Ground explosions have more dust and debris
        const phase = explosion.phase;
        
        // Draw main explosion circle
        this.drawStandardExplosion(explosion);
        
        // Add dust cloud above explosion
        if (phase < 0.7) {
            const dustSize = explosion.size * 1.5;
            const alpha = 0.6 - phase * 0.6;
            
            this.ctx.fillStyle = `rgba(150, 150, 150, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.ellipse(
                explosion.x, 
                explosion.y - explosion.size/2, 
                dustSize, 
                dustSize/2, 
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
            
            // Add debris particles
            this.ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
            for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI;
                const distance = explosion.size * (0.5 + phase * 0.5);
                this.ctx.beginPath();
                this.ctx.arc(
                    explosion.x + Math.cos(angle) * distance,
                    explosion.y - Math.sin(angle) * distance,
                    2 + Math.random() * 3,
                    0, Math.PI * 2
                );
                this.ctx.fill();
            }
        }
    }
    
    drawSkyExplosion(explosion) {
        // Sky explosions are more colorful with a shock wave
        const phase = explosion.phase;
        
        // Draw colorful explosion core
        this.drawStandardExplosion(explosion);
        
        // Add shock wave ring effect
        if (phase < 0.5) {
            const ringSize = explosion.size * (1 + phase);
            const ringWidth = 3 * (1 - phase);
            const alpha = 0.8 - phase * 1.6;
            
            this.ctx.strokeStyle = `rgba(255, 255, 200, ${alpha})`;
            this.ctx.lineWidth = ringWidth;
            this.ctx.beginPath();
            this.ctx.arc(explosion.x, explosion.y, ringSize, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    drawBuggyExplosion(explosion) {
        // Buggy explosions have more metal fragments
        const phase = explosion.phase;
        
        // Draw main explosion
        this.drawStandardExplosion(explosion);
        
        // Add metallic fragments
        if (phase < 0.8) {
            this.ctx.fillStyle = '#888888';
            
            for (let i = 0; i < 7; i++) {
                const angle = (i / 7) * Math.PI * 2 + phase * 5;
                const distance = explosion.size * (0.3 + phase * 1.2);
                const fragmentSize = 4 * (1 - phase);
                
                this.ctx.save();
                this.ctx.translate(
                    explosion.x + Math.cos(angle) * distance,
                    explosion.y + Math.sin(angle) * distance
                );
                this.ctx.rotate(angle + phase * 10);
                this.ctx.fillRect(-fragmentSize/2, -fragmentSize/2, fragmentSize, fragmentSize);
                this.ctx.restore();
            }
        }
    }
    
    createShieldEffect(x, y, width, height) {
        // Add shield flash animation to DOM
        const shield = document.createElement('div');
        shield.style.position = 'absolute';
        shield.style.left = (x - 20) + 'px';
        shield.style.top = (y - 20) + 'px';
        shield.style.width = (width + 40) + 'px';
        shield.style.height = (height + 40) + 'px';
        shield.style.borderRadius = '50%';
        shield.style.backgroundColor = 'rgba(100, 200, 255, 0.5)';
        shield.style.animation = 'shield-pulse 0.5s ease-out';
        shield.style.zIndex = '10';
        
        document.getElementById('gameContainer').appendChild(shield);
        
        // Remove after animation
        setTimeout(() => {
            shield.remove();
        }, 500);
    }
}

// DEBUGGING, sorry...
console.log("Loading effects.js");