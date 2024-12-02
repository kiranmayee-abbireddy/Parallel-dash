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
        
        // Get game instance
        this.game = window.game;
        
        // Create the character element
        this.element = this.createCharacter();
        
        // Add to appropriate section
        const section = document.getElementById(`${this.side}Section`);
        if (section) {
            section.appendChild(this.element);
        }
        
        // Initialize other properties
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
        const element = document.createElement('div');
        element.className = `character ${this.side}`;
        
        // Apply current skin if available
        if (this.game && this.game.currentSkin) {
            element.classList.add(this.game.currentSkin);
        }
        
        // Set initial position
        element.style.left = `${this.x}px`;
        element.style.bottom = `${this.y}px`;
        
        // Add current accessory if one is equipped
        if (this.game && this.game.currentAccessory && this.game.currentAccessory !== 'none') {
            const accessory = document.createElement('div');
            accessory.className = `accessory ${this.game.currentAccessory} ${this.side}`;
            element.appendChild(accessory);
        }
        
        return element;
    }

    updatePosition() {
        if (this.element) {
            if (this.side === 'left') {
                this.element.style.left = `${this.x}px`;
            } else {
                const section = document.getElementById('rightSection');
                if (section) {
                    const rightPosition = section.offsetWidth - this.x - this.element.offsetWidth;
                    this.element.style.left = `${rightPosition}px`;
                }
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

    applySkin(skinName) {
        // Remove any existing skin classes
        const skinClasses = this.element.className
            .split(' ')
            .filter(cls => !cls.endsWith('-skin'));
        
        // Create new class list
        let newClassList = skinClasses;
        
        // Add the skin class (even for default skin)
        newClassList.push(`${skinName}-skin`);
        
        // Update element's class list
        this.element.className = newClassList.join(' ');
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
        // Initialize arrays first
        this.purchasedSkins = JSON.parse(localStorage.getItem('purchasedSkins')) || ['default-skin']; // Only default skin free
        this.purchasedAccessories = JSON.parse(localStorage.getItem('purchasedAccessories')) || ['none'];
        
        // Initialize current items
        this.currentSkin = localStorage.getItem('currentSkin') || 'default-skin';
        this.currentAccessory = localStorage.getItem('currentAccessory') || 'none';
        
        // Cache DOM elements
        this.gameContainer = document.querySelector('.game-container');
        this.introScreen = document.getElementById('introScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.levelCompleteScreen = document.getElementById('levelCompleteScreen');
        this.storeTotalCoins = document.getElementById('storeTotalCoins');

        // Load saved progress
        const savedProgress = JSON.parse(localStorage.getItem('gameProgress')) || {
            currentLevel: 1,
            totalCoins: 0,
            highestLevel: 1
        };

        // Initialize game state
        this.currentLevel = savedProgress.currentLevel;
        this.totalCoins = savedProgress.totalCoins;
        this.coins = 0;
        this.collectedCoins = new Set();
        this.characterA = null;
        this.characterB = null;
        this.isRunning = false;
        this.maxLevel = Infinity;
        this.keys = {
            left: false,
            right: false,
            jump: false,
            up: false,
            down: false
        };
        this.levels = [];
        this.levelGenerator = new LevelGenerator();
        
        // Add nickname property
        this.playerNickname = localStorage.getItem('playerNickname');
        
        // Initialize game
        this.init();
        this.generateAndLoadLevel(this.currentLevel);
        this.setupIntroScreen();
        this.pause();
        this.characterAAtPortal = false;
        this.characterBAtPortal = false;
        
        // Make sure all characters have skins
        this.updateCharacterSkins(this.currentSkin);
        
        // Setup store after everything is initialized
        this.setupStore();
        
        // Check nickname last
        if (!this.playerNickname) {
            this.showNicknamePrompt();
        }

        this.themes = {
            'default-theme': {
                primary: '#4facfe',
                secondary: '#00f2fe',
                glow: 'rgba(79, 172, 254, 0.5)'
            },
            'cyan-theme': {
                primary: '#00CED1',
                secondary: '#40E0D0',
                glow: 'rgba(0, 206, 209, 0.5)'
            },
            'teal-theme': {
                primary: '#008080',
                secondary: '#20B2AA',
                glow: 'rgba(0, 128, 128, 0.5)'
            },
            'coral-theme': {
                primary: '#FF7F50',
                secondary: '#FA8072',
                glow: 'rgba(255, 127, 80, 0.5)'
            },
            'orange-theme': {
                primary: '#FFA500',
                secondary: '#FFB84D',
                glow: 'rgba(255, 165, 0, 0.5)'
            },
            'pink-theme': {
                primary: '#FF69B4',
                secondary: '#FFB6C1',
                glow: 'rgba(255, 105, 180, 0.5)'
            }
        };
        
        // Load saved theme
        this.currentTheme = localStorage.getItem('currentTheme') || 'default-theme';
        this.applyTheme(this.currentTheme);
    }

    init() {
        // Cache DOM elements
        this.gameContainer = document.querySelector('.game-container');
        this.introScreen = document.getElementById('introScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');
        this.levelCompleteScreen = document.getElementById('levelCompleteScreen');
        this.storeTotalCoins = document.getElementById('storeTotalCoins');

        // Load saved progress
        const savedProgress = JSON.parse(localStorage.getItem('gameProgress')) || {
            currentLevel: 1,
            totalCoins: 0,
            highestLevel: 1
        };

        // Set initial game state
        this.currentLevel = savedProgress.currentLevel;
        this.totalCoins = savedProgress.totalCoins;
        this.maxLevel = Infinity;
        this.keys = {
            left: false,
            right: false,
            jump: false,
            up: false,
            down: false
        };
        this.levels = [];
        this.levelGenerator = new LevelGenerator();
        
        // Add nickname property
        this.playerNickname = localStorage.getItem('playerNickname');
        
        // Initialize game
        this.createCharacters();
        this.setupControls();
        this.setupIntroScreen();
        this.generateAndLoadLevel(this.currentLevel);
        this.pause();
        
        // Initialize portal states
        this.characterAAtPortal = false;
        this.characterBAtPortal = false;
        
        // Make sure all characters have skins
        this.updateCharacterSkins(this.currentSkin);
        
        // Setup store
        this.setupStore();
        
        // Check nickname last
        if (!this.playerNickname) {
            this.showNicknamePrompt();
        }

        this.loadSavedAccessory();
    }

    createCharacters() {
        // Create characters
        this.characterA = new Character('left', 50, 20);
        this.characterB = new Character('right', 50, 20);
        
        // Apply current skin and accessories
        [this.characterA, this.characterB].forEach(char => {
            if (char && char.element) {
                // Apply skin
                char.element.classList.add(this.currentSkin || 'default-skin');
                
                // Apply accessory if one is equipped
                if (this.currentAccessory && this.currentAccessory !== 'none') {
                    const accessory = document.createElement('div');
                    accessory.className = `accessory ${this.currentAccessory} ${char.side}`;
                    char.element.appendChild(accessory);
                }
            }
        });
    }

    setupIntroScreen() {
        const introScreen = document.getElementById('introScreen');
        const startButton = document.getElementById('startButton');
        
        // Get the demo characters
        const leftDemo = introScreen.querySelector('.demo-character.left');
        const rightDemo = introScreen.querySelector('.demo-character.right');

        // First remove any existing skin classes
        const allSkins = [
            'default-skin', 'basic-blue-red-skin', 'basic-purple-orange-skin', 
            'basic-green-pink-skin', 'neon-skin', 'galaxy-skin', 'rainbow-skin', 
            'plasma-skin', 'crystal-skin', 'geometric-prism-skin',
            'celestial-skin', 'fruity-skin', 'twilight-dawn-skin',
            'emerald-ruby-skin', 'arctic-tropical-skin', 'mercury-skin',
            'holographic-skin', 'crystal-facets-skin'
        ];

        // Function to apply skin while preserving other classes
        const applySkin = (element, isRight = false) => {
            if (element) {
                // Keep all classes except skin classes
                const baseClasses = element.className
                    .split(' ')
                    .filter(cls => !cls.endsWith('-skin'));
                
                // Add position class if missing
                if (!baseClasses.includes(isRight ? 'right' : 'left')) {
                    baseClasses.push(isRight ? 'right' : 'left');
                }
                
                // Add skin from purchased list or default
                const skinToApply = this.purchasedSkins.includes(this.currentSkin) ? 
                    this.currentSkin : 
                    this.purchasedSkins[0]; // First purchased skin (should be default-skin)
                
                baseClasses.push(skinToApply);
                
                // Apply classes
                element.className = baseClasses.join(' ');
            }
        };

        // Apply current skin to demo characters
        applySkin(leftDemo);
        applySkin(rightDemo, true);

        // Apply accessories to demo characters
        if (this.currentAccessory) {
            [leftDemo, rightDemo].forEach(char => {
                if (char) {
                    const accessory = document.createElement('div');
                    accessory.className = `accessory ${this.currentAccessory} ${char.classList.contains('right') ? 'right' : 'left'}`;
                    char.appendChild(accessory);
                }
            });
        }

        // Update demo characters when skin changes
        this.updateCharacterSkins = (newSkin) => {
            // Only update if the skin is in purchased list
            if (this.purchasedSkins.includes(newSkin)) {
                this.currentSkin = newSkin;
                
                // Update all character instances
                const allCharacters = [
                    ...document.querySelectorAll('.demo-character'),
                    ...document.querySelectorAll('.game-over-character-left, .game-over-character-right'),
                    ...document.querySelectorAll('.completion-animation .character-left, .completion-animation .character-right'),
                    this.characterA?.element,
                    this.characterB?.element
                ];

                allCharacters.forEach(char => {
                    if (char) {
                        // Keep position and base classes
                        const baseClasses = char.className
                            .split(' ')
                            .filter(cls => !cls.endsWith('-skin') && cls !== 'at-portal');
                        
                        // Add new skin class
                        char.className = [...baseClasses, newSkin].join(' ');

                        // Preserve demo animations
                        if (char.classList.contains('demo-character')) {
                            const isRight = char.classList.contains('right');
                            const animationName = isRight ? 'demoMoveRight' : 'demoMoveLeft';
                            char.style.animation = `${animationName} 4s infinite`;
                        }

                        // Re-apply accessory if one is equipped
                        if (this.currentAccessory && this.currentAccessory !== 'none') {
                            // Remove existing accessory if any
                            const existingAccessory = char.querySelector('.accessory');
                            if (existingAccessory) {
                                existingAccessory.remove();
                            }
                            
                            // Add new accessory
                            const accessory = document.createElement('div');
                            accessory.className = `accessory ${this.currentAccessory} ${char.classList.contains('right') ? 'right' : 'left'}`;
                            char.appendChild(accessory);
                        }
                    }
                });

                // Save current skin
                localStorage.setItem('currentSkin', newSkin);
                
                // Update store buttons
                this.updateStoreButtons();
            }
        };

        this.updateMenuProgress();

        startButton.addEventListener('click', () => {
            introScreen.style.opacity = '0';
            setTimeout(() => {
                introScreen.style.display = 'none';
                const gameContainer = document.querySelector('.game-container');
                gameContainer.style.display = 'flex';
                this.generateAndLoadLevel(this.currentLevel);
                this.start();
            }, 500);
        });
    }

    updateMenuProgress() {
        // Remove existing progress display if any
        const existingProgress = document.querySelector('.progress-display');
        if (existingProgress) {
            existingProgress.remove();
        }

        // Create new progress display with just current level and total coins
        const progressDisplay = document.createElement('div');
        progressDisplay.className = 'progress-display';
        progressDisplay.innerHTML = `
            Current Level: ${this.currentLevel}<br>
            Total Coins: ${this.totalCoins}
        `;

        // Insert before start button
        const introScreen = document.getElementById('introScreen');
        const startButton = document.getElementById('startButton');
        introScreen.querySelector('.intro-content').insertBefore(
            progressDisplay, 
            startButton
        );
    }

    showGameOver() {
        const leftChar = document.querySelector('.game-over-character-left');
        const rightChar = document.querySelector('.game-over-character-right');
        
        if (leftChar && rightChar) {
            // Apply current skin
            leftChar.className = `game-over-character-left ${this.currentSkin || 'default-skin'}`;
            rightChar.className = `game-over-character-right ${this.currentSkin || 'default-skin'}`;
            
            // Apply current accessory
            if (this.currentAccessory) {
                const leftAccessory = document.createElement('div');
                leftAccessory.className = `accessory ${this.currentAccessory} left`;
                leftChar.appendChild(leftAccessory);

                const rightAccessory = document.createElement('div');
                rightAccessory.className = `accessory ${this.currentAccessory} right`;
                rightChar.appendChild(rightAccessory);
            }
        }

        document.getElementById('gameOverScreen').style.display = 'flex';
    }

    showLevelComplete() {
        document.getElementById('levelCompleteScreen').style.display = 'flex';
        const timeTaken = (Date.now() - this.levelStartTime) / 1000;
        document.getElementById('levelStats').innerHTML = `
            Level ${this.currentLevel} Complete!<br>
            Time: ${timeTaken.toFixed(1)}s<br>
            Coins: ${this.coins}
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
        if (!this.isRunning) {
            // Show game container if hidden
            const gameContainer = document.querySelector('.game-container');
            if (gameContainer.style.display === 'none') {
                gameContainer.style.display = 'flex';
            }
            
            this.isRunning = true;
            this.levelStartTime = Date.now();
            this.update();
        }
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
            const confirmModal = document.getElementById('confirmModal');
            confirmModal.style.display = 'block';

            document.getElementById('confirmYes').onclick = () => {
                // Hide modal first
                confirmModal.style.display = 'none';
                
                // Pause game
                this.pause();
                
                // Get references to screens
                const gameContainer = document.querySelector('.game-container');
                const introScreen = document.getElementById('introScreen');
                
                // Hide game screens immediately
                document.getElementById('gameOverScreen').style.display = 'none';
                document.getElementById('levelCompleteScreen').style.display = 'none';
                
                // Quick fade transition
                gameContainer.style.opacity = '0';
                
                // Single quick transition
                setTimeout(() => {
                    // Hide game container
                    gameContainer.style.display = 'none';
                    
                    // Show intro screen with animation
                    introScreen.style.display = 'block';
                    introScreen.style.opacity = '1';
                    
                    // Update menu progress
                    this.updateMenuProgress();
                    
                    // Reset game container opacity for next time
                    gameContainer.style.opacity = '1';
                    
                    // Clear level without restarting
                    this.clearLevel();
                    this.collectedCoins.clear();
                    this.coins = 0;
                    
                    // Update displays
                    document.getElementById('coinCount').textContent = this.coins;
                    document.getElementById('totalCoins').textContent = this.totalCoins;
                }, 200);
            };

            document.getElementById('confirmNo').onclick = () => {
                confirmModal.style.display = 'none';
            };
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

        // Reapply current skin to characters
        if (this.currentSkin && this.currentSkin !== 'default-skin') {
            this.characterA.element.classList.add(this.currentSkin);
            this.characterB.element.classList.add(this.currentSkin);
        }

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
        
        // Update both displays separately
        document.getElementById('coinCount').textContent = this.coins;
        document.getElementById('totalCoins').textContent = this.totalCoins;
        
        // Hide game over screen
        document.getElementById('gameOverScreen').style.display = 'none';
        
        // Reload current level
        this.generateAndLoadLevel(this.currentLevel);
        this.restart();
        this.updateLevelDisplay();
        this.saveProgress();
    }

    returnToMenu() {
        // Pause the game first
        this.pause();
        
        // Save current progress
        this.saveProgress();
        
        // Get references to screens
        const gameContainer = document.querySelector('.game-container');
        const introScreen = document.getElementById('introScreen');
        
        // Hide game screens
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('levelCompleteScreen').style.display = 'none';
        
        // Fade out game container
        gameContainer.style.opacity = '0';
        
        setTimeout(() => {
            // Hide game container
            gameContainer.style.display = 'none';
            
            // Show and fade in intro screen
            introScreen.style.display = 'block';
            introScreen.style.opacity = '1';
            
            // Update menu progress
            this.updateMenuProgress();
            
            // Reset game container opacity for next time
            gameContainer.style.opacity = '1';
            
            // Clear level without restarting
            this.clearLevel();
            this.collectedCoins.clear();
            this.coins = 0;
            
            // Update displays
            document.getElementById('coinCount').textContent = this.coins;
            document.getElementById('totalCoins').textContent = this.totalCoins;

            // Force reload the game instance
            window.game = new Game();
        }, 200);
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
            
            // Update both displays separately
            document.getElementById('coinCount').textContent = this.coins;
            document.getElementById('totalCoins').textContent = this.totalCoins;
            
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
        if (this.characterAAtPortal && this.characterBAtPortal) {
            this.pause();
            
            // Update level number and stats
            document.getElementById('completedLevel').textContent = this.currentLevel;
            document.getElementById('levelStats').innerHTML = `
                Time: ${((Date.now() - this.levelStartTime) / 1000).toFixed(1)}s<br>
                Coins: ${this.coins}
            `;

            const leftChar = document.querySelector('.completion-animation .character-left');
            const rightChar = document.querySelector('.completion-animation .character-right');
            
            if (leftChar && rightChar) {
                // Apply current skin
                leftChar.className = `character-left ${this.currentSkin || 'default-skin'}`;
                rightChar.className = `character-right ${this.currentSkin || 'default-skin'}`;
                
                // Apply current accessory
                if (this.currentAccessory) {
                    const leftAccessory = document.createElement('div');
                    leftAccessory.className = `accessory ${this.currentAccessory} left`;
                    leftChar.appendChild(leftAccessory);

                    const rightAccessory = document.createElement('div');
                    rightAccessory.className = `accessory ${this.currentAccessory} right`;
                    rightChar.appendChild(rightAccessory);
                }
            }

            document.getElementById('levelCompleteScreen').style.display = 'flex';
            setTimeout(() => this.createHearts(), 500);
        }
    }

    createHearts() {
        const container = document.querySelector('.hearts-container');
        const centerX = container.offsetWidth / 2;
        const centerY = container.offsetHeight / 2;
        
        // Create continuous hearts animation
        const createHeart = () => {
            const heart = document.createElement('div');
            heart.className = 'heart';
            
            // Start from the center where characters meet
            const startX = centerX + (Math.random() - 0.5) * 40; // Small random horizontal offset
            const startY = centerY;
            
            // Simple upward movement with slight side-to-side variation
            const spreadX = (Math.random() - 0.5) * 30;
            const floatHeight = -150 - Math.random() * 50; // Random float height
            
            heart.style.left = `${startX}px`;
            heart.style.top = `${startY}px`;
            heart.style.setProperty('--tx', spreadX);
            heart.style.setProperty('--ty', floatHeight);
            
            container.appendChild(heart);
            
            // Slower animation for more floating effect
            heart.style.animation = 'floatHeart 3s ease-out forwards';
            
            // Remove heart after animation
            heart.addEventListener('animationend', () => {
                heart.remove();
            });
        };

        // Create hearts continuously
        const heartInterval = setInterval(() => {
            createHeart();
        }, 200); // Create heart every 200ms

        // Store interval ID to clear it later
        this.heartAnimationInterval = heartInterval;

        // Add event listener to next level button to stop hearts
        const nextLevelButton = document.querySelector('.next-level-button');
        nextLevelButton.addEventListener('click', () => {
            clearInterval(this.heartAnimationInterval);
        });
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
        const levelDisplay = document.getElementById('levelDisplay');
        levelDisplay.textContent = `${this.playerNickname} - Level ${this.currentLevel}`;
    }

    saveProgress() {
        const progress = {
            currentLevel: this.currentLevel,
            totalCoins: this.totalCoins,
            highestLevel: this.highestLevel,
            purchasedSkins: this.purchasedSkins,
            currentSkin: this.currentSkin
        };
        localStorage.setItem('gameProgress', JSON.stringify(progress));
    }

    showNicknamePrompt() {
        const nicknamePrompt = document.getElementById('nicknamePrompt');
        const startButton = document.getElementById('startButton');
        const confirmButton = document.getElementById('confirmNickname');
        const nicknameInput = document.getElementById('nicknameInput');
        
        // Hide start button and show prompt
        startButton.style.display = 'none';
        nicknamePrompt.style.display = 'block';
        
        confirmButton.addEventListener('click', () => {
            const nickname = nicknameInput.value.trim();
            if (nickname) {
                this.playerNickname = nickname;
                localStorage.setItem('playerNickname', nickname);
                nicknamePrompt.style.display = 'none';
                startButton.style.display = 'block';
                
                // Update UI with nickname
                this.updateNicknameDisplay();
            }
        });
        
        // Allow Enter key to confirm
        nicknameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmButton.click();
            }
        });
    }

    updateNicknameDisplay() {
        // Update nickname in game UI
        const levelDisplay = document.getElementById('levelDisplay');
        levelDisplay.textContent = `${this.playerNickname} - Level ${this.currentLevel}`;
    }

    setupStore() {
        // Initial setup of store buttons
        document.querySelectorAll('.store-item button').forEach(button => {
            const itemId = button.dataset.item;
            const price = button.dataset.price;
            const category = button.closest('.store-item')?.dataset.category || 'skins';
            
            // Set initial button state
            if (category === 'accessories') {
                if (this.purchasedAccessories.includes(itemId)) {
                    if (this.currentAccessory === itemId) {
                        button.textContent = 'Equipped';
                        button.classList.add('equipped');
                    } else {
                        button.textContent = 'Equip';
                        button.classList.remove('equipped');
                    }
                } else {
                    button.textContent = `${price} 🪙`;
                    button.classList.remove('equipped');
                }
            } else {
                // Handle skins
                if (this.purchasedSkins.includes(itemId)) {
                    if (this.currentSkin === itemId) {
                        button.textContent = 'Equipped';
                        button.classList.add('equipped');
                    } else {
                        button.textContent = 'Equip';
                        button.classList.remove('equipped');
                    }
                } else {
                    button.textContent = `${price} 🪙`;
                    button.classList.remove('equipped');
                }
            }
            
            // Add click handler
            button.addEventListener('click', () => {
                this.handlePurchase(button);
            });
        });
    }

    handlePurchase(button) {
        const itemId = button.dataset.item;
        const price = parseInt(button.dataset.price);
        const category = button.closest('.store-item')?.dataset.category || 'skins';
        
        if (category === 'accessories') {
            if (this.purchasedAccessories.includes(itemId)) {
                // If already purchased, handle equipping
                if (this.currentAccessory !== itemId) {
                    this.equipAccessory(itemId);
                    button.textContent = 'Equipped';
                    button.classList.add('equipped');
                }
            } else if (this.totalCoins >= price) {
                // Purchase the accessory
                this.totalCoins -= price;
                this.purchasedAccessories.push(itemId);
                
                // Save to localStorage
                localStorage.setItem('purchasedAccessories', JSON.stringify(this.purchasedAccessories));
                localStorage.setItem('totalCoins', this.totalCoins);
                
                // Equip the accessory
                this.equipAccessory(itemId);
                button.textContent = 'Equipped';
                button.classList.add('equipped');
                
                // Update coins display
                if (this.storeTotalCoins) {
                    this.storeTotalCoins.textContent = this.totalCoins;
                }
            } else {
                this.showNotification('Not enough coins!');
            }
        } else {
            // Handle skins
            if (this.purchasedSkins.includes(itemId)) {
                if (this.currentSkin !== itemId) {
                    this.applySkin(itemId);
                    button.textContent = 'Equipped';
                    button.classList.add('equipped');
                }
            } else if (this.totalCoins >= price) {
                this.totalCoins -= price;
                this.purchasedSkins.push(itemId);
                
                localStorage.setItem('purchasedSkins', JSON.stringify(this.purchasedSkins));
                localStorage.setItem('totalCoins', this.totalCoins);
                
                this.applySkin(itemId);
                button.textContent = 'Equipped';
                button.classList.add('equipped');
                
                if (this.storeTotalCoins) {
                    this.storeTotalCoins.textContent = this.totalCoins;
                }
            } else {
                this.showNotification('Not enough coins!');
            }
        }
    }

    updateStoreButtons() {
        document.querySelectorAll('.store-item button').forEach(button => {
            const itemId = button.dataset.item;
            const price = button.dataset.price;
            const category = button.closest('.store-item')?.dataset.category || 'skins';
            
            if (category === 'accessories') {
                if (this.purchasedAccessories.includes(itemId)) {
                    if (this.currentAccessory === itemId) {
                        button.textContent = 'Equipped';
                        button.classList.add('equipped');
                    } else {
                        button.textContent = 'Equip';
                        button.classList.remove('equipped');
                    }
                } else {
                    button.textContent = `${price} 🪙`;
                    button.classList.remove('equipped');
                }
            } else {
                // Handle skins
                if (this.purchasedSkins.includes(itemId)) {
                    if (this.currentSkin === itemId) {
                        button.textContent = 'Equipped';
                        button.classList.add('equipped');
                    } else {
                        button.textContent = 'Equip';
                        button.classList.remove('equipped');
                    }
                } else {
                    button.textContent = `${price} 🪙`;
                    button.classList.remove('equipped');
                }
            }
        });
    }

    applySkin(skinName) {
        // Apply skin to all characters
        this.currentSkin = skinName;
        localStorage.setItem('currentSkin', skinName);
        
        // Update all character instances
        this.updateCharacterSkins(skinName);
        
        // Update store buttons
        this.updateStoreButtons();
    }

    updateCharacterSkins(newSkin) {
        this.currentSkin = newSkin;

        // Get all character instances including animation characters
        const allCharacters = [
            // Demo characters
            ...document.querySelectorAll('.demo-character'),
            
            // Game over screen characters
            ...document.querySelectorAll('.game-over-character-left, .game-over-character-right'),
            
            // Level complete animation characters
            ...document.querySelectorAll('.completion-animation .character-left, .completion-animation .character-right'),
            
            // Active game characters
            this.characterA?.element,
            this.characterB?.element
        ];

        // Update each character's skin and maintain animations
        allCharacters.forEach(char => {
            if (char) {
                // Keep position and base classes
                const baseClasses = char.className
                    .split(' ')
                    .filter(cls => !cls.endsWith('-skin') && cls !== 'at-portal');
                
                // Add new skin class
                char.className = [...baseClasses, newSkin].join(' ');

                // Preserve demo animations
                if (char.classList.contains('demo-character')) {
                    const isRight = char.classList.contains('right');
                    const animationName = isRight ? 'demoMoveRight' : 'demoMoveLeft';
                    char.style.animation = `${animationName} 4s infinite`;
                }

                // Re-apply accessory if one is equipped
                if (this.currentAccessory && this.currentAccessory !== 'none') {
                    // Remove existing accessory if any
                    const existingAccessory = char.querySelector('.accessory');
                    if (existingAccessory) {
                        existingAccessory.remove();
                    }
                    
                    // Add new accessory
                    const accessory = document.createElement('div');
                    accessory.className = `accessory ${this.currentAccessory} ${char.classList.contains('right') ? 'right' : 'left'}`;
                    char.appendChild(accessory);
                }
            }
        });

        // Save current skin
        localStorage.setItem('currentSkin', newSkin);
        
        // Update store buttons
        this.updateStoreButtons();
    }

    // Add method to equip accessory
    equipAccessory(accessoryId) {
        this.currentAccessory = accessoryId;
        localStorage.setItem('currentAccessory', accessoryId);
        
        // Get all character instances
        const allCharacters = [
            ...document.querySelectorAll('.demo-character'),
            ...document.querySelectorAll('.character'),
            ...document.querySelectorAll('.game-over-character-left, .game-over-character-right'),
            ...document.querySelectorAll('.completion-animation .character-left, .completion-animation .character-right'),
            this.characterA?.element,
            this.characterB?.element
        ].filter(Boolean); // Remove null/undefined entries

        // Remove existing accessories from all characters
        allCharacters.forEach(char => {
            const existingAccessory = char.querySelector('.accessory');
            if (existingAccessory) {
                existingAccessory.remove();
            }
        });

        // Add new accessory if not 'none'
        if (accessoryId !== 'none') {
            allCharacters.forEach(char => {
                const accessory = document.createElement('div');
                const side = char.classList.contains('right') ? 'right' : 'left';
                accessory.className = `accessory ${accessoryId} ${side}`;
                char.appendChild(accessory);
            });
        }

        // Update store buttons
        this.updateStoreButtons();
    }

    // Add method to load saved accessory
    loadSavedAccessory() {
        const savedAccessory = localStorage.getItem('currentAccessory');
        if (savedAccessory) {
            this.equipAccessory(savedAccessory);
        }
    }

    // Add method to apply accessory when creating new characters
    createCharacter(side, startX, startY) {
        const character = document.createElement('div');
        character.className = `character ${side} ${this.currentSkin || 'default-skin'}`;
        character.style.left = `${startX}px`;
        character.style.bottom = `${startY}px`;
        
        // Add current accessory if one is equipped
        if (this.currentAccessory && this.currentAccessory !== 'none') {
            const accessory = document.createElement('div');
            // Make sure to add the side class for proper color inheritance
            accessory.className = `accessory ${this.currentAccessory} ${side}`;
            character.appendChild(accessory);
        }

        return character;
    }

    // Update loadGame to restore accessories
    loadGame() {
        // ... existing load code ...
        
        // Restore accessories
        const savedAccessory = localStorage.getItem('currentAccessory');
        if (savedAccessory) {
            this.currentAccessory = savedAccessory;
            if (savedAccessory !== 'none') {
                this.equipAccessory(savedAccessory);
            }
        }
        
        // ... rest of load code ...
    }

    buyItem(itemId, price) {
        if (this.coins >= price) {
            this.coins -= price;
            this.totalCoins -= price;  // Deduct from total coins too
            this.ownedItems.add(itemId);
            localStorage.setItem('ownedItems', JSON.stringify([...this.ownedItems]));
            
            // Save both current coins and total coins
            const savedProgress = {
                currentLevel: this.currentLevel,
                totalCoins: this.totalCoins,
                highestLevel: this.getHighestLevel()
            };
            localStorage.setItem('gameProgress', JSON.stringify(savedProgress));
            
            // Handle different item types
            if (itemId.includes('skin')) {
                this.equipSkin(itemId);
            } else if (itemId !== 'none') {
                this.equipAccessory(itemId);
            }
            
            this.updateStoreButtons();
            this.updateCoinsDisplay();
            this.storeTotalCoins.textContent = this.totalCoins;  // Update store coins display
        }
    }

    applyTheme(themeId) {
        const theme = this.themes[themeId];
        if (!theme) return;

        // Apply theme colors to CSS variables
        document.documentElement.style.setProperty('--theme-primary', theme.primary);
        document.documentElement.style.setProperty('--theme-secondary', theme.secondary);
        document.documentElement.style.setProperty('--theme-glow', theme.glow);

        // Update current theme
        this.currentTheme = themeId;
        localStorage.setItem('currentTheme', themeId);

        // Update store buttons
        this.updateStoreButtons();

        // Update all characters with new theme colors
        const allCharacters = document.querySelectorAll('.character.left, .demo-character.left, .game-over-character-left, .completion-animation .character-left');
        allCharacters.forEach(char => {
            char.style.background = `linear-gradient(45deg, ${theme.primary}, ${theme.secondary})`;
            char.style.boxShadow = `0 0 15px ${theme.glow}`;
        });
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

class SpaceBackground {
    constructor() {
        // Create two canvases - one for intro and one for game
        this.gameCanvas = document.getElementById('spaceBackground');
        this.introCanvas = document.createElement('canvas');
        this.introCanvas.id = 'introSpaceBackground';
        
        // Insert intro canvas into intro screen
        const introScreen = document.getElementById('introScreen');
        introScreen.insertBefore(this.introCanvas, introScreen.firstChild);

        // Style intro canvas
        this.introCanvas.style.position = 'absolute';
        this.introCanvas.style.top = '0';
        this.introCanvas.style.left = '0';
        this.introCanvas.style.width = '100%';
        this.introCanvas.style.height = '100%';
        this.introCanvas.style.zIndex = '-1';

        // Get contexts
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.introCtx = this.introCanvas.getContext('2d');

        // Shared state for consistent animation
        this.stars = [];
        this.planets = [];
        this.nebulas = [];
        this.shootingStars = [];
        this.starClusters = [];
        this.celestialObjects = [];
        this.coloredNebulas = [];
        
        this.resize();
        this.init();
        
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        // Resize both canvases
        this.gameCanvas.width = window.innerWidth;
        this.gameCanvas.height = window.innerHeight;
        this.introCanvas.width = window.innerWidth;
        this.introCanvas.height = window.innerHeight;
    }

    init() {
        // Create colored nebulas (larger, more blurred)
        const nebulaColors = [
            ['#4facfe33', '#00f2fe22'],  // Blue
            ['#ff475733', '#ff6b8122'],  // Red
            ['#7d5fff33', '#7158e222'],  // Purple
            ['#3ae37433', '#32ff7e22'],  // Green
            ['#ffa50033', '#ffd70022'],  // Gold
            ['#ff69b433', '#da70d622']   // Pink
        ];

        for (let i = 0; i < 4; i++) {
            const colors = nebulaColors[Math.floor(Math.random() * nebulaColors.length)];
            this.coloredNebulas.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 400 + 300,
                colors: colors,
                rotation: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.0005,
                blur: Math.random() * 50 + 30
            });
        }

        // Create celestial objects (planets, moons, etc.)
        const celestialTypes = [
            { color: '#ff9999', size: 60, glow: '#ff000033' },  // Mars-like
            { color: '#99ff99', size: 40, glow: '#00ff0033' },  // Alien world
            { color: '#9999ff', size: 50, glow: '#0000ff33' },  // Ice planet
            { color: '#ffff99', size: 45, glow: '#ffff0033' },  // Desert world
            { color: '#ff99ff', size: 35, glow: '#ff00ff33' }   // Mystic world
        ];

        for (let i = 0; i < 3; i++) {
            const type = celestialTypes[Math.floor(Math.random() * celestialTypes.length)];
            this.celestialObjects.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: type.size * (0.5 + Math.random() * 0.5),
                color: type.color,
                glow: type.glow,
                rotation: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.001,
                orbitRadius: Math.random() * 100,
                orbitSpeed: Math.random() * 0.001,
                phase: Math.random() * Math.PI * 2
            });
        }

        // Adjust shooting star parameters
        this.shootingStarConfig = {
            spawnRate: 0.005,  // Reduced spawn rate
            minSpeed: 5,       // Slower minimum speed
            maxSpeed: 8,       // Slower maximum speed
            minLength: 50,     // Shorter trails
            maxLength: 150,    // Longer maximum trails
            colors: ['#fff', '#ffd700', '#4facfe', '#ff69b4'] // Multiple colors
        };

        // Regular stars
        for (let i = 0; i < 200; i++) {
            this.stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                size: Math.random() * 2,
                twinkleSpeed: Math.random() * 0.05 + 0.02,
                twinklePhase: Math.random() * Math.PI * 2
            });
        }

        this.animate();
    }

    drawBackground(ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Draw colored nebulas with blur
        this.coloredNebulas.forEach(nebula => {
            ctx.save();
            ctx.filter = `blur(${nebula.blur}px)`;
            const gradient = ctx.createRadialGradient(
                nebula.x, nebula.y, 0,
                nebula.x, nebula.y, nebula.size
            );
            gradient.addColorStop(0, nebula.colors[0]);
            gradient.addColorStop(0.5, nebula.colors[1]);
            gradient.addColorStop(1, 'transparent');

            ctx.translate(nebula.x, nebula.y);
            ctx.rotate(nebula.rotation);
            ctx.fillStyle = gradient;
            ctx.fillRect(-nebula.size, -nebula.size, nebula.size * 2, nebula.size * 2);
            ctx.restore();
        });

        // Draw celestial objects
        this.celestialObjects.forEach(obj => {
            ctx.save();
            // Add glow effect
            ctx.shadowColor = obj.glow;
            ctx.shadowBlur = 20;
            
            // Calculate orbit position
            const orbitX = obj.x + Math.cos(obj.phase) * obj.orbitRadius;
            const orbitY = obj.y + Math.sin(obj.phase) * obj.orbitRadius;
            
            // Draw the object
            ctx.translate(orbitX, orbitY);
            ctx.rotate(obj.rotation);
            
            // Create gradient for 3D effect
            const gradient = ctx.createRadialGradient(
                0, 0, 0,
                0, 0, obj.size
            );
            gradient.addColorStop(0, obj.color);
            gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, obj.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // Draw shooting stars with color and glow
        if (Math.random() < this.shootingStarConfig.spawnRate) {
            const color = this.shootingStarConfig.colors[
                Math.floor(Math.random() * this.shootingStarConfig.colors.length)
            ];
            this.shootingStars.push({
                x: Math.random() * ctx.canvas.width,
                y: 0,
                length: this.shootingStarConfig.minLength + 
                        Math.random() * (this.shootingStarConfig.maxLength - this.shootingStarConfig.minLength),
                speed: this.shootingStarConfig.minSpeed + 
                       Math.random() * (this.shootingStarConfig.maxSpeed - this.shootingStarConfig.minSpeed),
                angle: Math.PI / 4 + Math.random() * Math.PI / 8,
                color: color
            });
        }

        // Draw and update shooting stars
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        this.shootingStars = this.shootingStars.filter(star => {
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star.x - Math.cos(star.angle) * star.length, 
                      star.y - Math.sin(star.angle) * star.length);
            ctx.stroke();

            star.x += Math.cos(star.angle) * star.speed;
            star.y += Math.sin(star.angle) * star.speed;

            return star.y < ctx.canvas.height && star.x > 0;
        });

        // Update celestial objects
        this.celestialObjects.forEach(obj => {
            obj.rotation += obj.speed;
            obj.phase += obj.orbitSpeed;
        });

        // Update colored nebulas
        this.coloredNebulas.forEach(nebula => {
            nebula.rotation += nebula.speed;
        });

        // Draw twinkling stars
        this.stars.forEach(star => {
            const twinkle = Math.sin(Date.now() * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + twinkle * 0.5})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
            ctx.fill();
        });

        // Randomly add shooting stars
        if (Math.random() < 0.02) {
            this.shootingStars.push({
                x: Math.random() * ctx.canvas.width,
                y: 0,
                length: Math.random() * 100 + 50,
                speed: Math.random() * 15 + 10,
                angle: Math.PI / 4 + Math.random() * Math.PI / 8
            });
        }

        // Draw and update shooting stars
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        this.shootingStars = this.shootingStars.filter(star => {
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(star.x - Math.cos(star.angle) * star.length, 
                      star.y - Math.sin(star.angle) * star.length);
            ctx.stroke();

            star.x += Math.cos(star.angle) * star.speed;
            star.y += Math.sin(star.angle) * star.speed;

            return star.y < ctx.canvas.height && star.x > 0;
        });
    }

    animate() {
        // Update nebulas
        this.nebulas.forEach(nebula => {
            nebula.rotation += nebula.speed;
        });

        // Update star clusters
        this.starClusters.forEach(cluster => {
            cluster.rotation += cluster.speed;
        });

        // Draw on both canvases
        this.drawBackground(this.gameCtx);
        this.drawBackground(this.introCtx);

        requestAnimationFrame(() => this.animate());
    }
}

// Initialize space background when game starts
document.addEventListener('DOMContentLoaded', () => {
    new SpaceBackground();
    game = new Game();

    // Store category switching
    const categoryBtns = document.querySelectorAll('.category-btn');
    const storeItems = document.querySelectorAll('.store-item');

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show/hide items
            const category = btn.dataset.category;
            storeItems.forEach(item => {
                if (item.dataset.category === category) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });

    // Update store coins display
    const updateStoreCoins = () => {
        document.getElementById('storeTotalCoins').textContent = game.totalCoins;
    };

    // Update coins when store opens
    document.getElementById('storeButton').addEventListener('click', updateStoreCoins);
}); 