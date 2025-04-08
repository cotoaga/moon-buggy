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
        ufo.x -= (SCROLL_SPEED * 1.2) * deltaTime / 16;

        const zigZagAmplitude = ufo.type === 'ufo_high' ? 40 :
                                 ufo.type === 'ufo_mid' ? 30 : 20;
        const zigZagFrequency = ufo.type === 'ufo_high' ? 0.01 :
                                 ufo.type === 'ufo_mid' ? 0.015 : 0.02;

        ufo.y = ufo.baseY + Math.sin(ufo.x * zigZagFrequency) * zigZagAmplitude;

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
            bombCounter: 2000 + Math.random() * 2000
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
        this.ctx.fillStyle = '#888888';
        this.ctx.fillRect(ufo.x, ufo.y + ufo.height / 2, ufo.width, ufo.height / 2);
        this.ctx.beginPath();
        this.ctx.arc(
            ufo.x + ufo.width / 2,
            ufo.y + ufo.height / 2,
            ufo.width / 2,
            Math.PI, 2 * Math.PI
        );
        this.ctx.fill();

        this.ctx.fillStyle = '#00FFFF';
        this.ctx.beginPath();
        this.ctx.arc(ufo.x + ufo.width / 2, ufo.y + ufo.height / 2 - 4, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawBuggy(buggy) {
        if (buggy.isDashing) {
            this.ctx.fillStyle = '#550000';
        } else {
            this.ctx.fillStyle = '#222222';
        }

        this.ctx.fillRect(buggy.x, buggy.y, buggy.width, buggy.height);

        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(buggy.x + 15, buggy.y + buggy.height, 8, 0, Math.PI * 2);
        this.ctx.arc(buggy.x + buggy.width - 15, buggy.y + buggy.height, 8, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#666666';
        this.ctx.fillRect(buggy.x, buggy.y + 5, 10, 10);

        if (buggy.isDashing) {
            this.ctx.fillStyle = '#FF5500';
            this.ctx.beginPath();
            this.ctx.moveTo(buggy.x - 5, buggy.y + buggy.height - 5);
            this.ctx.lineTo(buggy.x - 15, buggy.y + buggy.height - 10);
            this.ctx.lineTo(buggy.x - 10, buggy.y + buggy.height);
            this.ctx.closePath();
            this.ctx.fill();

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

console.log("Loading enemies.js");
