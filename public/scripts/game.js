"use strict";

// A function that loads the second start menu to select game mode
function setupMenu2() {
  let menu = document.getElementById("menu");
  let childElt = document.querySelector("p");
  let modeContainer = document.createElement("div");
  modeContainer.setAttribute("id", "mode-container");
  menu.insertBefore(modeContainer, childElt);

  modeContainer.innerHTML = `
<h2 class="mode-header">mode:</h2>
<div class="mode-row">
  <span class="modes">
    <label for="tennis">Tennis</label>
    <input type="radio" name="game-type" id="tennis" checked>
  </span>
  <span class="modes">
    <label>Classic</label>
    <input type="radio" name="game-type" id="classic">
  </span>
  <span class="modes">
    <label>Chromatic</label>
    <input type="radio" name="game-type" id="chromatic">
  </span>
</div>
<h2 class="mode-header">sfx:</h2>
<div class="mode-row">
  <span class="modes">
    <label>Normal</label>
    <input type="radio" name="sound-type" id="normal" checked>
  </span>
  <span class="modes">
    <label>Grunts</label>
    <input type="radio" name="sound-type" id="grunt">
  </span>
</div>
<h2 class="mode-header">court:</h2>
<div class="mode-row">
  <span class="modes">
    <select id="court-select">
      <option value="au">Australian Open</option>
      <option value="fr">French Open</option>
      <option value="gb">Wimbledon</option>
      <option value="us">US Open</option>
    </select>
  </span>
</div>`.trim();

  addEventListener("click", function(event) {
    let name = event.target.getAttribute("name");
    let id = event.target.getAttribute("id");
    if (name === "game-type" && id !== "tennis") {
      let select = document.querySelector("select");
      let soundButtons = document.querySelectorAll('[name="sound-type"]');
      select.disabled = true;
      soundButtons[0].disabled = true;
      soundButtons[1].disabled = true;
    } else if (name === "game-type" && id === "tennis") {
      let select = document.querySelector("select");
      let soundButtons = document.querySelectorAll('[name="sound-type"]');
      select.disabled = false;
      soundButtons[0].disabled = false;
      soundButtons[1].disabled = false;
    }
  });
}

// Set up animationId to be cleared
let animationId;
// keyCodes
let controlCodes = {37: "p1Left", 38: "p1Backhand", 39: "p1Right", 40: "p1JumpTo", 65: "p2Left", 68: "p2Right", 83: "p2JumpTo", 87: "p2Backhand"};

function trackKeys(codes) {
    var pressed = {};
    function handler(event) {
	if (codes.hasOwnProperty(event.keyCode)) {
	    var down = (event.type == "keydown");
	    pressed[codes[event.keyCode]] = down;
	    event.preventDefault();
	}
    }
    addEventListener("keydown", handler);
    addEventListener("keyup", handler);
    return pressed;
}
// listen for keydown/up events
let keyEvent = trackKeys(controlCodes);


/*
 *The Board is set to a width and height via passed in parameters (default values are set in
 *case of undefined), providing the space in which the game will be played and the boundaries
 *in which objects can move. The board also has a space property that will be used to track
 *the positions of entities that are within it. This space property is set and updated by the
 *entities themselves (Ball, Player, etc). The board has a volume property that will control
 *the amplitute of the sounds when the ball collides with the left or right limiti (walls)
 *The board also recieves a gameType object that tells it what sfx need to be used for the
 *collision with limits left and right.
 */
let Board = function(width=400, height=600, gameType={sfx: "normal"}) {
    this.width = width;
    this.height = height;
    this.space = {};
    this.volumeLevel = 0;
    this.gameTypeSfx = gameType.sfx;
};

/*
 *generateBounceSfx() is a method (much like Player.prototype.generateGrunts()) which
 *iterates through a directory of sound effect files and places the new Audio() instance
 *into an array on the Board (sounds). These sounds will be played via Board.prototype.bounceSfx().
*/
Board.prototype.generateBounceSfx = function() {
    this.sounds = [];
    if (this.gameTypeSfx === "normal" || this.gameTypeSfx === "grunt") {
	for (let sfx = 1; sfx <= 5; sfx++) {
	    let sfxTrack = new Audio(`/assets/ball_bounce/${sfx}.mp3`);
	    this.sounds.push(sfxTrack);
	}
    } else if (this.gameTypeSfx === "classic") {
	let sfxTrack = new Audio(`/assets/classic/limit.mp3`);
	this.sounds.push(sfxTrack);
    } else if (this.gameTypeSfx === "chromatic") {
	let sfxTrack = new Audio(`/assets/digital/limit.mp3`);
	this.sounds.push(sfxTrack);
    }
};

/*
 *bounceSfx() is a method on the Ball that will play a random bounce sound effect when invoked.
 *It will increase the Board.volumeLevel (up to 1) each time it is invoked. This method is meant
 *to be utilized when balls hit the walls.
 */
Board.prototype.bounceSfx = function() {
    let randomBounce = Math.floor(Math.random()*this.sounds.length);
    let randomBounceSrc = this.sounds[randomBounce];
    // This ensures the audio api doesn't crash (if volume > 1)
    this.volumeLevel += (this.volumeLevel < 1) ? 0.5 : 0;
    randomBounceSrc.volume = this.volumeLevel;
    randomBounceSrc.play();
};
/*
 *The Game constructor takes in two players (playerA and playerB) along with the main ball
 *that will be used within the game (mainBall). The Game also contains a score that tracks
 *the points for both playerA and playerB and an activeMembers property where it stores a
 *reference to both players and the balls in play. The Game also contains a sounds object
 *that it used to store various sounds that relate to the games interface (menu selection)
 *The gameOver property is used to terminate the animation and end the current game.
 *The paused propety is used to toggle the game state to paused or unpaused.
 *gameType is an object that tells the game what mode the player has selected, it has
 *three properties, mode sfx, and court to determine the look and sound of the game.
*/
let Game = function(playerA, playerB, mainBall, gameType) {
    this.score = {
	playerOne: 0,
	playerTwo: 0
    };
    this.activeMembers = {
	playerOne: playerA,
	playerTwo: playerB,
	balls: [mainBall]
    };
    if (gameType.sfx === "normal" || gameType.sfx === "grunt") {
	this.sounds = {
	    start: new Audio("/assets/menu/start.mp3"),
	    cheer: new Audio("/assets/crowd/cheer.mp3"),
	    whiff: new Audio("/assets/racket/whoosh.mp3"),
	    serve: new Audio("/assets/misc/serve_up.mp3")
	};
    } else if (gameType.sfx === "classic") {
	this.sounds = {
	    start: new Audio("/assets/menu/start.mp3"),
	    cheer: new Audio("/assets/crowd/cheer.mp3"),
	    whiff: new Audio("/assets/classic/point.mp3"),
	    serve: new Audio("/assets/misc/serve_up.mp3")
	};
    } else if (gameType.sfx === "chromatic") {
	this.sounds = {
	    start: new Audio("/assets/menu/start.mp3"),
	    cheer: new Audio("/assets/crowd/cheer.mp3"),
	    whiff: new Audio("/assets/digital/point.mp3"),
	    serve: new Audio("/assets/digital/serve.mp3")
	};
    }
    this.gameOver = false;
    this.paused = false;
    this.gameType = {
	mode: gameType.mode,
	sfx: gameType.sfx,
	court: gameType.court
    };
    this.startTime = new Date().getTime();
    this.topSpeed = 0;
    this.maxRally = 0;
};

Game.prototype.elapsedTime = function() {
    let now = new Date().getTime();
    let elapsed = now - this.startTime;
    let milliseconds = parseInt((elapsed % 1000)/100);
    let seconds = parseInt((elapsed/1000) % 60);
    let minutes = parseInt((elapsed/(1000*60)) % 60);
    let hours = parseInt((elapsed/(1000*60*60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

Game.prototype.registerSpeed = function() {
    let xVelocity = this.activeMembers.balls[0].velocity.x;
    let yVelocity = this.activeMembers.balls[0].velocity.y;
    let calculatedVelocity = Math.pow(xVelocity, 2) + Math.pow(yVelocity, 2);
    if (calculatedVelocity > this.topSpeed) {
	this.topSpeed = calculatedVelocity;
    }
};

Game.prototype.registerMaxRally = function() {
    let p1CollisionCount = this.activeMembers.playerOne.collisionCount;
    let p2CollisionCount = this.activeMembers.playerTwo.collisionCount;
    let calculatedCount = Math.floor(p1CollisionCount + p2CollisionCount / 2);
    if (calculatedCount > this.maxRally) {
	this.maxRally = calculatedCount;
    }
};

/*
 *initialize() is the driving force behind the game. It essentially sets
 *the game in motion by performing the following actions:
 *1. Populating the Board with playerOne, playerTwo, and a ball.
 *2. Setting up the backdrop canvas which does not need to be re-rendered
 *   frame by frame (i.e black background, dashed-line net, etc...)
 *3. Setting up the main canvas where the animation will take place and
 *   appending it to the document.body (overlapping the backDrop canvas)
 *4. Set eventListeners on the DOM to call moveLeft() or moveRight() for
 *   the corresponding player.
 *5. Creating a render function where we will invoke the draw methods of
 *   each entity (ball and both players) and loop through via requestAnimationFrame,
 *   redrawing each entity as their position changes.
 */
Game.prototype.initialize = function(board) {
    // Load sounds
    this.loadSounds(board);

    let container = document.getElementById("container");
    let gameContainer = document.createElement("div");
    gameContainer.style.width = board.width + "px";
    gameContainer.style.height = board.height + "px";
    gameContainer.setAttribute("id", "game-container");
    if (this.gameType.mode === "tennis") {
	container.setAttribute("class", this.gameType.court + "-outer");
	gameContainer.setAttribute("class", this.gameType.court + "-inner");
    } else if (this.gameType.mode === "classic") {
	container.setAttribute("class", "classic-outer");
	gameContainer.setAttribute("class", "classic-inner");
    } else if (this.gameType.mode === "chromatic"){
	container.setAttribute("class", "chromatic-outer");
	gameContainer.setAttribute("class", "chromatic-inner");
    }
    container.appendChild(gameContainer);
    board.space.playerOne = this.activeMembers.playerOne;
    board.space.playerTwo = this.activeMembers.playerTwo;
    board.space.balls = [];
    board.space.balls[0]= this.activeMembers.balls[0];
    // Set up separate canvas for the net and black bgcolor
    let backDrop = document.createElement("canvas");
    let backDropCtx = backDrop.getContext('2d');
    backDrop.width = board.width;
    backDrop.height = board.height;
    backDrop.style.position = "absolute";
    backDrop.style.zIndex = 1;
    gameContainer.appendChild(backDrop);
    //document.body.appendChild(backDrop);
    // draw net
    backDropCtx.save();
    backDropCtx.strokeStyle = "white";
    backDropCtx.lineWidth = 4;
    backDropCtx.setLineDash([5, 10]);
    backDropCtx.beginPath();
    backDropCtx.moveTo(0, (backDrop.height/2));
    backDropCtx.lineTo(backDrop.width, (backDrop.height/2));
    backDropCtx.stroke();
    backDropCtx.restore();

    // Set up main canvas (for animation)
    let canvas = document.createElement("canvas");
    let ctx = canvas.getContext('2d');
    canvas.width = board.width;
    canvas.height = board.height;
    canvas.style.position = "absolute";
    canvas.style.zIndex = 2;
    gameContainer.appendChild(canvas);
    // Drawing the ball
    ctx.fillStyle = this.activeMembers.balls[0].colors[0];


    function clearBoard() {
	ctx.clearRect(0, 0, board.width, board.height);
    }

    // preserve 'this' (Game)
    let self = this;
    // Render function goes here which will call ball.move(), player.draw(), ball.draw()
    function render() {
    	clearBoard();
    	// Check for player 1 to move
    	if (keyEvent.p1Left && keyEvent.p1JumpTo) {
    	    //board.space.playerOne.jumpLeft();
    	    board.space.playerOne.moveLeft(15);
    	} else if (keyEvent.p1Right && keyEvent.p1JumpTo) {
    	    //board.space.playerOne.jumpRight();
    	    board.space.playerOne.moveRight(15);
    	} else if (keyEvent.p1Left) {
    	    board.space.playerOne.moveLeft(10);
    	} else if (keyEvent.p1Right) {
    	    board.space.playerOne.moveRight(10);
    	}
    	// Check for player 2 to move
    	if (keyEvent.p2Left && keyEvent.p2JumpTo) {
    	    //board.space.playerTwo.jumpLeft();
    	    board.space.playerTwo.moveLeft(15);
    	} else if (keyEvent.p2Right && keyEvent.p2JumpTo) {
    	    //board.space.playerTwo.jumpRight();
    	    board.space.playerTwo.moveRight(15);
    	} else if (keyEvent.p2Left) {
    	    board.space.playerTwo.moveLeft(10);
    	} else if (keyEvent.p2Right) {
    	    board.space.playerTwo.moveRight(10);
    	}
    	// draw playerOne
    	board.space.playerOne.draw(ctx);
    	// draw playerTwo
    	board.space.playerTwo.draw(ctx);
    	// iterate through balls array and if the ball.move() returns something. Add point
    	// to the correct player and call game.removeBall(), otherwise the ball would have already moved.
    	// and it can be drawn

    	board.space.balls.forEach((currentBall) => {
    	    // Move ball and assign result to variable simultaneously
    	    let potentialPoint = currentBall.move(board);
    	    if (potentialPoint) {
        		if (potentialPoint.playerPoint) {
        		    // Register the length of the rally between p1 and p2
        		    self.registerMaxRally();
        		    self.addPoint(potentialPoint.playerPoint);
        		    // get the string with player who scored the point
        		    // from the .move() returned object
        		    let pointWinner = potentialPoint.playerPoint;
        		    let pointLoser = (pointWinner === "playerOne") ? "playerTwo" : "playerOne";
        		    // increase winner size and decrease loser size
        		    self.activeMembers[pointWinner].increaseSize();
        		    self.activeMembers[pointLoser].decreaseSize();
        		    // if the loser has reached zero or less size end game
        		    if (self.activeMembers[pointLoser].width <= 0) {
        			    self.declareWinner(pointWinner);
            			self.sounds.cheer.play();
            			self.gameOver = true;
                  window.addEventListener("keydown", function(event) {
                    event.preventDefault();
                    // If space bar is pressed take to stats page
                  });
            			return;
        		    }
        		}
        		if (potentialPoint.remove) {
        		    // Add whiff sound
        		    self.sounds.whiff.play();
        		    // Register speed of the ball before it is removed
        		    self.registerSpeed();
        		    self.removeBall(board, currentBall);
        		    // Reset volume levels for both players
        		    self.activeMembers.playerOne.volumeLevel = 0;
        		    self.activeMembers.playerTwo.volumeLevel = 0;
        		    self.activeMembers.playerOne.clearCollisionCount();
        		    self.activeMembers.playerTwo.clearCollisionCount();
        		    setTimeout(function() {
            			let xVDirection = (Math.random() < 0.5) ? -1 : 1;
            			let yVDirection = (potentialPoint.playerPoint === "playerOne") ? -1 : 1;
            			let newBall = new Ball(board, 5, 5, 4*xVDirection, 4*yVDirection);
            			self.addBall(board, newBall);
            			// serve sfx
            			self.sounds.serve.play();
        		    }, 1000);
        		}
  	       }
           else {
             currentBall.draw(ctx);
           }
      });

      if (self.gameOver) {
          cancelAnimationFrame(animationId);
          window.addEventListener("keydown", function(event) {
            event.preventDefault();
            if (event.keyCode == "32") {
              self.displayStats();
            }
          });
          return;
      } else {
          animationId = requestAnimationFrame(render);
      }
    }
      // Set up event listener for pause
      window.addEventListener("keyup", function(event) {
        if (event.keyCode == "80") {
          if (animationId && self.paused === false) {
    	       self.togglePause(animationId);
           }
           else if (self.paused === true) {
    	        self.togglePause(null, render);
            }
        }
      });

      render();
};

/*
  * This is a method that displays the statistics of the game after a player has
  * won and pressed the spacebar after the trophy was shown
*/
Game.prototype.displayStats = function() {
  let statsHTML = `<div id="container">
                      <div id="menu">
                        <h1>Computer Tennis</h1>
                        <hr class="rule">
                        <div id="controls" style="padding-right=0">
                          <table>
                             <tr>
                                <th scope="row" class="player">Top Speed</th>
                                <td>${this.topSpeed} px/sec</td>
                             </tr>
                             <tr>
                                <th scope="row" class="player">Elapsed Time</th>
                                <td>${this.elapsedTime()}</td>
                             </tr>
                             <tr>
                                <th scope="row" class="player">Max Rally</th>
                                <td>${this.maxRally}</td>
                             </tr>
                          </table>
                        </div>
                        <p>press space to restart...</p>
                      </div>
                    </div>`;
  document.body.innerHTML = statsHTML;

  window.addEventListener("keydown", function(event) {
    event.preventDefault();
    if (event.keyCode == "32") {
      window.location = "/";
    }
  });
};

/*
 *addPoint is a method that will add a point the the Game.score for the player provided in
 *the parameter (either 'playerOne' or 'playerTwo')
*/
Game.prototype.addPoint = function(player) {
    if (player !== "playerOne" && player !== "playerTwo") {
	throw new Error("Invalid argument. Must be either 'playerOne' or 'playerTwo'");
    }
    this.score[player] += 1;
};

/*
 *addBall takes in a ball and board as parameters and appends a newly instantiated Ball to the
 *Game.activeMembers.balls array as well as the Ball.position to the Board.space.balls array.
 *This allows for the ball to be tracked by the Game and the ball's position to be tracked by
 *the board. The ball would then be in charge of updating its own position (Board and Game
 *have direct reference at that point).
*/
Game.prototype.addBall = function(board, ball) {
    this.activeMembers.balls.push(ball);
    board.space.balls.push(ball);
};

/*
 *removeBall takes in a ball and board as parameters and removes the ball from the
 *Game.activeMembers.balls array as well as the Ball.position to the Board.space.balls array.
 *The garbage collector will then remove that instance of the Ball once it is no longer in use.
*/
Game.prototype.removeBall = function(board, ball) {
    this.activeMembers.balls = this.activeMembers.balls.filter((currentBall) => {
	return (currentBall !== ball);
    });
    board.space.balls = board.space.balls.filter((currentBallPos) => {
	return (currentBallPos !== ball);
    });
};

/*
 *declareWinner is the method that displays the trophy page to the winning player.
 *It dynamically generates HTML and appends it to the #container. All styles are
 *handled in the main.css file. A player is passed into the function as a parameter
 *to determine who the winner is.
*/
Game.prototype.declareWinner = function(player) {
  let winner = (player === "playerOne") ? "one" : "two";

  let container = document.getElementById("container");
  container.innerHTML = "";

  let winMessage = document.createElement("div");
  winMessage.setAttribute("class", "win-message");
  let svgTrophy = document.createElement("div");
  svgTrophy.setAttribute("class", "svg-trophy");
  winMessage.appendChild(svgTrophy);
  let trophyBar = document.createElement("hr");
  trophyBar.setAttribute("class", "trophy-bar");
  winMessage.appendChild(trophyBar);
  let header = document.createElement("h1");
  header.setAttribute("class", "header");
  header.textContent = `player ${winner} wins`;
  // Change colors of hr and text based on court
  if (this.gameType.court !== "chromatic" && this.gameType.court !== "classic") {
    header.style.color = "#282d2f";
    if (this.gameType.court === "au") {
	trophyBar.style.border = "1px solid #678BAB";
    } else if (this.gameType.court === "fr") {
	trophyBar.style.border = "1px solid #D05006";
    } else if (this.gameType.court === "gb") {
	trophyBar.style.border = "1px solid #FFFEFF";
    } else if (this.gameType.court === "us") {
	trophyBar.style.border = "1px solid #6090BE";
    }
  } else if (this.gameType.court === "chromatic"){
    let colors = ["#ffc26b", "#ff796b", "#5991c2", "#59d574"];
    let randColor1 = colors.splice(Math.floor(Math.random()*colors.length), 1)[0];
    let randColor2 = colors.splice(Math.floor(Math.random()*colors.length), 1)[0];
    header.style.color = randColor1;
    trophyBar.style.border = "1px solid " + randColor2;
  } else {
    header.style.color = "#f8f4e3";
    trophyBar.style.border = "1px solid #7a7978";
  }
  winMessage.appendChild(header);

  container.appendChild(winMessage);
  let continueMessage = document.createElement("p");
  continueMessage.innerHTML = "press space to continue...";
  continueMessage.setAttribute("class", "continue-message");
  container.appendChild(continueMessage);
};

/*
 *togglePause is simply a method that allows the game to be played or paused, toggling a boolean
 *to know which one to do. It relies on the requestAnimationFrame id that is used to
 *cancel the animation frame at the end of the game. Note that in order for the game to move to
 *the paused state we must pass in the animationFrame Id as a parameter. Otherwise it may be made
 *null and the callback function must be passed instead (which will have requestAnimationFrame called
 *on it). The game will only pause if the state of gameOver is false.
*/
Game.prototype.togglePause = function(frameId, callback) {
    if (!this.gameOver) {
	let container = document.getElementById("container");
	if (!this.paused) {
	    this.paused = true;
	    cancelAnimationFrame(frameId);
	    document.body.style.backgroundColor = "black";
	    container.style.opacity = "0.4";
	} else {
	    this.paused = false;
	    document.body.style.backgroundColor = "#97B067";
	    container.style.opacity = "1";
	    requestAnimationFrame(callback);
	}
    }
};

/*
 *loadSounds() is a method that simply loads each sound the game will utilize. The idea is that
 *the game will initially load and reuse sounds rather than creating new Audio objects as the
 *game progresses.
 */
Game.prototype.loadSounds = function(board) {
    this.activeMembers.playerOne.generateGruntSfx();
    this.activeMembers.playerTwo.generateGruntSfx();
    board.generateBounceSfx();
};

/*
 *The Player constructor takes in five optional parameters for a player number, width, height, name
 *and photo source along with a required parameter for the board. The optional properties
 *have default values in the case that they are not explicitly defined. The position of the
 *player is kept via the position property, and the player will update the board each time the
 *position changes. The player also has a gameType parameter that is an object that tells what
 *sfx to use.
*/
let Player = function(board, playerNumber=1, width=100, height=25, gameType={sfx: "normal"}, name="anonymous", photo=null) {
    this.playerNumber = playerNumber;
    this.limits = {
	left: 0,
	right: board.width
    };
    this.board = board.space;
    this.gameTypeSfx = gameType.sfx;
    this.initialWidth = width;
    this.volumeLevel = 0;
    this.width = width;
    this.height = height;
    this.name = name;
    this.photo = photo;
    this.centerPoint = {
	x: (this.width/2),
	y: (this.height/2)
    };
    this.position = {
	// This accounts for fillRect using topleft corner when drawing on canvas
	x: ((board.width/2) - (this.centerPoint.x)),
	// Set the player's y 5 pixel off bottom or top of board depending on if player is
	// playerOne or playerTwo (p1 === bottom p2 === top)
	y: ((this.playerNumber === 1) ? (board.height - this.height - 5) : 5)
    };
    this.collisionCount = 0;
};

Player.prototype.addCollision = function() {
    this.collisionCount++;
};

Player.prototype.clearCollisionCount = function() {
    this.collisionCount = 0;
};

/*
 *moveLeft allows a player to shift their x position to the left (subtract). An optional
 *parameter can be set for the velocity the player can move at, otherwise a default value
 *is set. The player can only move left if it is within the board (limit.left), otherwise
 *the x position is set to limit.left. Keep in mind that position x is in relation to the
 *players top left conner (which accounts for the way canvas handles rectangles)
*/
Player.prototype.moveLeft = function(velocity=5) {
    if ((this.position.x - velocity) > this.limits.left) {
	this.position.x -= velocity;
    } else {
	this.position.x = this.limits.left;
    }
};

/*
 *moveRight allows a player to shift their x position to the right(add). An optional
 *parameter can be set for the velocity the player can move at, otherwise a default value
 *is set. The player can only move right if it is within the board (limit.right), otherwise
 *the x position is set to limit.right. Keep in mind that position x is in relation to the
 *players top left conner (which accounts for the way canvas handles rectangles)
*/
Player.prototype.moveRight = function(velocity=5) {
    if ((this.position.x + this.width + velocity) < this.limits.right) {
	this.position.x += velocity;
    } else {
	this.position.x = this.limits.right - this.width;
    }
};

/*
 *draw is a method that the player uses to draw itself. It expects a context in which
 *to draw itself on the canvas, and an optional color (default is white). This method
 *would be invoked before each re-paint, rendering cycle.
 */
Player.prototype.draw = function(context, color="white") {
    context.save();
    context.fillStyle = color;
    context.fillRect(this.position.x, this.position.y, this.width, this.height);
    context.restore();
};

/*
 *increaseSize is a method that will increase the player's paddle width by a set amount
 *(the initial width of the paddle divided by ten), but no greater than the player's initial
 *size. This method should be called when the player scores a point on their opponent.
*/
Player.prototype.increaseSize = function() {
    let growth = this.initialWidth/20;
    if (this.width + growth <= this.initialWidth) {
	this.width += growth;
    } else {
	this.width = this.initialWidth;
    }
};

/*
 *decreaseSize is a method that will decrease the player's paddle width by a set amount
 *(the initial width of the paddle divided by ten). If the size is less than or equal to
 *zero, then the size will just be set to zero.
 */
Player.prototype.decreaseSize = function() {
    let shrink = this.initialWidth/10;
    if (this.width - shrink <= 0) {
	this.width = 0;
    } else {
	this.width -= shrink;
    }
};

/*
 *jumpLeft is a method that enables the player to immediately jump to the left side
 *of the board.(aka limits.left)
 */
Player.prototype.jumpLeft = function() {
    this.position.x = this.limits.left;
};

/*
 *jumpRight is a method that enables the player to immediately jump to the right side of the
 *board (aka limits.right)
 */
Player.prototype.jumpRight = function() {
    this.position.x = this.limits.right - this.width;
};

/*
 *generateGruntSfx is a method that generates an array of the file names of the audio source files
 *for the tennis grunt sound effects (currently 14 tracks), and appends the array to the Player
 *instance. A new Audio() is instantiated for each sfx and placed in Player.sounds for reuse.
 */
Player.prototype.generateGruntSfx = function() {
    this.sounds = [];
    if (this.gameTypeSfx === "normal") {
	let fileDir = "/assets/racket/";
	for (let track = 1; track <= 10; track++) {
	    let playerSfx = fileDir + track + ".mp3";
	    this.sounds.push(new Audio(playerSfx));
	}
    } else if (this.gameTypeSfx === "grunt") {
	let fileDir = "/assets/tennis_grunts/";
	for (let track = 1; track <= 15; track++) {
	    let playerSfx = fileDir + track + ".mp3";
	    this.sounds.push(new Audio(playerSfx));
	}
    } else if (this.gameTypeSfx === "classic") {
	let playerSfx = new Audio(`/assets/classic/paddel.mp3`);
	this.sounds.push(playerSfx);
    } else if (this.gameTypeSfx === "chromatic") {
	let playerSfx1 = new Audio(`/assets/digital/paddel_1.mp3`);
	let playerSfx2 = new Audio(`/assets/digital/paddel_2.mp3`);
	this.sounds.push(playerSfx1);
	this.sounds.push(playerSfx2);
    }
};

/*
 *gruntSfx is a method on the Player constructor that selects a random tennis grunt audio src from
 *the sounds array  and plays the audio sample through the browser Audio api. This is meant
 *for when a player makes contact with the ball.
 */
Player.prototype.gruntSfx = function() {
    let randomGrunt = Math.floor(Math.random()*this.sounds.length);
    let randomGruntSrc = this.sounds[randomGrunt];
    // This ensures the audio api doesn't crash (if volume > 1)
    this.volumeLevel += (this.volumeLevel < 1) ? 0.5 : 0;
    randomGruntSrc.volume = this.volumeLevel;
    randomGruntSrc.play();
    // Increment collision count
    this.addCollision();
};

/*
 *The Ball constructor has a four parameters passed in a width, height, and velocity, which
 *default to values if not explicitly defined, along with a board object that is required.
 *The position of the ball is kept in the position property and the ball should update the
 *board anytime the position is changed.
 *The ball uses the board to also find out the gameType sfx to determine the color of the
 *ball if necessary (chromatic mode, classic mode, etc)
*/
let Ball = function(board, width=15, height=15, velocityX=5, velocityY=5) {
    this.limits = {
	top: {
	    start: {
		x: 0,
		y: 0
	    }, end: {
		x: board.width,
		y: 0
	    }
	},
	bottom: {
	    start: {
		x: 0,
		y: board.height
	    }, end: {
		x: board.width,
		y: board.height
	    }
	},
	left: {
	    start: {
		x: 0,
		y: 0
	    }, end: {
		x: 0,
		y: board.height
	    }
	},
	right: {
	    start: {
		x: board.width,
		y: 0
	    }, end: {
		x: board.width,
		y: board.height
	    }
	}
    };
    this.width = width;
    this.height = height;
    this.board = board.space;
    this.velocity = {
	x: velocityX,
	y: velocityY
    };
    this.position = {
	x: board.width/2,
	y: board.height/2
    };
    this.gameType = board.gameTypeSfx;
    this.currentColor = 0;
    if (this.gameType === "chromatic") {
	this.colors = ["#ffc26b", "#ff796b", "#5991c2", "#59d574"];
    } else if (this.gameType === "classic") {
	this.colors = ["white"];
    } else {
	this.colors = ["#f8f32b"];
    }
};

/*
 *ball.intersect is a method that, provided two lines in the form:
 *    {start: {x: ?, y: ? }, end: {x: ?, y: ? }}
 *, will output the point at which the two lines intersect (or false if lines are parallel).
 *The method returns the output in the form of an object: {x: ?, y: ?}
 *It needs to be kept in mind that this method assumes that the lines are infinite and not segments,
 *so further checks should be made to determine an actual collision has occured between two objects.
 */
Ball.prototype.intersect = function(lineOne, lineTwo) {
    let x1 = lineOne.start.x;
    let y1 = lineOne.start.y;
    let x2 = lineOne.end.x;
    let y2 = lineOne.end.y;
    let x3 = lineTwo.start.x;
    let y3 = lineTwo.start.y;
    let x4 = lineTwo.end.x;
    let y4 = lineTwo.end.y;

    let pxTop = (x1*y2 - y1*x2)*(x3 - x4) - (x1 - x2)*(x3*y4 - y3*x4);
    let pxBottom = (x1 - x2)*(y3 - y4) - (y1 - y2)*(x3 - x4);
    let px = pxTop/pxBottom;

    let pyTop = (x1*y2 - y1*x2)*(y3 - y4) - (y1 - y2)*(x3*y4 - y3*x4);
    let pyBottom = (x1 - x2)*(y3 - y4) - (y1 - y2)*(x3 - x4);
    let py = pyTop/pyBottom;

    let intersection;

    if (isFinite(px) && isFinite(py)) {
	intersection = {
	    x: px,
	    y: py
	};
    } else {
	intersection = false;
    }

    return intersection;
};

/*
  *moveBtmRtCorner is a helper method to the Ball.protoype.move() method that runs through the
  *collision cases for the bottom right corner of the Board. It uses the bottom
  *two corners of the ball, playerOnes top line, the limit right, and the limit
  *bottom of the board to either set the ball to a collision point, return an object
  *specifying to remove the ball from the board (and increment playerTwo point),
  *or simply just move the ball to its destination (no collision occurred).
  *This method needs the board passed in as a parameter so that it can access the
  *board's bounce sfx (keep in mind that the Ball.board refers to Board.space)
*/
Ball.prototype.moveBtmRtCorner = function(board) {
  let projectileVectorA, projectileVectorB;
  let ballBottomLeftCorner = {x: this.position.x, y: (this.position.y + this.height)};
  let ballBottomRightCorner = {x: (this.position.x + this.width), y: (this.position.y + this.height)};
  // p1 (top line)
  let p1 = {
    start: {
        x: this.board.playerOne.position.x,
        y: this.board.playerOne.position.y
    }, end: {
        x: (this.board.playerOne.position.x + this.board.playerOne.width),
        y: this.board.playerOne.position.y
    }
  };
  projectileVectorA = {
      start: ballBottomRightCorner,
      end: {
        x: (ballBottomRightCorner.x + this.velocity.x),
        y: (ballBottomRightCorner.y + this.velocity.y)
      }
  };
  projectileVectorB = {
      start: ballBottomLeftCorner,
      end: {
        x: (ballBottomLeftCorner.x + this.velocity.x),
        y: (ballBottomLeftCorner.y + this.velocity.y)
      }
  };
  let p1IntersectionA = this.intersect(projectileVectorA, p1);
	let p1IntersectionB = this.intersect(projectileVectorB, p1);
	let limitRightIntersectionA = this.intersect(projectileVectorA, this.limits.right);
	// handle case for direct collision with bottom right corner (wall and player)
	if ((p1IntersectionA && limitRightIntersectionA) && (projectileVectorA.end.x >= this.limits.right.end.x && projectileVectorA.end.y >= p1.end.y) && (p1IntersectionA.x === limitRightIntersectionA.x && p1IntersectionA.y === limitRightIntersectionA.y)) {
	    // move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (limitRightIntersectionA.x - this.width);
	    this.position.y = (limitRightIntersectionA.y - this.height);
	    //invert both x and y velocity
	    this.velocity.x *= -1;
	    this.velocity.y *= -1;
	    if (keyEvent.p1Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p1 sfx
	    this.board.playerOne.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for collision with player 1 only (check for both btmR & btmL ball corners
	else if (p1IntersectionA && projectileVectorA.end.y >= p1.end.y && p1IntersectionA.x <= p1.end.x && p1IntersectionA.x >= p1.start.x) {
	// move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (p1IntersectionA.x - this.width);
	    this.position.y = (p1IntersectionA.y - this.height);
	    // invert only the y velocity
	    this.velocity.y *= -1;
	    if (keyEvent.p1Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p1 sfx
	    this.board.playerOne.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}
	else if (p1IntersectionB && projectileVectorB.end.y >= p1.end.y && p1IntersectionB.x <= p1.end.x && p1IntersectionB.x >= p1.start.x) {
	// move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = p1IntersectionB.x;
	    this.position.y = (p1IntersectionB.y - this.height);
	    // invert only the y velocity
	    this.velocity.y *= -1;
	    if (keyEvent.p1Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p1 sfx
	    this.board.playerOne.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for collision with limit right only
	else if (limitRightIntersectionA && projectileVectorA.end.x >= this.limits.right.start.x) {
	    // move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (limitRightIntersectionA.x - this.width);
	    this.position.y = (limitRightIntersectionA.y - this.height);
	    // invert only the x velocity
	    this.velocity.x *= -1;
	    // bounce sfx
	    board.bounceSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for bottom limit collision (both btmR & btmL corners)
	else if (projectileVectorA.end.y >= this.limits.bottom.end.y || projectileVectorB.end.y >= this.limits.bottom.end.y) {
	    // add point for p2
	    // remove this ball
	    return {
		remove: true,
		playerPoint: "playerTwo"
	    };
	}

	// otherwise just move the position of the ball
	else {
	    this.position.x += this.velocity.x;
	    this.position.y += this.velocity.y;
	}
};


 /*
  *moveTopRtCorner is a helper method to the Ball.protoype.move() method that runs through the
  *collision cases for the top right corner of the Board. It uses the top
  *two corners of the ball, playerTwos bottom line, the limit right, and the limit
  *top of the board to either set the ball to a collision point, return an object
  *specifying to remove the ball from the board (and increment playerOne point),
  *or simply just move the ball to its destination (no collision occurred).
  *This method needs the board passed in as a parameter so that it can access the
  *board's bounce sfx (keep in mind that the Ball.board refers to Board.space)
*/
Ball.prototype.moveTopRtCorner = function(board) {
  let projectileVectorA, projectileVectorB;
  let ballTopLeftCorner = {x: this.position.x, y: this.position.y};
  let ballTopRightCorner = {x: (this.position.x + this.width), y: this.position.y};
  // p2 (bottom line)
  let p2 = {
    start: {
        x: this.board.playerTwo.position.x,
        y: (this.board.playerTwo.position.y + this.board.playerTwo.height)
    }, end: {
        x: (this.board.playerTwo.position.x + this.board.playerTwo.width),
        y: (this.board.playerTwo.position.y + this.board.playerTwo.height)
    }
  };
  projectileVectorA = {
	    start: ballTopRightCorner,
	    end: {
		x: (ballTopRightCorner.x + this.velocity.x),
		y: (ballTopRightCorner.y + this.velocity.y)
	    }
	};
	projectileVectorB = {
	    start: ballTopLeftCorner,
	    end: {
		x: (ballTopLeftCorner.x + this.velocity.x),
		y: (ballTopLeftCorner.y + this.velocity.y)
	    }
	};

	let p2IntersectionA = this.intersect(projectileVectorA, p2);
	let p2IntersectionB = this.intersect(projectileVectorB, p2);
	let limitRightIntersectionA = this.intersect(projectileVectorA, this.limits.right);

	// handle case for direct collision with top right corner (wall and player)
	if ((p2IntersectionA && limitRightIntersectionA) && (projectileVectorA.end.x >= this.limits.right.end.x && projectileVectorA.end.y <= p2.end.y) && (p2IntersectionA.x === limitRightIntersectionA.x && p2IntersectionA.y === limitRightIntersectionA.y)) {
	    // move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (limitRightIntersectionA.x - this.width);
	    this.position.y = (limitRightIntersectionA.y);
	    //invert both x and y velocity
	    this.velocity.x *= -1;
	    this.velocity.y *= -1;
	    if (keyEvent.p2Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p2 sfx
	    this.board.playerTwo.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for collision with player 1 only (check for both btmR & btmL ball corners
	if (p2IntersectionA && projectileVectorA.end.y <= p2.end.y && p2IntersectionA.x <= p2.end.x && p2IntersectionA.x >= p2.start.x) {
	// move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (p2IntersectionA.x - this.width);
	    this.position.y = (p2IntersectionA.y);
	    // invert only the y velocity
	    this.velocity.y *= -1;
	    if (keyEvent.p2Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p2 sfx
	    this.board.playerTwo.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}
	else if (p2IntersectionB && projectileVectorB.end.y <= p2.end.y && p2IntersectionB.x <= p2.end.x && p2IntersectionB.x >= p2.start.x) {
	// move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = p2IntersectionB.x;
	    this.position.y = p2IntersectionB.y;
	    // invert only the y velocity
	    this.velocity.y *= -1;
	    if (keyEvent.p2Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p2 sfx
	    this.board.playerTwo.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for collision with limit right only
	else if (limitRightIntersectionA && projectileVectorA.end.x >= this.limits.right.start.x) {
	    // move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (limitRightIntersectionA.x - this.width);
	    this.position.y = (limitRightIntersectionA.y);
	    // invert only the x velocity
	    this.velocity.x *= -1;
	    // ball bounce sfx
	    board.bounceSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for top limit collision (both topR & topL corners)
	else if (projectileVectorA.end.y <= this.limits.top.end.y || projectileVectorB.end.y <= this.limits.top.end.y) {
	    // add point for p1
	    // remove this ball
	    return {
		remove: true,
		playerPoint: "playerOne"
	    };
	}

	// otherwise just move the position of the ball
	else {
	    this.position.x += this.velocity.x;
	    this.position.y += this.velocity.y;
	}
};

 /*
  *moveBtmLtCorner is a helper method to the Ball.protoype.move() method that runs through the
  *collision cases for the bottom left corner of the Board. It uses the bottom
  *two corners of the ball, playerOnes top line, the limit left, and the limit
  *bottom of the board to either set the ball to a collision point, return an object
  *specifying to remove the ball from the board (and increment playerTwo point),
  *or simply just move the ball to its destination (no collision occurred).
  *This method needs the board passed in as a parameter so that it can access the
  *board's bounce sfx (keep in mind that the Ball.board refers to Board.space)
*/
Ball.prototype.moveBtmLtCorner = function(board) {
  let projectileVectorA, projectileVectorB;
  let ballBottomLeftCorner = {x: this.position.x, y: (this.position.y + this.height)};
  let ballBottomRightCorner = {x: (this.position.x + this.width), y: (this.position.y + this.height)};
  // p1 (top line)
  let p1 = {
    start: {
        x: this.board.playerOne.position.x,
        y: this.board.playerOne.position.y
    }, end: {
        x: (this.board.playerOne.position.x + this.board.playerOne.width),
        y: this.board.playerOne.position.y
    }
  };
  projectileVectorA = {
	    start: ballBottomLeftCorner,
	    end: {
		x: (ballBottomLeftCorner.x + this.velocity.x),
		y: (ballBottomLeftCorner.y + this.velocity.y)
	    }
	};
	projectileVectorB = {
	    start: ballBottomRightCorner,
	    end: {
		x: (ballBottomRightCorner.x + this.velocity.x),
		y: (ballBottomRightCorner.y + this.velocity.y)
	    }
	};

	let p1IntersectionA = this.intersect(projectileVectorA, p1);
	let p1IntersectionB = this.intersect(projectileVectorB, p1);
	let limitLeftIntersectionA = this.intersect(projectileVectorA, this.limits.left);

	// handle case for direct collision with bottom left corner (wall and player)
	if ((p1IntersectionA && limitLeftIntersectionA) && (projectileVectorA.end.x <= this.limits.left.end.x && projectileVectorA.end.y >= p1.end.y) && (p1IntersectionA.x === limitLeftIntersectionA.x && p1IntersectionA.y === limitLeftIntersectionA.y)) {
	    // move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (limitLeftIntersectionA.x);
	    this.position.y = (limitLeftIntersectionA.y - this.height);
	    //invert both x and y velocity
	    this.velocity.x *= -1;
	    this.velocity.y *= -1;
	    if (keyEvent.p1Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p1 sfx
	    this.board.playerOne.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for collision with player 1 only (check for both btmL & btmR ball corners
	if (p1IntersectionA && projectileVectorA.end.y >= p1.end.y && p1IntersectionA.x <= p1.end.x && p1IntersectionA.x >= p1.start.x) {
	// move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (p1IntersectionA.x);
	    this.position.y = (p1IntersectionA.y - this.height);
	    // invert only the y velocity
	    this.velocity.y *= -1;
	    if (keyEvent.p1Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p1 sfx
	    this.board.playerOne.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}
	else if (p1IntersectionB && projectileVectorB.end.y >= p1.end.y && p1IntersectionB.x <= p1.end.x && p1IntersectionB.x >= p1.start.x) {
	// move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (p1IntersectionB.x - this.width);
	    this.position.y = (p1IntersectionB.y - this.height);
	    // invert only the y velocity
	    this.velocity.y *= -1;
	    if (keyEvent.p1Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p1 sfx
	    this.board.playerOne.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for collision with limit left only
	else if (limitLeftIntersectionA && projectileVectorA.end.x <= this.limits.left.start.x) {
	    // move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (limitLeftIntersectionA.x);
	    this.position.y = (limitLeftIntersectionA.y - this.height);
	    // invert only the x velocity
	    this.velocity.x *= -1;
	    // ball bounce sfx
	    board.bounceSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for bottom limit collision (both btmL & btmR corners)
	else if (projectileVectorA.end.y >= this.limits.bottom.end.y || projectileVectorB.end.y >= this.limits.bottom.end.y) {
	    // add point for p2
	    // remove this ball
	    return {
		remove: true,
		playerPoint: "playerTwo"
	    };
	}

	// otherwise just move the position of the ball
	else {
	    this.position.x += this.velocity.x;
	    this.position.y += this.velocity.y;
	}

};

 /*
  *moveTopLtCorner is a helper method to the Ball.protoype.move() method that runs through the
  *collision cases for the top left corner of the Board. It uses the top
  *two corners of the ball, playerTwos bottom line, the limit left, and the limit
  *top of the board to either set the ball to a collision point, return an object
  *specifying to remove the ball from the board (and increment playerOne point),
  *or simply just move the ball to its destination (no collision occurred).
  *This method needs the board passed in as a parameter so that it can access the
  *board's bounce sfx (keep in mind that the Ball.board refers to Board.space)
*/
Ball.prototype.moveTopLtCorner = function(board) {
  let projectileVectorA, projectileVectorB;
  let ballTopLeftCorner = {x: this.position.x, y: this.position.y};
  let ballTopRightCorner = {x: (this.position.x + this.width), y: this.position.y};
  // p2 (bottom line)
  let p2 = {
    start: {
        x: this.board.playerTwo.position.x,
        y: (this.board.playerTwo.position.y + this.board.playerTwo.height)
    }, end: {
        x: (this.board.playerTwo.position.x + this.board.playerTwo.width),
        y: (this.board.playerTwo.position.y + this.board.playerTwo.height)
    }
  };
  projectileVectorA = {
	    start: ballTopLeftCorner,
	    end: {
		x: (ballTopLeftCorner.x + this.velocity.x),
		y: (ballTopLeftCorner.y + this.velocity.y)
	    }
	};
	projectileVectorB = {
	    start: ballTopRightCorner,
	    end: {
		x: (ballTopRightCorner.x + this.velocity.x),
		y: (ballTopRightCorner.y + this.velocity.y)
	    }
	};

	let p2IntersectionA = this.intersect(projectileVectorA, p2);
	let p2IntersectionB = this.intersect(projectileVectorB, p2);
	let limitLeftIntersectionA = this.intersect(projectileVectorA, this.limits.left);

	// handle case for direct collision with top right corner (wall and player)
	if ((p2IntersectionA && limitLeftIntersectionA) && (projectileVectorA.end.x <= this.limits.left.end.x && projectileVectorA.end.y <= p2.end.y) && (p2IntersectionA.x === limitLeftIntersectionA.x && p2IntersectionA.y === limitLeftIntersectionA.y)) {
	    // move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (limitLeftIntersectionA.x);
	    this.position.y = (limitLeftIntersectionA.y);
	    //invert both x and y velocity
	    this.velocity.x *= -1;
	    this.velocity.y *= -1;
	    if (keyEvent.p2Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p2 sfx
	    this.board.playerTwo.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for collision with player 2 only (check for both topL & topR ball corners
	if (p2IntersectionA && projectileVectorA.end.y <= p2.end.y && p2IntersectionA.x <= p2.end.x && p2IntersectionA.x >= p2.start.x) {
	// move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (p2IntersectionA.x);
	    this.position.y = (p2IntersectionA.y);
	    // invert only the y velocity
	    this.velocity.y *= -1;
	    if (keyEvent.p2Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p2 sfx
	    this.board.playerTwo.gruntSfx();
	}
	else if (p2IntersectionB && projectileVectorB.end.y <= p2.end.y && p2IntersectionB.x <= p2.end.x && p2IntersectionB.x >= p2.start.x) {
	// move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (p2IntersectionB.x - this.width);
	    this.position.y = p2IntersectionB.y;
	    // invert only the y velocity
	    this.velocity.y *= -1;
	    if (keyEvent.p2Backhand) {
		this.backspin();
	    }
	    // increase ball's velocity
	    this.increaseVelocity();
	    // p2 sfx
	    this.board.playerTwo.gruntSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for collision with limit left only
	else if (limitLeftIntersectionA && projectileVectorA.end.x <= this.limits.left.start.x) {
	    // move ball directly at collision point (adjusting position to top left corner (canvas)
	    this.position.x = (limitLeftIntersectionA.x);
	    this.position.y = (limitLeftIntersectionA.y);
	    // invert only the x velocity
	    this.velocity.x *= -1;
	    // ball bounce sfx
	    board.bounceSfx();
	    // Shift current Color if chromatic
	    if (this.gameType === "chromatic") {
		this.currentColor = (this.currentColor < this.colors.length-1) ? this.currentColor + 1 : 0;
	    }
	}

	// handle case for top limit collision (both topL & topR corners)
	else if (projectileVectorA.end.y <= this.limits.top.end.y || projectileVectorB.end.y <= this.limits.top.end.y) {
	    // add point for p1
	    // remove this ball
	    return {
		remove: true,
		playerPoint: "playerOne"
	    };
	}

	// otherwise just move the position of the ball
	else {
	    this.position.x += this.velocity.x;
	    this.position.y += this.velocity.y;
	}
};

 /*
  *move uses helper methods to help the ball figure out how it should move through
  *space. The method determines which helper to call based on the velocity and
  *direction in which the ball is moving, returning the result of the helper method,
  *which will either be undefined or an object determining if a player should recieve
  *a point and if the ball should be removed. If none of the helper methods is called
  *an error will be thrown because that means either the x or y velocity is zero. (illegal).
  *The move method needs the board passed in as a parameter so that it can access the
  *board's bounce sfx (keep in mind that the Ball.board refers to Board.space)
*/
Ball.prototype.move = function(board) {
    if (this.velocity.x > 0 && this.velocity.y > 0) {
      return this.moveBtmRtCorner(board);
    } else if (this.velocity.x > 0 && this.velocity.y < 0) {
      return this.moveTopRtCorner(board);
    } else if (this.velocity.x < 0 && this.velocity.y > 0) {
      return this.moveBtmLtCorner(board);
    } else if (this.velocity.x < 0 && this.velocity.y < 0) {
      return this.moveTopLtCorner(board);
    } else {
	    // Throw an error because velocity.x or velocity.y should never equal zero...
	    throw new Error("Ball has illegal velocity: x: " + this.velocity.x + ", y: " + this.velocity.y);
    }
};

/*
 *draw() is much of the same as with the Player.prototype, however it uses the
 *properties of the ball to draw the ball on the canvas. A context needs to be passed
 *into the method in order to allow for the shape to be filled properly on the right
 *canvas.
*/
Ball.prototype.draw = function(context) {
    context.fillStyle = this.colors[this.currentColor];
    context.fillRect(this.position.x, this.position.y, this.width, this.height);

};


/*
 *increase velocity is a method that increases the velocity of the ball in whichever
 *direction it is currently going by a set amount (default parameter=0.25). It is meant
 *to be used after each successive contact with a player's paddle during a rally.
 */
Ball.prototype.increaseVelocity = function(increment=0.25) {
    this.velocity.x += (this.velocity.x < 0) ? -1*increment : increment;
    this.velocity.y += (this.velocity.y < 0) ? -1*increment : increment;
};

/*
 *backspin is a maneuver that a player can pull to invert the velocity along
 *the x-axis upon making contact with the ball.
 */
Ball.prototype.backspin = function() {
    this.velocity.x *= -1;
};


/*============= Game Jumpstart Code Below =============*/
// Board = function(width=400, height=600) {
// let pongBoard = new Board();
// // Player = function(board, playerNumber, width=100, height=25, name="anonymous", photo=null) {
// let firstPlayer = new Player(pongBoard, 1, 100, 5);
// // Player = function(board, playerNumber, width=100, height=25, name="anonymous", photo=null) {
// let secondPlayer = new Player(pongBoard, 2, 100, 5);
// // Ball = function(board, width=15, height=15, velocityX=5, velocityY=5) {
// let pongBall = new Ball(pongBoard, 5, 5, 4, 4);
// // Game = function(playerA, playerB, mainBall) {
// let pongGame = new Game(firstPlayer, secondPlayer, pongBall);
// // Initialize the board
// pongGame.initialize(pongBoard);


//module.exports = {
    //Game: Game,
    //Player: Player,
    //Ball: Ball,
    //Board: Board
//};
function init() {
  let menuExit = 0;
  window.addEventListener("keydown", function() {
      if (event.keyCode == "32" && menuExit === 0) {
	// Show first menu
	event.preventDefault();
	let controls = document.getElementById("controls");
	controls.style.display = "none";
	// Append new menu for mode selection
	setupMenu2();
	menuExit++;
      } else if (event.keyCode == "32" && menuExit === 1) {
	  // Show second menu
	  let gameSettings;
	  let tennisMode = document.getElementById("tennis");
	  let classicMode = document.getElementById("classic");
	  let chromaticMode = document.getElementById("chromatic");
	  if (tennisMode.checked) {
	      let sfx;
	      let normalSfx = document.getElementById("normal");
	      let gruntSfx = document.getElementById("grunt");
	      if (normalSfx.checked) {
		sfx = "normal";
	      } else if (gruntSfx.checked) {
		sfx = "grunt";
	      }
	      let courtSelect = document.getElementById("court-select");
	      let courtValue = courtSelect.options[courtSelect.selectedIndex].value;
	      gameSettings = {
		mode: "tennis",
		sfx: sfx,
		court: courtValue
	      };
	  } else if (classicMode.checked) {
	      gameSettings = {
		mode: "classic",
		sfx: "classic",
		court: "classic"
	      };
	  } else if (chromaticMode.checked) {
	      gameSettings = {
		mode: "chromatic",
		sfx: "chromatic",
		court: "chromatic"
	      };
	  }

	  let container = document.getElementById("container");
	  container.innerHTML = "";
	  /*============= Game Jumpstart Code Below =============*/
	  let pongBoard = new Board(400, 600, gameSettings);
	  let firstPlayer = new Player(pongBoard, 1, 100, 5, gameSettings);
	  let secondPlayer = new Player(pongBoard, 2, 100, 5, gameSettings);
	  let pongBall = new Ball(pongBoard, 5, 5, 4, 4);
	  let pongGame = new Game(firstPlayer, secondPlayer, pongBall, gameSettings);
	  pongGame.sounds.start.play();
	  pongGame.initialize(pongBoard);
	// Set menuExit to true (making the code above not run again)
	menuExit++;
      }
  });
}
init();
