// player-movement.js - Player movement and physics
class PlayerMovement {
    constructor(player) {
        this.player = player;
        this.game = player.game;

        this.velocityY = 0;
        this.isJumping = false;
        this.jumpStartTime = 0;
        this.jumpPeakReached = false;
        this.lastJumpTime = 0;
        this.jumpCooldown = 250; // Reduced from 300 to make jumping more responsive
        
        // New properties to improve jump behavior
        this.jumpForce = JUMP_FORCE; // Now using constant from constants.js
        this.craterDetectionDistance = 80; // Increased from 60 for earlier crater detection
        this.maxJumpHoldTime = 500; // Max time player can "hold" the jump to go higher
        this.jumpHoldTime = 0;
        this.jumpReleased = true;
    }

    initialize() {
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpStartTime = 0;
        this.jumpPeakReached = false;
        this.jumpHoldTime = 0;
        this.jumpReleased = true;
    }

    update(deltaTime, keys) {
        if (keys.left) {
            this.player.x -= PLAYER_SPEED;
            if (this.player.x < 0) this.player.x = 0;
        }
        if (keys.right) {
            this.player.x += PLAYER_SPEED;
            if (this.player.x > GAME_WIDTH / 2) this.player.x = GAME_WIDTH / 2;
        }
        
        // Monitor jump key state for "hold to jump higher" mechanic
        if (keys.jump && this.isJumping && !this.jumpReleased && this.jumpHoldTime < this.maxJumpHoldTime) {
            this.jumpHoldTime += deltaTime;
            // Extended jump factor will be calculated in updateJumpPhysics
        } else if (!keys.jump && !this.jumpReleased) {
            this.jumpReleased = true;
        }
        
        this.updateJumpPhysics(deltaTime);
        
        // Check for craters ahead - now done in every frame, not just in God Mode
        this.checkForCratersAhead();
    }

    updateJumpPhysics(deltaTime) {
        if (this.isJumping) {
            const jumpDuration = Date.now() - this.jumpStartTime;
            const jumpPhase = Math.min(jumpDuration / 1000, 1);
            
            // Apply jump hold factor if the player is holding the jump button
            const jumpHoldFactor = Math.min(1 + (this.jumpHoldTime / this.maxJumpHoldTime) * 0.3, 1.3);

            if (jumpPhase < 0.3) {
                // Initial boost phase - stronger if holding jump
                this.velocityY = -this.jumpForce * jumpHoldFactor * (1 - jumpPhase / 0.3) * 0.9;
            } else if (jumpPhase < 0.7) {
                if (!this.jumpPeakReached) {
                    this.jumpPeakReached = true;
                    this.velocityY = -0.3;
                }
                // Reduced gravity at peak for more "hang time"
                this.velocityY += GRAVITY * 0.15 * deltaTime / 16;
            } else {
                const descentPhase = (jumpPhase - 0.7) / 0.3;
                // Gentler descent to give more time to clear obstacles
                this.velocityY += GRAVITY * (0.4 + descentPhase * 0.8) * deltaTime / 16;
            }

            this.player.y += this.velocityY;

            // Check ground collision
            const groundY = this.getGroundYSafely(this.player.x + this.player.width / 2);
            if (this.player.y >= groundY - this.player.height) {
                this.player.y = groundY - this.player.height;
                this.velocityY = 0;
                this.isJumping = false;
                this.jumpPeakReached = false;
                this.jumpHoldTime = 0;
            }

            // Absolute ground check as a safety measure
            if (this.player.y >= GAME_HEIGHT - GROUND_HEIGHT - this.player.height) {
                this.player.y = GAME_HEIGHT - GROUND_HEIGHT - this.player.height;
                this.velocityY = 0;
                this.isJumping = false;
                this.jumpPeakReached = false;
                this.jumpHoldTime = 0;
            }
        } else {
            const xCenter = this.player.x + this.player.width / 2;
            const groundY = this.getGroundYSafely(xCenter);
            
            // Check if player is over a crater
            const segment = this.getTerrainSegmentAt(xCenter);
            
            if (segment && segment.type === 'crater') {
                if (this.game.godMode) {
                    // God mode just lifts you over craters
                    this.player.y = groundY - this.player.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                } else {
                    // Player is over a crater and not in God Mode - check if we should fall in
                    const craterDepth = groundY - (GAME_HEIGHT - GROUND_HEIGHT);
                    
                    // Only trigger crater death if it's a significant crater
                    if (craterDepth > 20) {
                        // This is a deep crater, fall in and die
                        this.velocityY = 5; // Start falling
                        this.isJumping = true; // Enter jump mode for physics
                        this.jumpPeakReached = true; // Make sure we're in fall phase
                        
                        // Don't call hit() yet - let the physics run for a moment to show falling
                        setTimeout(() => {
                            if (this.game && this.game.player && !this.game.godMode) {
                                this.game.player.hit('crater');
                            }
                        }, 300);
                    } else {
                        // Small crater, just stay at the ground level
                        this.player.y = groundY - this.player.height;
                    }
                }
            } else {
                // Normal ground, just position at ground level
                this.player.y = groundY - this.player.height;
            }
        }
    }

    jump() {
        const now = Date.now();
        if (!this.isJumping && (now - this.lastJumpTime > this.jumpCooldown)) {
            this.isJumping = true;
            this.velocityY = -this.jumpForce;
            this.jumpStartTime = now;
            this.lastJumpTime = now;
            this.jumpPeakReached = false;
            this.jumpHoldTime = 0;
            this.jumpReleased = false; // Track that jump button is pressed
        }
    }

    checkForCratersAhead() {
        // Don't check if we're jumping already since we're already airborne
        if (this.isJumping) return;
        
        // Cooldown check to prevent rapid auto-jumping
        const now = Date.now();
        if (now - this.lastJumpTime < this.jumpCooldown) return;

        // Look ahead for craters at an increased distance
        const lookAheadDistance = this.craterDetectionDistance;
        const currentGroundY = this.getGroundYSafely(this.player.x + this.player.width / 2);
        const aheadGroundY = this.getGroundYSafely(this.player.x + this.player.width / 2 + lookAheadDistance);
        
        // Jump automatically if there's a significant drop ahead (potential crater)
        // Auto-jump works for all players now, not just God Mode, but with different thresholds
        const craterThreshold = this.game.godMode ? 15 : 30; // More sensitive for God Mode
        
        if (aheadGroundY > currentGroundY + craterThreshold) {
            // Auto-jump!
            console.log(`Auto-jump triggered: current Y=${currentGroundY}, ahead Y=${aheadGroundY}`);
            this.jump();
            
            // Visual feedback for auto-jump
            if (this.game.effects) {
                this.game.effects.createShieldEffect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        }
    }
    
    // Utility methods for safer terrain access
    
    getGroundYSafely(x) {
        if (this.game && this.game.terrain && typeof this.game.terrain.getGroundY === 'function') {
            return this.game.terrain.getGroundY(x);
        }
        // Fallback if terrain is not available
        return GAME_HEIGHT - GROUND_HEIGHT;
    }
    
    getTerrainSegmentAt(x) {
        try {
            if (!this.game || !this.game.terrain || !this.game.terrain.generator || 
                !this.game.terrain.generator.groundSegments) {
                return null;
            }
            
            const scrollOffset = (this.game.terrain.levelProgress / 100) * 
                (this.game.terrain.sectionWidth * this.game.terrain.levelLength);
            
            const terrainX = x + scrollOffset;
            
            return this.game.terrain.generator.groundSegments.find(seg => 
                terrainX >= seg.x && terrainX < seg.x + seg.width
            );
        } catch (e) {
            console.error("Error in getTerrainSegmentAt:", e);
            return null;
        }
    }
}