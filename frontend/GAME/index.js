//----------------------------------------
// CONFIGURACIÓN INICIAL DEL CANVAS
//----------------------------------------
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = 800;
canvas.height = 450;
ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);

//----------------------------------------
// CONFIGURACIÓN DEL MAPA Y COLISIONES
//----------------------------------------
console.log(collisions);

const collisionsMap = [];
for (let i = 0; i < collisions.length; i+= 192) {
    collisionsMap.push(collisions.slice(i, i + 192));
}

const offset = {
    x: 0,
    y: -1145
};

const velocity = 2;
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
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
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
    
    if (gameImages) {
        background.draw();
        boundaries.forEach((boundary) => {
            boundary.draw();
        });
        
        const spriteWidth = 19;
        const spriteHeight = 20;
        const column = 1;
        const row = 7;
        
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

    const canMove = {
        up: true,
        down: true,
        left: true,
        right: true
    };

    const player = {
        position: {
            x: playerX + 7,
            y: playerY + 8
        },
        width: 12,
        height: 17
    };

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

    if(keys.w && canMove.up) {
        background.position.y += velocity;
        boundaries.forEach(boundary => boundary.position.y += velocity);
    }
    
    if(keys.s && canMove.down) {
        background.position.y -= velocity;
        boundaries.forEach(boundary => boundary.position.y -= velocity);
    }
    
    if(keys.a && canMove.left) {
        background.position.x += velocity;
        boundaries.forEach(boundary => boundary.position.x += velocity);
    }
    
    if(keys.d && canMove.right) {
        background.position.x -= velocity;
        boundaries.forEach(boundary => boundary.position.x -= velocity);
    }

    window.requestAnimationFrame(Update);
}

function gameLoop() {
    if (keys.w) console.log("w");
    if (keys.s) console.log("s");
    if (keys.a) console.log("a");
    if (keys.d) console.log("d");

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

gameLoop();

