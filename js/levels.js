// levels.js - Level configuration and progression
class LevelManager {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.level = 1;
        this.levelConfigs = [
            // Level 1
            {
                scrollSpeed: 3,
                obstacleFrequency: 120,
                enemySpawnRates: {
                    ufoHigh: 0, // Not present
                    ufoMid: 0,  // Not present
                    ufoLow: 0,  // Not present
                    buggy: 0    // Not present
                },
                description: "Beginner level - Avoid craters and rocks."
            },
            
            // Level 2
            {
                scrollSpeed: 3.5,
                obstacleFrequency: 110,
                enemySpawnRates: {
                    ufoHigh: 1.0, // 100% of base spawn rate
                    ufoMid: 0,    // Not present
                    ufoLow: 0,    // Not present
                    buggy: 0      // Not present
                },
                description: "High UFOs appear!"
            },
            
            // Level 3
            {
                scrollSpeed: 4,
                obstacleFrequency: 100,
                enemySpawnRates: {
                    ufoHigh: 1.1, // 110% of base spawn rate
                    ufoMid: 1.0,  // 100% of base spawn rate
                    ufoLow: 0,    // Not present
                    buggy: 0      // Not present
                },
                description: "Mid-level UFOs appear!"
            },
            
            // Level 4
            {
                scrollSpeed: 4.5,
                obstacleFrequency: 90,
                enemySpawnRates: {
                    ufoHigh: 1.2, // 120% of base spawn rate
                    ufoMid: 1.1,  // 110% of base spawn rate
                    ufoLow: 0,    // Not present
                    buggy: 1.0    // 100% of base spawn rate
                },
                description: "Enemy buggies attack from behind!"
            },
            
            // Level 5
            {
                scrollSpeed: 5,
                obstacleFrequency: 80,
                enemySpawnRates: {
                    ufoHigh: 1.3, // 130% of base spawn rate
                    ufoMid: 1.2,  // 120% of base spawn rate
                    ufoLow: 1.0,  // 100% of base spawn rate
                    buggy: 1.1    // 110% of base spawn rate
                },
                description: "Low UFOs with precision bombing!"
            },
            
            // Level 6
            {
                scrollSpeed: 5.5,
                obstacleFrequency: 70,
                enemySpawnRates: {
                    ufoHigh: 1.4, // 140% of base spawn rate
                    ufoMid: 1.3,  // 130% of base spawn rate
                    ufoLow: 1.1,  // 110% of base spawn rate
                    buggy: 1.2    // 120% of base spawn rate
                },
                description: "More land mines!"
            }
        ];
    }
    
    setLevel(level) {
        this.level = Math.min(level, this.levelConfigs.length);
        const config = this.getCurrentLevelConfig();
        
        // Apply level configuration
        SCROLL_SPEED = config.scrollSpeed;
        
        // Return the level config for other modules to use
        return config;
    }
    
    getCurrentLevelConfig() {
        return this.levelConfigs[Math.min(this.level - 1, this.levelConfigs.length - 1)];
    }
    
    getLevelEnemySpawnRate(enemyType) {
        const config = this.getCurrentLevelConfig();
        return config.enemySpawnRates[enemyType] || 0;
    }
    
    getObstacleFrequency() {
        return this.getCurrentLevelConfig().obstacleFrequency;
    }
    
    getLevelDescription() {
        return this.getCurrentLevelConfig().description;
    }
}