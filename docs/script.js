
function startGame() {
    document.getElementById("start").style.visibility = "hidden";
    document.getElementById("menu").style.visibility = "hidden";
    document.getElementById("menuBack").remove();
    gameArea.start();
    startLevel();
}

var tank;
var drone;

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

        
        var ctx = cv.getContext("2d");
        var img = document.getElementById("drone");
        drawLine();

        function drawLine() {
            ctx.strokeStyle = 'yellow';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, cv.height/1.2);
            ctx.lineTo(cv.width, cv.height/1.2);
            ctx.stroke();
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
    this.level = 1;
    this.averageX = 0;
    this.averageY = 0;
    this.x = x;
    this.y = y;
  
    this.update = function () {
        var ctx = gameArea.context;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.drawImage(this.image, this.width / -2 , this.height / -2, 100, 100);
        ctx.restore();
        
      }
    this.newPos = function () {
        this.y += 1;
        
    }
    }

// tankArray[]
var isGameOver = false;
var isLineCrossed = false;
function startLevel() {
    initLevel();

    if(!isGameOver)
    {
      setInterval(updateGameArea, 10)
      RenderLevel();
    }
}

function initLevel() {
    // Randon number (0..this.canvas.width)

    // Create new tank object with speed vector and put to tankArray[]
    tankArray = [];
    tank = new component(50, 50, "res/tank.png", Math.random() * cv.width , 0, "tank");
    drone = new component(100, 100, "res/drone.png", cv.width/2, cv.height/1.1, "drone" );
}

// Update game tick
function updateGameArea() {
    gameArea.clear();
    tank.update();
    drone.update();
    tank.newPos();
    checkLine();
    drawLine();

  }
  


function RenderLevel() {
    // Draw all from tankArray[]
}
function checkLine() {
    if(tank.y>=cv.height/1.2){
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
   
  

  