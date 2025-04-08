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
        this.jumpCooldown = 300;
    }

    initialize() {
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpStartTime = 0;
        this.jumpPeakReached = false;
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
        this.updateJumpPhysics(deltaTime);
    }

    updateJumpPhysics(deltaTime) {
        if (this.isJumping) {
            const jumpDuration = Date.now() - this.jumpStartTime;
            const jumpPhase = Math.min(jumpDuration / 1000, 1);

            if (jumpPhase < 0.3) {
                this.velocityY = -JUMP_FORCE * (1 - jumpPhase / 0.3) * 0.9;
            } else if (jumpPhase < 0.7) {
                if (!this.jumpPeakReached) {
                    this.jumpPeakReached = true;
                    this.velocityY = -0.3;
                }
                this.velocityY += GRAVITY * 0.2 * deltaTime / 16;
            } else {
                const descentPhase = (jumpPhase - 0.7) / 0.3;
                this.velocityY += GRAVITY * (0.5 + descentPhase * 0.9) * deltaTime / 16;
            }

            this.player.y += this.velocityY;

            const groundY = this.game.terrain.getGroundY(this.player.x + this.player.width / 2);
            if (this.player.y >= groundY - this.player.height) {
                this.player.y = groundY - this.player.height;
                this.velocityY = 0;
                this.isJumping = false;
                this.jumpPeakReached = false;
            }

            if (this.player.y >= GAME_HEIGHT - GROUND_HEIGHT - this.player.height) {
                this.player.y = GAME_HEIGHT - GROUND_HEIGHT - this.player.height;
                this.velocityY = 0;
                this.isJumping = false;
                this.jumpPeakReached = false;
            }
        } else {
            const xCenter = this.player.x + this.player.width / 2;
            const scrollOffset = (this.game.terrain.levelProgress / 100) * (this.game.terrain.sectionWidth * this.game.terrain.levelLength);
            const terrainX = xCenter + scrollOffset;
            const groundY = this.game.terrain.getGroundY(xCenter);

            const segment = this.game.terrain.generator.groundSegments.find(seg =>
                terrainX >= seg.x && terrainX < seg.x + seg.width
            );

            if (segment && segment.type === 'crater') {
                if (this.game.godMode) {
                    this.player.y = groundY - this.player.height;
                    this.velocityY = 0;
                    this.isJumping = false;
                    console.warn("✨ God lifted you over a crater at x=" + segment.x);
                } else {
                    console.warn("☠️ Crater death at segment x=" + segment.x + ", player x=" + terrainX);
                    this.player.hit('crater');
                }
            } else {
                this.player.y = groundY - this.player.height;
            }
        }
    }

    jump() {
        const now = Date.now();
        if (!this.isJumping && (now - this.lastJumpTime > this.jumpCooldown)) {
            this.isJumping = true;
            this.velocityY = -JUMP_FORCE;
            this.jumpStartTime = now;
            this.lastJumpTime = now;
            this.jumpPeakReached = false;
        }
    }

    checkForCratersAhead() {
        if (this.isJumping || this.game.godMode) return;

        const now = Date.now();
        if (now - this.lastJumpTime < this.jumpCooldown) return;

        const lookAheadDistance = 60;
        const currentGroundY = this.game.terrain.getGroundY(this.player.x + this.player.width / 2);
        const aheadGroundY = this.game.terrain.getGroundY(this.player.x + this.player.width / 2 + lookAheadDistance);

        if (aheadGroundY > currentGroundY + 20) {
            this.jump();
            if (this.game.effects) {
                this.game.effects.createShieldEffect(this.player.x, this.player.y, this.player.width, this.player.height);
            }
        }
    }
}