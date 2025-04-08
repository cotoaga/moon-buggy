class TerrainGenerator {
    constructor(terrainManager) {
        this.terrain = terrainManager;
        this.game = terrainManager.game;
        this.ctx = terrainManager.ctx;

        this.groundSegments = [];
        this.rockWidth = 90;
        this.rockHeight = 80;
        this.rockProbability = 0.02;
    }

    generateInitialGround() {
        this.groundSegments = [];
        const segmentWidth = 150;
        const segmentCount = Math.ceil((this.terrain.sectionWidth * this.terrain.levelLength) / segmentWidth);
        const safeZone = GAME_WIDTH * 2;

        for (let i = 0; i < segmentCount; i++) {
            let segmentType = 'flat';
            let segmentHeight = 0;
            const sectionIndex = Math.floor((i * segmentWidth) / this.terrain.sectionWidth);
            const segmentX = i * segmentWidth;

            // Force crater at Section B (index 1)
            if (sectionIndex === 1 && i === 0) {
                segmentType = 'crater';
                segmentHeight = -55;
            } else if (segmentX < safeZone) {
                segmentType = 'flat';
                segmentHeight = 0;
            } else {
                const obstacleChance = 0.03 + (sectionIndex * 0.005);
                if (Math.random() < obstacleChance) {
                    segmentType = 'crater';
                    segmentHeight = -55;
                }
            }

            this.groundSegments.push({
                x: segmentX,
                height: segmentHeight,
                type: segmentType,
                width: segmentWidth,
                section: String.fromCharCode(65 + sectionIndex % this.terrain.levelLength)
            });

            if (segmentType === 'flat' && Math.random() < this.rockProbability && segmentX > safeZone) {
                this.terrain.obstacleManager.addObstacle({
                    x: segmentX + segmentWidth / 2,
                    y: GAME_HEIGHT - GROUND_HEIGHT - this.rockHeight,
                    width: this.rockWidth,
                    height: this.rockHeight,
                    type: OBSTACLE_TYPES.ROCK,
                    destroyed: false
                });
            }
        }
    }

    generateSection(sectionIndex) {
        const segmentWidth = 150;
        const segmentsPerSection = Math.ceil(this.terrain.sectionWidth / segmentWidth);
        const startX = this.groundSegments.length > 0
            ? this.groundSegments[this.groundSegments.length - 1].x + segmentWidth
            : 0;

        const safeZone = GAME_WIDTH * 2;

        for (let i = 0; i < segmentsPerSection; i++) {
            let segmentType = 'flat';
            let segmentHeight = 0;

            const segmentX = startX + i * segmentWidth;
            const obstacleChance = 0.03 + (sectionIndex * 0.005);
            const rand = Math.random();

            if (segmentX < safeZone) {
                segmentType = 'flat';
                segmentHeight = 0;
            } else if (rand < obstacleChance) {
                segmentType = 'crater';
                segmentHeight = -55;
            } else {
                segmentType = 'flat';
                segmentHeight = 0;
            }

            this.groundSegments.push({
                x: segmentX,
                height: segmentHeight,
                type: segmentType,
                width: segmentWidth,
                section: String.fromCharCode(65 + sectionIndex % this.terrain.levelLength)
            });

            if (segmentType === 'flat' &&
                Math.random() < (this.rockProbability * (1 + sectionIndex * 0.2)) &&
                segmentX > safeZone) {
                this.terrain.obstacleManager.addObstacle({
                    x: segmentX + segmentWidth / 2,
                    y: GAME_HEIGHT - GROUND_HEIGHT - this.rockHeight,
                    width: this.rockWidth,
                    height: this.rockHeight,
                    type: OBSTACLE_TYPES.ROCK,
                    destroyed: false
                });
            }
        }
    }

    drawGroundFeatures(scrollOffset) {
        for (let i = 0; i < this.groundSegments.length; i++) {
            const segment = this.groundSegments[i];
            const adjustedX = segment.x - scrollOffset;

            if (adjustedX + segment.width < 0 || adjustedX > GAME_WIDTH) continue;

            if (segment.type === 'crater') {
                this.drawCrater(adjustedX, segment);
            }
        }

        const lastSegment = this.groundSegments[this.groundSegments.length - 1];
        const lastSegmentScreenPos = lastSegment.x - scrollOffset;

        if (lastSegmentScreenPos < GAME_WIDTH * 2) {
            const nextSectionIndex = Math.floor(lastSegment.x / this.terrain.sectionWidth) + 1;
            this.generateSection(nextSectionIndex);
        }

        while (this.groundSegments.length > 0 &&
              (this.groundSegments[0].x - scrollOffset) < -GAME_WIDTH) {
            this.groundSegments.shift();
        }
    }

	drawCrater(x, segment) {
	    const ctx = this.ctx;
	    const craterX = x + segment.width / 2;
	    const craterY = GAME_HEIGHT - GROUND_HEIGHT;
	    const outerRadius = segment.width / 2;
	    const innerRadius = segment.width / 3;

	    ctx.save();

	    // === Crater depression (shadow gradient) ===
	    const gradient = ctx.createRadialGradient(craterX, craterY, innerRadius * 0.5, craterX, craterY, outerRadius);
	    gradient.addColorStop(0, '#444444'); // center
	    gradient.addColorStop(1, '#1A1A1A'); // edge
	    ctx.fillStyle = gradient;

	    ctx.beginPath();
	    ctx.arc(craterX, craterY, outerRadius, 0, Math.PI);
	    ctx.fill();

	    // === Inner core highlight (subtle) ===
	    ctx.fillStyle = '#2A2A2A';
	    ctx.beginPath();
	    ctx.arc(craterX, craterY, innerRadius, 0, Math.PI);
	    ctx.fill();

	    // === Rugged edge (simulate debris with jagged strokes) ===
	    ctx.strokeStyle = '#333333';
	    ctx.lineWidth = 1.5;
	    for (let i = 0; i < 12; i++) {
	        const angle = (Math.PI / 16) + i * (Math.PI / 12);
	        const length = outerRadius * (0.2 + Math.random() * 0.2);
	        ctx.beginPath();
	        ctx.moveTo(craterX, craterY);
	        ctx.lineTo(
	            craterX + Math.cos(angle) * length,
	            craterY + Math.sin(angle) * length
	        );
	        ctx.stroke();
	    }

	    // === Crater ridge (thin outer rim) ===
	    ctx.strokeStyle = '#555555';
	    ctx.lineWidth = 0.8;
	    ctx.beginPath();
	    ctx.arc(craterX, craterY, outerRadius, 0, Math.PI);
	    ctx.stroke();

	    ctx.restore();
	}
}