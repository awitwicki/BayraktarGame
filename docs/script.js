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
var respawnTimer = 0;
var interval;
var fuel;
var maxFuel;
var explosionFrames = [];

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
  this.frame = 0;

  this.update = function () {
    var ctx = gameArea.context;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.drawImage(this.image, this.width / -2, this.height / -2, this.width, this.height);
    ctx.restore();
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

  offset = (window.innerWidth - cv.width) / 2;

  explosionFrames.push("res/frame0.gif");
  explosionFrames.push("res/frame1.gif");
  explosionFrames.push("res/frame2.gif");
  explosionFrames.push("res/frame3.gif");
  explosionFrames.push("res/frame4.gif");
  explosionFrames.push("res/frame5.gif");
  explosionFrames.push("res/frame6.gif");
  explosionFrames.push("res/frame7.gif");
  explosionFrames.push("res/frame8.gif");
  explosionFrames.push("res/frame9.gif");
  explosionFrames.push("res/frame10.gif");
  explosionFrames.push("res/frame11.gif");

  // let fuel = document.getElementById("fuel");
  // fuel.style.visibility = "visible";
  // fuel.style.right = barOffsetRight;
  fuel = cv.width - 10;
  maxFuel = cv.width - 10;

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
  updateFuel();

  for (var i = 0; i < tankArray.length; i++) {
    tank = tankArray[i];
    tank.update();
    tank.newPos();
    checkTankRespawn();

    // Check for tank crossed alive
    // if (tank.y >= cv.height && tank.destroyed == false) {
    //   isGameOver = true;
    // }
  }


  if (targets.length > 0) {
    for (i = 0; i < targets.length; i++) {
      target = targets[i];
      rocket = rockets[i];
      target.update();
      rocket.update();
      checkRocket();
      if (target.destroyed && target.frame < explosionFrames.length - 1) {
        target.y += 1;
        target.frame += 1;
        target.image.src = explosionFrames[target.frame];
      }
      if (target.frame == explosionFrames.length - 1) {
        target.x = -100;
        target.y = -100;
        targets.pop;
        rockets.pop;
      }
    }
  }

  drawScore();
  drawfuel();
  drone.update();
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
      onSuccess:onConnect
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
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
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
  ctx.fillText("Ви програли!", cv.width/2, cv.height/2 - 140)
  ctx.fillText("На рахунку: " + score, cv.width/2, cv.height/2-100)
}

function drawScore() {
  var ctx = cv.getContext("2d");
  ctx.fillStyle = "black";
  ctx.font = "30px Arial";
  ctx.fillText("На рахунку: " + score, 10, 50);
}

function updateTimer() {
  cooldownTimer += 10;
  respawnTimer += 10;
  if (cooldownTimer >= 1000) {
    cooldown = false;
    cooldownTimer = 0;
  }
}

function checkRocket() {
  if (rocket.launched) {
    rocket.newPos();
  }

  if (rocket.x <= target.x + 5 && rocket.y <= target.y + 5 && rocket.x >= target.x - 5 && rocket.y >= target.y - 5) {
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

    // Remove rocket

    rocket.x = -100;
    rocket.y = -100;

    target.image.src = explosionFrames[target.frame];
    target.destroyed = true;

  }
}

function checkTankRespawn() {
  if (tank.y > cv.height + 100) {
    tankArray.pop;
  }
  if (respawnTimer >= (30000 * (1 / (10 + score / 3))) + (Math.random() * 250)) {
    respawnTimer = 0;
    spawnTank();
  }
}

function updateTankStatus(i) {
  tankArray[i].destroyed = true;
  tankArray[i].image.src = tankDestroyedImageUrl;
  score += 1;
  //document.getElementById("fuel").value += 100;
  fuel += maxFuel/8;
}

function spawnTank() {
  var _tank = new component(100, 100, tankImageUrl, Math.random() * (cv.width - 50), -100, "tank");
  _tank.speedY = 1;
  tankArray.push(_tank);
}

function restart() {
  document.location.reload();
}

function updateFuel() {
  if (fuel > maxFuel) fuel = maxFuel;
  fuel -= maxFuel/2000 + maxFuel/10000 * score/10;
  if (fuel <= 0) isGameOver = true;
}

function drawfuel() {
  var ctx = cv.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0,0,cv.width,20);
  ctx.fillStyle = "yellow"
  ctx.fillRect(5,5,fuel,10)
}