//JPF vars
var JPF = {}; //Joe's Particle Fun

var kongregate = parent.kongregate;

JPF.startTime = (new Date()).getTime();
JPF.clockTime = 0;
JPF.lastFrameTime = 0;
JPF.fps = 0;

JPF.mouse = "up";

JPF.renderBox = [0,0,0,0];

JPF.maxLevel = 1;
JPF.level = JPF.maxLevel;

JPF.font = 'Verdana'; //Default font before new one loaded

//State bools
JPF.dirtyCanvas = true;  //Keep track of when state has changed and need to update canvas

JPF.gameInProgress = false;
JPF.wonGame = false;

JPF.toSaveGame = true;

JPF.particles = [];
JPF.mousePos = [0.5,0.5];

window.onload = function(){
	JPF.startSession();
	requestNextAnimationFrame(JPF.gameLoop);
	JPF.initEvents();
};

JPF.gameLoop = function(time){
	var ctx = JPF.ctx;
	
	JPF.updateParticles(time - JPF.lastFrameTime);
	JPF.drawGame();

	if(JPF.dirtyCanvas){
		JPF.dirtyCanvas = false;

		if(JPF.timeConst){
			JPF.dirtyCanvas = true;
		}

		if(JPF.checkWon && !JPF.wonGame){
			JPF.checkWon = false;
			//check if won game
		}

		//console.log("gameLoop! fps: " + (JPF.fps+0.5|0));
		
		//Save game
		if(JPF.toSaveGame){
			JPF.saveGameState();
			JPF.toSaveGame = false;
		}
	}

	JPF.fps = 1000 / (time - JPF.lastFrameTime);
	JPF.lastFrameTime = time;

	requestNextAnimationFrame(JPF.gameLoop);
};

JPF.startGame = function(){
	JPF.genParticles();
	JPF.dirtyCanvas = true;
	JPF.wonGame = false;
};

JPF.loadGameState = function() {
	if (!supports_html5_storage()) { return false; }
	JPF.gameInProgress = (localStorage["JPF.gameInProgress"] == "true");

	if(JPF.gameInProgress){
		JPF.maxLevel = parseInt(localStorage["JPF.maxLevel"]);
		JPF.wonGame = (localStorage["JPF.wonGame"] == "true");
		JPF.level = parseInt(localStorage["JPF.level"]);
		JPF.map = JSON.parse(localStorage["JPF.map"]);
	}
}

JPF.saveGameState = function() {
	if (!supports_html5_storage()) { return false; }
	// localStorage["JPF.gameInProgress"] = true; //temp disable for testing

	localStorage["JPF.maxLevel"] = JPF.maxLevel;
	localStorage["JPF.wonGame"] = JPF.wonGame;
	localStorage["JPF.level"] = JPF.level;

	localStorage["JPF.map"] = JSON.stringify(JPF.map);
}

JPF.startSession = function(){
	JPF.canvas = document.getElementById("canvas");
	JPF.ctx = JPF.canvas.getContext("2d");

	 // resize the canvas to fill browser window dynamically
    window.addEventListener('resize', resizeCanvas, false);

    function resizeCanvas() {
            JPF.canvas.width = window.innerWidth;
            JPF.canvas.height = window.innerHeight;
            JPF.dirtyCanvas = true;
    }

    resizeCanvas();

	var w = window.innerWidth;
	var h = window.innerHeight;

	console.log(w,h);
	JPF.renderBox = [20,20,w-20,h-20];

	JPF.loadGameState();

	//Start new game
	if(!JPF.gameInProgress){
		JPF.startGame();
	}

	JPF.dirtyCanvas = true;

	JPF.initEvents();
}

JPF.getRenderBoxWidth  = function(){return JPF.renderBox[2] - JPF.renderBox[0];};
JPF.getRenderBoxHeight = function(){return JPF.renderBox[3] - JPF.renderBox[1];};
JPF.mouseDown = function(){return JPF.mouse === "down";};
JPF.mouseUp = function(){return JPF.mouse === "up";};

JPF.internalToRenderSpace = function(x,y){
	var xRender = x * JPF.getRenderBoxWidth()  + JPF.renderBox[0];
	var yRender = y * JPF.getRenderBoxHeight() + JPF.renderBox[1];
	return [xRender,yRender];
};

JPF.renderToInternalSpace = function(x,y){
	var xInternal = (x - JPF.renderBox[0]) / JPF.getRenderBoxWidth();
	var yInternal = (y - JPF.renderBox[1]) / JPF.getRenderBoxHeight();
	return [xInternal,yInternal];
};

JPF.sign = function(x){if(x<0){return -1;}else if(x>0){return 1;}else{return 0;}};

JPF.mousemove = function(x,y){
	JPF.mousePos = [x,y];
};

JPF.mousedown = function(x,y){
	JPF.mouse = "down";
	JPF.mousePos = [x,y];
};

JPF.mouseup = function(x,y){
	JPF.mouse = "up";
};

JPF.winGame = function(){
	if(JPF.level == JPF.maxLevel){
		JPF.maxLevel++;

		if(typeof kongregate !== "undefined"){
			kongregate.stats.submit("Max Level",JPF.maxLevel);
		}

	}

	JPF.wonGame = true;
};

// *** Canvas Drawing ***
JPF.drawGame = function(){
	JPF.drawBackground();
	JPF.drawParicles();
};

JPF.drawBackground = function(){
	var ctx = JPF.ctx;
	ctx.save();

	ctx.clearRect(0,0,JPF.canvas.width,JPF.canvas.height);

    ctx.restore();
};

JPF.drawParicles = function(){
	var N = JPF.particles.length;
	var i;
	var ctx = JPF.ctx;

	ctx.save();
	for(i = 0; i < N; i++){
		var particle = JPF.particles[i];

		var pos = JPF.internalToRenderSpace(particle.x,particle.y);
		var r = JPF.getRenderBoxWidth()*particle.r;

		pos[0] *= JPF.getRenderBoxHeight() / JPF.getRenderBoxWidth();

		ctx.beginPath();
		ctx.arc(pos[0], pos[1], r, 0, 2 * Math.PI, false);
		ctx.closePath();

		particle.color[3] = 0.5*Math.pow(Math.pow(particle.vx,2)+Math.pow(particle.vy,2),0.25);

		ctx.fillStyle = JPF.arrayColorToString(particle.color);
		ctx.fill();
	}

	ctx.restore();
};


// *** Events ***
JPF.initEvents = function(){
	$(document).mouseup(function (e) {
		var offset = $("#canvas").offset();
		var x = e.pageX - offset.left;
		var y = e.pageY - offset.top;

		//Convert to internal coord system
		var internalPoint = JPF.renderToInternalSpace(x,y);
		x = internalPoint[0];
		y = internalPoint[1];

		JPF.mouseup(x,y);
	});

	$(document).mousedown(function (e) {
		var offset = $("#canvas").offset();
		var x = e.pageX - offset.left;
		var y = e.pageY - offset.top;

		//Convert to internal coord system
		var internalPoint = JPF.renderToInternalSpace(x,y);
		x = internalPoint[0];
		y = internalPoint[1];
		
		JPF.mousedown(x,y);
	});

	$(document).mousemove(function (e) {
		var offset = $("#canvas").offset();
		var x = e.pageX - offset.left;
		var y = e.pageY - offset.top;

		//Convert to intenal coord system
		var internalPoint = JPF.renderToInternalSpace(x,y);
		x = internalPoint[0];
		y = internalPoint[1];

		JPF.mousemove(x,y);
	});

	$(document).keydown(function (e) {
		console.log("keypress: ", e.keyCode);
	});
};

// *** LocalStorage Check ***
function supports_html5_storage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}


JPF.arrayColorToString = function(color){
	return "rgba("+Math.round(color[0])+","+Math.round(color[1])+","+Math.round(color[2])+"," + color[3]+")";
};

// Reprinted from Core HTML5 Canvas
// By David Geary
window.requestNextAnimationFrame =
   (function () {
      var originalWebkitRequestAnimationFrame = undefined,
          wrapper = undefined,
          callback = undefined,
          geckoVersion = 0,
          userAgent = navigator.userAgent,
          index = 0,
          self = this;

      // Workaround for Chrome 10 bug where Chrome
      // does not pass the time to the animation function
      
      if (window.webkitRequestAnimationFrame) {
         // Define the wrapper

         wrapper = function (time) {
           if (time === undefined) {
              time = +new Date();
           }
           self.callback(time);
         };

         // Make the switch
          
         originalWebkitRequestAnimationFrame = window.webkitRequestAnimationFrame;    

         window.webkitRequestAnimationFrame = function (callback, element) {
            self.callback = callback;

            // Browser calls the wrapper and wrapper calls the callback
            
            originalWebkitRequestAnimationFrame(wrapper, element);
         }
      }

      // Workaround for Gecko 2.0, which has a bug in
      // mozRequestAnimationFrame() that restricts animations
      // to 30-40 fps.

      if (window.mozRequestAnimationFrame) {
         // Check the Gecko version. Gecko is used by browsers
         // other than Firefox. Gecko 2.0 corresponds to
         // Firefox 4.0.
         
         index = userAgent.indexOf('rv:');

         if (userAgent.indexOf('Gecko') != -1) {
            geckoVersion = userAgent.substr(index + 3, 3);

            if (geckoVersion === '2.0') {
               // Forces the return statement to fall through
               // to the setTimeout() function.

               window.mozRequestAnimationFrame = undefined;
            }
         }
      }
      
      return window.requestAnimationFrame   ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame    ||
         window.oRequestAnimationFrame      ||
         window.msRequestAnimationFrame     ||

         function (callback, element) {
            var start,
                finish;


            window.setTimeout( function () {
               start = +new Date();
               callback(start);
               finish = +new Date();

               self.timeout = 1000 / 60 - (finish - start);

            }, self.timeout);
         };
      }
   )
();