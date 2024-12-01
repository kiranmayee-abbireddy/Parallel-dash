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
        this.createCharacter();
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
        if (!this.isJumping) {
            this.isJumping = true;
            this.velocityY = this.jumpForce;
        }
    }

    update() {
        // Apply gravity
        if (this.isJumping) {
            this.velocityY -= this.gravity;
            this.y += this.velocityY;

            // Check for ground collision
            if (this.y <= 20) { // 20px is platform height
                this.y = 20;
                this.velocityY = 0;
                this.isJumping = false;
            }

            this.updatePosition();
        }
    }

    moveLeft() {
        if (this.side === 'left') {
            this.x = Math.max(0, this.x - this.speed);
        } else {
            const section = document.getElementById('rightSection');
            const maxX = section.offsetWidth - this.element.offsetWidth;
            this.x = Math.min(maxX, this.x + this.speed);
        }
        this.updatePosition();
    }

    moveRight() {
        if (this.side === 'left') {
            const section = document.getElementById('leftSection');
            const maxX = section.offsetWidth - this.element.offsetWidth;
            this.x = Math.min(maxX, this.x + this.speed);
        } else {
            this.x = Math.max(0, this.x - this.speed);
        }
        this.updatePosition();
    }

    getBoundingBox() {
        return {
            left: this.x,
            right: this.x + this.element.offsetWidth,
            top: this.y + this.element.offsetHeight,
            bottom: this.y
        };
    }

    checkCollision(obstacle) {
        const charBox = this.getBoundingBox();
        const obstacleBox = {
            left: obstacle.offsetLeft,
            right: obstacle.offsetLeft + obstacle.offsetWidth,
            top: obstacle.offsetTop + obstacle.offsetHeight,
            bottom: obstacle.offsetTop
        };

        return !(charBox.left > obstacleBox.right || 
                charBox.right < obstacleBox.left || 
                charBox.top < obstacleBox.bottom || 
                charBox.bottom > obstacleBox.top);
    }

    die() {
        this.element.style.opacity = '0.5';
        this.isDead = true;
    }
}

class Game {
    constructor() {
        this.characterA = null;
        this.characterB = null;
        this.isRunning = false;
        this.keys = {
            left: false,
            right: false,
            jump: false
        };
        this.init();
        this.setupIntroScreen();
        this.pause(); // Start paused until player clicks start
    }

    init() {
        // Create characters with mirrored starting positions
        this.characterA = new Character('left', 20, 20);  // Left character starts from left
        
        // Get right section width for mirrored position
        const rightSection = document.getElementById('rightSection');
        const rightStartX = rightSection.offsetWidth - 60; // 20px from right edge (+ character width)
        this.characterB = new Character('right', rightStartX, 20);
        
        // Set up controls
        this.setupControls();
    }

    setupIntroScreen() {
        const introScreen = document.getElementById('introScreen');
        const startButton = document.getElementById('startButton');

        startButton.addEventListener('click', () => {
            introScreen.style.opacity = '0';
            setTimeout(() => {
                introScreen.style.display = 'none';
                this.start(); // Start game when player clicks start
            }, 500);
        });
    }

    start() {
        this.isRunning = true;
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
                    if (!this.characterA.isJumping) {
                        this.characterA.jump();
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
            }
        });

        // Pause button functionality
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

        // Restart button functionality
        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });

        // Home button functionality
        const homeButton = document.getElementById('homeButton');
        homeButton.addEventListener('click', () => {
            this.pause();
            if (confirm('Return to main menu? Current progress will be lost.')) {
                document.getElementById('introScreen').style.display = 'block';
                document.getElementById('introScreen').style.opacity = '1';
                this.reset();
            } else {
                this.start();
            }
        });
    }

    update() {
        if (!this.isRunning) return;

        // Handle movement
        if (this.keys.left) {
            this.characterA.moveLeft();
            this.characterB.moveLeft(); // Will move right due to mirroring
        }
        if (this.keys.right) {
            this.characterA.moveRight();
            this.characterB.moveRight(); // Will move left due to mirroring
        }

        // Update physics
        this.characterA.update();
        
        // Keep vertical movement in sync
        this.characterB.y = this.characterA.y;
        this.characterB.velocityY = this.characterA.velocityY;
        this.characterB.isJumping = this.characterA.isJumping;
        this.characterB.updatePosition();

        // Continue game loop
        requestAnimationFrame(() => this.update());
    }

    restart() {
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
        // Reset game state
        this.restart();
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
}); 