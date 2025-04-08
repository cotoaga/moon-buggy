// collision.js - Collision detection and response
class CollisionManager {
    constructor(game) {
        this.game = game;
        this.debug = false; // Enable for debugging collision issues
    }

    checkMineProximity(mine, enemy) {
        // Calculate center points for both objects
        const mineX = mine.x + mine.width / 2;
        const mineY = mine.y + mine.height / 2;
        const enemyX = enemy.x + enemy.width / 2;
        const enemyY = enemy.y + enemy.height / 2;
        
        // Calculate distance between centers
        const dx = mineX - enemyX;
        const dy = mineY - enemyY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if within blast radius
        const inBlastRadius = distance < MINE_BLAST_RADIUS;
        
        if (this.debug && inBlastRadius) {
            console.log(`Mine at (${mineX}, ${mineY}) detected enemy at (${enemyX}, ${enemyY}), distance: ${distance}`);
        }
        
        return inBlastRadius;
    }

    checkMineEnemyCollisions() {
        const mines = this.game.terrain?.mineManager?.mines;
        const enemies = this.game.enemies?.enemies;
        
        if (!mines || !enemies || !Array.isArray(mines) || !Array.isArray(enemies)) {
            return;
        }
        
        // Only active mines can explode
        const activeMines = mines.filter(mine => mine.active);
        
        for (const mine of activeMines) {
            for (let i = enemies.length - 1; i >= 0; i--) {
                const enemy = enemies[i];
                
                if (enemy.destroyed) continue;
                
                if (this.checkMineProximity(mine, enemy)) {
                    // Trigger explosion and destroy enemy
                    mine.explode = true;
                    enemy.destroyed = true;
                    
                    // Add score
                    if (enemy.type === 'ufo_high') {
                        this.game.addScore(75);
                    } else if (enemy.type === 'ufo_mid') {
                        this.game.addScore(100);
                    } else if (enemy.type === 'ufo_low') {
                        this.game.addScore(150);
                    } else if (enemy.type === 'buggy') {
                        this.game.addScore(200);
                    }
                    
                    // Create explosion effect
                    if (this.game.effects) {
                        this.game.effects.createExplosion(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            80,
                            enemy.type.includes('ufo') ? 'sky' : 'buggy'
                        );
                    }
                    
                    // Remove the enemy
                    enemies.splice(i, 1);
                    
                    if (this.debug) {
                        console.log(`💥 Mine exploded enemy of type ${enemy.type}`);
                    }
                }
            }
        }
    }

    isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    checkCollisions() {
        this.checkPlayerObstacleCollisions();
        this.checkPlayerEnemyCollisions();
        this.checkPlayerBulletCollisions();
        this.checkBulletObstacleCollisions();
        this.checkBulletEnemyCollisions();
        this.checkMineEnemyCollisions();
    }

    checkPlayerObstacleCollisions() {
        if (!this.game.player || !this.game.terrain || !this.game.terrain.obstacleManager) return;
        if (this.game.player.health.invulnerable > 0) return;

        const obstacles = this.game.terrain.obstacleManager.obstacles;
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            if (obstacle.destroyed) continue;

            if (this.isColliding(this.game.player, obstacle)) {
                if (this.game.godMode && obstacle.type !== OBSTACLE_TYPES.CRATER) {
                    this.game.addExplosion(
                        obstacle.x + obstacle.width / 2,
                        obstacle.y + obstacle.height / 2,
                        30,
                        obstacle.type === OBSTACLE_TYPES.ROCK ? 'ground' : 'standard'
                    );
                    obstacle.destroyed = true;
                } else {
                    if (obstacle.type === OBSTACLE_TYPES.MINE || obstacle.type === 'bullet') {
                        this.game.addExplosion(
                            obstacle.x + obstacle.width / 2,
                            obstacle.y + obstacle.height / 2,
                            40,
                            'standard'
                        );
                        obstacle.destroyed = true;
                    }
                    this.game.player.hit(obstacle.type);
                }
                break;
            }
        }
    }

    checkPlayerEnemyCollisions() {
        if (!this.game.player || !this.game.enemies) return;
        if (this.game.player.health.invulnerable > 0) return;

        const enemies = this.game.enemies.enemies;
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (enemy.destroyed) continue;
            
            if (this.isColliding(this.game.player, enemy)) {
                this.game.addExplosion(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2,
                    30,
                    enemy.type.includes('ufo') ? 'sky' : 'buggy'
                );
                enemies.splice(i, 1);
                if (!this.game.godMode) {
                    this.game.player.hit();
                }
                break;
            }
        }
    }

    checkPlayerBulletCollisions() {
        if (!this.game.player || !this.game.terrain || !this.game.terrain.obstacleManager) return;
        if (this.game.player.health.invulnerable > 0) return;

        const obstacles = this.game.terrain.obstacleManager.obstacles;
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            if (obstacle.type === 'bullet' && !obstacle.destroyed) {
                if (this.isColliding(this.game.player, obstacle)) {
                    this.game.addExplosion(
                        obstacle.x + obstacle.width / 2,
                        obstacle.y + obstacle.height / 2,
                        20,
                        'standard'
                    );
                    obstacle.destroyed = true;
                    if (!this.game.godMode) {
                        this.game.player.hit();
                    }
                    break;
                }
            }
        }
    }

    checkBulletObstacleCollisions() {
        if (!this.game.player || !this.game.player.weapons || !this.game.terrain || !this.game.terrain.obstacleManager) return;

        const bullets = this.game.player.weapons.bullets;
        const obstacles = this.game.terrain.obstacleManager.obstacles;

        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            for (let j = 0; j < obstacles.length; j++) {
                const obstacle = obstacles[j];
                if (obstacle.type === OBSTACLE_TYPES.ROCK && !obstacle.destroyed) {
                    if (this.isColliding(bullet, obstacle)) {
                        obstacle.destroyed = true;
                        this.game.addExplosion(
                            obstacle.x + obstacle.width / 2,
                            obstacle.y + obstacle.height / 2,
                            30,
                            'ground'
                        );
                        bullets.splice(i, 1);
                        this.game.addScore(20);
                        break;
                    }
                }
            }
        }
    }

    checkBulletEnemyCollisions() {
        if (!this.game.player || !this.game.player.weapons || !this.game.enemies) return;

        const bullets = this.game.player.weapons.bullets;
        const enemies = this.game.enemies.enemies;

        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            if (!bullet) continue;

            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                if (enemy.destroyed) continue;
                
                if (this.isColliding(bullet, enemy)) {
                    enemy.health--;
                    this.game.addExplosion(
                        bullet.x + bullet.width / 2,
                        bullet.y + bullet.height / 2,
                        15,
                        enemy.type.includes('ufo') ? 'sky' : 'buggy'
                    );
                    bullets.splice(i, 1);

                    if (enemy.type === 'ufo_high') {
                        this.game.addScore(50);
                    } else if (enemy.type === 'ufo_mid') {
                        this.game.addScore(75);
                    } else if (enemy.type === 'ufo_low') {
                        this.game.addScore(100);
                    } else if (enemy.type === 'buggy') {
                        this.game.addScore(150);
                    }

                    if (enemy.health <= 0) {
                        this.game.addExplosion(
                            enemy.x + enemy.width / 2,
                            enemy.y + enemy.height / 2,
                            60,
                            enemy.type.includes('ufo') ? 'sky' : 'buggy'
                        );
                        this.game.addScore(100);

                        if (enemy.type === 'buggy' && this.game.terrain) {
                            this.game.terrain.addObstacle({
                                x: enemy.x + 20,
                                y: GAME_HEIGHT - GROUND_HEIGHT - 25,
                                width: 25,
                                height: 25,
                                type: OBSTACLE_TYPES.MINE,
                                destroyed: false
                            });
                        }

                        enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }
    }
}