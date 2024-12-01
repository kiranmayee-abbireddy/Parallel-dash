class Character {
    constructor(side, startX, startY) {
        this.side = side;
        this.x = startX;
        this.y = startY;
        this.element = null;
        this.speed = 5;
        this.jumpForce = 12;
        this.gravity = 0.5;
        this.velocityY = 0;
        this.isJumping = false;
        this.isClimbing = false;
        this.climbSpeed = 4;
        this.createCharacter();
        this.doubleJumpAvailable = true;
        this.lastJumpTime = 0;
        this.jumpCount = 0;
        this.momentum = 0;
        this.maxMomentum = 8;
        this.currentPlatform = null;
        this.isFlying = false;
        this.flyForce = 8;
        this.maxFlyHeight = 300;
        this.doubleJumpForce = this.jumpForce * 1.5;
    }

    createCharacter() {
        this.element = document.createElement('div');
        this.element.className = `character ${this.side}`;
        this.element.id = `${this.side}Character`;
        this.updatePosition();
        
        const section = document.getElementById(`${this.side}Section`);
        section.appendChild(this.element);
    }

    updatePosition() {
        if (this.element) {
            if (this.side === 'left') {
                this.element.style.left = `${this.x}px`;
            } else {
                // For right character, position from right edge
                const section = document.getElementById('rightSection');
                const rightPosition = section.offsetWidth - this.x - this.element.offsetWidth;
                this.element.style.left = `${rightPosition}px`;
            }
            this.element.style.bottom = `${this.y}px`;
        }
    }

    jump() {
        this.isJumping = true;
        this.velocityY = this.jumpForce;
    }

    update() {
        this.velocityY -= this.gravity;
        this.y += this.velocityY;

        if (this.y <= 20) {
            this.y = 20;
            this.velocityY = 0;
            this.isJumping = false;
        }

        this.updatePosition();
    }

    climb(direction) {
        if (this.isClimbing) {
            this.y += direction * this.climbSpeed;
            this.velocityY = 0; // Reset vertical velocity while climbing
            this.updatePosition();
        }
    }

    moveLeft() {
        const newX = Math.max(0, this.x - this.speed);
        // Check if movement would cross section boundary
        if (this.isWithinSection(newX)) {
            this.x = newX;
            this.updatePosition();
        }
    }

    moveRight() {
        const section = document.getElementById(`${this.side}Section`);
        const maxX = section.offsetWidth - this.element.offsetWidth;
        const newX = Math.min(maxX, this.x + this.speed);
        // Check if movement would cross section boundary
        if (this.isWithinSection(newX)) {
            this.x = newX;
            this.updatePosition();
        }
    }

    isWithinSection(newX) {
        const section = document.getElementById(`${this.side}Section`);
        return newX >= 0 && newX <= (section.offsetWidth - this.element.offsetWidth);
    }

    getBoundingBox() {
        const rect = this.element.getBoundingClientRect();
        const section = document.getElementById(`${this.side}Section`).getBoundingClientRect();
        return {
            left: this.x,
            right: this.x + rect.width,
            top: this.y + rect.height,
            bottom: this.y,
            element: this.element
        };
    }

    checkCollision(element) {
        if (!element || !this.element) return false;

        const charRect = this.element.getBoundingClientRect();
        const elemRect = element.getBoundingClientRect();
        const section = element.parentElement.getBoundingClientRect();

        // Convert coordinates to be relative to section
        const charBox = {
            left: charRect.left - section.left,
            right: charRect.right - section.left,
            top: charRect.top - section.top,
            bottom: charRect.bottom - section.top
        };

        const elemBox = {
            left: elemRect.left - section.left,
            right: elemRect.right - section.left,
            top: elemRect.top - section.top,
            bottom: elemRect.bottom - section.top
        };

        // Check for actual overlap
        return !(charBox.left > elemBox.right - 5 || 
                charBox.right < elemBox.left + 5 || 
                charBox.top > elemBox.bottom - 5 || 
                charBox.bottom < elemBox.top + 5);
    }

    die() {
        this.element.style.opacity = '0.5';
        this.isDead = true;
    }

    getMaxX() {
        const section = document.getElementById(`${this.side}Section`);
        return section.offsetWidth - this.element.offsetWidth;
    }

    checkMonsterCollision(monster) {
        if (!monster || !this.element) return false;

        const charRect = this.element.getBoundingClientRect();
        const monsterRect = monster.getBoundingClientRect();
        const section = monster.parentElement.getBoundingClientRect();

        // Convert coordinates to be relative to section
        const charCenter = {
            x: charRect.left - section.left + charRect.width / 2,
            y: charRect.top - section.top + charRect.height / 2
        };

        const monsterCenter = {
            x: monsterRect.left - section.left + monsterRect.width / 2,
            y: monsterRect.top - section.top + monsterRect.height / 2
        };

        // Calculate distance between centers
        const distance = Math.sqrt(
            Math.pow(charCenter.x - monsterCenter.x, 2) +
            Math.pow(charCenter.y - monsterCenter.y, 2)
        );

        // Use smaller collision radius for more precise detection
        const collisionRadius = Math.min(charRect.width, charRect.height, 
                                       monsterRect.width, monsterRect.height) / 2.5;

        return distance < collisionRadius;
    }

    startClimbing() {
        this.isClimbing = true;
        this.velocityY = 0;
    }

    stopClimbing() {
        this.isClimbing = false;
    }

    startFlying() {
        if (this.y < this.maxFlyHeight) {
            this.isFlying = true;
            this.isJumping = false;
        }
    }

    stopFlying() {
        this.isFlying = false;
        this.isJumping = true;
        this.velocityY = 0;
    }
}

class LevelGenerator {
    constructor() {
        this.baseConfig = {
            monsterCount: 3,
            coinCount: 5,
            monsterSpeed: 2,
            monsterRange: 100,
            sectionWidth: 600,
            minPortalDistance: 400 // Minimum distance from start
        };
    }

    generateLevel(levelNumber) {
        const difficulty = Math.min(levelNumber * 0.5, 5);
        
        // Generate separate layouts for each section
        const leftLayout = {
            monsters: this.generateMonsters(levelNumber, difficulty),
            coins: this.generateCoins(levelNumber),
            portal: this.generatePortalPosition('left')
        };

        const rightLayout = {
            monsters: this.generateMonsters(levelNumber, difficulty),
            coins: this.generateCoins(levelNumber),
            portal: this.generatePortalPosition('right')
        };

        return {
            name: `Level ${levelNumber}`,
            leftSection: leftLayout,
            rightSection: rightLayout,
            requiredCoins: Math.min(levelNumber + 2, leftLayout.coins.length + rightLayout.coins.length)
        };
    }

    generateMonsters(level, difficulty) {
        const monsters = [];
        const count = Math.floor(this.baseConfig.monsterCount + level/2);
        
        for (let i = 0; i < count; i++) {
            monsters.push({
                type: 'monster',
                x: 100 + Math.random() * (this.baseConfig.sectionWidth - 200),
                y: 50 + Math.random() * 200,
                width: 40,
                height: 40,
                moveRange: this.baseConfig.monsterRange * (1 + difficulty * 0.2),
                speed: this.baseConfig.monsterSpeed * (1 + difficulty * 0.1)
            });
        }
        return monsters;
    }

    generateCoins(level) {
        const coins = [];
        const count = this.baseConfig.coinCount + Math.floor(level/2);
        
        for (let i = 0; i < count; i++) {
            coins.push({
                x: 100 + Math.random() * (this.baseConfig.sectionWidth - 200),
                y: 50 + Math.random() * 200
            });
        }
        return coins;
    }

    generatePortalPosition(side) {
        if (side === 'left') {
            // For left section, portal should be far right
            const minX = this.baseConfig.minPortalDistance;
            const maxX = this.baseConfig.sectionWidth - 60;
            return {
                x: minX + Math.random() * (maxX - minX),
                y: 50 + Math.random() * 200 // Random height between 50 and 250
            };
        } else {
            // For right section, portal should be far left
            const maxX = this.baseConfig.sectionWidth - this.baseConfig.minPortalDistance;
            return {
                x: Math.random() * maxX,
                y: 50 + Math.random() * 200 // Different random height
            };
        }
    }

    loadLevel(levelNum) {
        const level = this.levels[levelNum - 1];
        this.clearLevel();
        
        // Load left section
        level.leftSection.monsters.forEach(config => {
            const obstacle = new Obstacle(config.type, config.x, config.y, config.width, config.height);
            document.getElementById('leftSection').appendChild(obstacle.element);
        });
        level.leftSection.coins.forEach(config => {
            const coin = new Coin(config.x, config.y);
            document.getElementById('leftSection').appendChild(coin.element);
        });
        this.createExitPortal(level.leftSection.portal, 'left');

        // Load right section (different layout)
        level.rightSection.monsters.forEach(config => {
            const obstacle = new Obstacle(config.type, config.x, config.y, config.width, config.height);
            document.getElementById('rightSection').appendChild(obstacle.element);
        });
        level.rightSection.coins.forEach(config => {
            const coin = new Coin(config.x, config.y);
            document.getElementById('rightSection').appendChild(coin.element);
        });
        this.createExitPortal(level.rightSection.portal, 'right');
    }
}

class Game {
    constructor() {
        // Load saved progress
        const savedProgress = JSON.parse(localStorage.getItem('gameProgress')) || {
            currentLevel: 1,
            totalCoins: 0,
            highestLevel: 1
        };

        this.currentLevel = savedProgress.currentLevel;
        this.totalCoins = savedProgress.totalCoins;
        this.coins = 0;
        this.collectedCoins = new Set();
        this.characterA = null;
        this.characterB = null;
        this.isRunning = false;
        this.maxLevel = Infinity; // Allow unlimited levels
        this.keys = {
            left: false,
            right: false,
            jump: false,
            up: false,
            down: false
        };
        this.levels = []; // Initialize empty levels array
        this.levelGenerator = new LevelGenerator();
        
        this.init(); // Initialize characters first
        this.generateAndLoadLevel(this.currentLevel); // Generate and load first level
        this.setupIntroScreen();
        this.pause();
        this.characterAAtPortal = false;
        this.characterBAtPortal = false;
    }

    init() {
        // Create characters with mirrored starting positions
        this.characterA = new Character('left', 20, 20);
        const rightSection = document.getElementById('rightSection');
        const rightStartX = rightSection.offsetWidth - 60;
        this.characterB = new Character('right', rightStartX, 20);
        
        // Set up controls
        this.setupControls();
    }

    setupIntroScreen() {
        const introScreen = document.getElementById('introScreen');
        const startButton = document.getElementById('startButton');
        
        // Show current progress
        const progressDisplay = document.createElement('div');
        progressDisplay.className = 'progress-display';
        progressDisplay.innerHTML = `
            Current Level: ${this.currentLevel}<br>
            Total Coins: ${this.totalCoins}<br>
            Highest Level: ${this.getHighestLevel()}
        `;
        introScreen.querySelector('.intro-content').insertBefore(
            progressDisplay, 
            startButton
        );

        startButton.addEventListener('click', () => {
            introScreen.style.opacity = '0';
            setTimeout(() => {
                introScreen.style.display = 'none';
                this.generateAndLoadLevel(this.currentLevel);
                this.start();
            }, 500);
        });
    }

    showGameOver() {
        document.getElementById('gameOverScreen').style.display = 'flex';
    }

    showLevelComplete() {
        document.getElementById('levelCompleteScreen').style.display = 'flex';
        const timeTaken = (Date.now() - this.levelStartTime) / 1000;
        document.getElementById('levelStats').innerHTML = `
            Level ${this.currentLevel} Complete!<br>
            Time: ${timeTaken.toFixed(1)}s<br>
            Coins: ${this.coins}<br>
            High Score: Level ${this.getHighestLevel()}
        `;
    }

    getHighestLevel() {
        return localStorage.getItem('highestLevel') || 1;
    }

    nextLevel() {
        this.currentLevel++;
        this.characterAAtPortal = false;
        this.characterBAtPortal = false;
        this.generateAndLoadLevel(this.currentLevel);
        this.saveProgress(); // Save after level completion
        this.updateLevelDisplay();
        if (this.currentLevel > this.getHighestLevel()) {
            localStorage.setItem('highestLevel', this.currentLevel);
        }
        this.start();
    }

    start() {
        this.isRunning = true;
        this.levelStartTime = Date.now(); // Add time tracking
        this.update();
    }

    pause() {
        this.isRunning = false;
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.keys.right = true;
                    break;
                case 'ArrowUp':
                case 'w':
                case ' ':
                    // Allow jumping anytime
                    if (!this.characterAAtPortal) {
                        this.characterA.jump();
                    }
                    if (!this.characterBAtPortal) {
                        this.characterB.jump();
                    }
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.keys.right = false;
                    break;
                case 'ArrowUp':
                case 'w':
                    this.characterA.stopFlying();
                    this.characterB.stopFlying();
                    break;
            }
        });

        // Button controls
        const pauseButton = document.getElementById('pauseButton');
        pauseButton.addEventListener('click', () => {
            if (this.isRunning) {
                this.pause();
                pauseButton.textContent = 'Resume';
            } else {
                this.start();
                pauseButton.textContent = 'Pause';
            }
        });

        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });

        const homeButton = document.getElementById('homeButton');
        homeButton.addEventListener('click', () => {
            if (confirm('Return to main menu? Your progress will be saved.')) {
                this.returnToMenu();
            }
        });

        // Game Over screen controls
        const retryButton = document.querySelector('#gameOverScreen .retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                document.getElementById('gameOverScreen').style.display = 'none';
                this.reset();
                this.start();
            });
        }

        const menuButton = document.querySelector('#gameOverScreen .menu-button');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                this.returnToMenu();
            });
        }

        // Level Complete screen controls
        const nextLevelButton = document.querySelector('.next-level-button');
        if (nextLevelButton) {
            nextLevelButton.addEventListener('click', () => {
                document.getElementById('levelCompleteScreen').style.display = 'none';
                this.nextLevel();
                this.start();
            });
        }
    }

    update() {
        if (!this.isRunning) return;

        // Handle movement with mirroring
        if (this.keys.left) {
            if (!this.characterAAtPortal) {
                this.characterA.moveLeft();
            }
            if (!this.characterBAtPortal) {
                this.characterB.moveRight(); // Move right when A moves left
            }
        }
        if (this.keys.right) {
            if (!this.characterAAtPortal) {
                this.characterA.moveRight();
            }
            if (!this.characterBAtPortal) {
                this.characterB.moveLeft(); // Move left when A moves right
            }
        }

        // Update physics with height limit
        if (!this.characterAAtPortal) {
            this.characterA.update();
            if (this.characterA.y > 300) { // Limit height
                this.characterA.y = 300;
                this.characterA.velocityY = 0;
            }
        }
        if (!this.characterBAtPortal) {
            this.characterB.update();
            if (this.characterB.y > 300) { // Limit height
                this.characterB.y = 300;
                this.characterB.velocityY = 0;
            }
        }

        // Check collisions
        this.checkCollisions();

        // Continue game loop
        requestAnimationFrame(() => this.update());
    }

    restart() {
        // Reset portal states
        this.characterAAtPortal = false;
        this.characterBAtPortal = false;
        
        // Remove portal active states
        document.querySelectorAll('.exit-portal').forEach(portal => {
            portal.classList.remove('active');
        });
        
        // Remove character portal states
        this.characterA.element.classList.remove('at-portal');
        this.characterB.element.classList.remove('at-portal');

        // Reset character positions
        this.characterA.x = 20;
        this.characterA.y = 20;
        this.characterA.velocityY = 0;
        this.characterA.isJumping = false;
        this.characterA.updatePosition();

        // Reset mirrored position for character B
        const rightSection = document.getElementById('rightSection');
        const rightStartX = rightSection.offsetWidth - 60;
        this.characterB.x = rightStartX;
        this.characterB.y = 20;
        this.characterB.velocityY = 0;
        this.characterB.isJumping = false;
        this.characterB.updatePosition();

        // Resume game
        if (!this.isRunning) {
            this.start();
            document.getElementById('pauseButton').textContent = 'Pause';
        }
    }

    reset() {
        // Reset only current level state, keep total progress
        this.coins = 0;
        this.collectedCoins.clear();
        document.getElementById('coinCount').textContent = `0 (Total: ${this.totalCoins})`;
        
        // Hide game over screen
        document.getElementById('gameOverScreen').style.display = 'none';
        
        // Reload current level
        this.generateAndLoadLevel(this.currentLevel);
        this.restart();
        this.updateLevelDisplay();
        this.saveProgress();
    }

    returnToMenu() {
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('introScreen').style.display = 'block';
        document.getElementById('introScreen').style.opacity = '1';
        // Don't reset level number
        this.reset();
    }

    generateAndLoadLevel(levelNum) {
        const level = this.levelGenerator.generateLevel(levelNum);
        this.levels[levelNum - 1] = level;
        this.loadLevel(levelNum);
        this.updateLevelDisplay(); // Update level display
        localStorage.setItem('currentLevel', levelNum); // Save progress
    }

    loadLevel(levelNum) {
        const level = this.levels[levelNum - 1];
        if (!level) {
            console.error('Level not found:', levelNum);
            return;
        }

        this.clearLevel();
        this.collectedCoins.clear();
        this.coins = 0;

        // Create monsters
        level.leftSection.monsters.forEach(config => {
            const monster = new Obstacle('monster', config.x, config.y, config.width, config.height);
            document.getElementById('leftSection').appendChild(monster.element);
        });

        level.rightSection.monsters.forEach(config => {
            const monster = new Obstacle('monster', config.x, config.y, config.width, config.height);
            document.getElementById('rightSection').appendChild(monster.element);
        });

        // Create coins
        level.leftSection.coins.forEach(config => {
            const coin = new Coin(config.x, config.y);
            document.getElementById('leftSection').appendChild(coin.element);
        });

        level.rightSection.coins.forEach(config => {
            const coin = new Coin(config.x, config.y);
            document.getElementById('rightSection').appendChild(coin.element);
        });

        // Create portals
        this.createExitPortal(level.leftSection.portal, 'left');
        this.createExitPortal(level.rightSection.portal, 'right');

        // Reset characters
        this.restart();
    }

    createExitPortal(config, section) {
        const portal = document.createElement('div');
        portal.className = 'exit-portal';
        portal.style.left = `${config.x}px`;
        portal.style.bottom = `${config.y}px`;
        document.getElementById(`${section}Section`).appendChild(portal);
    }

    clearLevel() {
        // Remove all existing elements including portals
        document.querySelectorAll('.obstacle, .coin, .exit-portal').forEach(el => el.remove());
    }

    checkCollisions() {
        // Check monster collisions first
        document.querySelectorAll('.obstacle.monster').forEach(monster => {
            const section = monster.parentElement.id;
            const character = section === 'leftSection' ? this.characterA : this.characterB;
            
            if (character && !character.atPortal && character.checkMonsterCollision(monster)) {
                this.handleDeath();
            }
        });

        // Check coin collisions
        document.querySelectorAll('.coin').forEach(coin => {
            if (!this.collectedCoins.has(coin.id)) {
                const section = coin.parentElement.id;
                const character = section === 'leftSection' ? this.characterA : this.characterB;
                
                if (character && !character.atPortal && character.checkCollision(coin)) {
                    this.collectCoin(coin);
                }
            }
        });

        // Check portal collisions
        const leftPortal = document.querySelector('#leftSection .exit-portal');
        const rightPortal = document.querySelector('#rightSection .exit-portal');
        
        if (leftPortal && rightPortal) {
            if (!this.characterAAtPortal && this.characterA.checkCollision(leftPortal)) {
                this.characterAAtPortal = true;
                leftPortal.classList.add('active');
                this.characterA.element.classList.add('at-portal');
            }
            
            if (!this.characterBAtPortal && this.characterB.checkCollision(rightPortal)) {
                this.characterBAtPortal = true;
                rightPortal.classList.add('active');
                this.characterB.element.classList.add('at-portal');
            }

            if (this.characterAAtPortal && this.characterBAtPortal) {
                this.handleLevelComplete();
            }
        }
    }

    handleDeath() {
        this.pause();
        this.showGameOver();
    }

    collectCoin(coinElement) {
        if (!this.collectedCoins.has(coinElement.id)) {
            this.collectedCoins.add(coinElement.id);
            coinElement.remove();
            this.coins++;
            this.totalCoins++; // Update total coins
            document.getElementById('coinCount').textContent = `${this.coins} (Total: ${this.totalCoins})`;
            this.saveProgress(); // Save after collecting coin
            this.checkLevelCompletion();
        }
    }

    checkLevelCompletion() {
        const level = this.levels[this.currentLevel - 1];
        if (this.coins >= level.requiredCoins) {
            // Maybe show some visual feedback that enough coins are collected
            // But don't complete the level yet
        }
    }

    handleLevelComplete() {
        const level = this.levels[this.currentLevel - 1];
        if (!level) return;

        // Only complete if both characters are at portals AND have enough coins
        if (this.characterAAtPortal && this.characterBAtPortal) {
            this.pause();
            const timeTaken = (Date.now() - this.levelStartTime) / 1000;
            document.getElementById('levelStats').innerHTML = `
                Level ${this.currentLevel} Complete!<br>
                Time: ${timeTaken.toFixed(1)}s<br>
                Coins: ${this.coins}/${level.requiredCoins}
            `;
            document.getElementById('levelCompleteScreen').style.display = 'flex';
        }
    }

    checkPortalCollision(character, portal) {
        if (!portal || !character) return false;

        const charBox = character.getBoundingBox();
        const portalRect = portal.getBoundingClientRect();
        const section = portal.parentElement.getBoundingClientRect();

        // Calculate relative positions
        const charCenter = {
            x: charBox.left + (charBox.right - charBox.left) / 2,
            y: charBox.bottom + (charBox.top - charBox.bottom) / 2
        };

        const portalCenter = {
            x: (portalRect.left - section.left) + portalRect.width / 2,
            y: (portalRect.top - section.top) + portalRect.height / 2
        };

        // Very strict collision check
        const tolerance = 5;
        return Math.abs(charCenter.x - portalCenter.x) < tolerance &&
               Math.abs(charCenter.y - portalCenter.y) < tolerance;
    }

    updateLevelDisplay() {
        document.getElementById('levelDisplay').textContent = `Level ${this.currentLevel}`;
    }

    saveProgress() {
        const progress = {
            currentLevel: this.currentLevel,
            totalCoins: this.totalCoins,
            highestLevel: Math.max(this.currentLevel, this.getHighestLevel())
        };
        localStorage.setItem('gameProgress', JSON.stringify(progress));
    }
}

// New Obstacle class
class Obstacle {
    constructor(type, x, y, width, height, properties = {}) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.properties = properties;
        this.element = this.createObstacle();
    }

    createObstacle() {
        const element = document.createElement('div');
        element.className = `obstacle ${this.type}`;
        
        if (this.type === 'monster') {
            element.classList.add('deadly');
        } else if (this.type === 'bar') {
            element.classList.add('climbable');
        }

        element.style.left = `${this.x}px`;
        element.style.bottom = `${this.y}px`;
        element.style.width = `${this.width}px`;
        element.style.height = `${this.height}px`;
        return element;
    }
}

// New Coin class
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.collected = false;
        this.element = this.createCoin();
        this.element.id = `coin_${Math.random().toString(36).substr(2, 9)}`; // Unique ID
    }

    createCoin() {
        const element = document.createElement('div');
        element.className = 'coin';
        element.style.left = `${this.x}px`;
        element.style.bottom = `${this.y}px`;
        return element;
    }

    collect() {
        if (!this.collected) {
            this.collected = true;
            this.element.remove();
            return true;
        }
        return false;
    }
}

// At the bottom of game.js, modify the initialization:
let game; // Declare game variable in global scope

document.addEventListener('DOMContentLoaded', () => {
    game = new Game(); // Assign to global variable
}); 