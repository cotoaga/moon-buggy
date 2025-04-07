// player-movement.js - Player movement and physics
class PlayerMovement {
    constructor(player) {
        this.player = player;
        this.game = player.game;
        
        // Movement state
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpStartTime = 0;
        this.jumpPeakReached = false;
        this.lastJumpTime = 0;
        this.jumpCooldown = 300; // ms between auto-jumps to prevent rapid jumping
    }
    
    initialize() {
        // Reset movement state
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpStartTime = 0;
        this.jumpPeakReached = false;
    }
    
    update(deltaTime, keys) {
        // Horizontal movement
        if (keys.left) {
            this.player.x -= PLAYER_SPEED;
            if (this.player.x < 0) this.player.x = 0;
        }
        if (keys.right) {
            this.player.x += PLAYER_SPEED;
            if (this.player.x > GAME_WIDTH / 2) this.player.x = GAME_WIDTH / 2;
        }
        
        // Update jumping physics
        this.updateJumpPhysics(deltaTime);
    }
    
    updateJumpPhysics(deltaTime) {
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
            this.player.y += this.velocityY;
            
            // Check if landed
            if (this.game.terrain) {
                const groundY = this.game.terrain.getGroundY(this.player.x + this.player.width/2);
                if (this.player.y >= groundY - this.player.height) {
                    this.player.y = groundY - this.player.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                    this.jumpPeakReached = false;
                }
            }
            
            // Add absolute ground check
            if (this.player.y >= GAME_HEIGHT - GROUND_HEIGHT - this.player.height) {
                this.player.y = GAME_HEIGHT - GROUND_HEIGHT - this.player.height;
                this.velocityY = 0;
                this.isJumping = false;
                this.jumpPeakReached = false;
            }
        } else {
            // When not jumping, check if we're over a crater
            if (this.game.terrain) {
                const groundY = this.game.terrain.getGroundY(this.player.x + this.player.width/2);
                const previousY = this.player.y;
                
                // If we suddenly detect a much lower ground (crater), start falling instead of teleporting
                if (groundY > previousY + 20) {
                    // Start falling into the crater
                    this.isJumping = true;
                    this.velocityY = 0; // Start with zero velocity
                    this.jumpStartTime = Date.now() - 700; // Start in the descent phase
                    this.jumpPeakReached = true;
                    
                    // Auto-jump in godMode to avoid craters, otherwise check for death
                    if (groundY > GAME_HEIGHT - GROUND_HEIGHT - 45) {
                        if (this.game.godMode) {
                            this.jump(); // Auto-jump in god mode
                        } else {
                            this.player.hit('crater'); // Player gets hit when in deep crater
                        }
                    }
                } else {
                    // Normal ground following
                    this.player.y = groundY - this.player.height;
                }
            }
        }
    }
    
    jump() {
        // Only jump if not already jumping and cooldown has elapsed
        const now = Date.now();
        if (!this.isJumping && (now - this.lastJumpTime > this.jumpCooldown)) {
            this.isJumping = true;
            this.velocityY = -JUMP_FORCE;
            
            // Reset jump timing for more "moon-like" jumps
            this.jumpStartTime = now;
            this.lastJumpTime = now;
            this.jumpPeakReached = false;
        }
    }
    
    checkForCratersAhead() {
        if (this.isJumping) return; // Don't check if already jumping
        
        // Only check periodically to prevent constant jumping
        const now = Date.now();
        if (now - this.lastJumpTime < this.jumpCooldown) return;
        
        // Look ahead for craters and auto-jump when needed
        if (this.game.terrain) {
            const lookAheadDistance = 60;
            const currentGroundY = this.game.terrain.getGroundY(this.player.x + this.player.width/2);
            const aheadGroundY = this.game.terrain.getGroundY(this.player.x + this.player.width/2 + lookAheadDistance);
            
            if (aheadGroundY > currentGroundY + 20) {
                this.jump();
                if (this.game.effects) {
                    this.game.effects.createShieldEffect(this.player.x, this.player.y, this.player.width, this.player.height);
                }
            }
        }
    }
}