// SAR Conference "Resonance" interactive image
// Pedro Amado, FBAUP/i2ADS, 2024-06-17
// Version 7 (Object Physics adapted from https://editor.p5js.org/js6450/sketches/_zFk1xRHN )

let COR;
let tiles;
let maxnx, maxny;
let mainColor, secondaryColor;
let maxInitialVelocity;
let previousHeight;

let windForce, windScalar;
let wa, maxa, wb, maxb;
let a, inca, b, incb;

function setup() {

  let canvasDiv = document.getElementById('animation');
    let theight = canvasDiv.offsetHeight;

  let myCanvas = createCanvas(screen.width, theight);
  myCanvas.parent ("animation");

  rectMode(CENTER);

  noStroke();

  // Restitution coefficient AKA energy loss in collision due to softness of material (should be less than one): https://en.wikipedia.org/wiki/Coefficient_of_restitution
  COR = 0.96;

  maxInitialVelocity = 0.15;

  mainColor = color(0, 0, 0);
  secondaryColor = color(39, 170, 225);

    // Initialize n tile objects (in each line)
  maxnx = 25;
  
  // Initialize n lines of tiles (vertically)
  maxny = 10;
  
  build();

  wind = 0;
  maxa = windowWidth/4;
  maxb = maxa/5;

  wa = random(0, maxa);
  wb = random(0, maxb);

  a = random(0, TWO_PI);
  b = random(0, TWO_PI);

  inca = PI / 300;
  incb = PI / 75;

  windForce = createVector(0, 0);
  windScalar = 0.001;
}

function build() {
  // Start an array --> has to be converted into a 2D array?
  tiles = [];


  
  let nx = int(random(5, maxnx));
  let ny = int(random(3, maxny));
  //print("ny: ", ny);

  let minHeight = height / (maxny * 2);
  let maxHeight = height / (maxny * 0.5);

  let minMass = 3;
  let maxMass = 30;

  // horizontal position buffer to add the previous tile width
  let tx = 0;

  // each line will have it's own height
  // but third line will have a fixed height for logotype
  let brandLineHeight = 50;

  // and it should have a specific position onScreen
  let brandLineY = 120;

  // initialize first line
  // position of logo = 20% top
  let th = random(minHeight, maxHeight);
  previousHeight = 0;

  let tpos = createVector(0, th / 2);

  let thread;
  // print("building 2D Array");

  // just for first two lines
  for (let m = 0; m < 2; m++) {
    thread = [];
    for (let i = 0; i < nx; i++) {
      // populate temporary horizontal positions
      let tc = mainColor;
      let tm = random(minMass, maxMass); // used for width/weight (reflects on mass of tile)
      let tv = createVector(random(-maxInitialVelocity, maxInitialVelocity), 0);
      let tp = createVector(
        random(width / nx) * i + tm / 3,
        th / 2 + previousHeight
      );
      thread.push(new Tile(tp, tv, tm, tm * 2, th, tc));
      tx += tp.x / 2;
    }
    tiles.push(thread); 
    previousHeight += th;
    th = 0.2*height - previousHeight;
    
  }

  th = random(minHeight, maxHeight);
  
  // rest of lines
  for (let m = 2; m < ny-1; m++) {
    // populate each vertical line/array
    // print("populating line:", m);

    // reset thread line
    thread = [];

    for (let i = 0; i < nx; i++) {
      // populate temporary horizontal positions

      let tc = mainColor;
      let tm = random(minMass, maxMass); // used for width/weight (reflects on mass of tile)
      let tv = createVector(random(-maxInitialVelocity, maxInitialVelocity), 0);

      // we have to do this later to add half the previous and current tile width
      let tp = createVector(
        random(width / nx) * i + tm / 3,
        th / 2 + previousHeight
      );

      //_p, _v, _m, _w, _h, _c
      thread.push(new Tile(tp, tv, tm, tm * 2, th, tc));

      // add half the width of the current tile to buffer horizontal positions
      tx += tp.x / 2;
    }
    // end of horizontal population

    // push the full line into the vertical array
    tiles.push(thread);

    previousHeight += th;

    // calculate the new vertical position
    //ty = random(minHeight, (height - ty - brandLineHeight) / ny - (k + 1));
    th = random(minHeight, maxHeight);

    //th += previousHeight;
  }
  
  // last line (occupy all if empy bottom space (quick & dirty fix))
  th = height-previousHeight;
  
  // just last line
  for (let m = ny-1; m < ny; m++) {
    thread = [];
    for (let i = 0; i < nx; i++) {
      let tc = mainColor;
      let tm = random(minMass, maxMass); // used for width/weight (reflects on mass of tile)
      let tv = createVector(random(-maxInitialVelocity, maxInitialVelocity), 0);
      let tp = createVector(
        random(width / nx) * i + tm / 3,
        th / 2 + previousHeight
      );
      thread.push(new Tile(tp, tv, tm, tm * 2, th, tc));
      tx += tp.x / 2;
    }
    tiles.push(thread);
  }
}

function draw() {
  background(240, 250, 255);

  windForce.x = (cos(a) * wa + cos(b) * wb) ;
  a += inca;
  b += incb;

  //showWind();
  //rectMode(CENTER);

  // Loop through all Tile objects in the array
  for (let m = 0; m < tiles.length; m++) {
    let thread = tiles[m];

    for (let i = 0; i < thread.length; i++) {
      let tile = thread[i];

      // Check each tile for collision with all others
      for (let k = 0; k < thread.length; k++) {
        // Don't check against itself
        if (i != k) {
          let target = thread[k];

          tile.checkCollision(target);
        }
      }

      // Update tile position
      tile.update();

      // Display tile
      tile.display();
    }
  }
}

// When the window is resized, resize the canvas
function windowResized() {

  let canvasDiv = document.getElementById('animation');
    let theight = canvasDiv.offsetHeight;

  resizeCanvas(screen.width, theight);
  reBuild();
}

function reBuild() {
  build();
}

function showWind() {
  //print("showing wind…", windForce.x);
  rectMode(CORNER);
  noStroke();
  fill(200, 0, 0);
  rect(windowWidth/2, 0, windForce.x, 20);
}

class Tile {
  constructor(_p, _v, _m, _w, _h, _c) {
    this.position = _p;
    this.velocity = _v;
    this.acceleration = createVector(0, 0);
    this.mass = _m;
    this.size = createVector(this.mass * 2, _h);
    this.fillColor = _c;
    this.colorDecay = 0;
  }
  // End of Constructor Method

  applyForce(_f) {
    // Newton's Second Law: divide force by mass, then add to acceleration
    _f.div(this.mass);

    this.acceleration.add(_f);

    let twind = windForce.copy();
    twind.x *= windScalar;
    
    twind.div(this.mass);
    this.acceleration.add(twind);
  }
  // End of Apply Force Method

  checkCollision(_t) {
    // Check distance between this ball and target tile
    let distance = this.position.dist(_t.position);

    if (distance < this.size.x / 2 + _t.size.x / 2) {
      // Calculate force applied to this ball
      // Subtract this.pos from _t.pos to get the force of impact
      let force = p5.Vector.sub(_t.position, this.position);

      // Normalize (set vector's length to 1)
      force.normalize();

      // Flip direction
      force.mult(-1);

      // Multiple by magnitude of other.vel
      force.mult(_t.velocity.mag());

      // Apply the calculated force to this ball
      this.applyForce(force);

      // Multiple this ball's velocity by resitution coefficient
      this.velocity.mult(COR);

      // Calculate force applied to other ball
      // Subtract other.pos from this.pos to get the force of impact
      force = p5.Vector.sub(this.position, _t.position);

      // Normalize (set vector's length to 1)
      force.normalize();

      // Flip direction
      force.mult(-1);

      // Multiple by magnitude of this.vel
      force.mult(this.velocity.mag());

      // Apply the calculated force to the other ball
      _t.applyForce(force);

      // Multiple other ball's velocity by resitution coefficient
      _t.velocity.mult(COR);

      this.colorDecay = 100 / this.mass;
    }
  }
  // End of collision method

  update() {
    // Add acceleration to velocity
    this.velocity.add(this.acceleration);

    // Add vel to pos
    this.position.add(this.velocity);

    // Reset acc
    this.acceleration.mult(0);

    if (this.colorDecay > 0) {
      this.colorDecay--;
      this.fillColor = secondaryColor;
    } else {
      this.fillColor = mainColor;
    }
  }

  display() {
    fill(this.fillColor);
    rect(this.position.x, this.position.y, this.size.x, this.size.y);
  }
}
// End of Tile Class
