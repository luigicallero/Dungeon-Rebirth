//----------------------------------------
// CONFIGURACIÓN INICIAL DEL CANVAS
//----------------------------------------
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 1000;
canvas.height = 600;

const zoomLevel = 2; //ajustar el zoom

// Posición fija del jugador en el centro (independiente del zoom)
const playerX = 200;  // canvas.width / 4
const playerY = 112;  // canvas.height / 4

// Ajustar el offset inicial para que el jugador aparezca en la posición correcta del mapa
const offset = {
    x: 100,
    y: -1130
};

ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Variables globales
const texts = []; // Array para almacenar textos en pantalla
let isGameOver = false;
let timeBeforeRespawn = 180; // Modifica este valor para cambiar el tiempo de respawn (60 frames = 1 segundo)
const TOTAL_GAME_OVER_FRAMES = 11; // Total de frames en la animación de Game Over
let gameOverScreen = null;
let playerDamageFrames = 0; // Contador para los frames de daño

const gameObjects = {
    background: null, // Se inicializará después
    boundaries: [],
    doorBoundaries: [],
    blueKnights: [],
    // Aquí podemos añadir más tipos de objetos en el futuro
};

const bullets = [];
const playerBullets = []; // Array separado para las balas del jugador

// Clase base para todos los objetos del juego
class GameObject {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.originalX = x;
        this.originalY = y;
    }

    update() {
        // Método a ser sobrescrito por las clases hijas
    }

    draw() {
        // Método a ser sobrescrito por las clases hijas
    }

    reset() {
        this.x = this.originalX;
        this.y = this.originalY;
    }

    moveWithMap(dx, dy) {
        this.x += dx;
        this.y += dy;
    }
}

//----------------------------------------
// CONFIGURACIÓN DEL MAPA Y COLISIONES
//----------------------------------------

const collisionsMap = [];
for (let i = 0; i < collisions.length; i+= 192) {
    collisionsMap.push(collisions.slice(i, i + 192));
}

const doorCollisionsMap = [];
for (let i = 0; i < doorCollisions.length; i+= 192) {
    doorCollisionsMap.push(doorCollisions.slice(i, i + 192));
}

const velocity = 2;
let isPlayerInBattle = false;
//----------------------------------------
// CLASES
//----------------------------------------
class Boundary extends GameObject {
    static width = 16;
    static height = 16;
    
    constructor({position}) {
        super(position.x, position.y);
        this.width = Boundary.width;
        this.height = Boundary.height;
        this.position = position; // Mantener compatibilidad con código existente
    }

    moveWithMap(dx, dy) {
        super.moveWithMap(dx, dy);
        this.position.x = this.x;
        this.position.y = this.y;
    }

    reset() {
        super.reset();
        this.position.x = this.originalX;
        this.position.y = this.originalY;
    }

    draw() {
        ctx.fillStyle = "rgba(255, 0, 0, 0.0)";
        ctx.fillRect(
            this.position.x,
            this.position.y,
            this.width,
            this.height
        );
    }
}

class DoorBoundary extends GameObject {
    static width = 16;
    static height = 16;
    
    constructor({position}) {
        super(position.x, position.y);
        this.width = DoorBoundary.width;
        this.height = DoorBoundary.height;
        this.position = position; // Mantener compatibilidad con código existente
    }

    moveWithMap(dx, dy) {
        super.moveWithMap(dx, dy);
        this.position.x = this.x;
        this.position.y = this.y;
    }

    reset() {
        super.reset();
        this.position.x = this.originalX;
        this.position.y = this.originalY;
    }

    draw() {
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.fillRect(
            this.position.x,
            this.position.y,
            this.width,
            this.height
        );
    }
}

// Modificar la clase Sprite para heredar de GameObject
class Sprite extends GameObject {
    constructor({position, image}) {
        super(position.x, position.y);
        this.position = position;
        this.image = image;
    }

    draw() {
        ctx.drawImage(
            this.image,
            this.position.x,
            this.position.y
        );
    }

    moveWithMap(dx, dy) {
        super.moveWithMap(dx, dy);
        this.position.x = this.x;
        this.position.y = this.y;
    }

    reset() {
        super.reset();
        this.position.x = this.originalX;
        this.position.y = this.originalY;
    }
}

//----------------------------------------
// CONFIGURACIÓN DE LÍMITES (BOUNDARIES)
//----------------------------------------
collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 257) {
            const boundary = new Boundary({
                position: {
                    x: j * Boundary.width + offset.x,
                    y: i * Boundary.height + offset.y
                }
            });
            gameObjects.boundaries.push(boundary);
        }
    });
});

const doorBoundaries = [];

doorCollisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 257) {
            const doorBoundary = new DoorBoundary({position: {x: j * DoorBoundary.width + offset.x, y: i * DoorBoundary.height + offset.y}});
            gameObjects.doorBoundaries.push(doorBoundary);
        }
    });
});

//----------------------------------------
// CARGA DE IMÁGENES Y RECURSOS
//----------------------------------------
const mapImg = new Image();
mapImg.src = "img/Level Map.png";

const playerImg = new Image();
playerImg.src = "img/PlayerChris.png";

let gameImages;
let background;
let currentFrame = 0;
let frameCounter = 0;
let lastDirection = 'down';
let isMoving = false;
const FRAME_DELAY = 8; // Ajusta este valor para controlar la velocidad de la animación

function loadImages(sources, callback) {
    let loadedImages = 0;
    const images = {};

    function imageLoaded() {
        loadedImages++;
        if (loadedImages >= Object.keys(sources).length) {
            callback(images);
        }
    }

    for (let src in sources) {
        images[src] = new Image();
        images[src].onload = imageLoaded;
        images[src].src = sources[src];
    }
}

const sources = {
    map: "img/Level Map.png",
    player: "img/PlayerChris.png",
    gameOver: "img/UI/GameOverScreen.png",
    health: "img/playerLives.png",
    bullet: "img/bullet.png",
    playerBullet: "img/playerBullet.png"
};

//----------------------------------------
// SISTEMA DE COLISIONES
//----------------------------------------
function rectangularCollision({rectangle1, rectangle2}) {
    const leftMargin = 4;
    const topMargin = 10;
    const rightMargin = -1;
    const bottomMargin = 0;
    
    return (
        rectangle1.position.x + rectangle1.width - rightMargin >= rectangle2.position.x &&
        rectangle1.position.x + leftMargin <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y + rectangle1.height - bottomMargin >= rectangle2.position.y &&
        rectangle1.position.y + topMargin <= rectangle2.position.y + rectangle2.height
    );
}

//----------------------------------------
// SISTEMA DE CONTROL DE TECLAS
//----------------------------------------
const keys = {
    w: false,
    s: false,
    a: false,
    d: false
};

window.addEventListener("keydown", (e) => {
    // Si el juego está en game over, ignorar inputs
    if (isGameOver) return;

    if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        switch (e.key.toLowerCase()) {
            case "w": keys.w = true; break;
            case "s": keys.s = true; break;  
            case "a": keys.a = true; break;
            case "d": keys.d = true; break;
        }
    }
    if (e.key.toLowerCase() === 'e') {
        isPlayerInBattle = !isPlayerInBattle; // Alterna entre true y false
    }
    if (e.key.toLowerCase() === 'o') {
        playerHealth.takeDamage(1);
    }
    if (e.key.toLowerCase() === 'p') {
        playerHealth.heal(1);
    }
});

window.addEventListener("keyup", (e) => {
    switch (e.key.toLowerCase()) {
        case "w": keys.w = false; break;
        case "s": keys.s = false; break;  
        case "a": keys.a = false; break;
        case "d": keys.d = false; break;
    }
});

//----------------------------------------
// BUCLES DE JUEGO Y ACTUALIZACIÓN
//----------------------------------------
function Update() {
    if (isGameOver) {
        if (timeBeforeRespawn > 0) {
            timeBeforeRespawn--;
            
            // Calcular el frame actual basado en el tiempo restante
            const frameIndex = Math.floor(
                (1 - timeBeforeRespawn / ORIGINAL_TIME) * TOTAL_GAME_OVER_FRAMES
            );
            
            const row = Math.floor(frameIndex / 3);
            const col = frameIndex % 3;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(
                gameImages.gameOver,
                col * (gameImages.gameOver.width / 3),
                row * (gameImages.gameOver.height / 4),
                gameImages.gameOver.width / 3,
                gameImages.gameOver.height / 4,
                0,
                0,
                canvas.width / zoomLevel,
                canvas.height / zoomLevel
            );
        } else {
            resetGame();
        }
        
        window.requestAnimationFrame(Update);
        return;
    }
    
    // Calcular las coordenadas del mundo
    const worldX = -background.position.x + playerX;
    const worldY = -background.position.y + playerY;
    
    // // Mostrar coordenadas del jugador en consola
    // console.log(`======================== x: ${Math.round(worldX)}, y: ${Math.round(worldY)}`);
    
    ctx.clearRect(0, 0, canvas.width / zoomLevel, canvas.height / zoomLevel);
    
    const canMove = {
        up: true,
        down: true,
        left: true,
        right: true
    };
    
    // hitbox del jugador
    const player = {
        position: {
            x: playerX + 7,
            y: playerY + 8
        },
        width: 12,
        height: 17
    };

    // Verificar colisiones
    gameObjects.boundaries.forEach(boundary => {
        if(rectangularCollision({
            rectangle1: {
                ...player,
                position: {
                    x: playerX,
                    y: playerY - velocity
                }
            },
            rectangle2: boundary
        })) {
            canMove.up = false;
        }
        
        if(rectangularCollision({
            rectangle1: {
                ...player,
                position: {
                    x: playerX,
                    y: playerY + velocity
                }
            },
            rectangle2: boundary
        })) {
            canMove.down = false;
        }
        
        if(rectangularCollision({
            rectangle1: {
                ...player,
                position: {
                    x: playerX - velocity,
                    y: playerY
                }
            },
            rectangle2: boundary
        })) {
            canMove.left = false;
        }
        
        if(rectangularCollision({
            rectangle1: {
                ...player,
                position: {
                    x: playerX + velocity,
                    y: playerY
                }
            },
            rectangle2: boundary
        })) {
            canMove.right = false;
        }
    });

    if (isPlayerInBattle) {
        // Verificar si la ronda actual está completa
        roomManager.checkWaveCompletion();
        
        // Añadir verificación de colisiones para puertas
        gameObjects.doorBoundaries.forEach(doorBoundary => {
            if(rectangularCollision({
                rectangle1: {
                    ...player,
                    position: {
                        x: playerX,
                        y: playerY - velocity
                    }
                },
                rectangle2: doorBoundary
            })) {
                canMove.up = false;
                // Aquí puedes añadir lógica adicional para cuando el jugador toca una puerta
            }
            
            if(rectangularCollision({
                rectangle1: {
                    ...player,
                    position: {
                        x: playerX,
                        y: playerY + velocity
                    }
                },
                rectangle2: doorBoundary
            })) {
                canMove.down = false;
                // Aquí puedes añadir lógica adicional para cuando el jugador toca una puerta
            }
            
            if(rectangularCollision({
                rectangle1: {
                    ...player,
                    position: {
                        x: playerX - velocity,
                        y: playerY
                    }
                },
                rectangle2: doorBoundary
            })) {
                canMove.left = false;
                // Aquí puedes añadir lógica adicional para cuando el jugador toca una puerta
            }
            
            if(rectangularCollision({
                rectangle1: {
                    ...player,
                    position: {
                        x: playerX + velocity,
                        y: playerY
                    }
                },
                rectangle2: doorBoundary
            })) {
                canMove.right = false;
                // Aquí puedes añadir lógica adicional para cuando el jugador toca una puerta
            }
        });
    }

    if (gameImages) {
        gameObjects.background.draw();
        gameObjects.boundaries.forEach((boundary) => {
            boundary.draw();
        });

        // Actualizar y dibujar balas del jugador (fuera del bloque isPlayerInBattle)
        for (let i = playerBullets.length - 1; i >= 0; i--) {
            playerBullets[i].update();
            
            // Verificar colisiones con enemigos
            let bulletHitEnemyFlag = false;
            if (isPlayerInBattle) {
                for (const knight of gameObjects.blueKnights) {
                    if (!knight.isDead && bulletHitEnemy(playerBullets[i], knight)) {
                        knight.takeDamage(1);
                        bulletHitEnemyFlag = true;
                        break;
                    }
                }
            }
            
            if (bulletHitEnemyFlag) {
                playerBullets.splice(i, 1);
                continue;
            }
            
            // Verificar colisiones con boundaries
            let bulletHitBoundary = false;
            
            // Verificar colisiones con paredes normales
            for (const boundary of gameObjects.boundaries) {
                if (bulletCollision(playerBullets[i], boundary)) {
                    bulletHitBoundary = true;
                    break;
                }
            }
            
            // Verificar colisiones con puertas
            if (!bulletHitBoundary && isPlayerInBattle) {
                for (const door of gameObjects.doorBoundaries) {
                    if (bulletCollision(playerBullets[i], door)) {
                        bulletHitBoundary = true;
                        break;
                    }
                }
            }
            
            // Si la bala golpeó algo o está muy lejos, eliminarla
            const distanceFromPlayer = Math.hypot(
                playerBullets[i].x - playerX,
                playerBullets[i].y - playerY
            );
            
            if (bulletHitBoundary || distanceFromPlayer > 500) {
                playerBullets.splice(i, 1);
                continue;
            }
            
            playerBullets[i].draw(ctx);
        }

        // Solo dibujar las puertas y caballeros si el jugador está en batalla
        if (isPlayerInBattle) {
            gameObjects.doorBoundaries.forEach((doorBoundary) => {
                doorBoundary.draw();
            });
            
            // Actualizar y dibujar todos los caballeros
            gameObjects.blueKnights.forEach(knight => {
                knight.update();
                knight.draw(ctx);
            });
            
            // Actualizar y dibujar balas enemigas
            for (let i = bullets.length - 1; i >= 0; i--) {
                bullets[i].update();
                
                // Verificar si la bala golpea al jugador
                if (bulletHitPlayer(bullets[i])) {
                    playerHealth.takeDamage(1);
                    playerDamageFrames = 10; // Cambiar a 10 frames de daño
                    bullets.splice(i, 1);
                    continue;
                }
                
                // Verificar colisiones con boundaries
                let bulletHitBoundary = false;
                
                // Verificar colisiones con paredes normales
                for (const boundary of gameObjects.boundaries) {
                    if (bulletCollision(bullets[i], boundary)) {
                        bulletHitBoundary = true;
                        break;
                    }
                }
                
                // Verificar colisiones con puertas
                if (!bulletHitBoundary && isPlayerInBattle) {
                    for (const door of gameObjects.doorBoundaries) {
                        if (bulletCollision(bullets[i], door)) {
                            bulletHitBoundary = true;
                            break;
                        }
                    }
                }
                
                // Si la bala golpeó algo o está muy lejos, eliminarla
                const distanceFromPlayer = Math.hypot(
                    bullets[i].x - playerX,
                    bullets[i].y - playerY
                );
                
                if (bulletHitBoundary || distanceFromPlayer > 500) {
                    bullets.splice(i, 1);
                    continue;
                }
                
                bullets[i].draw(ctx);
            }
        }
        
        const spriteWidth = 19;
        const spriteHeight = 20;
        
        // Determinar dirección y actualizar frames
        isMoving = false;
        if (keys.a && canMove.left) {
            isMoving = true;
        } else if (keys.d && canMove.right) {
            isMoving = true;
        } else if (keys.w && canMove.up) {
            isMoving = true;
        } else if (keys.s && canMove.down) {
            isMoving = true;
        }

        // Calcular la dirección basada en el mouse
        if (!isGameOver) {
            const dx = mouseX - playerX;
            const dy = mouseY - playerY;
            
            // Calcular el ángulo entre el jugador y el mouse
            const angle = Math.atan2(dy, dx);
            const degrees = angle * (180 / Math.PI);
            
            // Determinar la dirección basada en el ángulo
            if (degrees >= -45 && degrees < 45) {
                lastMouseDirection = 'right';
            } else if (degrees >= 45 && degrees < 135) {
                lastMouseDirection = 'down';
            } else if (degrees >= -135 && degrees < -45) {
                lastMouseDirection = 'up';
            } else {
                lastMouseDirection = 'left';
            }
        }

        // Actualizar frame counter y current frame
        if (isMoving) {
            frameCounter++;
            if (frameCounter >= FRAME_DELAY) {
                frameCounter = 0;
                currentFrame = (currentFrame + 1) % 6;
            }
        } else {
            currentFrame = 1; // Frame estático cuando no se mueve
        }

        // Determinar fila y columna del sprite
        let row, column;
        if (playerDamageFrames > 0) {
            row = 8;
            column = 0;
            playerDamageFrames--;
        } else {
            // Usar la dirección del mouse en lugar de lastDirection
            switch (lastMouseDirection) {
                case 'left':
                    row = 6;
                    break;
                case 'right':
                    row = 7;
                    break;
                case 'up':
                    row = 4;
                    break;
                case 'down':
                    row = 5;
                    break;
            }
            column = isMoving ? currentFrame : 1;
        }

        ctx.drawImage(
            gameImages.player,
            column * spriteWidth,
            row * spriteHeight,
            spriteWidth,
            spriteHeight,
            playerX,
            playerY,
            spriteWidth,
            spriteHeight
        );

        // Dibujar la barra de vida (siempre visible)
        playerHealth.draw(ctx);
    }

    // Actualizar la posición de todos los caballeros cuando el jugador se mueve
    if(keys.w && canMove.up) {
        moveAllObjects(0, velocity);
    }
    
    if(keys.s && canMove.down) {
        moveAllObjects(0, -velocity);
    }
    
    if(keys.a && canMove.left) {
        moveAllObjects(velocity, 0);
    }
    
    if(keys.d && canMove.right) {
        moveAllObjects(-velocity, 0);
    }

    // Añadir la verificación de entrada a la sala
    checkRoomEntry();

    // Dibujar textos (solo si hay textos para mostrar)
    if (texts.length > 0) {
        texts.forEach((text, index) => {
            const x = 10;
            const y = 15 + (index * 15);
            ctx.strokeText(text, x, y);
            ctx.fillText(text, x, y);
        });
    }
    
    // Restaurar el estado del contexto
    ctx.restore();
    
    window.requestAnimationFrame(Update);
}

function gameLoop() {
    requestAnimationFrame(gameLoop);
}

//----------------------------------------
// INICIALIZACIÓN DEL JUEGO
//----------------------------------------
loadImages(sources, (images) => {
    gameImages = images;
    
    gameObjects.background = new Sprite({
        position: {
            x: offset.x,
            y: offset.y
        },
        image: gameImages.map
    });
    
    // Ya no necesitamos la variable background global
    background = gameObjects.background;
    
    gameObjects.boundaries.forEach(boundary => {
        boundary.originalX = boundary.position.x;
        boundary.originalY = boundary.position.y;
    });
    
    ctx.imageSmoothingEnabled = false;
    ctx.scale(zoomLevel, zoomLevel);
    Update();
});

//----------------------------------------
// DEFINICIÓN DE LAS SALAS
//----------------------------------------
const rooms = [
    {
        id: 1, // primera sala
        bounds: {
            x1: 254,  
            y1: 1127,
            x2: 466,
            y2: 1341
        },
        isCleared: false,
        isActive: false
    },
    {
        id: 2, // segunda sala
        bounds: {
            x1: 654,  
            y1: 1175,
            x2: 866,
            y2: 1357
        },
        isCleared: false,
        isActive: false
    },
    {
        id: 3, // tercera sala
        bounds: {
            x1: 1054,  
            y1: 1079,
            x2: 1266,
            y2: 1291
        },
        isCleared: false,
        isActive: false
    },
    {
        id: 4, // cuarta sala
        bounds: {
            x1: 1086,  
            y1: 1431,
            x2: 1234,
            y2: 1597
        },
        isCleared: false,
        isActive: false
    },
    {
        id: 5, // quinta sala
        bounds: {
            x1: 1502,  
            y1: 1511,
            x2: 1714,
            y2: 1693
        },
        isCleared: false,
        isActive: false
    },
    {
        id: 6, // sexta sala
        bounds: {
            x1: 1838,  
            y1: 1255,
            x2: 2146,
            y2: 1453
        },
        isCleared: false,
        isActive: false
    },
    {
        id: 7, // séptima sala
        bounds: {
            x1: 1886,  
            y1: 919,
            x2: 2098,
            y2: 1117
        },
        isCleared: false,
        isActive: false
    },
    {// esta sala no esta apropiadamente definida, pero eso no deberia cambiar nada
        id: 8, // octava sala
        bounds: {
            x1: 1390,  
            y1: 743,
            x2: 1666,
            y2: 829
        },
        isCleared: false,
        isActive: false
    },
    {
        id: 9, // novena sala
        bounds: {
            x1: 958,  
            y1: 631,
            x2: 1186,
            y2: 845
        },
        isCleared: false,
        isActive: false
    },
    {
        id: 10, // décima sala
        bounds: {
            x1: 2462,  
            y1: 199,
            x2: 2898,
            y2: 317
        },
        isCleared: false,
        isActive: false
    }
];

let currentRoom = null;

function checkRoomEntry() {
    // Convertir la posición del jugador al sistema de coordenadas del mundo
    const worldX = -background.position.x + playerX;
    const worldY = -background.position.y + playerY;

    rooms.forEach(room => {
        if (worldX >= room.bounds.x1 && worldX <= room.bounds.x2 &&
            worldY >= room.bounds.y1 && worldY <= room.bounds.y2) {
            
            // Si el jugador entra en una nueva sala no limpiada
            if (!room.isActive && !room.isCleared) {
                console.log('¡Jugador entró en la sala!'); // Para debugging
                room.isActive = true;
                isPlayerInBattle = true;
                roomManager.startRoom(room.id);
            }
        }
    });
}

gameLoop();

class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isAlive = true;
        this.health = 100;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.isAlive = false;
        }
    }
    
    update() {
        if (!this.isAlive) return;
        // Lógica de movimiento y comportamiento del enemigo
    }
    
    draw() {
        if (!this.isAlive) return;
        // Lógica para dibujar el enemigo
    }
}

//----------------------------------------
// CLASE BLUEKNIGHT (ENEMIGO)
//----------------------------------------
class BlueKnight extends GameObject {
    constructor(x, y) {
        super(x, y);
        // Posición y dimensiones
        this.width = 16;
        this.height = 17;
        this.speed = 1;
        
        // Animación
        this.frameX = 0;
        this.frameY = 0;
        this.frameCount = 8;
        this.frameDelay = 4;
        this.frameTimer = 0;
        
        // Estado
        this.hasSeenPlayer = false;
        
        // Rangos de comportamiento
        this.activationRange = 60;    // Se aleja si el jugador está más cerca
        this.chaseRange = 100;        // Rango para perseguir
        this.detectionRange = 150;    // Rango inicial de detección
        
        // Sprite
        this.sprite = new Image();
        this.sprite.src = 'img/BlueKnight.png';
        
        // Añadir variable para el movimiento aleatorio
        this.currentEvasionDirection = null;
        this.directionChangeTimer = 0;
        this.directionChangeCooldown = 30; // Frames antes de poder cambiar de dirección
        
        // Añadir variables para el disparo
        this.shootTimer = 0; // Frames antes de poder disparar
        this.shootInterval = 70; // Disparar cada 26 frames
        
        // Añadir variables de vida y daño
        this.maxHealth = 6;  // Vida inicial del enemigo <--------------------- VIDA DEL ENEMIGO
        this.currentHealth = this.maxHealth;
        this.damageFrames = 0;  // Contador para los frames de daño
        this.isDead = false;  // Para controlar si el enemigo está muerto
    }
    
    update() {
        if (this.isDead) return;  // No actualizar si está muerto

        const playerWorldX = -background.position.x + playerX;
        const playerWorldY = -background.position.y + playerY;
        const enemyWorldX = this.x - background.position.x;
        const enemyWorldY = this.y - background.position.y;
        
        const dx = playerWorldX - enemyWorldX;
        const dy = playerWorldY - enemyWorldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= this.detectionRange) {
            this.hasSeenPlayer = true;
        }

        if (this.hasSeenPlayer) {
            this.handleMovement(distance, dx, dy);
            
            // Solo disparar si el enemigo está activo y en rango
            this.shootTimer++;
            if (this.shootTimer >= this.shootInterval && distance <= this.detectionRange) {
                this.shoot();
                this.shootTimer = 0;
            }
        } else {
            // Animación inicial antes de detectar al jugador
            this.setIdleAnimation(dx, dy);
        }
        
        this.updateAnimation();
    }
    
    handleMovement(distance, dx, dy) {
        const angle = Math.atan2(dy, dx);
        let moveX = 0;
        let moveY = 0;
        let isMoving = false;

        if (distance < this.activationRange) {
            // Alejándose del jugador de manera aleatoria
            this.directionChangeTimer++;
            
            // Elegir nueva dirección si no hay una o si pasó el cooldown
            if (!this.currentEvasionDirection || this.directionChangeTimer >= this.directionChangeCooldown) {
                this.chooseEvasionDirection(dx, dy);
                this.directionChangeTimer = 0;
            }
            
            // Aplicar el movimiento según la dirección elegida
            const evasionSpeed = this.speed * 1.2; // Ligero boost al evadir
            switch (this.currentEvasionDirection) {
                case 'up':
                    moveX = -Math.cos(angle) * 0.5;
                    moveY = -1;
                    break;
                case 'down':
                    moveX = -Math.cos(angle) * 0.5;
                    moveY = 1;
                    break;
                case 'left':
                    moveX = -1;
                    moveY = -Math.sin(angle) * 0.5;
                    break;
                case 'right':
                    moveX = 1;
                    moveY = -Math.sin(angle) * 0.5;
                    break;
            }
            
            this.x += moveX * evasionSpeed;
            this.y += moveY * evasionSpeed;
            isMoving = true;
        } 
        else if (distance > this.chaseRange) {
            // Persiguiendo al jugador (movimiento directo)
            moveX = Math.cos(angle);
            moveY = Math.sin(angle);
            
            this.x += moveX * this.speed;
            this.y += moveY * this.speed;
            isMoving = true;
        } 
        else {
            // En rango óptimo - idle mirando al jugador
            this.currentEvasionDirection = null;
            this.setIdleAnimation(dx, dy);
            return;
        }

        // Actualizar animación según el movimiento real
        if (isMoving) {
            this.setMovementAnimation(moveX, moveY);
        }
    }
    
    chooseEvasionDirection(dx, dy) {
        // Determinar si el jugador está más cerca horizontal o verticalmente
        if (Math.abs(dx) > Math.abs(dy)) {
            // Jugador se acerca horizontalmente - evadir vertical
            this.currentEvasionDirection = Math.random() < 0.5 ? 'up' : 'down';
        } else {
            // Jugador se acerca verticalmente - evadir horizontal
            this.currentEvasionDirection = Math.random() < 0.5 ? 'left' : 'right';
        }
    }
    
    setMovementAnimation(moveX, moveY) {
        // Determinar la dirección del movimiento basado en el vector de movimiento
        if (Math.abs(moveX) > Math.abs(moveY)) {
            // Movimiento horizontal
            this.frameY = moveX > 0 ? 5 : 6; // derecha : izquierda
        } else {
            // Movimiento vertical
            this.frameY = moveY > 0 ? 7 : 4; // abajo : arriba
        }
    }
    
    setIdleAnimation(dx, dy) {
        // Determinar la dirección basada en la posición relativa del jugador
        if (Math.abs(dx) > Math.abs(dy)) {
            // Jugador está más lejos horizontalmente
            this.frameY = dx > 0 ? 1 : 2; // derecha : izquierda
        } else {
            // Jugador está más lejos verticalmente
            this.frameY = dy > 0 ? 0 : 3; // abajo : arriba
        }
    }
    
    updateAnimation() {
        this.frameTimer++;
        if (this.frameTimer >= this.frameDelay) {
            this.frameTimer = 0;
            this.frameX = (this.frameX + 1) % this.frameCount;
        }
    }
    
    draw(ctx) {
        if (this.isDead) return;  // No dibujar si está muerto

        ctx.drawImage(
            this.sprite,
            (this.damageFrames > 0 ? 0 : this.frameX) * this.width,  // Columna 1 para el frame de daño
            (this.damageFrames > 0 ? 8 : this.frameY) * this.height,  // Fila 8 para el frame de daño
            this.width,
            this.height,
            this.x,
            this.y,
            this.width,
            this.height
        );

        if (this.damageFrames > 0) {
            this.damageFrames--;
        }
    }

    moveWithMap(dx, dy) {
        super.moveWithMap(dx, dy);
        // No necesitamos actualizar this.position ya que usamos x,y directamente
    }
    
    shoot() {
        const playerWorldX = -background.position.x + playerX;
        const playerWorldY = -background.position.y + playerY;
        const enemyWorldX = this.x - background.position.x;
        const enemyWorldY = this.y - background.position.y;
        
        const dx = playerWorldX - enemyWorldX;
        const dy = playerWorldY - enemyWorldY;
        const angle = Math.atan2(dy, dx);
        
        bullets.push(new Bullet(
            this.x + this.width/2,
            this.y + this.height/2,
            angle,
            gameImages.bullet,
            'enemy'
        ));
    }

    // Añadir método para recibir daño
    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.damageFrames = 10;  // Activar frames de daño
        
        if (this.currentHealth <= 0) {
            this.isDead = true;
        }
    }
}

//----------------------------------------
// INSTANCIAS DE ENEMIGOS
//----------------------------------------
// Definir las posiciones de spawn de los caballeros
const knightSpawnPoints = [
    { x: 286, y: 1156 },  // Posición original
    { x: 442, y: 1168 },  // Nueva posición
    { x: 360, y: 1324 }   // Otra posición
];

// Crear los caballeros en sus posiciones
knightSpawnPoints.forEach(spawn => {
    gameObjects.blueKnights.push(
        new BlueKnight(
            spawn.x + offset.x,
            spawn.y + offset.y
        )
    );
});

//----------------------------------------
// CLASE HEALTHBAR
//----------------------------------------
class HealthBar {
    constructor() {
        this.maxHealth = 10;
        this.currentHealth = this.maxHealth;
        
        // Actualizar dimensiones para la nueva spritesheet
        this.frameWidth = 39;    // 78/2 (2 columnas)
        this.frameHeight = 6;  // 36/5 (5 filas)
        
        // Factor de escala para la barra de vida
        this.scale = 2;
        
        // Posición en pantalla
        this.x = 10 / zoomLevel;
        this.y = 10 / zoomLevel;
    }

    draw(ctx) {
        // Calcular qué frame mostrar basado en la vida actual
        const frameIndex = this.maxHealth - this.currentHealth;
        
        // Calcular la fila y columna en la spritesheet
        const row = Math.floor(frameIndex / 2);  // 2 columnas
        const col = frameIndex % 2;              // 2 columnas
        
        ctx.drawImage(
            gameImages.health,
            col * this.frameWidth,           // sourceX
            row * this.frameHeight,          // sourceY
            this.frameWidth,                 // sourceWidth
            this.frameHeight,                // sourceHeight
            this.x,                          // destinationX
            this.y,                          // destinationY
            this.frameWidth * this.scale,    // destinationWidth
            this.frameHeight * this.scale    // destinationHeight
        );
    }

    takeDamage(amount) {
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        if (this.currentHealth <= 0) {
            isGameOver = true;
        }
    }

    heal(amount) {
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    }
}

//----------------------------------------
// INICIALIZACIÓN DEL JUEGO (modificar)
//----------------------------------------
// Añadir la barra de vida como variable global
const playerHealth = new HealthBar();

function resetGame() {
    isGameOver = false;
    isPlayerInBattle = false;
    playerHealth.currentHealth = playerHealth.maxHealth;
    timeBeforeRespawn = ORIGINAL_TIME; // Restaurar al valor original
    
    // Reiniciar posición del mapa
    offset.x = 100;
    offset.y = -1130;
    
    // Reiniciar todos los objetos del juego
    Object.values(gameObjects).forEach(objectGroup => {
        if (Array.isArray(objectGroup)) {
            objectGroup.forEach(obj => {
                obj.reset();
                if (obj instanceof BlueKnight) {
                    obj.currentHealth = obj.maxHealth;
                    obj.isDead = false;
                    obj.damageFrames = 0;
                }
            });
        } else if (objectGroup && typeof objectGroup.reset === 'function') {
            objectGroup.reset();
        }
    });
    
    // Reiniciar estado de las salas
    rooms.forEach(room => {
        room.isCleared = false;
        room.isActive = false;
    });
    // Reiniciar estado de las rondas
    roomManager.currentRoom = null;
    roomManager.currentWave = 0;
    roomManager.isWaveActive = false;
    
    // Limpiar arrays de balas
    bullets.length = 0;
    playerBullets.length = 0;
    playerDamageFrames = 0;
}

// Modificar la función que mueve los objetos cuando el jugador se mueve
function moveAllObjects(dx, dy) {
    Object.values(gameObjects).forEach(objectGroup => {
        if (Array.isArray(objectGroup)) {
            objectGroup.forEach(obj => obj.moveWithMap(dx, dy));
        } else if (objectGroup && typeof objectGroup.moveWithMap === 'function') {
            objectGroup.moveWithMap(dx, dy);
        }
    });
    
    // Mover las balas con el mapa
    bullets.forEach(bullet => bullet.moveWithMap(dx, dy));
    playerBullets.forEach(bullet => bullet.moveWithMap(dx, dy));
}

//----------------------------------------
// SISTEMA DE COLISIONES DE BALAS
//----------------------------------------
function bulletCollision(bullet, boundary) {
    return (
        bullet.x + bullet.width >= boundary.position.x &&
        bullet.x <= boundary.position.x + boundary.width &&
        bullet.y + bullet.height >= boundary.position.y &&
        bullet.y <= boundary.position.y + boundary.height
    );
}

//----------------------------------------
// CLASE BULLET
//----------------------------------------
class Bullet extends GameObject {
    // Configuraciones predeterminadas para diferentes tipos de balas
    static BULLET_TYPES = {
        enemy: {
            speed: 1.5,
            width: 10,
            height: 6
        },
        player: {
            speed: 4,  // Bala del jugador más rápida
            width: 10,
            height: 6
        }
    };

    constructor(x, y, angle, image, type = 'enemy') {
        super(x, y);
        const config = Bullet.BULLET_TYPES[type];
        this.speed = config.speed;
        this.angle = angle;
        this.image = image;
        this.width = config.width;
        this.height = config.height;
        this.type = type;
        
        // Calcular velocidades basadas en el ángulo
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }
    
    //----------------------------------------
    // ACTUALIZACIÓN DE LA BALA
    //----------------------------------------
    update() {
        this.x += this.vx;
        this.y += this.vy;
    }
    
    //----------------------------------------
    // RENDERIZADO DE LA BALA
    //----------------------------------------
    draw(ctx) {
        // Guardar el contexto actual
        ctx.save();
        
        // Trasladar al centro de la bala
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        // Rotar según el ángulo
        ctx.rotate(this.angle);
        
        // Dibujar la bala centrada
        ctx.drawImage(
            this.image,
            -this.width/2,
            -this.height/2,
            this.width,
            this.height
        );
        
        // Restaurar el contexto
        ctx.restore();
    }
    
    //----------------------------------------
    // MOVIMIENTO CON EL MAPA
    //----------------------------------------
    moveWithMap(dx, dy) {
        super.moveWithMap(dx, dy);
    }
}

// Primero, añadamos una función para detectar colisiones entre balas y jugador
function bulletHitPlayer(bullet) {
    const playerHitbox = {
        x: playerX + 7,      // Mismo offset que usamos para otras colisiones
        y: playerY + 8,
        width: 12,           // Mismo tamaño que usamos para otras colisiones
        height: 17
    };
    
    return (
        bullet.x + bullet.width >= playerHitbox.x &&
        bullet.x <= playerHitbox.x + playerHitbox.width &&
        bullet.y + bullet.height >= playerHitbox.y &&
        bullet.y <= playerHitbox.y + playerHitbox.height
    );
}

// Al inicio del juego, guardar el tiempo original
const ORIGINAL_TIME = timeBeforeRespawn;

// Añadir cerca de las otras variables globales
let mouseX = 0;
let mouseY = 0;
let lastMouseDirection = 'down'; // Dirección por defecto

// Añadir después de los otros event listeners
canvas.addEventListener('mousemove', (e) => {
    // Obtener la posición real del mouse en el canvas considerando el zoom
    const rect = canvas.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) / zoomLevel;
    mouseY = (e.clientY - rect.top) / zoomLevel;
});

// Añadir después del event listener del mouse
canvas.addEventListener('click', (e) => {
    if (isGameOver) return;
    
    // Obtener la posición real del mouse en el canvas
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / zoomLevel;
    const clickY = (e.clientY - rect.top) / zoomLevel;
    
    // Calcular el ángulo entre el jugador y el click
    const dx = clickX - playerX;
    const dy = clickY - playerY;
    const angle = Math.atan2(dy, dx);
    
    // Crear nueva bala desde el centro del jugador usando la imagen precargada
    const bullet = new Bullet(
        playerX + 9.5,
        playerY + 10,
        angle,
        gameImages.playerBullet,
        'player'
    );
    
    playerBullets.push(bullet);
});

// Añadir función para detectar colisiones entre balas y enemigos
function bulletHitEnemy(bullet, enemy) {
    return (
        bullet.x + bullet.width >= enemy.x &&
        bullet.x <= enemy.x + enemy.width &&
        bullet.y + bullet.height >= enemy.y &&
        bullet.y <= enemy.y + enemy.height
    );
}

//----------------------------------------
// CONFIGURACIÓN DE RONDAS POR SALA
//----------------------------------------
const roomWaves = { //============================================================ MODIFICAR OLEADAS
    1: [ // Sala 1
        { // Ronda 1
            enemies: [
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) },
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) },
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) }
            ]
        },
        { // Ronda 2
            enemies: [
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) },
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) },
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) },
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) }
            ]
        },
        { // Ronda 3
            enemies: [
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) },
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) },
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) },
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) },
                { type: 'BlueKnight', x: Math.floor(Math.random() * (466-254) + 254), y: Math.floor(Math.random() * (1341-1127) + 1127) }
            ]
        }
    ]
    // Puedes añadir más salas siguiendo el mismo formato
    // 2: [ ... ],
    // 3: [ ... ],
};

// Modificar la clase Room para manejar las rondas
class RoomManager {
    constructor() {
        this.currentRoom = null;
        this.currentWave = 0;
        this.isWaveActive = false;
    }

    startRoom(roomId) {
        this.currentRoom = roomId;
        this.currentWave = 0;
        this.startNextWave();
    }

    startNextWave() {
        if (!this.currentRoom || !roomWaves[this.currentRoom]) return;

        const waves = roomWaves[this.currentRoom];
        if (this.currentWave >= waves.length) {
            // Todas las rondas completadas
            this.completeRoom();
            return;
        }

        // Limpiar enemigos anteriores
        gameObjects.blueKnights = [];

        // Spawner enemigos de la ronda actual
        const wave = waves[this.currentWave];
        wave.enemies.forEach((enemy, index) => {
            if (enemy.type === 'BlueKnight') {
                // Convertir coordenadas del mundo a coordenadas de pantalla
                const screenX = enemy.x + background.position.x;
                const screenY = enemy.y + background.position.y;
                
                const knight = new BlueKnight(
                    screenX,
                    screenY
                );
                
                gameObjects.blueKnights.push(knight);
                console.log(`Ronda ${this.currentWave}: Caballero Azul #${index + 1} ha aparecido en coordenadas del mundo X: ${Math.round(enemy.x)}, Y: ${Math.round(enemy.y)}`);
            }
        });

        this.isWaveActive = true;
        this.currentWave++;
    }

    checkWaveCompletion() {
        if (!this.isWaveActive) return;

        // Verificar si todos los enemigos están muertos
        const allEnemiesDead = gameObjects.blueKnights.every(knight => knight.isDead);
        
        if (allEnemiesDead) {
            this.isWaveActive = false;
            
            // Pequeña pausa antes de la siguiente ronda
            setTimeout(() => {
                this.startNextWave();
            }, 1000);
        }
    }

    completeRoom() {
        const room = rooms.find(r => r.id === this.currentRoom);
        if (room) {
            room.isCleared = true;
            room.isActive = false;
            isPlayerInBattle = false;
        }
        this.currentRoom = null;
        this.currentWave = 0;
        this.isWaveActive = false;
    }
}

// Crear instancia global del RoomManager
const roomManager = new RoomManager();


// *******************************//
// *******************************//
// Blockchain Section
// *******************************//
// *******************************//

// // Import ethers.js
// const { ethers } = require("ethers");

function connect() {
    sdk.connect()
    .then((res) => {
        const metamaskProvider = sdk.getProvider();
        provider = new ethers.providers.Web3Provider(metamaskProvider);

        // Ensure the contract is initialized here
        const contractAddress = "0x26423a5aCB0cD213c2206ADdc3091bC5D4f68b62"; // Your contract address
        fetch('./blockchain/abi/CheckPointNFT.json') // Ensure the path is correct
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Return the promise for the JSON data
            })
            .then(data => {
                const contractABI = data.abi; // Access the ABI from the JSON
                console.log(contractABI); // Now you can use the ABI for contract interaction

                // Create a contract instance
                contract = new ethers.Contract(contractAddress, contractABI, provider); // Initialize the contract here
                console.log("Contract initialized successfully.");

                // Call getCheckpointNFTData with a specific tokenId
                useCheckpointData(1); // Replace 1 with the actual tokenId you want to query
            })
            .catch(error => {
                console.error('Error loading ABI:', error);
            });
    })
    .catch((e) => console.log('request accounts ERR', e));
}

// Function to use checkpoint data
function useCheckpointData(tokenId) {
    // Call the global function to get checkpoint data
    window.getCheckpointNFTData(tokenId)
        .then(data => {
            // Use the returned data in your game logic
            if (data) {
                // For example, update the game state with the checkpoint data
                updateGameState(data);
            }
        })
        .catch(error => {
            console.error("Error using checkpoint data:", error);
        });
}

// Function to update the game state with checkpoint data
function updateGameState(data) {
    // Example of how you might use the data
    console.log("Updating game state with checkpoint data:", data);
    console.log("You are in room:", data.levelNumber);
    // Implement your game logic here, e.g., updating player stats, level, etc.
}