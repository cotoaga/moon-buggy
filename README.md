# Moon Buggy 2025 - Modular Implementation

A modern, browser-based homage to the classic Moon Patrol arcade game, built with HTML5 Canvas and JavaScript. This version features a fully modular architecture for easier maintenance and feature additions.

## New Modular Structure

The game has been restructured into a modular architecture with cleaner separation of concerns:

```
moon-buggy-2025/
├── index.html 
├── styles.css
├── js/
    ├── constants.js          // Game constants and configuration
    ├── engine.js             // Core game loop and initialization
    │
    ├── player-core.js        // Main player class and rendering
    ├── player-movement.js    // Player movement and jumping
    ├── player-weapons.js     // Player weapons and bullets
    ├── player-health.js      // Player health, shields, energy
    │
    ├── terrain-core.js       // Main terrain management
    ├── terrain-generator.js  // Terrain feature generation
    ├── obstacles.js          // Obstacle management
    ├── mines.js              // Player-placed mine management
    │
    ├── input.js              // Input handling (keyboard/touch)
    ├── effects.js            // Visual effects (explosions)
    ├── enemies.js            // UFO and enemy management
    ├── collision.js          // Collision detection and response
    ├── parallax.js           // Background and parallax effects
    ├── ui.js                 // HUD and user interface
    └── levels.js             // Level configuration and progression
```

## Implementation Details

### Dependencies and Module Loading

- Modules must be loaded in the correct order (see index.html)
- Each module establishes its dependencies through the constructor
- Cross-module communication happens through the central Game instance

### Key Components

#### Player System
- **player-core.js**: Main player class that composes other player components
- **player-movement.js**: Handles player movement, jumping, and lunar physics
- **player-weapons.js**: Manages shooting (forward/up) and mine placement
- **player-health.js**: Manages lives, shield, energy, and damage handling

#### Terrain System
- **terrain-core.js**: Main terrain manager that composes other terrain components
- **terrain-generator.js**: Handles ground generation and features like craters
- **obstacles.js**: Manages rocks, small craters, and enemy projectiles
- **mines.js**: Manages player-placed mines

#### Support Systems
- **collision.js**: Central collision detection between all game objects
- **effects.js**: Visual effects like explosions and shield flashes
- **enemies.js**: Enemy spawning, behavior, and rendering
- **parallax.js**: Manages background elements with parallax scrolling

## Recent Fixes

- Fixed the death message dialog click handler issue by adding a small timeout and proper event binding
- Consolidated rock sizes to only have the larger rocks for better visibility
- Enhanced collision detection with proper null checks for safer component communication
- Added auto-jumping for craters in God Mode with a cooldown to prevent rapid jumping

## Development Guidelines

### Adding New Features

1. **Identify the appropriate module**: Determine which module should own the new feature
2. **Make incremental changes**: Update one module at a time and test
3. **Follow the established patterns**: Use the same class structures and communication patterns

### Module Communication

- Modules should never directly access other modules' internal properties
- Use the main Game instance as a communication hub
- Add accessor methods at the appropriate level for cross-module access

### Error Handling

- Add null checks before accessing properties that might not be initialized
- Use defensive programming techniques for safer execution
- All error messages should be displayed through the game.showErrorMessage() method

## Known Issues

- The death message dialog occasionally needs improvements in positioning and styling
- Multiple sizes of rocks still appear in some places
- God Mode jumping behavior needs further tuning

## Future Improvements

- Add sound effects and background music
- Implement additional enemy types with unique behaviors
- Create a proper menu system with pause functionality
- Add local high score persistence
- Optimize mobile touch controls for better responsiveness

## Running the Game

Simply open index.html in a web browser, or use a local server:

```
python -m http.server
```

Then navigate to http://localhost:8000 in your browser.