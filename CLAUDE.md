# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Environment
- Run game: Open index.html in a browser or use a local server (e.g., `python -m http.server`)
- No build system or package manager required
- No formal lint/test commands - maintain consistent style with existing code

## Code Organization
- ES6 class-based architecture with separate modules for each game system
- Entry point: engine.js initializes game and manages game loop
- Constants in constants.js
- Module dependencies managed via script order in index.html

## Code Style Guidelines
- Classes: PascalCase (TerrainManager, ParallaxManager)
- Methods/variables: camelCase (updateObstacles, playerSpeed)
- Constants: UPPER_SNAKE_CASE (GAME_WIDTH, PLAYER_SPEED)
- Class pattern: constructor → initialize → update/draw methods
- Use ES6 classes, not function prototypes
- Add descriptive comments for complex logic
- Each file starts with a brief description comment

## Game Programming Patterns
- Use delta time for frame-rate independent movement
- Separate update logic from rendering
- Manage game state through the central Game instance
- Handle errors with try/catch and fallback to defaults
- Follow existing collision detection and object pooling patterns

## Adding Features
- New game elements should follow existing patterns
- New constants should be added to constants.js
- Test thoroughly across different browsers
- Maintain vanilla JS approach (no external libraries)