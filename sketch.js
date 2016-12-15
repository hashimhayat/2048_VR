// -------------- Control Mode ---------------- //
var userPosition, userX, prev_userX, userY, prev_userY;
var currentMode = 'K';
var trackingSetup = false;
var motionSetup = false;
var Debug = false;

// ----------------- 2048 ------------------ //
var tile;
var game, scoreboard;
var tiles = [];
var newR, newC;
var add, gameEnd = false;

// --------------- Tracking ---------------- //
var capture;
var time;
var videoCanvas;
var control = {LEFT:false, RIGHT:false, TOP:false, BOTTOM:false};
var cheight = 480;
var cwidth = 640;
var compareFrame;
var mergedFrame;
var threshold = 30;
var leftChange = 0;
var rightChange = 0;
var topChange = 0;
var bottomChange = 0;
var characterX = 160;
var lastDirection = 'TOP';

// --------------- Motion Detection ---------------- //

var motionDetector;
var mdCanvas;
var h_positions = [];
var v_positions = [];
var h_detect = [];
var v_detect = [];
var prev_control = 'U';

function preload(){
  add = loadSound("sounds/pop.mp3");
}

function setup() {

  // --------------- Tracking Setup ---------------- //
    videoCanvas = createCanvas(cwidth, cheight);
    videoCanvas.position(0, cheight-20);
  	
  	  capture = createCapture({
      video: {
        mandatory: {
          minWidth: 320,
          minHeight: 240,
          maxWidth: 320,
          maxHeight: 240
        }
      }
    });
    capture.hide();
  
    compareFrame = new p5.Image(320, 240);
    mergedFrame = new p5.Image(320, 240);
    trackingSetup = true;
    
  //--------------- Motion Detection Setup ---------------- //
  mdCanvas = createCanvas(320, 240);
  mdCanvas.position(0, cheight-20);
  motionDetector = new MotionDetector(320, 240, true, true, 50, 0.5);
  
  for (var i = 4; i < 8; i++) {
    h_positions.push(new Position(i * 40, 0));
  }
  
  for (var i = 0; i < 4; i++) {
    v_positions.push(new Position(i*40+2, 50+i * 40));
  }
  motionSetup = true;

// ----------------- 2048 ------------------ //

  world = new World('VRScene');
  userPosition = world.getUserPosition();
  game = new Board(1000,700,500);
	
}

function draw() {
  
// ----------------- 2048 ------------------ //
  
  if (game.state == false){
      game = new Board(1000,700,500);
	    scoreboard = new scoreBoard('sb');
      game.begin();
      game.state = true;
  } else{
      gameEnd = game.end();
  }
  
   game.dispTiles();
   scoreboard.displayScore(game.points);
   
   
// --------------- Tracking ---------------- //
  
  if (currentMode == 'C'){
    
      if (!trackingSetup){
        // --------------- Tracking Setup ---------------- //
          // videoCanvas = createCanvas(cwidth, cheight);
          // videoCanvas.position(0, cheight-20);
        	
        	 // capture = createCapture({
          //   video: {
          //     mandatory: {
          //       minWidth: 320,
          //       minHeight: 240,
          //       maxWidth: 320,
          //       maxHeight: 240
          //     }
          //   }
          // });
          // capture.hide();
        
          // compareFrame = new p5.Image(320, 240);
          // mergedFrame = new p5.Image(320, 240);
          // trackingSetup = true;
      }
      
    motionControl();
    
    threshold = map(mouseX, 0, width, 0, 100);
  
    // expose the pixels of each of our image objects
    capture.loadPixels();
    compareFrame.loadPixels();
    mergedFrame.loadPixels();
  
  
    if (capture.pixels.length > 0 && compareFrame.pixels.length > 0) {
      
      mirrorVideo();
      
      // assume that we have no motion pixels
      leftChange = 0;
      rightChange = 0;
      topChange = 0;
      bottomChange = 0;
  
      // examine all pixels
      for (var x = 0; x < 320; x++) {
        for (var y = 0; y < 240; y++) {
          // compute 1D location here
          var location = int((x + y * 320) * 4);
  
          // LEFT
          if (x < 30 && y > 30 && y < (cheight/2 - 40) && dist(capture.pixels[location], capture.pixels[location + 1], capture.pixels[location + 2], compareFrame.pixels[location], compareFrame.pixels[location + 1], compareFrame.pixels[location + 2]) > threshold) {
            leftChange += 1;
            mergedFrame.pixels[location] = 0;
            mergedFrame.pixels[location + 1] = 255;
            mergedFrame.pixels[location + 2] = 0;
            mergedFrame.pixels[location + 3] = 255;
          } 
          // RIGHT
          else if (x > 100 && x < 130 && y > 30 && y < (cheight/2 - 40) && dist(capture.pixels[location], capture.pixels[location + 1], capture.pixels[location + 2], compareFrame.pixels[location], compareFrame.pixels[location + 1], compareFrame.pixels[location + 2]) > threshold) {
            rightChange += 1;
            mergedFrame.pixels[location] = 0;
            mergedFrame.pixels[location + 1] = 255;
            mergedFrame.pixels[location + 2] = 0;
            mergedFrame.pixels[location + 3] = 255;
          } 
          // TOP 
          else if (x > 200 && x < (cwidth/2 - 50) && y > 0 && y < 30 && dist(capture.pixels[location], capture.pixels[location + 1], capture.pixels[location + 2], compareFrame.pixels[location], compareFrame.pixels[location + 1], compareFrame.pixels[location + 2]) > threshold) {
            topChange += 1;
            mergedFrame.pixels[location] = 0;
            mergedFrame.pixels[location + 1] = 255;
            mergedFrame.pixels[location + 2] = 0;
            mergedFrame.pixels[location + 3] = 255;
          } 
          // BOTTOM
          else if (x > 200 && x < (cwidth/2 - 50) && y > (cheight/2 - 30) && dist(capture.pixels[location], capture.pixels[location + 1], capture.pixels[location + 2], compareFrame.pixels[location], compareFrame.pixels[location + 1], compareFrame.pixels[location + 2]) > threshold) {
            bottomChange += 1;
            mergedFrame.pixels[location] = 0;
            mergedFrame.pixels[location + 1] = 255;
            mergedFrame.pixels[location + 2] = 0;
            mergedFrame.pixels[location + 3] = 255;
          }
          else {
            mergedFrame.pixels[location] = capture.pixels[location];
            mergedFrame.pixels[location + 1] = capture.pixels[location + 2];
            mergedFrame.pixels[location + 2] = capture.pixels[location + 2];
            mergedFrame.pixels[location + 3] = 255;
          }
        }
      }
  
      // update pixels and draw our merged frame
      mergedFrame.updatePixels();
     image(mergedFrame, 0, 0, 320, 240);
  
      // see if we have to move our character
      if (leftChange > 1000) {
        control[LEFT] = true;
      } else if (rightChange > 1000) {
        control[RIGHT] = true;
      } else if (topChange > 1000) {
        characterX -= 5;
        control[TOP] = true;
      } else if (bottomChange > 1000) {
        characterX += 5;
        control[BOTTOM] = true;
      }
  
      compareFrame.copy(capture, 0, 0, 320, 240, 0, 0, 320, 240);
    }
  }
   
// --------------- Motion Detection ---------------- //   
  
  if (currentMode == 'M'){
    
    if (!motionSetup){
        // --------------- Motion Detection Setup ---------------- //
        // mdCanvas = createCanvas(320, 240);
        // mdCanvas.position(0, cheight-20);
        // motionDetector = new MotionDetector(320, 240, true, true, 50, 0.5);
        
        // for (var i = 4; i < 8; i++) {
        //   h_positions.push(new Position(i * 40, 0));
        // }
        
        // for (var i = 0; i < 4; i++) {
        //   v_positions.push(new Position(i*40+2, 50+i * 40));
        // }
        // motionSetup = true;
    }
    
    motionControl();
  
    motionDetector.startProcessFrame();
    motionDetector.endProcessFrame(true, 0, 0, 320, 240);
    h_detect = [0,0,0,0];
    
    var i = 0;
    for (i = 0; i < h_positions.length; i++) {
      var x = h_positions[i].update();
      h_detect[i] = x;
    }
    
    if (i == h_positions.length){
      if (h_detect[0] == 160 && h_detect[3] == 0 && lastDirection != 'RIGHT'){
        control[RIGHT] = true;
        lastDirection = 'RIGHT';
      } else if (h_detect[3] == 280 && h_detect[0] == 0 && lastDirection != 'LEFT'){
        control[LEFT] = true;
        lastDirection = 'LEFT';
      }
    }
    
    var j = 0;
    for (var j = 0; j < v_positions.length; j++) {
      var y = v_positions[j].update();
      v_detect[j] = y;
    }
    
    if (j == v_positions.length){
      if (v_detect[0] == 50 && v_detect[3] == 0 && lastDirection != 'BOTTOM'){
        lastDirection = 'BOTTOM';
        control[BOTTOM] = true;
      } else if (v_detect[3] == 170 && v_detect[0] == 0 && lastDirection != 'TOP'){
        control[TOP] = true;
        lastDirection = 'TOP';
      }
    }
  } 
   
}

function keyPressed() {
  
  if (keyCode === 75){
    console.log('Mode changed to Keyboard.');
    currentMode = 'K';
    if (trackingSetup) {videoCanvas.style('display', 'none');}
    if (motionSetup) {mdCanvas.style('display', 'none');}
    
  } else if (keyCode == 67){
    console.log('Mode changed to Color Detection.');
    currentMode = 'C';
    mdCanvas.style('display', 'none');
    videoCanvas.style('display', 'block');
  } else if (keyCode == 77){
    console.log('Mode changed to Motion Detection.');
    currentMode = 'M';
    videoCanvas.style('display', 'none');
    mdCanvas.style('display', 'block');
  } else if (keyCode == 82){
    game.state = false;
  } else if (keyCode == 69){
    Debug = true;
    console.log('Debug Mode');
  }
  
  if (currentMode == 'K'){
    if (keyCode === LEFT_ARROW || control[LEFT]) {
      game.moveUP();
      game.addUP();
      newNumber();
      control[LEFT] = false;
    } else if (keyCode === RIGHT_ARROW || control[RIGHT]) {
      game.moveDOWN();
      game.addDOWN();
      newNumber();
      control[RIGHT] = false;
    }else if (keyCode === UP_ARROW || control[TOP]) {
      game.moveLEFT();
      game.addLEFT();
      newNumber();
      control[TOP] = false;
    }else if (keyCode === DOWN_ARROW || control[BOTTOM]) {
      game.moveRIGHT();
      game.addRIGHT();
      newNumber();
      control[BOTTOM] = false;
    }
  }
}

function motionControl() {
  if (control[LEFT] == true && lastDirection != 'LEFT') {
    
    console.log('test');
    
    game.moveUP();
    game.addUP();
    newNumber();
    
    console.log('LEFT');
    control[LEFT] = false;
    lastDirection = 'LEFT';
  } else if (control[RIGHT] == true && lastDirection != 'RIGHT') {
    
    game.moveDOWN();
    game.addDOWN();
    newNumber();
    
    console.log('RIGHT');
    control[RIGHT] = false;
    lastDirection = 'RIGHT';
  }else if (control[TOP] == true && lastDirection != 'TOP') {
    
    game.moveLEFT();
    game.addLEFT();
    newNumber();
    
    console.log('UP');
    control[TOP] = false;
    lastDirection = 'TOP';
  }else if (control[BOTTOM] == true && lastDirection != 'BOTTOM') {
    
    game.moveRIGHT();
    game.addRIGHT();
    newNumber();
    
    console.log('DOWN');
    control[BOTTOM] = false;
    lastDirection = 'BOTTOM';
  }
}


function scoreBoard(disp){
  
  if (disp == 'sb'){
    this.xPos = 4;
    this.yPos = 6;
    this.dim = 0.6;
  } else if (disp == 'ft'){
    this.xPos = 4;
    this.yPos = 6;
    this.dim = 1;
  }

  this.offset = 0;
  
  this.b1 = new Box({ x:this.yPos-2, y:this.xPos+0.2+0.0, z:-1, width: this.dim, height: this.dim,metalness: 0.5});
  this.b2 = new Box({ x:this.yPos-2+0.7, y:this.xPos+0.2, z:-1, width: this.dim, height: this.dim,metalness: 0.5});
  this.b3 = new Box({ x:this.yPos-2+1.4, y:this.xPos+0.2, z:-1, width: this.dim, height: this.dim,metalness: 0.5});
  this.b4 = new Box({ x:this.yPos-2+2.1, y:this.xPos+0.2, z:-1, width: this.dim, height: this.dim,metalness: 0.5});
  world.add(this.b1); world.add(this.b2); world.add(this.b3); world.add(this.b4); 
  
  this.displayScore = function(points){
  
    var score = str(points);
    var len = score.length;
    
    if (!gameEnd){
    
      if (len == 1){
        var s = 's' + str(score[0]);
        this.b4.setAsset(s);
      } else if (len == 2) {
        var s = 's' + str(score[0]);
        var s2 = 's' + str(score[1]);
        this.b3.setAsset(s);
        this.b4.setAsset(s2);
      } else if (len == 3) {
        var s = 's' + str(score[0]);
        var s2 = 's' + str(score[1]);
        var s3 = 's' + str(score[2]);
        this.b2.setAsset(s);
        this.b3.setAsset(s2);
        this.b4.setAsset(s3);
      } else if (len == 4) {
        var s = 's' + str(score[0]);
        var s2 = 's' + str(score[1]);
        var s3 = 's' + str(score[2]);
        var s4 = 's' + str(score[3]);
        this.b1.setAsset(s);
        this.b2.setAsset(s2);
        this.b3.setAsset(s3);
        this.b4.setAsset(s4);
      }
    } else {
        this.b1.hide();
        this.b2.setAsset('e');
        this.b3.setAsset('n');
        this.b4.setAsset('d');
    }
    
  }
}

function Tile(row,col,val,state){
  this.row = 4-row;       // Row of the tile
  this.col = col;         // Col of the tile
  this.val = val;         // The value to be displayed
  this.state = 'Show';    // Display status
  this.angle = 0;         // Angle for rotation
 	this.xOffset = random(1000);
	this.zOffset = random(2000, 3000);
  
  // The 3D tile (BOX)
  this.tile = new Box({ x:this.col-1.5, y:this.row+0.2, z:-2, width: 1, height: 1});
  world.add(this.tile);
  
  // Setter for Val
  this.setVal = function(val){
    this.val = val;
  }
  
  // Displays the tile on the screen
  this.showTile = function(x,y){
      var r = {2:238,4:237,8:243,16:247,32:245,64:235,128:238,256:242,512:229,1024:205,2048:237};
      var g = {2:228,4:224,8:178,16:149,32:124,64:88,128:207,256:209,512:193,1024:2,2048:197};
      var b = {2:217,4:199,8:116,16:93,32:95,64:58,128:106,256:59,512:0,1024:0,2048:0};
      
      this.tile.rotateX(0);
      this.tile.setMetalness(0);
      
      if (Debug || gameEnd) {
          var yMovement = 0.01;
      		var xMovement = map( noise(this.xOffset), 0, 1, -0.05, 0.05);
      		var zMovement = map( noise(this.zOffset), 0, 1, -0.05, 0.05);
      		this.xOffset += 0.01;
      		this.yOffset += 0.01;
          this.tile.nudge(xMovement, yMovement, zMovement);
      }
      
      if (this.val != 0) {
        var s = 'p' + str(this.val);
        this.tile.setAsset(s);
        this.tile.setColor(r[this.val],g[this.val],b[this.val]);
        this.tile.show();
      } else {
        this.tile.hide();
      }

  }
  
  // Animates the tile using rotation and metalness
  this.animate = function(){
    if (this.angle <= 90) {
      this.tile.rotateX(this.angle);
      this.angle += 2;
      this.tile.setMetalness(0.6);
    }
  }
  
  // Hides a tile when its value is zero
  this.hideTile = function(){
    this.state = 'Hide';
    this.tile.hide();
  }
}

function Board(w,h,bsize){
    this.w = w;
    this.h = h;
    this.bsize = bsize;                   //Size of the Board
    this.bposx = (this.w - this.bsize)/2; 
    this.bposy = 100;
    this.noTiles = 4;
    this.points = 0;
    this.front = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];       //Tiles on the board
    this.container = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];       //Tiles on the board
    this.keyboard = {UP:false,LEFT:false,RIGHT:false,DOWN:false};
    this.state = false;
    this.Tiles = [];
    
    this.end = function(){  
      var neighbours = [[0,1], [-1,0], [1,0], [0,-1]];
      var count = 0;
      var valid = 0;
      
      for (var row = 0; row < this.noTiles; row++){
        for (var col = 0; col < this.noTiles; col++){
          
          if (this.container[row][col] != 0){
            count += 1;
            for (var n = 0; n < neighbours.length; n++){
              if (0 <= row+neighbours[n][0] && row+neighbours[n][0] < this.noTiles && 0 <= row+neighbours[n][1] && row+neighbours[n][1] < this.noTiles){
                if (this.container[row][col] == this.container[row+neighbours[n][0]][col+neighbours[n][1]]){
                  valid += 1
                }
              }
            }
          }
        }
      }
      
      if (count == 16 && valid == 0){
        return true;
      } else {
        return false;
      }
    }
    
    this.begin = function(){
      
      console.log('Begin');
      // creating empty tile containers
      for (var r = 0; r < this.noTiles; r++){
        for (var c = 0; c < this.noTiles; c++){
          var temp = new Tile(r,c,0,'Hide');
          temp.tile.hide();
          this.front[r][c] = temp;
        }
      }
      
      var row_first = int(random(0,4));
      var col_first = int(random(0,4));
      this.container[row_first][col_first] = 2;
    }
                    
    this.dispTiles = function(){
      for (var row = 0; row < this.noTiles; row++){
        for (var col = 0; col < this.noTiles; col++){
          
          var val = this.container[row][col];
          this.front[col][row].setVal(val);
          this.front[col][row].showTile(this.bposx,this.bposy);
          
          if (row == newR && col == newC){
            this.front[col][row].animate();
          }
          
        }
      }
    }

    
    this.dispBoard = function(){
      
      for (var row = 0; row < this.noTiles; row++){
        var rowv = '';
        for (var col = 0; col < this.noTiles; col++){
          var val = this.container[col][row];
          rowv += str(val) + " ";
        }
        console.log(rowv);
      }
      console.log('-----------');
    }
  
    this.moveUP = function(){
      var row = 0;
      for (var col = 0; col < this.noTiles; col++){
        
        if (this.container[row][col]!=0 || this.container[row+1][col]!=0 || this.container[row+2][col]!=0 || this.container[row+3][col]!=0) {
          if (this.container[row][col] == 0){
            while (this.container[row][col] == 0){
               this.container[row][col] = this.container[row+1][col];                     
               this.container[row+1][col] = this.container[row+2][col];                     
               this.container[row+2][col] = this.container[row+3][col];                     
               this.container[row+3][col] = 0;
            }
          }
        }
        
        if (this.container[row+1][col] == 0 && (this.container[row+2][col]!=0 || this.container[row+3][col]!=0)){
            while (this.container[row+1][col] == 0) {                  
               this.container[row+1][col] = this.container[row+2][col];                     
               this.container[row+2][col] = this.container[row+3][col];                     
               this.container[row+3][col] = 0;
            }
        }
        
        if (this.container[row+2][col]!=0 && this.container[row+3][col]!=0) {
            while (this.container[row+2][col] == 0) {                                         
                this.container[row+2][col] = this.container[row+3][col];                     
                this.container[row+3][col] = 0;
            }
        }
      }
    }
    
    this.addUP = function(){
       var i = 0;     
       for (var col = 0; col < this.noTiles; col++){
           if (this.container[i][col] == this.container[i+1][col]){ 
               this.container[i][col] = this.container[i][col] + this.container[i+1][col]; 
               this.points += this.container[i][col] * 2;
               this.container[i+1][col] = this.container[i+2][col]; 
               this.container[i+2][col] = this.container[i+3][col]; 
               this.container[i+3][col] = 0; 
               add.play();
           }
           
           if (this.container[i+1][col] == this.container[i+2][col]){
               this.container[i+1][col] = this.container[i+1][col] + this.container[i+2][col]; 
               this.points += this.container[i+1][col] * 2;
               this.container[i+2][col] = this.container[i+3][col]; 
               this.container[i+3][col] = 0; 
           }
           
           if (this.container[i+2][col] == this.container[i+3][col]){
               this.container[i+2][col] = this.container[i+2][col] + this.container[i+3][col]; 
               this.points += this.container[i+2][col] * 2; 
               this.container[i+3][col] = 0; 
           }
       }
    }
    
    this.moveDOWN = function(){
       var row = 0;
       for (var col = 0; col < this.noTiles; col++){
           if (this.container[row][col]!=0 || this.container[row+1][col]!=0 || this.container[row+2][col]!=0 || this.container[row+3][col]!=0){
               if (this.container[row+3][col] == 0){
                   while (this.container[row+3][col] == 0){
                       this.container[row+3][col] = this.container[row+2][col];                     
                       this.container[row+2][col] = this.container[row+1][col];                     
                       this.container[row+1][col] = this.container[row][col];                     
                       this.container[row][col] = 0;
                   }
               }
           }
           
           if (this.container[row+2][col] == 0 && (this.container[row+1][col]!=0 || this.container[row][col]!=0)){
                   while (this.container[row+2][col] == 0){                    
                       this.container[row+2][col] = this.container[row+1][col];                     
                       this.container[row+1][col] = this.container[row][col];                     
                       this.container[row][col] = 0;
                   }
           }
           
           if (this.container[row+1][col] ==0 && this.container[row][col]!=0){
                   while (this.container[row+1][col] == 0){                                         
                       this.container[row+1][col] = this.container[row][col];                     
                       this.container[row][col] = 0;
                   }
           }
       } 
    }
    
    this.addDOWN = function(){
       var i = 0;         
       for (var j = 0; j < this.noTiles; j++){ 
           if (this.container[i+3][j] == this.container[i+2][j]){
               this.container[i+3][j] = this.container[i+3][j] + this.container[i+2][j]; 
               this.points += this.container[i+3][j] * 2; 
               this.container[i+2][j] = this.container[i+1][j]; 
               this.container[i+1][j] = this.container[i][j]; 
               this.container[i][j] = 0;
               add.play();
            }
            
           if (this.container[i+2][j] == this.container[i+1][j]){
               this.container[i+2][j] = this.container[i+2][j] + this.container[i+1][j]; 
               this.points += this.container[i+2][j] * 2; 
               this.container[i+1][j] = this.container[i][j]; 
               this.container[i][j] = 0; 
           }
           
           if (this.container[i+1][j] == this.container[i][j]){
               this.container[i+1][j] = this.container[i+1][j] + this.container[i][j]; 
               this.points += this.container[i+1][j] * 2; 
               this.container[i][j] = 0; 
           }
        }
    }
    
   this.moveLEFT = function(){
       var col = 0;
       for (var row = 0; row < this.noTiles; row++){ 
           if (this.container[row][col]!=0 || this.container[row][col+1]!=0 || this.container[row][col+2]!=0 || this.container[row][col+3]!=0){
               if (this.container[row][col] == 0){
                   while (this.container[row][col] == 0){
                       this.container[row][col] = this.container[row][col+1];                     
                       this.container[row][col+1] = this.container[row][col+2];                     
                       this.container[row][col+2] = this.container[row][col+3];                     
                       this.container[row][col+3] = 0;
                   }
               }
    
               if (this.container[row][col+1] == 0 && (this.container[row][col+2] != 0 || this.container[row][col+2] != 0)){
                   while (this.container[row][col+1] == 0){            
                       this.container[row][col+1] = this.container[row][col+2];                     
                       this.container[row][col+2] = this.container[row][col+3];                     
                       this.container[row][col+3] = 0;
                   }
               }
               
               if (this.container[row][col+2] == 0 && this.container[row][col+3] != 0){
                   while (this.container[row][col+2] == 0){                                       
                       this.container[row][col+2] = this.container[row][col+3];                     
                       this.container[row][col+3] = 0;
                   }
               }
           }
        }
   }
   
   this.addLEFT = function(){ 
       var j = 0;     
       for (var i = 0; i < this.noTiles; i++){       
           if (this.container[i][j] == this.container[i][j+1]){     
               this.container[i][j] = this.container[i][j]+this.container[i][j+1];             
               this.points += this.container[i][j] * 2;            
               this.container[i][j+1] = this.container[i][j+2];            
               this.container[i][j+2] = this.container[i][j+3];            
               this.container[i][j+3] = 0; 
               add.play();
           }
    
           if (this.container[i][j+1] == this.container[i][j+2]){            
               this.container[i][j+1] = this.container[i][j+1]+this.container[i][j+2];           
               this.points += this.container[i][j+1] * 2;              
               this.container[i][j+2] = this.container[i][j+3];  
               this.container[i][j+3] = 0;    
           }
            
           if (this.container[i][j+2] == this.container[i][j+3]){       
               this.container[i][j+2] = this.container[i][j+2]+this.container[i][j+3];      
               this.points += this.container[i][j+2] * 2;            
               this.container[i][j+3] = 0; 
           }   
       }
   }
   
    this.moveRIGHT = function(){ 
       var j = 0;     
       for (var i = 0; i < this.noTiles; i++){
           if (this.container[i][j]!=0 || this.container[i][j+1]!=0 || this.container[i][j+2]!=0 || this.container[i][j+3]!=0){
               if (this.container[i][j+3]==0){
                   while (this.container[i][j+3] == 0){ 
                       this.container[i][j+3]=this.container[i][j+2];                     
                       this.container[i][j+2]=this.container[i][j+1];                     
                       this.container[i][j+1]=this.container[i][j];                     
                       this.container[i][j] = 0;
                   }
               }
           }
        
           if (this.container[i][j+2]==0 && (this.container[i][j+1]!=0 || this.container[i][j]!=0)){ 
               while (this.container[i][j+2] == 0){
                   this.container[i][j+2] = this.container[i][j+1];                     
                   this.container[i][j+1] = this.container[i][j];                    
                   this.container[i][j] = 0; 
               }
           }
        
           if (this.container[i][j+1]==0 && this.container[i][j]!=0){ 
               while (this.container[i][j+1]==0){ 
                   this.container[i][j+1]=this.container[i][j];                     
                   this.container[i][j] = 0;
               }
           }
       }
    }
    
    this.addRIGHT = function(){ 
       var j = 0;     
       for (var i = 0; i < this.noTiles; i++){ 
           if (this.container[i][j+3]==this.container[i][j+2]){
               this.container[i][j+3]=this.container[i][j+3] + this.container[i][j+2]; 
               this.points += this.container[i][j+3] * 2; 
               this.container[i][j+2]=this.container[i][j+1];
               this.container[i][j+1]=this.container[i][j]; 
               this.container[i][j]=0;
               add.play();
           }
            
           if (this.container[i][j+2] == this.container[i][j+1]){
               this.container[i][j+2]=this.container[i][j+2]+this.container[i][j+1]; 
               this.points += this.container[i][j+2] * 2; 
               this.container[i][j+1]=this.container[i][j];
               this.container[i][j] = 0; 
           }
            
           if (this.container[i][j+1]==this.container[i][j]){
               this.container[i][j+1]=this.container[i][j+1]+this.container[i][j]; 
               this.points += this.container[i][j+1] * 2;
               this.container[i][j] = 0; 
           }
       }
    }
}       

function newNumber(){
  
    var row_indexes_with_zero = [];     
    var column_indexes_with_zero = [];     
    
    for (var i = 0; i < 4; i++){
      for (var j = 0; j < 4; j++){
            if (game.container[i][j] == 0){                 
                row_indexes_with_zero.push(i);                 
                column_indexes_with_zero.push(j);     
            }
            if (game.container[i][j] == 2048){                
                game.status = false;                 
                break;   
            }
      }
    }
    
    if (row_indexes_with_zero.length > 1){
        random_index = int(random((row_indexes_with_zero.length)));         
        row_to_place_entry = row_indexes_with_zero[random_index];         
        column_to_place_entry = column_indexes_with_zero[random_index];        
        game.container[row_to_place_entry][column_to_place_entry] = 2;
        newR = row_to_place_entry;
        newC = column_to_place_entry;
    }
    
    else if (row_indexes_with_zero.length == 1){      
        row_to_place_entry = row_indexes_with_zero[0];         
        column_to_place_entry = column_indexes_with_zero[0];        
        game.container[row_to_place_entry][column_to_place_entry] = 2; 
        newR = row_to_place_entry;
        newC = column_to_place_entry;
    }
}


function mirrorVideo() {
  // iterate over 1/2 of the width of the image & the full height of the image
  for (var x = 0; x < capture.width/2; x++) {
    for (var y = 0; y < capture.height; y++) {
      // compute location here
      var loc1 = (x + y*capture.width) * 4;
      var loc2 = (capture.width-x + y*capture.width) * 4;
      
      // swap pixels from left to right
      var tR = capture.pixels[loc1];
      var tG = capture.pixels[loc1+1];
      var tB = capture.pixels[loc1+2];

      capture.pixels[loc1]   = capture.pixels[loc2];
      capture.pixels[loc1+1] = capture.pixels[loc2+1];
      capture.pixels[loc1+2] = capture.pixels[loc2+2];

      capture.pixels[loc2] = tR;
      capture.pixels[loc2+1] = tG;
      capture.pixels[loc2+2] = tB;
    }
  }
  capture.updatePixels();
}

// --------------- Motion Detection ---------------- //

function Position(x, y) {
  // store our position
  this.x = x;
  this.y = y;
  this.cooldown = 0;

  // display & handle touches
  this.update = function() {
    // see if the user is touching this tile
    if (this.cooldown == 0 && motionDetector.detectMotion(this.x, this.y, 40, 40)) {
      fill(72);
      if (this.y == 0){return this.x;}
      else return this.y;
      
      this.cooldown = 10;
    } else {
      fill(22);
      
      if (this.cooldown > 0) { 
        this.cooldown -= 1;
      }
    }
    rect(this.x, this.y, 40, 40);
    return 0;
    
  }
}


function MotionDetector(w, h, mirror, showMotion, threshold, percentChangeNeeded) {
  // create a video object
  this.video = createCapture({
    video: {
      mandatory: {
        minWidth: w,
        minHeight: h,
        maxWidth: w,
        maxHeight: h
      }
    }
  });
  this.video.hide();

  // construct a changed frame image object
  this.compareFrame = new p5.Image(w, h);

  // store width and height
  this.vw = w;
  this.vh = h;

  // store our mirror preferences
  this.mirror = mirror;

  // store show motion preference
  this.showMotion = showMotion;

  // store threshold & percent change needed
  this.threshold = threshold;
  this.percentChangeNeeded = percentChangeNeeded;


  // process a frame of video (1/2)
  this.startProcessFrame = function() {

    // expose pixels
    this.video.loadPixels();
    this.compareFrame.loadPixels();

    // do we need to mirror the video?
    if (this.mirror) {
      // iterate over 1/2 of the width of the image & the full height of the image
      for (var x = 0; x < this.video.width / 2; x++) {
        for (var y = 0; y < this.video.height; y++) {
          // compute location here
          var loc1 = (x + y * this.video.width) * 4;
          var loc2 = (this.video.width - x + y * this.video.width) * 4;

          // swap pixels from left to right
          var tR = this.video.pixels[loc1];
          var tG = this.video.pixels[loc1 + 1];
          var tB = this.video.pixels[loc1 + 2];

          this.video.pixels[loc1] = this.video.pixels[loc2];
          this.video.pixels[loc1 + 1] = this.video.pixels[loc2 + 1];
          this.video.pixels[loc1 + 2] = this.video.pixels[loc2 + 2];

          this.video.pixels[loc2] = tR;
          this.video.pixels[loc2 + 1] = tG;
          this.video.pixels[loc2 + 2] = tB;


          // swap pixels from left to right (compareFrame)
          tR = this.compareFrame.pixels[loc1];
          tG = this.compareFrame.pixels[loc1 + 1];
          tB = this.compareFrame.pixels[loc1 + 2];

          this.compareFrame.pixels[loc1] = this.compareFrame.pixels[loc2];
          this.compareFrame.pixels[loc1 + 1] = this.compareFrame.pixels[loc2 + 1];
          this.compareFrame.pixels[loc1 + 2] = this.compareFrame.pixels[loc2 + 2];

          this.compareFrame.pixels[loc2] = tR;
          this.compareFrame.pixels[loc2 + 1] = tG;
          this.compareFrame.pixels[loc2 + 2] = tB;
        }
      }
    }
  }


  // detect motion in a specific region
  this.detectMotion = function(x, y, w, h) {

    // assume no motion
    var movedPixels = 0;

    // constrain motion rectangle, if necessary
    if (x < 0) {
      x = 0;
    } else if (x >= this.video.width) {
      x = this.video.width - 1;
    }
    if (y < 0) {
      y = 0;
    } else if (y >= this.video.height) {
      y = this.video.height - 1;
    }

    if (x + w >= this.video.width) {
      w = (this.video.width - 2) - x;
    }
    if (y + h >= this.video.height) {
      h = (this.video.height - 2) - y;
    }

    // iterate over the region in question
    for (var i = x; i < x + w; i++) {
      for (var j = y; j < y + h; j++) {
        // compute 1D location
        var loc = (i + j * this.video.width) * 4;

        // determine if there is motion here
        if (dist(this.video.pixels[loc], this.video.pixels[loc + 1], this.video.pixels[loc + 2], this.compareFrame.pixels[loc], this.compareFrame.pixels[loc + 1], this.compareFrame.pixels[loc + 2]) > this.threshold) {

          if (this.showMotion) {
            this.video.pixels[loc] = 0;
            this.video.pixels[loc + 1] = 255;
            this.video.pixels[loc + 2] = 0;
          }

          movedPixels += 1;
        }
      }
    }

    // evaluate whether motion occurred here
    if (movedPixels / (w + h) > this.percentChangeNeeded) {
      return true;
    }
    return false;
  }

  // process a frame of video (2/2)
  this.endProcessFrame = function(showVideo, x, y, w, h) {

    // update compareFrame
    this.compareFrame.copy(this.video, 0, 0, this.vw, this.vh, 0, 0, this.vw, this.vh);

    // save pixels
    this.video.updatePixels();

    // draw the video, if necessary
    if (showVideo) {
      image(this.video, x, y, w, h);
    }
  }

}

