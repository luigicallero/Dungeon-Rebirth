//----------------------------------------
// CONFIGURACIÓN INICIAL DEL CANVAS
//----------------------------------------
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 450;
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

const offset = {
    x: 0,
    y: -1145
};

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

const zoomLevel = 2;
let gameImages;
let background;
let playerX = 140;
let playerY = 100;

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
    }
    
    if(keys.s && canMove.down) {
        background.position.y -= velocity;
        boundaries.forEach(boundary => boundary.position.y -= velocity);
        doorBoundaries.forEach(doorBoundary => doorBoundary.position.y -= velocity);
    }
    
    if(keys.a && canMove.left) {
        background.position.x += velocity;
        boundaries.forEach(boundary => boundary.position.x += velocity);
        doorBoundaries.forEach(doorBoundary => doorBoundary.position.x += velocity);
    }
    
    if(keys.d && canMove.right) {
        background.position.x -= velocity;
        boundaries.forEach(boundary => boundary.position.x -= velocity);
        doorBoundaries.forEach(doorBoundary => doorBoundary.position.x -= velocity);
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
        id: 1,
        bounds: {
            x1: -200,  // Ajusta estas coordenadas según tu mapa
            y1: -1300,
            x2: 200,
            y2: -1000
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

