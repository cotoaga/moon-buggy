// enemies.js - corrected class with fixed brackets
class EnemyManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.enemies = [];

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

/*
Debug output reminding me of dark times		
	    if (this.game.frameCount % 60 === 0) {
            console.log("====== SPAWN COUNTERS ======");
            console.log(`UFO High: ${Math.round(this.spawnCounters.ufoHigh)}`);
            console.log(`UFO Mid: ${Math.round(this.spawnCounters.ufoMid)}`);
            console.log(`UFO Low: ${Math.round(this.spawnCounters.ufoLow)}`);
            console.log(`Buggy: ${Math.round(this.spawnCounters.buggy)}`);
            console.log(`Current enemies: ${this.enemies.length}`);
            console.log("===========================");
        }
*/
    }

    spawnEnemies(deltaTime, level) {
        this.spawnCounters.ufoHigh -= deltaTime;
        this.spawnCounters.ufoMid -= deltaTime;
        this.spawnCounters.ufoLow -= deltaTime;
        this.spawnCounters.buggy -= deltaTime;

        if (level >= 2 && this.spawnCounters.ufoHigh <= 0 && this.countType('ufo_high') < 2) {
            this.spawnUFO('ufo_high', level);
        }
        if (level >= 3 && this.spawnCounters.ufoMid <= 0 && this.countType('ufo_mid') < 2) {
            this.spawnUFO('ufo_mid', level);
        }
        if (level >= 5 && this.spawnCounters.ufoLow <= 0 && this.countType('ufo_low') < 2) {
            this.spawnUFO('ufo_low', level);
        }
        if (level >= 4 && this.spawnCounters.buggy <= 0 && this.countType('buggy') < 2) {
            this.spawnBuggy(level);
        }
    }

    countType(type) {
        return this.enemies.filter(e => e.type === type && !e.dead).length;
    }

    debugEnemies() {
        const counts = {
            ufo_high: 0,
            ufo_mid: 0,
            ufo_low: 0,
            buggy: 0
        };
        this.enemies.forEach(enemy => {
            if (counts[enemy.type] !== undefined) {
                counts[enemy.type]++;
            }
        });
        console.table(counts);
        return counts;
    }

	updateUFO(ufo, deltaTime) {
	    // Horizontal movement
	    const moveAmount = (SCROLL_SPEED * 1.2) * deltaTime / 16;
	    ufo.x -= moveAmount;

	    // Zigzag pattern
	    const amplitude = ufo.type === 'ufo_high' ? 40 :
	                      ufo.type === 'ufo_mid' ? 30 : 20;
	    const frequency = ufo.type === 'ufo_high' ? 0.01 :
	                      ufo.type === 'ufo_mid' ? 0.015 : 0.02;

	    ufo.y = ufo.baseY + Math.sin(ufo.x * frequency) * amplitude;

	    // Random bomb drops without proximity check
	    ufo.bombCounter -= deltaTime;
	    if (ufo.bombCounter <= 0) {
	        ufo.bombCounter = 120 + Math.random() * 100;
	        this.game.addBomb(ufo.x + ufo.width / 2, ufo.y + ufo.height);
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

    spawnUFO(type, level) {
        const params = {
            'ufo_high': { y: 80, health: 1, resetTime: this.baseSpawnTime.ufoHigh },
            'ufo_mid': { y: 140, health: 2, resetTime: this.baseSpawnTime.ufoMid },
            'ufo_low': { y: 200, health: 3, resetTime: this.baseSpawnTime.ufoLow }
        };
        const levelIndex = type === 'ufo_high' ? 2 : type === 'ufo_mid' ? 3 : 5;
        this.spawnCounters[type] = params[type].resetTime * (1 - (level - levelIndex) * 0.1);
        const startX = GAME_WIDTH - 10;
        if (this.enemies.length % 10 === 0) {
            console.log(`Spawning ${type} UFO - Total enemies: ${this.enemies.length}`);
        }
        this.enemies.push({
            x: startX,
            y: params[type].y,
            baseY: params[type].y,
            width: 40,
            height: 20,
            type: type,
            health: params[type].health,
            bombCounter: 2000 + Math.random() * 2000,
            prevX: startX,
            prevY: params[type].y
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
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.globalAlpha = 1.0;
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowColor = 'transparent';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.enemies.length; i++) {
            const enemy = this.enemies[i];
            if (enemy.destroyed) continue;
            this.ctx.save();
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
            this.ctx.restore();
        }
    }

	drawUFO(ufo) {
	    const { x, y, width, height } = ufo;
	    const centerX = x + width / 2;
	    const centerY = y + height / 2;

	    this.ctx.save();

	    // === SAUCER BODY ===
	    const gradient = this.ctx.createLinearGradient(x, y, x + width, y + height);
	    gradient.addColorStop(0, '#9EA7AD');
	    gradient.addColorStop(1, '#5C6670');

	    this.ctx.fillStyle = gradient;
	    this.ctx.beginPath();
	    this.ctx.ellipse(centerX, centerY, width / 2, height / 3, 0, 0, Math.PI * 2);
	    this.ctx.fill();

	    // === GLASS DOME ===
	    this.ctx.fillStyle = 'rgba(0, 255, 255, 0.6)';
	    this.ctx.beginPath();
	    this.ctx.ellipse(centerX, centerY - height / 3, width / 3, height / 3, 0, 0, Math.PI * 2);
	    this.ctx.fill();

	    // === LIGHTS ===
	    const lightBlinkRate = 30;
	    const lightsOn = Math.floor(this.game.frameCount / lightBlinkRate) % 2 === 0;

	    const lightColor1 = lightsOn ? '#FF5555' : '#880000';
	    const lightColor2 = lightsOn ? '#FFFF55' : '#888800';
	    const lightColor3 = lightsOn ? '#55AAFF' : '#003366';

	    const lights = [
	        { x: x + width * 0.2, y: centerY + height * 0.1, color: lightColor1 },
	        { x: x + width * 0.5, y: centerY + height * 0.15, color: lightColor2 },
	        { x: x + width * 0.8, y: centerY + height * 0.1, color: lightColor3 }
	    ];

	    lights.forEach(light => {
	        this.ctx.fillStyle = light.color;
	        this.ctx.beginPath();
	        this.ctx.arc(light.x, light.y, 3, 0, Math.PI * 2);
	        this.ctx.fill();
	    });

	    this.ctx.restore();
	}
	
    drawBuggy(buggy) {
        const x = buggy.x;
        const y = buggy.y;
        const width = buggy.width;
        const height = buggy.height;
        const baseColor = buggy.isDashing ? '#550000' : '#333333';
        const detailColor = buggy.isDashing ? '#FF2222' : '#666666';
        this.ctx.fillStyle = baseColor;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + height * 0.8);
        this.ctx.lineTo(x + width * 0.2, y);
        this.ctx.lineTo(x + width, y + height * 0.3);
        this.ctx.lineTo(x + width, y + height * 0.8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.strokeStyle = detailColor;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.2, y + 2);
        this.ctx.lineTo(x + width, y + height * 0.3 + 2);
        this.ctx.stroke();
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(x + width * 0.7, y - height * 0.3, width * 0.2, height * 0.4);
        this.ctx.fillStyle = buggy.isDashing ? '#FFFF00' : '#33CCFF';
        this.ctx.beginPath();
        this.ctx.moveTo(x + width * 0.25, y + 5);
        this.ctx.lineTo(x + width * 0.45, y + 5);
        this.ctx.lineTo(x + width * 0.5, y + 15);
        this.ctx.lineTo(x + width * 0.2, y + 15);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.25, y + height, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.75, y + height, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#555555';
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.25, y + height, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(x + width * 0.75, y + height, 3, 0, Math.PI * 2);
        this.ctx.fill();
        if (buggy.isDashing) {
            this.ctx.fillStyle = '#FF5500';
            this.ctx.beginPath();
            this.ctx.moveTo(x - 5, y + height * 0.5 - 5);
            this.ctx.lineTo(x - 15, y + height * 0.5);
            this.ctx.lineTo(x - 5, y + height * 0.5 + 5);
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
            for (let i = 0; i < 3; i++) {
                const size = 4 + Math.random() * 4;
                this.ctx.beginPath();
                this.ctx.arc(
                    x - 15 - Math.random() * 10,
                    y + height * 0.5 + (Math.random() * 10 - 5),
                    size, 0, Math.PI * 2
                );
                this.ctx.fill();
            }
        }
    }
}

console.log("Loading enemies.js");
