// enemies.js - Handles UFOs and enemy buggy logic
class EnemyManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.enemies = [];

        // Enemy spawn timing
        this.baseSpawnTime = {
            ufoHigh: 8000,
            ufoMid: 12000,
            ufoLow: 15000,
            buggy: 20000
        };

        this.spawnCounters = {
            ufoHigh: 3000,
            ufoMid: 5000,
            ufoLow: 7000,
            buggy: 10000
        };
    }

    update(deltaTime, level) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];

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

            if (enemy.x < -50 || enemy.x > GAME_WIDTH + 50) {
                this.enemies.splice(i, 1);
            }
        }

        this.spawnEnemies(deltaTime, level);
    }

    updateUFO(ufo, deltaTime) {
        // Store previous position for trail detection
        ufo.prevX = ufo.x;
        ufo.prevY = ufo.y;
        
        // Calculate new position based on deltaTime
        ufo.x -= (SCROLL_SPEED * 1.2) * deltaTime / 16;

        const zigZagAmplitude = ufo.type === 'ufo_high' ? 40 :
                                 ufo.type === 'ufo_mid' ? 30 : 20;
        const zigZagFrequency = ufo.type === 'ufo_high' ? 0.01 :
                                 ufo.type === 'ufo_mid' ? 0.015 : 0.02;

        // Calculate new Y position based on zigzag pattern
        ufo.y = ufo.baseY + Math.sin(ufo.x * zigZagFrequency) * zigZagAmplitude;

        // Check if movement is too large (might cause trails)
        const dx = ufo.x - (ufo.prevX || ufo.x);
        const dy = ufo.y - (ufo.prevY || ufo.y);
        const moveDist = Math.sqrt(dx*dx + dy*dy);
        
        // If movement is too large, break it down into smaller steps
        if (moveDist > 5) {
            // Cap movement to prevent large jumps that cause trailing
            ufo.x = ufo.prevX - Math.min(Math.abs(dx), 5) * Math.sign(dx);
            ufo.y = ufo.prevY + Math.min(Math.abs(dy), 5) * Math.sign(dy);
        }

        // Update bomb counter
        ufo.bombCounter -= deltaTime;
        if (ufo.bombCounter <= 0) {
            ufo.bombCounter = 2000 + Math.random() * 3000;
            if (Math.abs(ufo.x - this.game.player.x) < 300) {
                this.game.addBomb(ufo.x, ufo.y + 10);
            }
        }
    }

    updateBuggy(buggy, deltaTime) {
        const targetX = this.game.player.x - 120;
        const distanceToTarget = targetX - buggy.x;
        const speedFactor = Math.abs(distanceToTarget) > 300 ? 0.08 : 0.05;

        buggy.x += Math.sign(distanceToTarget) * Math.min(Math.abs(distanceToTarget) * speedFactor, 3);

        if (!buggy.dashCooldown) buggy.dashCooldown = 0;
        buggy.dashCooldown -= deltaTime;

        if (buggy.dashCooldown <= 0 && Math.abs(distanceToTarget) < 200 && Math.random() < 0.005) {
            buggy.isDashing = true;
            buggy.dashDuration = 1000;
            buggy.dashCooldown = 5000 + Math.random() * 5000;
        }

        if (buggy.isDashing) {
            buggy.x += 4 * Math.sign(distanceToTarget);
            buggy.dashDuration -= deltaTime;
            if (buggy.dashDuration <= 0) {
                buggy.isDashing = false;
            }
        }

        buggy.shootCounter -= deltaTime;
        if (buggy.shootCounter <= 0) {
            buggy.shootCounter = 1200 + Math.random() * 1000;
            this.game.addEnemyBullet(buggy.x + 30, buggy.y + 10);
        }
    }

    spawnEnemies(deltaTime, level) {
        this.spawnCounters.ufoHigh -= deltaTime;
        this.spawnCounters.ufoMid -= deltaTime;
        this.spawnCounters.ufoLow -= deltaTime;
        this.spawnCounters.buggy -= deltaTime;

        if (level >= 2 && this.spawnCounters.ufoHigh <= 0) {
            this.spawnUFO('ufo_high', level);
        }
        if (level >= 3 && this.spawnCounters.ufoMid <= 0) {
            this.spawnUFO('ufo_mid', level);
        }
        if (level >= 5 && this.spawnCounters.ufoLow <= 0) {
            this.spawnUFO('ufo_low', level);
        }
        if (level >= 4 && this.spawnCounters.buggy <= 0) {
            this.spawnBuggy(level);
        }
    }

    spawnUFO(type, level) {
        const params = {
            'ufo_high': { y: 80, health: 1, resetTime: this.baseSpawnTime.ufoHigh },
            'ufo_mid': { y: 140, health: 2, resetTime: this.baseSpawnTime.ufoMid },
            'ufo_low': { y: 200, health: 3, resetTime: this.baseSpawnTime.ufoLow }
        };

        const levelIndex = type === 'ufo_high' ? 2 : type === 'ufo_mid' ? 3 : 5;
        this.spawnCounters[type] = params[type].resetTime * (1 - (level - levelIndex) * 0.1);

        this.enemies.push({
            x: GAME_WIDTH + 50,
            y: params[type].y,
            baseY: params[type].y,
            width: 40,
            height: 20,
            type: type,
            health: params[type].health,
            bombCounter: 2000 + Math.random() * 2000,
            prevX: GAME_WIDTH + 50, // Track previous position to prevent trailing
            prevY: params[type].y    // Track previous position to prevent trailing
        });
    }

    spawnBuggy(level) {
        this.spawnCounters.buggy = this.baseSpawnTime.buggy * (1 - (level - 4) * 0.15);
        this.enemies.push({
            x: -50,
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
        // IMPORTANT: Make sure we're not using the saved context state from elsewhere
        this.ctx.save();
        this.ctx.restore();
        
        // Draw each enemy without any lingering context changes
        this.enemies.forEach(enemy => {
            this.ctx.save(); // Save state before drawing each enemy
            
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
            
            this.ctx.restore(); // Restore state after drawing each enemy
        });
    }

    drawUFO(ufo) {
        // Reset any potentially problematic context properties
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = "transparent";
        this.ctx.globalAlpha = 1.0;
        this.ctx.lineWidth = 1;
        
        const x = ufo.x;
        const y = ufo.y;
        const width = ufo.width;
        const height = ufo.height;
        const centerX = x + width/2;
        const centerY = y + height/2;
        
        // Draw a more interesting saucer shape
        
        // Bottom dish
        this.ctx.fillStyle = '#666666';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY + 3, width/2, height/4, 0, 0, Math.PI*2);
        this.ctx.fill();
        
        // Main saucer body - with gradient for better 3D effect
        const gradient = this.ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#AAAAAA');
        gradient.addColorStop(0.5, '#777777');
        gradient.addColorStop(1, '#444444');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY, width/2, height/3, 0, 0, Math.PI*2);
        this.ctx.fill();
        
        // Top dome
        this.ctx.fillStyle = '#BBBBBB';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY - 2, width/3, height/5, 0, 0, Math.PI);
        this.ctx.fill();
        
        // Window reflections
        this.ctx.fillStyle = '#00FFFF';
        
        // Cockpit window
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY - 3, width/6, height/10, 0, 0, Math.PI*2);
        this.ctx.fill();
        
        // Side lights - blinking based on frame count
        const blinkRate = 30;
        const lightOn = Math.floor(this.game.frameCount / blinkRate) % 2 === 0;
        
        this.ctx.fillStyle = lightOn ? '#FF3333' : '#880000';
        this.ctx.beginPath();
        this.ctx.arc(x + width*0.2, centerY, 3, 0, Math.PI*2);
        this.ctx.fill();
        
        this.ctx.fillStyle = !lightOn ? '#FF3333' : '#880000';
        this.ctx.beginPath();
        this.ctx.arc(x + width*0.8, centerY, 3, 0, Math.PI*2);
        this.ctx.fill();
        
        // Add a subtle glow when the UFO is active (bombing)
        if (ufo.bombCounter < 500) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(centerX, centerY + 5, width/2, height/3, 0, 0, Math.PI*2);
            this.ctx.fill();
        }
    }

    drawBuggy(buggy) {
        const x = buggy.x;
        const y = buggy.y;
        const width = buggy.width;
        const height = buggy.height;
        
        // Base color changes during dash
        const baseColor = buggy.isDashing ? '#550000' : '#333333';
        const detailColor = buggy.isDashing ? '#FF2222' : '#666666';
        
        // Improved buggy body
        this.ctx.fillStyle = baseColor;
        
        // Main body - angled like a wedge for more aggressive look
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height*0.8);
        this.ctx.lineTo(x + width*0.2, y);
        this.ctx.lineTo(x + width, y + height*0.3);
        this.ctx.lineTo(x + width, y + height*0.8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Detail line along the top
        this.ctx.strokeStyle = detailColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + width*0.2, y + 2);
        this.ctx.lineTo(x + width, y + height*0.3 + 2);
        this.ctx.stroke();
        
        // Turret/cannon
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(x + width*0.7, y - height*0.3, width*0.2, height*0.4);
        
        // Window/cockpit
        this.ctx.fillStyle = buggy.isDashing ? '#FFFF00' : '#33CCFF';
        this.ctx.beginPath();
        this.ctx.moveTo(x + width*0.25, y + 5);
        this.ctx.lineTo(x + width*0.45, y + 5);
        this.ctx.lineTo(x + width*0.5, y + 15);
        this.ctx.lineTo(x + width*0.2, y + 15);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Wheels with better detail
        this.ctx.fillStyle = '#000000';
        
        // Draw front wheel
        this.ctx.beginPath();
        this.ctx.arc(x + width*0.25, y + height, 8, 0, Math.PI*2);
        this.ctx.fill();
        
        // Draw rear wheel
        this.ctx.beginPath();
        this.ctx.arc(x + width*0.75, y + height, 8, 0, Math.PI*2);
        this.ctx.fill();
        
        // Wheel details - hubcaps
        this.ctx.fillStyle = '#555555';
        this.ctx.beginPath();
        this.ctx.arc(x + width*0.25, y + height, 3, 0, Math.PI*2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x + width*0.75, y + height, 3, 0, Math.PI*2);
        this.ctx.fill();
        
        // Draw dash effect
        if (buggy.isDashing) {
            // Thruster flames
            this.ctx.fillStyle = '#FF5500';
            this.ctx.beginPath();
            this.ctx.moveTo(x - 5, y + height*0.5 - 5);
            this.ctx.lineTo(x - 15, y + height*0.5);
            this.ctx.lineTo(x - 5, y + height*0.5 + 5);
            this.ctx.closePath();
            this.ctx.fill();

            // Add smoke particles
            this.ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
            for (let i = 0; i < 3; i++) {
                const size = 4 + Math.random() * 4;
                this.ctx.beginPath();
                this.ctx.arc(
                    x - 15 - (Math.random() * 10),
                    y + height*0.5 + (Math.random() * 10 - 5),
                    size, 0, Math.PI*2
                );
                this.ctx.fill();
            }
        }
    }
}

console.log("Loading enemies.js");