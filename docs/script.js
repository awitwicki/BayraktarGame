function startGame() {
  document.getElementById("start").style.visibility = "hidden";
  document.getElementById("menu").style.visibility = "hidden";
  document.getElementById("menuBack").remove();
  gameArea.start();
  startLevel();
}

var tank;
var drone;
var cooldown = false;
var cooldownTimer = 0;
var offset;
var score = 0;
var tankArray = [];
var rockets = [];
var explosions = [];
var craters = [];
var respawnTimer = 0;
var interval;
var fuel;
var maxFuel;

var isGameOver = false;
var isLineCrossed = false;

const droneImageUrl = "res/Drone.png";
const tankImageUrl = "res/Tank.png";
const tankDestroyedImageUrl = "res/Tank_Destroyed.png";
const targetImageUrl = "res/Target.png";
const rocketImageUrl = "res/Rocket.png";
const backgroundImageUrl = "res/Background.png";
const explosionImageUrl = "res/Explosion.gif";
const craterImageUrl = "res/Crater.png";

const _explosionSprite = GIF();
_explosionSprite.load(explosionImageUrl)

var gameArea = {
  start: function () {
    var cv = document.getElementById('cv');
    cv.style.visibility = "visible";
    cv.width = Math.min(window.innerWidth, 700);
    cv.height = Math.min(window.innerHeight, 950);

    this.context = cv.getContext("2d");
  },
  clear: function () {
    this.context.clearRect(0, 0, cv.width, cv.height);
  }
}

// Suppoted types
// Tank, destroyed tank, rocket, explosion, explosion crater
function gameEntity(width, height, imageSrc, x, y, type) {
  this.type = type;

  // Sprite type
  if (imageSrc.includes(".gif")) {
    // Animated sprite
    this.isAnimated = true;

    this.gif = GIF();
    this.gif.load(imageSrc);
  } else if (imageSrc.includes(".png")) {
    // Simple image sprite
    this.isAnimated = false;

    this.image = new Image();
    this.image.src = imageSrc;
  }

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
  this.frame = 0;
  this.index = 0;

  this.draw = function () {
    var ctx = gameArea.context;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    // Get image to draw
    var img;

    if (this.isAnimated) {
      img = this.gif.frames[this.index].image;
    } else {
      img = this.image;
    }

    ctx.drawImage(img, this.width / -2, this.height / -2, this.width, this.height);
    ctx.restore();

    // New frame in animation
    if (this.isAnimated) {
      this.index++;
      this.index = Math.min(this.index, this.gif.frameCount - 1);
    }
  }

  this.newPos = function () {
    this.x += this.speedX;
    this.y += this.speedY;
  }
}

function startLevel() {
  initLevel();
  interval = setInterval(updateGameArea, 10);
}

function initLevel() {
  spawnTank();

  fuel = cv.width - 10;
  maxFuel = cv.width - 10;

  cv.addEventListener('click', (evt) => { });

  cv.onclick = (evt) => {
    if (!cooldown) {
      var offset_width = (window.innerWidth - cv.width) / 2;
      var offset_height = (window.innerHeight - cv.height) / 2;

      var _target = new gameEntity(100, 100, targetImageUrl, evt.clientX - offset_width, evt.clientY - offset_height, "target");
      var _rocket = new gameEntity(40, 40, rocketImageUrl, -100, -100, "rocket");
      _rocket.target = _target;
      _rocket.launched = true;
      _rocket.x = drone.x;
      _rocket.y = drone.y;
      _rocket.speedX = (_target.x - drone.x) / -((_target.y - cv.height - 100) / 6);
      _rocket.speedY = (_target.y - drone.y) / -((_target.y - cv.height - 100) / 6);
      _rocket.angle = Math.atan2(_target.y - _rocket.y, _target.x - _rocket.x);

      cooldown = true;

      rockets.push(_rocket);
    }
  }

  drone = new gameEntity(200, 200, droneImageUrl, cv.width / 2, cv.height / 1.2, "drone");
  background = new gameEntity(cv.width, cv.height, backgroundImageUrl, cv.width / 2, cv.height / 2, "background");
  background2 = new gameEntity(cv.width, cv.height, backgroundImageUrl, cv.width / 2, -cv.height / 2, "background");
  background.speedY = 1;
  background2.speedY = 1;
}

// Update game tick
function updateGameArea() {
  gameArea.clear();

  if (background.y >= cv.height * 1.5) {
    background.y = cv.height / 2;
    background2.y = -cv.height / 2;
  }

  background.draw();
  background.newPos();
  background2.draw();
  background2.newPos();

  updateTimer();
  updateFuel();
  if (craters.length > 0) {
    for (i = 0; i < craters.length; i++) {
      craters[i].draw();
      craters[i].newPos();
      
      craters = craters.filter(object => {
        return object.y < cv.height + 100;
      });

    }
  }

  // Tanks
  for (var i = 0; i < tankArray.length; i++) {
    tankArray[i].draw();
    tankArray[i].newPos();
  }

  checkTankRespawn();

  // Rockets and them targets
  if (rockets.length > 0) {
    for (i = 0; i < rockets.length; i++) {
      var _rocket = rockets[i];
      var _target = _rocket.target;

      _target.draw();
      _rocket.draw();

      checkRocket(_rocket);
    }

    // Remove destroyed
    rockets = rockets.filter(object => {
      return !object.destroyed;
    });
  }

  // Explosions
  if (explosions.length > 0) {
    for (var i = 0; i < explosions.length; i++) {
      explosions[i].draw();
      explosions[i].newPos();
    }

    // Remove destroyed (last frame means remove sprite)
    explosions = explosions.filter(object => {
      return object.index != object.gif.frameCount - 1;
    });
  }

  drawScore();
  drawFuel();
  drone.draw();
  if (isGameOver) {
    endGame();
  }
}

function endGame() {
  var url = new URL(location.href);
  var gameId = url.searchParams.get("gameid");

  // Sumbit score to bot via mqtt if gameid is provided
  if (gameId != null) {
    // Create a mqtt client instance
    var client = new Paho.MQTT.Client('test.mosquitto.org', 8081, uuidv4());

    // Connect the client
    client.connect({
      useSSL: true,
      onSuccess: onConnect
    });

    // Called when the client connects
    function onConnect() {
      // Once a connection has been made, make a subscription and send a message.
      console.log("onConnect");
      var message = new Paho.MQTT.Message(gameId + '|' + score);
      message.destinationName = "h3twergwergomemperature";
      client.send(message);
      console.log("Sent");
    }

    function uuidv4() {
      return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    }
  }

  clearInterval(interval);
  gameArea.clear();
  document.getElementById("restart").style.visibility = "visible";
  var ctx = cv.getContext("2d");
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Ви програли!", cv.width / 2, cv.height / 2 - 140)
  ctx.fillText("На рахунку: " + score, cv.width / 2, cv.height / 2 - 100)
}

function drawScore() {
  var ctx = cv.getContext("2d");
  ctx.fillStyle = "rgb(0, 255, 123)";
  ctx.font = "30px Arial";
  ctx.fillText("На рахунку: " + score, 5, 40);
}

function updateTimer() {
  cooldownTimer += 10;
  respawnTimer += 10;
  if (cooldownTimer >= 1000) {
    cooldown = false;
    cooldownTimer = 0;
  }
}

function checkRocket(rocket) {
  var target = rocket.target;
  
  if (rocket.launched) {
    rocket.newPos();
  }

  var ctxx = cv.getContext("2d");
  ctxx.fillStyle = "rgb(0, 255, 123)";
  ctxx.fillText(Math.abs(Math.round(rocket.x-target.x))+","+Math.abs(Math.round(rocket.y-target.y)) , target.x - 50 , target.y - 50);
  //ctxx.fillText(Math.abs(Math.round(rocket.y-target.y)) , target.x  , target.y - 50);

  if (rocket.x <= target.x + 5 && rocket.y <= target.y + 5 && rocket.x >= target.x - 5 && rocket.y >= target.y - 5) {
    rocket.launched = false;
    for (var i = 0; i < tankArray.length; i++) {
      if (
        (50 > target.x - tankArray[i].x && target.x - tankArray[i].x > -50) &&
        (50 > target.y - tankArray[i].y && target.y - tankArray[i].y > -50) &&
        !tankArray[i].destroyed
      ) {
        destroyTank(tankArray[i]);
      }
    }

    // Spawn Explosion
    var _explosion = new gameEntity(100, 100, '', rocket.x, rocket.y, "explosion");
    var _crater = new gameEntity( 100, 100, craterImageUrl, rocket.x, rocket.y, "crater");
    _explosion.gif = _explosionSprite;
    _explosion.isAnimated = true;
    _explosion.speedY = 1;
    _crater.speedY = 1;
    _crater.angle = Math.random()*Math.PI*2;
    explosions.push(_explosion);
    craters.push(_crater);

    // Remove rocket
    rocket.x = -100;
    rocket.y = -100;

    rocket.destroyed = true;
  }
}

function checkTankRespawn(tank) {
  // Remove tanks
  tankArray = tankArray.filter(object => {
    return object.y < cv.height + 100;
  });

  if (respawnTimer >= (30000 * (1 / (10 + score / 3))) + (Math.random() * 250)) {
    respawnTimer = 0;
    spawnTank();
  }
}

function destroyTank(tank) {
  tank.destroyed = true;
  tank.image.src = tankDestroyedImageUrl;
  score += 1;
  fuel += maxFuel / 8;
}

function spawnTank() {
  var _tank = new gameEntity(100, 100, tankImageUrl, Math.random() * (cv.width - 50), -100, "tank");
  _tank.speedY = 1;
  tankArray.push(_tank);
}

function restart() {
  document.location.reload();
}

function updateFuel() {
  fuel = Math.min(fuel, maxFuel);

  fuel -= maxFuel / 2000 + maxFuel / 10000 * score / 100;

  if (fuel <= 0) {
    isGameOver = true;
  }
}

function drawFuel() {
  var ctx = cv.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, cv.width, 10);
  ctx.fillStyle = "yellow";
  ctx.fillRect(0, 0, fuel, 10);
}
