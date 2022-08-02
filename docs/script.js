
function startGame() {
    document.getElementById("start").style.visibility = "hidden";
    document.getElementById("menu").style.visibility = "hidden";
    document.getElementById("menuBack").remove();
    gameArea.start();
    startLevel();
}

var tank;
var drone;
var rocket;
var cooldown = false;
var cooldownTimer = 0;
var offset;
var rocketLaunched = false;

var gameArea = {
    start: function () {
        var cv = document.getElementById('cv');
        cv.style.visibility = "visible";
        if (window.innerWidth < 700) {
            cv.width = window.innerWidth;
        }
        else {
            cv.width = 700;
        }

        this.context = cv.getContext("2d");

        if (window.innerHeight < 950) {
            cv.height = window.innerHeight;
        }
        else {
            cv.height = 950;
        }
    },
    clear: function () {
        this.context.clearRect(0, 0, cv.width, cv.height);
      }
}

function component(width, height, color, x, y, type) {
    this.type = type;
  
    this.image = new Image();
    this.image.src = color;
  
    this.gamearea = gameArea;
    this.width = width;
    this.height = height;
    this.destinationX = 0;
    this.destinationy = 0;
    this.x = x;
    this.y = y;
    this.speedX = 0;
    this.speedY = 0;
    this.angle = 0;
    this.destroyed = false;
  
    this.update = function () {
        var ctx = gameArea.context;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.image, this.width / -2 , this.height / -2, this.width, this.height);
        ctx.restore();
    }
    this.newTankPos = function () {
        this.y += 1;
    }
    this.newRocketPos = function () {
        this.x += this.speedX;
        this.y += this.speedY;
    }
    // this.dronePos = function () {
    //     cv.addEventListener('mousemove', (e) => {
    //     this.x = e.clientX;
    //     }
    //     )   
    // }
}

// tankArray[]
var isGameOver = false;
var isLineCrossed = false;
function startLevel() {
    initLevel();

    if(!isGameOver) {
      setInterval(updateGameArea, 10)
      RenderLevel();
    }
}

function initLevel() {
    // Randon number (0..this.canvas.width)

    // Create new tank object with speed vector and put to tankArray[]
    tankArray = [];
    offset = (window.innerWidth - cv.width) / 2;

    cv.addEventListener ('click', (evt) => {});
    cv.onclick = (evt) => {
        if(!cooldown) { 
            target.x = evt.clientX - offset;
            target.y = evt.clientY ;
            rocket.x = drone.x;
            rocket.y = drone.y;
            rocket.speedX = (target.x - drone.x)/50;
            rocket.speedY = (target.y - drone.y)/50;
            cooldown = true;
            rocketLaunched = true;
            rocket.angle = Math.atan2(target.y - rocket.y, target.x - rocket.x ); 
        }
    }
    
    tank = new component(100, 100, "res/tank.png", Math.random() * (cv.width - 50) , -100, "tank");
    drone = new component(100, 100, "res/drone.png", cv.width/2, cv.height/1.1, "drone" );
    rocket = new component (25, 25, "res/rocket.png", -100, -100, "rocket");
    target = new component (100, 100, "res/target.png", -100, -100, "target");
}

// Update game tick
function updateGameArea() {
    gameArea.clear();
    drawLine();
    tank.update();
    drone.update();
    target.update();
    tank.newTankPos();
    rocket.update();
    checkRocket();
    checkTank();
    checkLine();
    updateTimer();
}
  
function RenderLevel() {
    // Draw all from tankArray[]
}

function checkLine() {
    if(tank.y>=cv.height/1.2 && tank.destroyed == false){
        endGame();
    }
}

function endGame() {
    tank.y = +50;
    alert("Game Over");
    document.location.reload();
}

function drawLine() {
    var ctx = cv.getContext("2d");
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(0, cv.height/1.2);
    ctx.lineTo(cv.width, cv.height/1.2);
    ctx.stroke();
}

function updateTimer() {
    cooldownTimer += 10;
    if (cooldownTimer >= 3000) {
        cooldown = false;
        cooldownTimer = 0;
    }
}

function checkRocket() {
    if (rocketLaunched) {
        rocket.newRocketPos();
    }
    if (rocket.x <= target.x + 5  && rocket.y <= target.y + 5 ) {
    rocketLaunched = false;
        if(50 > target.x - tank.x && target.x - tank.x > -50 && 50 > target.y - tank.y && target.y - tank.y > -50 ){
            tank.destroyed = true;
        }
    rocket.x = -100;
    rocket.y = -100;
    target.x = -100;
    target.y = -100;
    }
}

function checkTank() {
    if (tank.destroyed) {
        tank.image.src = "res/tank_destroyed.png";
    }
    if (tank.y > cv.height + 100) {
        tank.y = -100;
        tank.x = Math.random() * (cv.width - 50);
        tank.destroyed = false;
        tank.image.src = "res/tank.png"
    }
}
     