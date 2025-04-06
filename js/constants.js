// Game constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 500;
const GROUND_HEIGHT = 50;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 30;
const GRAVITY = 0.6;
const JUMP_FORCE = 15;
const PLAYER_SPEED = 5;
let SCROLL_SPEED = 3;
const PARALLAX_NEAR = 0.6;
const PARALLAX_FAR = 0.3;
const GOD_MODE = false;

// Obstacle types
const OBSTACLE_TYPES = {
    CRATER: 'crater',
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

// God-Mode-Switch
let godMode = false; // Now a variable that can be toggled