# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment
- Run game: Open index.html in a browser or use a local server (e.g., `python -m http.server`)
- No build system or package manager required
- Debug Mode: Press Ctrl+D to toggle debug panel
- Testing: Use god mode (G key) and debug panel for manual testing

## Code Organization
- ES6 class-based architecture with separate modules for each game system
- Entry point: engine.js initializes game and manages game loop
- Constants in constants.js
- Module dependencies managed via script order in index.html
- Component-based player and terrain structure

## Code Style Guidelines
- Classes: PascalCase (TerrainManager, ParallaxManager)
- Methods/variables: camelCase (updateObstacles, playerSpeed)
- Constants: UPPER_SNAKE_CASE (GAME_WIDTH, PLAYER_SPEED)
- Files: kebab-case (player-core.js, terrain-generator.js)
- Indentation: 4 spaces
- Class pattern: constructor → initialize → update/draw methods
- Error handling: Try/catch blocks with fallbacks, null checks before property access
- Comments: Each file starts with description, add comments for complex logic

## Game Programming Patterns
- Use delta time for frame-rate independent movement
- Separate update logic from rendering (double buffering pattern)
- Manage game state through the central Game instance
- Object pooling for frequently created/destroyed objects
- Collision detection with hitbox-based approach

## Adding Features
- New game elements should follow existing patterns
- New constants should be added to constants.js
- Test thoroughly using debug panel functionality
- Maintain vanilla JS approach (no external libraries)