const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");//ctx is the context of the canvas

console.log(collisions);

const collisionsMap = [];
for (let i = 0; i < collisions.length; i+= 192) {
    collisionsMap.push(collisions.slice(i, i + 192));
}

const offset = {
    x: 0,
    y: -1145
};

class Boundary {
    // El tamaño base sin zoom
    static width = 16;  // 48/3
    static height = 16; // 48/3
    constructor({position}) {
        this.position = position;
        // El tamaño se ajustará automáticamente con el zoom
        this.width = Boundary.width;
        this.height = Boundary.height;
    }
    draw() {
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)"; // Rojo semi-transparente para debug
        ctx.fillRect(
            this.position.x,
            this.position.y,
            this.width,
            this.height
        );
    }
}

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


canvas.width = 800; // in the tutorial it was 1024
canvas.height = 450; // in the tutorial it was 576

ctx.fillStyle = "white";
ctx.fillRect(0, 0, canvas.width, canvas.height);
//---------------------------------------Map---------------------------------------
const mapImg = new Image();
mapImg.src = "img/Level Map.png";

const playerImg = new Image();
playerImg.src = "img/PlayerChris.png";

// Factor de zoom (1 = tamaño original, 2 = doble tamaño, 0.5 = mitad de tamaño)
const zoomLevel = 2;

// Declarar gameImages globalmente
let gameImages;
let background; // También declaramos background globalmente
let playerX = 140; // Posición inicial X del jugador
let playerY = 100; // Posición inicial Y del jugador

// Función para asegurarnos que ambas imágenes estén cargadas antes de dibujar
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

// Definimos nuestras fuentes de imágenes
const sources = {
    map: "img/Level Map.png",
    player: "img/PlayerChris.png"
};

// Modificar la carga de imágenes
loadImages(sources, (images) => {
    gameImages = images;
    

    
    // Crear el sprite background después de que las imágenes estén cargadas
    background = new Sprite({
        position: {
            x: offset.x,
            y: offset.y
        },
        image: gameImages.map
    });
    
    // Desactivar el suavizado
    ctx.imageSmoothingEnabled = false;
    // Aplicar el zoom
    ctx.scale(zoomLevel, zoomLevel);
    // Iniciar el bucle de actualización
    Update();
});

class Sprite {
    constructor({position, velocity, image}) {// cuando se crea un sprite se le pasa un objeto con las propiedades position, velocity y image, es decir, llamamos al constructor con un objeto
        this.position = position;
        this.image = image;
    }
    draw() { // este metodo determina que se dibuja en el canvas
        ctx.drawImage(
            this.image,
            this.position.x,
            this.position.y
        );
    }
}

// Modificamos la función de detección de colisiones
function rectangularCollision({rectangle1, rectangle2}) {
    const leftMargin = 4;    // Margen más pequeño en el lado izquierdo
    const topMargin = 10;     // Margen más pequeño en la parte superior
    const rightMargin = -1;   // Margen normal en el lado derecho
    const bottomMargin = 0;  // Margen normal en la parte inferior
    
    return (
        rectangle1.position.x + rectangle1.width - rightMargin >= rectangle2.position.x &&
        rectangle1.position.x + leftMargin <= rectangle2.position.x + rectangle2.width &&
        rectangle1.position.y + rectangle1.height - bottomMargin >= rectangle2.position.y &&
        rectangle1.position.y + topMargin <= rectangle2.position.y + rectangle2.height
    );
}

function Update() {
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width / zoomLevel, canvas.height / zoomLevel);
    
    if (gameImages) {
        // Dibujar el mapa usando el método draw del sprite
        background.draw();

        //dibujar los limites
        boundaries.forEach((boundary) => {
            boundary.draw();
        });
        
        // Dibujar el jugador
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
    // Movimiento del jugador
    // if(keys.w) playerY -= 1;
    // if(keys.s) playerY += 1;
    // if(keys.a) playerX -= 1;
    // if(keys.d) playerX += 1;    

    // Movimiento del fondo y boundaries con detección de colisiones
    let moving = true;
    const player = {
        position: {
            x: playerX + 7,
            y: playerY + 8
        },
        width: 12,
        height: 17
    };

    if(keys.w) {
        for(let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i];
            if(rectangularCollision({
                rectangle1: {
                    ...player,
                    position: {
                        x: playerX,
                        y: playerY - 1
                    }
                },
                rectangle2: boundary
            })) {
                moving = false;
                break;
            }
        }
        if(moving) {
            background.position.y += 1;
            boundaries.forEach(boundary => boundary.position.y += 1);
        }
    }

    if(keys.s) {
        for(let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i];
            if(rectangularCollision({
                rectangle1: {
                    ...player,
                    position: {
                        x: playerX,
                        y: playerY + 1
                    }
                },
                rectangle2: boundary
            })) {
                moving = false;
                break;
            }
        }
        if(moving) {
            background.position.y -= 1;
            boundaries.forEach(boundary => boundary.position.y -= 1);
        }
    }

    if(keys.a) {
        for(let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i];
            if(rectangularCollision({
                rectangle1: {
                    ...player,
                    position: {
                        x: playerX - 1,
                        y: playerY
                    }
                },
                rectangle2: boundary
            })) {
                moving = false;
                break;
            }
        }
        if(moving) {
            background.position.x += 1;
            boundaries.forEach(boundary => boundary.position.x += 1);
        }
    }

    if(keys.d) {
        for(let i = 0; i < boundaries.length; i++) {
            const boundary = boundaries[i];
            if(rectangularCollision({
                rectangle1: {
                    ...player,
                    position: {
                        x: playerX + 1,
                        y: playerY
                    }
                },
                rectangle2: boundary
            })) {
                moving = false;
                break;
            }
        }
        if(moving) {
            background.position.x -= 1;
            boundaries.forEach(boundary => boundary.position.x -= 1);
        }
    }

    window.requestAnimationFrame(Update);
}



//-------------------------------Detectar Teclas---------------------------------------


// Objeto para rastrear las teclas presionadas
const keys = {
    w: false,
    s: false,
    a: false,
    d: false
};

// Eventos para detectar cuando se presiona y suelta una tecla
window.addEventListener("keydown", (e) => {
    // Prevenir el comportamiento por defecto solo para las teclas que nos interesan
    if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        switch (e.key.toLowerCase()) {
            case "w":
                keys.w = true;
                break;
            case "s":
                keys.s = true;
                break;  
            case "a":
                keys.a = true;
                break;
            case "d":
                keys.d = true;
                break;
        }
    }
});

window.addEventListener("keyup", (e) => {
    // Manejar el keyup independientemente de otras teclas
    switch (e.key.toLowerCase()) {
        case "w":
            keys.w = false;
            break;
        case "s":
            keys.s = false;
            break;  
        case "a":
            keys.a = false;
            break;
        case "d":
            keys.d = false;
            break;
    }
});

// Función de bucle de juego
function gameLoop() {
    // Verificar teclas presionadas
    if (keys.w) console.log("w");
    if (keys.s) console.log("s");
    if (keys.a) console.log("a");
    if (keys.d) console.log("d");

    // Llamar al siguiente frame
    requestAnimationFrame(gameLoop);
}

// Iniciar el bucle del juego
gameLoop();

