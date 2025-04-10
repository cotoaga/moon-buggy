// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const GROUND_HEIGHT = 50;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 30;
const GRAVITY = 0.6;
const JUMP_FORCE = 18; // Increased from 15 for better crater clearing
const PLAYER_SPEED = 5;
let SCROLL_SPEED = 3;
const PARALLAX_NEAR = 0.6;
const PARALLAX_FAR = 0.3;
const GROUND_ROCK_WIDTH = 90;
const GROUND_ROCK_HEIGHT = 80;
const GROUND_ROCK_PROBABILITY = 0.02;
const GROUND_ROCK_PROBABILITY_2 = 0.1;
const MINE_BLAST_RADIUS = 60; // Increased from 40 for better enemy detection

// Obstacle types - removed CRATER type since we're using ground craters only
const OBSTACLE_TYPES = {
    ROCK: 'rock',
    MINE: 'mine'
};

// Enemy types
const ENEMY_TYPES = {
    UFO_HIGH: 'ufo_high',
    UFO_MID: 'ufo_mid',
    UFO_LOW: 'ufo_low',
    BUGGY: 'buggy'
};

// Bullet constants
const BULLET_SPEED = 10;
const BULLET_SIZE = 5;
const SHOOT_COOLDOWN = 20;
const MINE_COOLDOWN = 1000;

// Enemy spawn timing
const BASE_SPAWN_TIME = {
    ufoHigh: 8000,
    ufoMid: 12000,
    ufoLow: 15000,
    buggy: 20000
};

// Store godMode as a global window property to maintain state
// Initialize it if it doesn't exist
window.godMode = window.godMode || false;