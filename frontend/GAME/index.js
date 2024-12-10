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
class Boundary {
    static width = 16;
    static height = 16;
    constructor({position}) {
        this.position = position;
        this.width = Boundary.width;
        this.height = Boundary.height;
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

class DoorBoundary {
    static width = 16;
    static height = 16;
    constructor({position}) {
        this.position = position;
        this.width = DoorBoundary.width;
        this.height = DoorBoundary.height;
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



class Sprite {
    constructor({position, velocity, image}) {
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
}

//----------------------------------------
// CONFIGURACIÓN DE LÍMITES (BOUNDARIES)
//----------------------------------------
const boundaries = [];

collisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 257) {
            boundaries.push(
                new Boundary({
                position: {
                    x: j * Boundary.width + offset.x,
                    y: i * Boundary.height + offset.y
                }
                })
            )
        }
    });
});

const doorBoundaries = [];

doorCollisionsMap.forEach((row, i) => {
    row.forEach((symbol, j) => {
        if (symbol === 257) {
            doorBoundaries.push(new DoorBoundary({position: {x: j * DoorBoundary.width + offset.x, y: i * DoorBoundary.height + offset.y}}));
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
    player: "img/PlayerChris.png"
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
    // Calcular las coordenadas del mundo
    const worldX = -background.position.x + playerX;
    const worldY = -background.position.y + playerY;
    
    // Mostrar coordenadas del jugador en consola
    console.log(`Coordenadas del jugador - X: ${Math.round(worldX)}, Y: ${Math.round(worldY)}`);
    
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
    boundaries.forEach(boundary => {
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
        // Añadir verificación de colisiones para puertas
        doorBoundaries.forEach(doorBoundary => {
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
        background.draw();
        boundaries.forEach((boundary) => {
            boundary.draw();
        });

        // Solo dibujar las puertas si el jugador está en batalla
        if (isPlayerInBattle) {
            doorBoundaries.forEach((doorBoundary) => {
                doorBoundary.draw();
            });
            
            //============= Actualizar y dibujar el caballero solo en batalla =====================
            blueKnight.update();
            blueKnight.draw(ctx);
        }
        
        const spriteWidth = 19;
        const spriteHeight = 20;
        
        // Determinar dirección y actualizar frames
        isMoving = false;
        if (keys.a && canMove.left) {
            isMoving = true;
            lastDirection = 'left';
        } else if (keys.d && canMove.right) {
            isMoving = true;
            lastDirection = 'right';
        } else if (keys.w && canMove.up) {
            isMoving = true;
            lastDirection = 'up';
        } else if (keys.s && canMove.down) {
            isMoving = true;
            lastDirection = 'down';
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
        switch (lastDirection) {
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
    }

    if(keys.w && canMove.up) {
        background.position.y += velocity;
        boundaries.forEach(boundary => boundary.position.y += velocity);
        doorBoundaries.forEach(doorBoundary => doorBoundary.position.y += velocity);
        blueKnight.y += velocity;
        blueKnight.patrolArea.offsetY += velocity;
    }
    
    if(keys.s && canMove.down) {
        background.position.y -= velocity;
        boundaries.forEach(boundary => boundary.position.y -= velocity);
        doorBoundaries.forEach(doorBoundary => doorBoundary.position.y -= velocity);
        blueKnight.y -= velocity;
        blueKnight.patrolArea.offsetY -= velocity;
    }
    
    if(keys.a && canMove.left) {
        background.position.x += velocity;
        boundaries.forEach(boundary => boundary.position.x += velocity);
        doorBoundaries.forEach(doorBoundary => doorBoundary.position.x += velocity);
        blueKnight.x += velocity;
        blueKnight.patrolArea.offsetX += velocity;
    }
    
    if(keys.d && canMove.right) {
        background.position.x -= velocity;
        boundaries.forEach(boundary => boundary.position.x -= velocity);
        doorBoundaries.forEach(doorBoundary => doorBoundary.position.x -= velocity);
        blueKnight.x -= velocity;
        blueKnight.patrolArea.offsetX -= velocity;
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
    
    background = new Sprite({
        position: {
            x: offset.x,
            y: offset.y
        },
        image: gameImages.map
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
                currentRoom = room;
                isPlayerInBattle = true;
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
class BlueKnight {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 17;
        this.speed = 1.5;
        
        // Variables para la animación
        this.frameX = 0;
        this.frameY = 0;
        this.frameCount = 8;
        this.frameDelay = 4;
        this.frameTimer = 0;
        
        // Variables para el movimiento
        this.isMoving = false;
        this.direction = 'right';
        this.moveTimer = 0;
        this.moveInterval = 120;
        
        // Cargar sprite
        this.sprite = new Image();
        this.sprite.src = 'img/BlueKnight.png';
        
        // Área de patrulla con posición inicial
        this.patrolArea = {
            x1: 254,
            y1: 127,
            x2: 466,
            y2: 341,
            // Añadir offset inicial
            offsetX: 0,
            offsetY: 0
        };
        this.detectionRange = 100; // Rango de detección
        this.idealRange = 80;      // Distancia a la que intentará mantenerse
        
        console.log('¡BlueKnight ha spawneado!');
        console.log(`Posición inicial - X: ${x}, Y: ${y}`);
    }
    
    update() {
        // Calcular coordenadas del mundo correctamente
        const playerWorldX = -background.position.x + playerX;
        const playerWorldY = -background.position.y + playerY;
        const enemyWorldX = this.x - background.position.x;
        const enemyWorldY = this.y - background.position.y;
        
        // Mostrar coordenadas del enemigo en el mundo
        console.log(`BlueKnight - X: ${Math.round(enemyWorldX)}, Y: ${Math.round(enemyWorldY)}`);
        
        const dx = playerWorldX - enemyWorldX;
        const dy = playerWorldY - enemyWorldY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let enemySawPlayer = false;
        // Si el jugador está dentro del rango de detección inicial
        if (distance <= this.detectionRange) {
            enemySawPlayer = true;
        }
        // Variable estática para mantener el estado de persecución
        if (!this.hasSeenPlayer && enemySawPlayer) {
            this.hasSeenPlayer = true;
        }

        // Si el jugador ha sido visto alguna vez, perseguir siempre
        if (this.hasSeenPlayer) {
            // Calcular la dirección hacia el jugador
            const angle = Math.atan2(dy, dx);
            
            // Si está más cerca que el rango ideal, alejarse
            if (distance < this.idealRange) {
                this.x -= Math.cos(angle) * this.speed;
                this.y -= Math.sin(angle) * this.speed;
                // Actualizar dirección de sprite según el movimiento
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.frameY = dx > 0 ? 6 : 5; // izquierda : derecha
                } else {
                    this.frameY = dy > 0 ? 4 : 7; // abajo : arriba
                }
            }
            // Si está más lejos que el rango ideal, acercarse
            else if (distance > this.idealRange) {
                this.x += Math.cos(angle) * this.speed;
                this.y += Math.sin(angle) * this.speed;
                // Actualizar dirección de sprite según el movimiento
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.frameY = dx > 0 ? 5 : 6; // derecha : izquierda
                } else {
                    this.frameY = dy > 0 ? 7 : 4; // arriba : abajo
                }
            }
            // Si está en el rango ideal, quedarse quieto pero mirando al jugador
            else {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.frameY = dx > 0 ? 1 : 2; // derecha : izquierda (idle)
                } else {
                    this.frameY = dy > 0 ? 0 : 3; // abajo : arriba (idle)
                }
            }
        }
        // Actualizar animación
        this.frameTimer++;
        if (this.frameTimer >= this.frameDelay) {
            this.frameTimer = 0;
            this.frameX = (this.frameX + 1) % this.frameCount;
        }
    }
    
    draw(ctx) {
        ctx.drawImage(
            this.sprite,
            this.frameX * this.width,
            this.frameY * this.height,
            this.width,
            this.height,
            this.x,
            this.y,
            this.width,
            this.height
        );
    }
    
    changeDirection() {
        const directions = ['right', 'left', 'up', 'down'];
        const currentIndex = directions.indexOf(this.direction);
        let newIndex;
        
        do {
            newIndex = Math.floor(Math.random() * directions.length);
        } while (newIndex === currentIndex);
        
        this.direction = directions[newIndex];
        
        if (!this.isMoving) {
            switch(this.direction) {
                case 'right': this.frameY = 1; break;
                case 'left': this.frameY = 2; break;
                case 'up': this.frameY = 3; break;
                case 'down': this.frameY = 0; break;
            }
        }
    }
}

//----------------------------------------
// INSTANCIA DEL ENEMIGO
//----------------------------------------
const spawnWorldX = 420;  // Coordenada X del spawn del enemigo en el mundo
const spawnWorldY = 1242; // Coordenada Y del spawn del enemigo en el mundo
const blueKnight = new BlueKnight(
    spawnWorldX + offset.x,
    spawnWorldY + offset.y
);

