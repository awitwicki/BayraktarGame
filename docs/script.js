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
var target;
var cooldown = false;
var cooldownTimer = 0;
var offset;
var score = 0;
var tankArray = [];
var rockets = [];
var targets = [];

var isGameOver = false;
var isLineCrossed = false;

const droneImageUrl = "res/Drone.png";
const tankImageUrl = "res/Tank.png";
const tankDestroyedImageUrl = "res/Tank_Destroyed.png";
const targetImageUrl = "res/Target.png";
const rocketImageUrl = "res/Rocket.png";

var gameArea = {
  start: function () {
    var cv = document.getElementById('cv');
    cv.style.visibility = "visible";

    if (window.innerWidth < 700) {
      cv.width = window.innerWidth;
    } else {
      cv.width = 700;
    }

    this.context = cv.getContext("2d");

    if (window.innerHeight < 950) {
      cv.height = window.innerHeight;
    } else {
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
  this.x = x;
  this.y = y;
  this.speedX = 0;
  this.speedY = 0;
  this.angle = 0;
  this.destroyed = false;
  this.launched = false;

  this.update = function () {
    var ctx = gameArea.context;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.drawImage(this.image, this.width / -2, this.height / -2, this.width, this.height);
    ctx.restore();
  }

  this.newTankPos = function () {
    this.y += 1;
  }

  this.newRocketPos = function () {
    this.x += this.speedX;
    this.y += this.speedY;
  }
}

function startLevel() {
  initLevel();

  if (!isGameOver) {
    setInterval(updateGameArea, 10)
  }
}

function initLevel() {
  spawnTank();
  setInterval(spawnTank, 5000)

  offset = (window.innerWidth - cv.width) / 2;

  cv.addEventListener('click', (evt) => { });
  cv.onclick = (evt) => {
    if (!cooldown) {
      var _rocket = new component(25, 25, rocketImageUrl, -100, -100, "rocket");
      var _target = new component(100, 100, targetImageUrl, evt.clientX - offset, evt.clientY, "target");
      _rocket.x = drone.x;
      _rocket.y = drone.y;
      _rocket.speedX = (_target.x - drone.x) / -((_target.y - cv.height - 100) / 6);
      _rocket.speedY = (_target.y - drone.y) / -((_target.y - cv.height - 100) / 6);
      cooldown = true;
      _rocket.launched = true;
      _rocket.angle = Math.atan2(_target.y - _rocket.y, _target.x - _rocket.x);
      rockets.push(_rocket);
      targets.push(_target);
    }
  }

  drone = new component(200, 200, droneImageUrl, cv.width / 2, cv.height / 1.2, "drone");
}

// Update game tick
function updateGameArea() {
  gameArea.clear();
  updateTimer();

  for (var i = 0; i < tankArray.length; i++) {
    tank = tankArray[i];
    tank.update();
    tank.newTankPos();
    checkTankRespawn();

    // Check for tank crossed alive
    if (tank.y >= cv.height && tank.destroyed == false) {
      endGame();
    }
  }

  if (targets.length > 0) {
    for (i = 0; i < targets.length; i++) {
      target = targets[i];
      rocket = rockets[i];
      target.update();
      rocket.update();
      checkRocket();
    }
  }

  drawScore()
  drone.update();
}

function endGame() {
  tank.y = +50;
  alert("Game Over");
  document.location.reload();
}

function drawScore() {
  var ctx = cv.getContext("2d");
  ctx.font = "30px Arial";
  ctx.fillText("На рахунку: " + score, 10, 50)
}

function updateTimer() {
  cooldownTimer += 10;
  if (cooldownTimer >= 1000) {
    cooldown = false;
    cooldownTimer = 0;
  }
}

function checkRocket() {
  if (rocket.launched) {
    rocket.newRocketPos();
  }

  if (rocket.x <= target.x + 5 && rocket.y <= target.y + 5) {
    rocket.launched = false;
    for (var i = 0; i < tankArray.length; i++) {
      if (
          (50 > target.x - tankArray[i].x && target.x - tankArray[i].x > -50) &&
          (50 > target.y - tankArray[i].y && target.y - tankArray[i].y > -50) &&
          !tankArray[i].destroyed
         ) {
        updateTankStatus(i);
      }
    }

    // Remove rocket and target
    rocket.x = -100;
    rocket.y = -100;
    target.x = -100;
    target.y = -100;
    rockets.pop;
    targets.pop;
  }
}

function checkTankRespawn() {
  if (tank.y > cv.height + 100) {
    tankArray.pop;
  }
}

function updateTankStatus(i) {
  tankArray[i].destroyed = true;
  tankArray[i].image.src = tankDestroyedImageUrl;
  score += 1;
}

function spawnTank() {
  var _tank = new component(100, 100, tankImageUrl, Math.random() * (cv.width - 50), -100, "tank");
  tankArray.push(_tank);
}
