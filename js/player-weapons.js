// player-weapons.js - Player weapons management
class PlayerWeapons {
    constructor(player) {
        this.player = player;
        this.game = player.game;
        this.ctx = player.ctx;

        // Weapons state
        this.bullets = [];
        this.cooldown = 0;
        this.mineCooldown = 0;
        this.isShooting = false;
        this.isShootingUp = false;
        this.debug = false;

        // Weapon limits
        this.maxBullets = 10;
        this.maxMines = 5;

        // Energy costs
        this.shootEnergyCost = 5;
        this.mineEnergyCost = 10;
    }

    initialize() {
        this.bullets = [];
        this.cooldown = 0;
        this.mineCooldown = 0;
        this.isShooting = false;
        this.isShootingUp = false;
    }

    update(deltaTime) {
        this.updateBullets(deltaTime);

        if (this.cooldown > 0) {
            this.cooldown -= deltaTime;
        }

        if (this.mineCooldown > 0) {
            this.mineCooldown -= deltaTime;
        }
    }

    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.velocityX * deltaTime / 16;
            bullet.y += bullet.velocityY * deltaTime / 16;

            if (bullet.x > GAME_WIDTH || bullet.x < 0 || bullet.y < 0 || bullet.y > GAME_HEIGHT) {
                this.bullets.splice(i, 1);
            }
        }
    }

    shoot() {
        if (this.cooldown <= 0 &&
            this.bullets.length < this.maxBullets &&
            this.player.health.energy >= this.shootEnergyCost) {

            this.player.health.energy -= this.shootEnergyCost;

            this.bullets.push({
                x: this.player.x + this.player.width,
                y: this.player.y + this.player.height / 3,
                width: BULLET_SIZE,
                height: BULLET_SIZE,
                velocityX: BULLET_SPEED,
                velocityY: 0,
                type: 'forward'
            });

            this.cooldown = SHOOT_COOLDOWN;

            this.isShooting = true;
            setTimeout(() => {
                this.isShooting = false;
            }, 100);
        }
    }

    shootUp() {
        if (this.cooldown <= 0 &&
            this.bullets.length < this.maxBullets &&
            this.player.health.energy >= this.shootEnergyCost) {

            this.player.health.energy -= this.shootEnergyCost;

            this.bullets.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y - BULLET_SIZE,
                width: BULLET_SIZE,
                height: BULLET_SIZE,
                velocityX: 0,
                velocityY: -BULLET_SPEED,
                type: 'upward'
            });

            this.cooldown = SHOOT_COOLDOWN;

            this.isShootingUp = true;
            setTimeout(() => {
                this.isShootingUp = false;
            }, 100);
        }
    }

    dropMine() {
        if (this.mineCooldown > 0) {
            if (this.debug) console.log("Mine cooldown still active:", this.mineCooldown);
            return;
        }
        
        if (this.player.health.energy < this.mineEnergyCost) {
            if (this.debug) console.log("Not enough energy to drop mine:", this.player.health.energy);
            return;
        }
        
        // Check if we have terrain and mines system
        if (!this.game.terrain || !this.game.terrain.mineManager) {
            console.error("Cannot drop mine: terrain or mineManager not available");
            return;
        }
        
        const mines = this.game.terrain.mineManager.mines;
        const maxMines = this.maxMines;
        
        if (mines.length >= maxMines) {
            if (this.debug) console.log(`Max mines (${maxMines}) already placed`);
            return;
        }
        
        // Deduct energy
        this.player.health.energy -= this.mineEnergyCost;
        
        // Calculate position (at player's rear end, on the ground)
        const x = this.player.x;
        const y = this.game.terrain.getGroundY(x) - 20;
        
        // Add the mine
        this.game.terrain.mineManager.addMine(x, y);
        
        // Set cooldown
        this.mineCooldown = MINE_COOLDOWN;
        
        if (this.debug) console.log(`Mine dropped at (${x}, ${y})`);
        
        // Show visual feedback
        if (this.game.effects) {
            this.game.effects.createShieldEffect(x, y, 20, 20);
        }
    }

    draw() {
        if (this.isShooting) {
            this.ctx.fillStyle = '#CC3333';
            this.ctx.fillRect(this.player.x + this.player.width - 8, this.player.y + 5, 8, 6);
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width + 5, this.player.y + 8, 5, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = '#CC3333';
            this.ctx.fillRect(this.player.x + this.player.width - 5, this.player.y + 5, 10, 6);
        }

        if (this.isShootingUp) {
            this.ctx.fillStyle = '#8888CC';
            this.ctx.fillRect(this.player.x + this.player.width / 2 - 5, this.player.y - 8, 10, 8);
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.beginPath();
            this.ctx.arc(this.player.x + this.player.width / 2, this.player.y - 10, 5, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = '#8888CC';
            this.ctx.fillRect(this.player.x + this.player.width / 2 - 5, this.player.y - 5, 10, 5);
        }

        this.drawBullets();
    }

    drawBullets() {
        this.ctx.fillStyle = '#FFFF00';
        this.bullets.forEach(bullet => {
            this.ctx.shadowColor = '#FFFF80';
            this.ctx.shadowBlur = 5;
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            this.ctx.shadowBlur = 0;
        });
    }
}