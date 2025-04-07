// player-core.js - Core player management
class Player {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        
        // Core properties
        this.x = 200;
        this.y = GAME_HEIGHT - GROUND_HEIGHT - PLAYER_HEIGHT;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        
        // Visual state
        this.flash = false;
        this.deathMessageShown = false;
        
        // Create component managers
        this.movement = new PlayerMovement(this);
        this.weapons = new PlayerWeapons(this);
        this.health = new PlayerHealth(this);
    }
    
    initialize() {
        // Clear death message flag on initialization
        this.deathMessageShown = false;
        
        // Ensure no death message is showing
        const existingMsgs = document.querySelectorAll('.death-message');
        existingMsgs.forEach(msg => msg.remove());
        
        // Initialize components
        this.movement.initialize();
        this.weapons.initialize();
        this.health.initialize();
        
        // Set initial invulnerability to give player a chance to get oriented
        this.health.invulnerable = 2000;
    }
    
    update(deltaTime, keys) {
        // Update components
        this.movement.update(deltaTime, keys);
        this.weapons.update(deltaTime);
        this.health.update(deltaTime);
        
        // Check for craters ahead (auto-jump in God Mode)
        if (this.game.godMode) {
            this.movement.checkForCratersAhead();
        }
    }
    
    // Main draw method
    draw() {
        if (this.health.invulnerable > 0 && this.flash) return; // Skip drawing when flashing
        
        // Draw vehicle body (Cybertruck-inspired angular design)
        this.drawVehicleBody();
        this.drawWheels();
        
        // Draw weapons
        this.weapons.draw();
    }
    
    drawVehicleBody() {
        // Draw vehicle body (Cybertruck-inspired angular design)
        this.ctx.fillStyle = '#C0C0C0'; // Metallic silver
        
        // Main body (trapezoid)
        this.ctx.beginPath();
        this.ctx.moveTo(this.x, this.y + 10);
        this.ctx.lineTo(this.x + this.width - 15, this.y);
        this.ctx.lineTo(this.x + this.width, this.y + 8);
        this.ctx.lineTo(this.x + this.width, this.y + this.height - 8);
        this.ctx.lineTo(this.x, this.y + this.height - 5);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add metallic sheen
        const gradient = this.ctx.createLinearGradient(
            this.x, this.y, 
            this.x + this.width, this.y + this.height
        );
        gradient.addColorStop(0, '#A0A0A0');
        gradient.addColorStop(0.5, '#E0E0E0');
        gradient.addColorStop(1, '#A0A0A0');
        
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(this.x + 5, this.y + 12);
        this.ctx.lineTo(this.x + this.width - 18, this.y + 3);
        this.ctx.lineTo(this.x + this.width - 5, this.y + 10);
        this.ctx.lineTo(this.x + this.width - 5, this.y + this.height - 12);
        this.ctx.lineTo(this.x + 5, this.y + this.height - 8);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Add window
        this.ctx.fillStyle = '#88CCFF';
        this.ctx.beginPath();
        this.ctx.moveTo(this.x + 15, this.y + 13);
        this.ctx.lineTo(this.x + this.width - 25, this.y + 6);
        this.ctx.lineTo(this.x + this.width - 20, this.y + 15);
        this.ctx.lineTo(this.x + 20, this.y + 20);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawWheels() {
        // Calculate wheel wobble based on frame count and movement
        let wheelSpeed = 4; // Default speed
        if (this.game.input && (this.game.input.keys.left || this.game.input.keys.right)) {
            wheelSpeed = 2; // Faster rotation when moving
        }
        
        const wheelOffset1 = Math.sin(this.game.frameCount / wheelSpeed) * 2;
        const wheelOffset2 = Math.sin(this.game.frameCount / wheelSpeed + 1) * 2;
        const wheelOffset3 = Math.sin(this.game.frameCount / wheelSpeed + 2) * 2;
        
        // Draw six wheels with independent wobble
        this.ctx.fillStyle = '#000000'; // Pure black wheels
        
        // Front wheels
        this.ctx.beginPath();
        this.ctx.arc(this.x + 10, this.y + this.height + wheelOffset1, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Middle wheels
        this.ctx.beginPath();
        this.ctx.arc(this.x + this.width/2 - 5, this.y + this.height + wheelOffset2, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Rear wheels
        this.ctx.beginPath();
        this.ctx.arc(this.x + this.width - 15, this.y + this.height + wheelOffset3, 6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Wrapper methods to simplify access from other modules
    jump() {
        this.movement.jump();
    }
    
    hit(type) {
        this.health.hit(type);
    }
    
    shoot() {
        this.weapons.shoot();
    }
    
    shootUp() {
        this.weapons.shootUp();
    }
    
    dropMine() {
        this.weapons.dropMine();
    }
}