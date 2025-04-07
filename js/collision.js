// collision.js - Collision detection and response
class CollisionManager {
    constructor(game) {
        this.game = game;
    }
    
    // Check for collision between two rectangles
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
        // Skip if player is invulnerable or necessary components aren't initialized
        if (!this.game.player || !this.game.terrain || !this.game.terrain.obstacleManager) return;
        if (this.game.player.health.invulnerable > 0) return;
    
        // Check collision with each obstacle
        const obstacles = this.game.terrain.obstacleManager.obstacles;
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            
            // Skip destroyed obstacles
            if (obstacle.destroyed) continue;
            
            // Check collision
            if (this.isColliding(this.game.player, obstacle)) {
                // In god mode, auto-destroy obstacles without taking damage, except for craters
                if (this.game.godMode && obstacle.type !== OBSTACLE_TYPES.CRATER) {
                    // Create explosion effect
                    this.game.addExplosion(
                        obstacle.x + obstacle.width/2, 
                        obstacle.y + obstacle.height/2, 
                        30,
                        obstacle.type === OBSTACLE_TYPES.ROCK ? 'ground' : 'standard'
                    );
                    
                    // Mark obstacle as destroyed
                    obstacle.destroyed = true;
                } else {
                    // Normal collision handling for non-god mode
                    
                    // Create explosion for mines or bullets
                    if (obstacle.type === OBSTACLE_TYPES.MINE || obstacle.type === 'bullet') {
                        this.game.addExplosion(
                            obstacle.x + obstacle.width/2, 
                            obstacle.y + obstacle.height/2, 
                            40,
                            'standard'
                        );
                        
                        // Mark obstacle as destroyed
                        obstacle.destroyed = true;
                    }
                    
                    // Trigger player hit with the type of obstacle
                    this.game.player.hit(obstacle.type);
                }
                
                // Only hit once per frame
                break;
            }
        }
    }
    
    checkPlayerEnemyCollisions() {
        // Skip if player is invulnerable or necessary components aren't initialized
        if (!this.game.player || !this.game.enemies) return;
        if (this.game.player.health.invulnerable > 0) return;
        
        // Check collision with each enemy
        const enemies = this.game.enemies.enemies;
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            
            // Check collision
            if (this.isColliding(this.game.player, enemy)) {
                // Create explosion
                this.game.addExplosion(
                    enemy.x + enemy.width/2, 
                    enemy.y + enemy.height/2, 
                    30,
                    enemy.type.includes('ufo') ? 'sky' : 'buggy'
                );
                
                // Destroy enemy
                enemies.splice(i, 1);
                
                // In god mode, don't take damage
                if (!this.game.godMode) {
                    // Trigger player hit
                    this.game.player.hit();
                }
                
                // Only hit once per frame
                break;
            }
        }
    }
    
    checkPlayerBulletCollisions() {
        // Skip if player is invulnerable or necessary components aren't initialized
        if (!this.game.player || !this.game.terrain || !this.game.terrain.obstacleManager) return;
        if (this.game.player.health.invulnerable > 0) return;
        
        // Check collision with each enemy bullet
        const obstacles = this.game.terrain.obstacleManager.obstacles;
        for (let i = 0; i < obstacles.length; i++) {
            const obstacle = obstacles[i];
            
            // Only check bullet type obstacles
            if (obstacle.type === 'bullet' && !obstacle.destroyed) {
                if (this.isColliding(this.game.player, obstacle)) {
                    // Create explosion
                    this.game.addExplosion(
                        obstacle.x + obstacle.width/2, 
                        obstacle.y + obstacle.height/2, 
                        20,
                        'standard'
                    );
                    
                    // Mark bullet as destroyed
                    obstacle.destroyed = true;
                    
                    // Don't take damage in god mode
                    if (!this.game.godMode) {
                        // Trigger player hit
                        this.game.player.hit();
                    }
                    
                    // Only hit once per frame
                    break;
                }
            }
        }
    }
    
    checkBulletObstacleCollisions() {
        // Skip if necessary components aren't initialized
        if (!this.game.player || !this.game.player.weapons || !this.game.terrain || !this.game.terrain.obstacleManager) return;
        
        // Check each bullet
        const bullets = this.game.player.weapons.bullets;
        const obstacles = this.game.terrain.obstacleManager.obstacles;
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            // Check collision with each obstacle
            for (let j = 0; j < obstacles.length; j++) {
                const obstacle = obstacles[j];
                
                // Only rocks can be destroyed by bullets
                if (obstacle.type === OBSTACLE_TYPES.ROCK && !obstacle.destroyed) {
                    if (this.isColliding(bullet, obstacle)) {
                        // Mark obstacle as destroyed
                        obstacle.destroyed = true;
                        
                        // Create explosion
                        this.game.addExplosion(
                            obstacle.x + obstacle.width/2, 
                            obstacle.y + obstacle.height/2, 
                            30,
                            'ground'
                        );
                        
                        // Remove bullet
                        bullets.splice(i, 1);
                        
                        // Add score
                        this.game.addScore(20);
                        
                        // Break to next bullet
                        break;
                    }
                }
            }
        }
    }
    
    checkBulletEnemyCollisions() {
        // Skip if necessary components aren't initialized
        if (!this.game.player || !this.game.player.weapons || !this.game.enemies) return;
        
        // Check each bullet
        const bullets = this.game.player.weapons.bullets;
        const enemies = this.game.enemies.enemies;
        
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            // Skip if bullet already removed
            if (!bullet) continue;
            
            // Check collision with each enemy
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                
                if (this.isColliding(bullet, enemy)) {
                    // Reduce enemy health
                    enemy.health--;
                    
                    // Create small explosion for hit
                    this.game.addExplosion(
                        bullet.x + bullet.width/2, 
                        bullet.y + bullet.height/2, 
                        15,
                        enemy.type.includes('ufo') ? 'sky' : 'buggy'
                    );
                    
                    // Remove bullet
                    bullets.splice(i, 1);
                    
                    // Add score based on enemy type
                    if (enemy.type === 'ufo_high') {
                        this.game.addScore(50);
                    } else if (enemy.type === 'ufo_mid') {
                        this.game.addScore(75);
                    } else if (enemy.type === 'ufo_low') {
                        this.game.addScore(100);
                    } else if (enemy.type === 'buggy') {
                        this.game.addScore(150);
                    }
                    
                    // Check if enemy is destroyed
                    if (enemy.health <= 0) {
                        // Create large explosion
                        this.game.addExplosion(
                            enemy.x + enemy.width/2, 
                            enemy.y + enemy.height/2, 
                            60,
                            enemy.type.includes('ufo') ? 'sky' : 'buggy'
                        );
                        
                        // Add bonus score for destroying enemy
                        this.game.addScore(100);
                        
                        // For buggies, drop a mine when destroyed
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
                        
                        // Remove enemy
                        enemies.splice(j, 1);
                    }
                    
                    // Break to next bullet
                    break;
                }
            }
        }
    }
    
    checkMineEnemyCollisions() {
        // Skip if necessary components aren't initialized
        if (!this.game.terrain || !this.game.terrain.mineManager || !this.game.enemies) return;
        
        // Only check active mines
        const mines = this.game.terrain.mineManager.mines;
        const enemies = this.game.enemies.enemies;
        
        for (let i = mines.length - 1; i >= 0; i--) {
            const mine = mines[i];
            
            // Skip inactive mines
            if (!mine.active) continue;
            
            // Check collision with enemy buggies
            for (let j = enemies.length - 1; j >= 0; j--) {
                const enemy = enemies[j];
                
                // Only consider buggies since they're ground-based
                if (enemy.type !== 'buggy') continue;
                
                if (this.isColliding(mine, enemy)) {
                    // Create large explosion
                    this.game.addExplosion(
                        enemy.x + enemy.width/2, 
                        enemy.y + enemy.height/2, 
                        60,
                        'buggy'
                    );
                    
                    // Remove enemy
                    enemies.splice(j, 1);
                    
                    // Remove mine
                    mines.splice(i, 1);
                    
                    // Add score
                    this.game.addScore(300);
                    
                    // Break to next mine
                    break;
                }
            }
        }
    }
}