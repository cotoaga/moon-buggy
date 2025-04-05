// player.js - Player vehicle logic and rendering
class Player {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.x = 200;
        this.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpStartTime = 0;
        this.jumpPeakReached = false;
        this.isShooting = false;
        this.isShootingUp = false;
        this.cooldown = 0;
        this.mineCooldown = 0;
        this.lives = 3;
        this.invulnerable = 0;
        this.flash = false;
        this.bullets = [];
        this.mines = [];
        this.maxBullets = 10;
        this.maxMines = 5;
    }
    
    initialize() {
        // Nothing specific needed for initialization
    }
    
    update(deltaTime, keys) {
        // Horizontal movement
        if (keys.left) {
            this.x -= PLAYER_SPEED;
            if (this.x < 0) this.x = 0;
        }
        if (keys.right) {
            this.x += PLAYER_SPEED;
            if (this.x > GAME_WIDTH / 2) this.x = GAME_WIDTH / 2;
        }
        
        // Update invulnerability and flashing
        if (this.invulnerable > 0) {
            this.invulnerable -= deltaTime;
            // Flash effect every 100ms
            if (Math.floor(this.invulnerable / 100) % 2 === 0) {
                this.flash = true;
            } else {
                this.flash = false;
            }
        } else {
            this.flash = false;
        }
        
        // Enhanced moon-like jumping with improved physics
        if (this.isJumping) {
            // Calculate jump phase (0-1 where 0.5 is the peak)
            const jumpDuration = Date.now() - this.jumpStartTime;
            const jumpPhase = Math.min(jumpDuration / 1000, 1); // Normalize to 0-1 over 1 second
            
            // Enhance the lunar gravity effect with three distinct phases:
            
            // Initial thrust phase (0-0.3)
            if (jumpPhase < 0.3) {
                // Strong initial thrust that gradually decreases
                this.velocityY = -JUMP_FORCE * (1 - jumpPhase/0.3) * 0.9;
            } 
            // "Hang time" phase (0.3-0.7) - very low gravity feel
            else if (jumpPhase < 0.7) {
                if (!this.jumpPeakReached) {
                    this.jumpPeakReached = true;
                    this.velocityY = -0.3; // Slight upward drift at peak
                }
                // Very minimal gravity during hang time (only 20% of normal)
                this.velocityY += GRAVITY * 0.2 * deltaTime / 16; 
            } 
            // Descent phase (0.7-1.0) - gradually increasing gravity
            else {
                const descentPhase = (jumpPhase - 0.7) / 0.3; // 0 to 1 during descent
                // Gravity increases as you fall, creating more realistic acceleration
                this.velocityY += GRAVITY * (0.5 + descentPhase * 0.9) * deltaTime / 16;
            }
            
            // Update position
            this.y += this.velocityY;
            
            // Check if landed
            const groundY = this.game.terrain.getGroundY(this.x + PLAYER_WIDTH/2);
            if (this.y >= groundY - PLAYER_HEIGHT) {
                this.y = groundY - PLAYER_HEIGHT;
                this.velocityY = 0;
                this.isJumping = false;
                this.jumpPeakReached = false;
            }
            
            // Add absolute ground check
            if (this.y >= GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT) {
                this.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
                this.velocityY = 0;
                this.isJumping = false;
                this.jumpPeakReached = false;
            }
        } else {
            // When not jumping, check if we're over a crater
            const groundY = this.game.terrain.getGroundY(this.x + PLAYER_WIDTH/2);
            const previousY = this.y;
            
            // If we suddenly detect a much lower ground (crater), start falling instead of teleporting
            if (groundY > previousY + 20) {
                // Start falling into the crater
                this.isJumping = true;
                this.velocityY = 0; // Start with zero velocity
                this.jumpStartTime = Date.now() - 700; // Start in the descent phase
                this.jumpPeakReached = true;
            } else {
                // Normal ground following
                this.y = groundY - PLAYER_HEIGHT;
            }
        }
        
        // Cooldown for shooting
        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }
        
        // Cooldown for mines
        if (this.mineCooldown > 0) {
            this.mineCooldown -= deltaTime;
        }
        
        // Update player bullets
        this.updateBullets(deltaTime);
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // Update position
            bullet.x += bullet.velocityX * deltaTime / 16;
            bullet.y += bullet.velocityY * deltaTime / 16;
            
            // Remove bullets that go offscreen
            if (bullet.x > GAME_WIDTH || bullet.x < 0 || bullet.y < 0 || bullet.y > GAME_HEIGHT) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check for collision with obstacles and enemies handled by game engine
        }
    }
    
    jump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.velocityY = -JUMP_FORCE;
            
            // Reset jump timing for more "moon-like" jumps
            this.jumpStartTime = Date.now();
            this.jumpPeakReached = false;
        }
    }
    
    shoot() {
        if (this.cooldown <= 0 && this.bullets.length < this.maxBullets) {
            // Create bullet
            this.bullets.push({
                x: this.x + PLAYER_WIDTH,
                y: this.y + PLAYER_HEIGHT/3,
                width: BULLET_SIZE,
                height: BULLET_SIZE,
                velocityX: BULLET_SPEED,
                velocityY: 0,
                type: 'forward'
            });
            
            // Reset cooldown
            this.cooldown = SHOOT_COOLDOWN;
            
            // Add visual feedback for shooting
            this.isShooting = true;
            setTimeout(() => {
                this.isShooting = false;
            }, 100);
        }
    }
    
    shootUp() {
        if (this.cooldown <= 0 && this.bullets.length < this.maxBullets) {
            // Create bullet
            this.bullets.push({
                x: this.x + PLAYER_WIDTH/2,
                y: this.y - BULLET_SIZE,
                width: BULLET_SIZE,
                height: BULLET_SIZE,
                velocityX: 0,
                velocityY: -BULLET_SPEED,
                type: 'upward'
            });
            
            // Reset cooldown
            this.cooldown = SHOOT_COOLDOWN;
            
            // Add visual feedback for shooting
            this.isShootingUp = true;
            setTimeout(() => {
                this.isShootingUp = false;
            }, 100);
        }
    }
    
    dropMine() {
        if (this.mineCooldown <= 0 && this.game.terrain.mines.length < this.maxMines) {
            // Create mine
            this.game.terrain.mines.push({
                x: this.x,
                y: this.game.terrain.getGroundY(this.x) - 20,
                width: 20,
                height: 20,
                timer: 1000, // Activation timer
                active: false
            });
            
            // Reset cooldown
            this.mineCooldown = MINE_COOLDOWN;
        }
    }
    
    hit() {
        if (!this.invulnerable) {
            if (godMode) {
                // In god mode, just flash but don't lose lives
                this.invulnerable = 1000;
                
                // Add shield effect
                this.game.effects.createShieldEffect(this.x, this.y, PLAYER_WIDTH, PLAYER_HEIGHT);
            } else {
                // Normal gameplay: lose a life
                this.lives--;
                this.invulnerable = 2000;
                
                // Add shield effect
                this.game.effects.createShieldEffect(this.x, this.y, PLAYER_WIDTH, PLAYER_HEIGHT);
                
                if (this.lives <= 0) {
                    this.game.gameRunning = false;
                }
            }
        }
    }
    
    draw() {
        if (this.flash) return; // Skip drawing when flashing
        
        // Draw vehicle body (Cybertruck-inspired angular design)
        this.ctx.fillStyle = '#C0C0C0'; // Metallic silver
        
        // Calculate wheel wobble based on frame count and movement
        let wheelSpeed = 4; // Default speed
        if (this.game.input.keys.left || this.game.input.keys.right) {
            wheelSpeed = 2; // Faster rotation when moving
        }
        
        const wheelOffset1 = Math.sin(this.game.frameCount / wheelSpeed) * 2;
        const wheelOffset2 = Math.sin(this.game.frameCount / wheelSpeed + 1) * 2;
        const wheelOffset3 = Math.sin(this.game.frameCount / wheelSpeed + 2) * 2;
        
        // Main body (trapezoid)
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y + 10);
        this.ctx.lineTo(this.x + PLAYER_WIDTH - 15, this.y);
        this.ctx.lineTo(this.x + PLAYER_WIDTH, this.y + 8);
        this.ctx.lineTo(this.x + PLAYER_WIDTH, this.y + PLAYER_HEIGHT - 8);
        this.ctx.lineTo(this.x, this.y + PLAYER_HEIGHT - 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add metallic sheen
        const gradient = this.ctx.createLinearGradient(
            this.x, this.y, 
            this.x + PLAYER_WIDTH, this.y + PLAYER_HEIGHT
        );
        gradient.addColorStop(0, '#A0A0A0');
        gradient.addColorStop(0.5, '#E0E0E0');
        gradient.addColorStop(1, '#A0A0A0');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(this.x + 5, this.y + 12);
        this.ctx.lineTo(this.x + PLAYER_WIDTH - 18, this.y + 3);
        this.ctx.lineTo(this.x + PLAYER_WIDTH - 5, this.y + 10);
        this.ctx.lineTo(this.x + PLAYER_WIDTH - 5, this.y + PLAYER_HEIGHT - 12);
        this.ctx.lineTo(this.x + 5, this.y + PLAYER_HEIGHT - 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add window
        this.ctx.fillStyle = '#88CCFF';
        this.ctx.beginPath();
        this.ctx.moveTo(this.x + 15, this.y + 13);
        this.ctx.lineTo(this.x + PLAYER_WIDTH - 25, this.y + 6);
        this.ctx.lineTo(this.x + PLAYER_WIDTH - 20, this.y + 15);
        this.ctx.lineTo(this.x + 20, this.y + 20);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw six wheels with independent wobble
        this.ctx.fillStyle = '#333333';
        
        // Front wheels
        this.ctx.beginPath();
        this.ctx.arc(this.x + 10, this.y + PLAYER_HEIGHT + wheelOffset1, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Middle wheels
        this.ctx.beginPath();
        this.ctx.arc(this.x + PLAYER_WIDTH/2 - 5, this.y + PLAYER_HEIGHT + wheelOffset2, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rear wheels
        this.ctx.beginPath();
        this.ctx.arc(this.x + PLAYER_WIDTH - 15, this.y + PLAYER_HEIGHT + wheelOffset3, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Draw gun with shooting animation
        if (this.isShooting) {
            // Gun with recoil
            this.ctx.fillStyle = '#CC3333';
            this.ctx.fillRect(this.x + PLAYER_WIDTH - 8, this.y + 5, 8, 6);
            
            // Muzzle flash
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(this.x + PLAYER_WIDTH + 5, this.y + 8, 5, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Normal gun
            this.ctx.fillStyle = '#CC3333';
            this.ctx.fillRect(this.x + PLAYER_WIDTH - 5, this.y + 5, 10, 6);
        }
        
        // Draw upward gun with shooting animation
        if (this.isShootingUp) {
            // Gun with muzzle flash
            this.ctx.fillStyle = '#8888CC';
            this.ctx.fillRect(this.x + PLAYER_WIDTH/2 - 5, this.y - 8, 10, 8);
            
            // Muzzle flash
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(this.x + PLAYER_WIDTH/2, this.y - 10, 5, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Normal upward gun
            this.ctx.fillStyle = '#8888CC';
            this.ctx.fillRect(this.x + PLAYER_WIDTH/2 - 5, this.y - 5, 10, 5);
        }
        
        // Draw bullets
        this.drawBullets();
    }
    
    drawBullets() {
        this.ctx.fillStyle = '#FFFF00';
        this.bullets.forEach(bullet => {
            // Add slight glow effect
            this.ctx.shadowColor = '#FFFF80';
            this.ctx.shadowBlur = 5;
            
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
        });
    }
}