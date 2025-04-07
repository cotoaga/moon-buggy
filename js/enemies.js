// enemies.js - Handles UFOs and enemy buggy logic
class EnemyManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.enemies = [];
        
        // Enemy spawn timing
        this.baseSpawnTime = {
            ufoHigh: 8000,  // 8 seconds
            ufoMid: 12000,  // 12 seconds
            ufoLow: 15000,  // 15 seconds
            buggy: 20000    // 20 seconds
        };
        
        // Current spawn counters
        this.spawnCounters = {
            ufoHigh: 3000,  // First enemy appears sooner
            ufoMid: 5000,
            ufoLow: 7000,
            buggy: 10000
        };
    }
    
    update(deltaTime, level) {
        // Process existing enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Update enemy position based on its type
            switch (enemy.type) {
                case 'ufo_high':
                case 'ufo_mid':
                case 'ufo_low':
                    this.updateUFO(enemy, deltaTime);
                    break;
                    
                case 'buggy':
                    this.updateBuggy(enemy, deltaTime);
                    break;
            }
            
            // Remove enemies that go offscreen
            if (enemy.x < -50 || enemy.x > GAME_WIDTH + 50) {
                this.enemies.splice(i, 1);
            }
        }
        
        // Spawn new enemies based on level
        this.spawnEnemies(deltaTime, level);
    }
    
    updateUFO(ufo, deltaTime) {
        // UFO zig-zag movement pattern
        ufo.x -= (SCROLL_SPEED * 1.2) * deltaTime / 16; // Slightly faster than scroll speed
        
        // Zig-zag pattern using sine wave
        const zigZagAmplitude = ufo.type === 'ufo_high' ? 40 : 
                             (ufo.type === 'ufo_mid' ? 30 : 20);
        const zigZagFrequency = ufo.type === 'ufo_high' ? 0.01 : 
                             (ufo.type === 'ufo_mid' ? 0.015 : 0.02);
        
        ufo.y = ufo.baseY + Math.sin(ufo.x * zigZagFrequency) * zigZagAmplitude;
        
        // Occasionally drop bombs
        ufo.bombCounter -= deltaTime;
        if (ufo.bombCounter <= 0) {
            // Reset bomb counter with randomness
            ufo.bombCounter = 2000 + Math.random() * 3000; // 2-5 seconds
            
            // Only drop bombs if near the player
            if (Math.abs(ufo.x - this.game.player.x) < 300) {
                // Notify game to add a bomb
                this.game.addBomb(ufo.x, ufo.y + 10);
            }
        }
    }
    
    updateBuggy(buggy, deltaTime) {
        // Enemy buggy follows behind player with improved aggression
        const targetX = this.game.player.x - 120;  // Stay closer to player
        const distanceToTarget = targetX - buggy.x;
    
        // Use variable speed - faster when far away to catch up
        const speedFactor = Math.abs(distanceToTarget) > 300 ? 0.08 : 0.05;
    
        // Move toward target position with variable speed
        buggy.x += Math.sign(distanceToTarget) * Math.min(Math.abs(distanceToTarget) * speedFactor, 3);
    
        // Occasional aggressive dash toward player
        if (!buggy.dashCooldown) {
            buggy.dashCooldown = 0;
        }
    
        buggy.dashCooldown -= deltaTime;
    
        // Start a dash when close enough and cooldown expired
        if (buggy.dashCooldown <= 0 && Math.abs(distanceToTarget) < 200 && Math.random() < 0.005) {
            buggy.isDashing = true;
            buggy.dashDuration = 1000; // 1 second dash
            buggy.dashCooldown = 5000 + Math.random() * 5000; // 5-10 seconds between dashes
        }
    
        // Apply dash speed boost if dashing
        if (buggy.isDashing) {
            buggy.x += 4 * Math.sign(distanceToTarget); // Faster movement during dash
            buggy.dashDuration -= deltaTime;
        
            if (buggy.dashDuration <= 0) {
                buggy.isDashing = false;
            }
        }
    
        // Occasionally shoot at player
        buggy.shootCounter -= deltaTime;
        if (buggy.shootCounter <= 0) {
            buggy.shootCounter = 1200 + Math.random() * 1000; // 1.2-2.2 seconds
        
            // Notify game to add an enemy bullet
            this.game.addEnemyBullet(buggy.x + 30, buggy.y + 10);
        }
    }
        
    spawnEnemies(deltaTime, level) {
        // Decrement spawn counters
        this.spawnCounters.ufoHigh -= deltaTime;
        this.spawnCounters.ufoMid -= deltaTime;
        this.spawnCounters.ufoLow -= deltaTime;
        this.spawnCounters.buggy -= deltaTime;
        
        // Spawn UFOs based on level
        if (level >= 2 && this.spawnCounters.ufoHigh <= 0) {
            this.spawnUFO('ufo_high', level);
        }
        
        if (level >= 3 && this.spawnCounters.ufoMid <= 0) {
            this.spawnUFO('ufo_mid', level);
        }
        
        if (level >= 5 && this.spawnCounters.ufoLow <= 0) {
            this.spawnUFO('ufo_low', level);
        }
        
        // Spawn enemy buggy based on level
        if (level >= 4 && this.spawnCounters.buggy <= 0) {
            this.spawnBuggy(level);
        }
    }
    
    spawnUFO(type, level) {
        // UFO parameters based on type
        let params = {
            'ufo_high': { y: 80, health: 1, resetTime: this.baseSpawnTime.ufoHigh },
            'ufo_mid': { y: 140, health: 2, resetTime: this.baseSpawnTime.ufoMid },
            'ufo_low': { y: 200, health: 3, resetTime: this.baseSpawnTime.ufoLow }
        };
        
        // Reset counter with level-based reduction
        const levelIndex = type === 'ufo_high' ? 2 : (type === 'ufo_mid' ? 3 : 5);
        this.spawnCounters[type] = params[type].resetTime * (1 - (level - levelIndex) * 0.1);
        
        // Add a UFO
        this.enemies.push({
            x: GAME_WIDTH + 50,
            y: params[type].y,
            baseY: params[type].y,
            width: 40,
            height: 20,
            type: type,
            health: params[type].health,
            bombCounter: 2000 + Math.random() * 2000
        });
    }
    
    spawnBuggy(level) {
        // Reset counter with level-based reduction
        this.spawnCounters.buggy = this.baseSpawnTime.buggy * (1 - (level - 4) * 0.15);
        
        // Add an enemy buggy
        this.enemies.push({
            x: -50, // Start off-screen to the left
            y: GAME_HEIGHT - GROUND_HEIGHT - 30,
            width: 60,
            height: 30,
            type: 'buggy',
            health: 4,
            shootCounter: 2000 + Math.random() * 1000,
            dashCooldown: 0,
            isDashing: false,
            dashDuration: 0
        });
    }
    
    draw() {
        this.enemies.forEach(enemy => {
            switch (enemy.type) {
                case 'ufo_high':
                case 'ufo_mid':
                case 'ufo_low':
                    this.drawUFO(enemy);
                    break;
                    
                case 'buggy':
                    this.drawBuggy(enemy);
                    break;
            }
        });
    }
    
    drawUFO(ufo) {
        // Draw UFO body
        this.ctx.fillStyle = '#AAAAFF';
        this.ctx.beginPath();
        this.ctx.ellipse(ufo.x + ufo.width/2, ufo.y + ufo.height/2, 
                       ufo.width/2, ufo.height/3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw UFO dome
        this.ctx.fillStyle = '#DDDDFF';
        this.ctx.beginPath();
        this.ctx.arc(ufo.x + ufo.width/2, ufo.y + ufo.height/2 - 5, 
                   ufo.width/4, Math.PI, 0);
        this.ctx.fill();
        
        // Draw UFO lights with animation
        this.ctx.fillStyle = '#FFFF00';
        for (let i = 0; i < 3; i++) {
            const blinkRate = (this.game.frameCount / 10 + i) % 2 < 1 ? 1 : 0.3;
            this.ctx.globalAlpha = blinkRate;
            this.ctx.beginPath();
            this.ctx.arc(ufo.x + ufo.width/4 + (ufo.width/2 * i/2), 
                       ufo.y + ufo.height - 5, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawBuggy(buggy) {
        // Draw enemy buggy body - color changes when dashing to indicate aggression
        if (buggy.isDashing) {
            // Red tint when dashing/aggressive
            this.ctx.fillStyle = '#550000'; 
        } else {
            // Normal dark color
            this.ctx.fillStyle = '#222222';
        }
    
        this.ctx.fillRect(buggy.x, buggy.y, buggy.width, buggy.height);
    
        // Draw wheels
        this.ctx.fillStyle = '#000000'; // Pure black wheels
        this.ctx.beginPath();
        this.ctx.arc(buggy.x + 15, buggy.y + buggy.height, 8, 0, Math.PI * 2);
        this.ctx.arc(buggy.x + buggy.width - 15, buggy.y + buggy.height, 8, 0, Math.PI * 2);
        this.ctx.fill();
    
        // Draw gun
        this.ctx.fillStyle = '#666666';
        this.ctx.fillRect(buggy.x, buggy.y + 5, 10, 10);
    
        // Add exhaust effect when dashing
        if (buggy.isDashing) {
            this.ctx.fillStyle = '#FF5500';
            this.ctx.beginPath();
            this.ctx.moveTo(buggy.x - 5, buggy.y + buggy.height - 5);
            this.ctx.lineTo(buggy.x - 15, buggy.y + buggy.height - 10);
            this.ctx.lineTo(buggy.x - 10, buggy.y + buggy.height);
            this.ctx.closePath();
            this.ctx.fill();
        
            // Add smoke particles
            this.ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
            for (let i = 0; i < 3; i++) {
                const size = 4 + Math.random() * 4;
                this.ctx.beginPath();
                this.ctx.arc(
                    buggy.x - 15 - (Math.random() * 10), 
                    buggy.y + buggy.height - 5 + (Math.random() * 10 - 5),
                    size, 0, Math.PI * 2
                );
                this.ctx.fill();
            }
        }
    }
}

// DEBUGGING, sorry...
console.log("Loading enemies.js");