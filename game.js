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
        this.element.style.left = `${this.x}px`;
        this.element.style.bottom = `${this.y}px`;
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
        this.x = Math.max(0, this.x - this.speed);
        this.updatePosition();
    }

    moveRight() {
        const section = document.getElementById(`${this.side}Section`);
        const maxX = section.offsetWidth - this.element.offsetWidth;
        this.x = Math.min(maxX, this.x + this.speed);
        this.updatePosition();
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
    }

    init() {
        // Create characters
        this.characterA = new Character('left', 20, 20);
        this.characterB = new Character('right', 20, 20);

        // Set up controls
        this.setupControls();
        
        // Start game loop
        this.start();
    }

    setupControls() {
        // Handle keydown events
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            
            switch(e.key.toLowerCase()) {
                // WASD controls
                case 'a':
                case 'arrowleft':
                    this.keys.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = true;
                    break;
                case 'w':
                case 'arrowup':
                case ' ': // Spacebar
                    this.keys.jump = true;
                    this.characterA.jump();
                    break;
            }
        });

        // Handle keyup events
        document.addEventListener('keyup', (e) => {
            switch(e.key.toLowerCase()) {
                case 'a':
                case 'arrowleft':
                    this.keys.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = false;
                    break;
                case 'w':
                case 'arrowup':
                case ' ':
                    this.keys.jump = false;
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
    }

    update() {
        if (!this.isRunning) return;

        // Handle continuous movement based on key states
        if (this.keys.left) {
            this.characterA.moveLeft();
        }
        if (this.keys.right) {
            this.characterA.moveRight();
        }

        // Update character positions
        this.characterA.update();
        
        // Mirror character B's position
        const sectionA = document.getElementById('leftSection');
        const sectionB = document.getElementById('rightSection');
        const mirroredX = sectionB.offsetWidth - this.characterA.x - this.characterA.element.offsetWidth;
        
        this.characterB.x = mirroredX;
        this.characterB.y = this.characterA.y;
        this.characterB.updatePosition();

        // Continue the game loop
        requestAnimationFrame(() => this.update());
    }

    start() {
        this.isRunning = true;
        this.update();
    }

    pause() {
        this.isRunning = false;
    }

    restart() {
        // Reset character positions
        this.characterA.x = 20;
        this.characterA.y = 20;
        this.characterA.velocityY = 0;
        this.characterA.isJumping = false;
        this.characterA.updatePosition();

        this.characterB.x = 20;
        this.characterB.y = 20;
        this.characterB.velocityY = 0;
        this.characterB.isJumping = false;
        this.characterB.updatePosition();

        // Resume game if paused
        if (!this.isRunning) {
            this.start();
            document.getElementById('pauseButton').textContent = 'Pause';
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
}); 