const TILE_SIZE = 64;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const FOV_ANGLE = 60 * (Math.PI / 180);

const WALL_STRIP_WIDTH = 1;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

const MINIMAP_SCALE_FACTOR = 0.2;

class Grid {
  constructor() {
    this.grid = [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];
  }

  render() {
    for (let i = 0; i < MAP_NUM_ROWS; i++) {
      for (let j = 0; j < MAP_NUM_COLS; j++) {
        const tileX = j * TILE_SIZE;
        const tileY = i * TILE_SIZE;
        const tileColor = this.grid[i][j] == 1 ? '#222' : '#fff';
        stroke('#222');
        fill(tileColor);
        rect(
          MINIMAP_SCALE_FACTOR * tileX,
          MINIMAP_SCALE_FACTOR * tileY,
          MINIMAP_SCALE_FACTOR * TILE_SIZE,
          MINIMAP_SCALE_FACTOR * TILE_SIZE,
        );
      }
    }
  }

  hasWallAt(x, y) {
    const gridRow = Math.floor(y / TILE_SIZE);
    const gridCol = Math.floor(x / TILE_SIZE);

    if (gridRow < 0 || gridRow >= MAP_NUM_ROWS) {
      return true;
    }

    if (gridCol < 0 || gridCol >= MAP_NUM_COLS) {
      return true;
    }

    return this.grid[gridRow][gridCol] == 1;
  }
}

class Player {
  constructor() {
    this.x = WINDOW_WIDTH / 2;
    this.y = WINDOW_HEIGHT / 2;
    this.radius = 3;
    this.turnDirection = 0; // -1 if left, +1 if right
    this.walkDirection = 0; // -1 if back, +1 if front
    this.rotationAngle = Math.PI / 2;
    this.moveSpeed = 2.0;
    this.rotationSpeed = 2 * (Math.PI / 180);
  }

  update(grid) {
    this.rotationAngle += this.turnDirection * this.rotationSpeed;

    if (this.rotationAngle > 2 * Math.PI) {
      this.rotationAngle -= 2 * Math.PI;
    }

    if (this.rotationAngle < 0) {
      this.rotationAngle += 2 * Math.PI;
    }

    const moveStep = this.walkDirection * this.moveSpeed;

    const newXPos = this.x + Math.cos(this.rotationAngle) * moveStep;
    const newYPos = this.y + Math.sin(this.rotationAngle) * moveStep;

    if (!grid.hasWallAt(newXPos, this.y)) {
      this.x = newXPos;
    }

    if (!grid.hasWallAt(this.x, newYPos)) {
      this.y = newYPos;
    }
  }

  render() {
    noStroke();
    fill('red');
    circle(MINIMAP_SCALE_FACTOR * this.x, MINIMAP_SCALE_FACTOR * this.y, MINIMAP_SCALE_FACTOR * this.radius);
    stroke('blue');
    line(
      MINIMAP_SCALE_FACTOR * this.x,
      MINIMAP_SCALE_FACTOR * this.y,
      MINIMAP_SCALE_FACTOR * (this.x + Math.cos(this.rotationAngle) * 30),
      MINIMAP_SCALE_FACTOR * (this.y + Math.sin(this.rotationAngle) * 30),
    );
  }
}

class Ray {
  constructor(rayAngle) {
    this.rayAngle = normalizeAngle(rayAngle);
    this.wallHitX = 0;
    this.wallHitY = 0;
    this.distance = 0;
    this.wasHitVertical = false;

    this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI;
    this.isRayFacingUp = !this.isRayFacingDown;

    this.isRayFacingRight = this.rayAngle < Math.PI * 0.5 || this.rayAngle > Math.PI * 1.5;
    this.isRayFacingLeft = !this.isRayFacingRight;
  }

  render() {
    stroke('rgba(255, 0, 0, 0.3)');
    line(
      MINIMAP_SCALE_FACTOR * player.x,
      MINIMAP_SCALE_FACTOR * player.y,
      MINIMAP_SCALE_FACTOR * this.wallHitX,
      MINIMAP_SCALE_FACTOR * this.wallHitY,
    );
  }

  cast(columId) {
    let yIntercept, xIntercept;
    let xStep, yStep;
    let horzWallHitX = 0;
    let horzWallHitY = 0;

    /////////////////////////////////////////////////////////////////////////
    // HORIZONTAL RAY-GRID INTERSECTION CODE
    /////////////////////////////////////////////////////////////////////////
    let foundHorzWallHit = false;

    // Find the y-coordinate of the closest horizontal grid intersetion
    yIntercept = Math.floor(player.y / TILE_SIZE) * TILE_SIZE;
    yIntercept += this.isRayFacingDown ? TILE_SIZE : 0;

    // Find the x-coordinate of the closest horizontal grid intersetion
    xIntercept = player.x + (yIntercept - player.y) / Math.tan(this.rayAngle);

    // Calculate the increment xstep and ystep
    yStep = TILE_SIZE;
    yStep *= this.isRayFacingUp ? -1 : 1;

    xStep = TILE_SIZE / Math.tan(this.rayAngle);
    xStep *= this.isRayFacingLeft && xStep > 0 ? -1 : 1;
    xStep *= this.isRayFacingRight && xStep < 0 ? -1 : 1;

    let nextHorzTouchX = xIntercept;
    let nextHorzTouchY = yIntercept;

    // Increment xStep and yStep until we find a wall
    while (
      nextHorzTouchX >= 0 &&
      nextHorzTouchX <= WINDOW_WIDTH &&
      nextHorzTouchY >= 0 &&
      nextHorzTouchY <= WINDOW_WIDTH
    ) {
      if (grid.hasWallAt(nextHorzTouchX, nextHorzTouchY - (this.isRayFacingUp ? 1 : 0))) {
        foundHorzWallHit = true;
        horzWallHitX = nextHorzTouchX;
        horzWallHitY = nextHorzTouchY;

        break;
      }
      nextHorzTouchX += xStep;
      nextHorzTouchY += yStep;
    }

    /////////////////////////////////////////////////////////////////////////
    // VERTICAL RAY-GRID INTERSECTION CODE
    /////////////////////////////////////////////////////////////////////////
    //
    let foundVertWallHit = false;
    let vertWallHitX = 0;
    let vertWallHitY = 0;

    // Find the x-coordinate of the closest vertical grid intersetion
    xIntercept = Math.floor(player.x / TILE_SIZE) * TILE_SIZE;
    xIntercept += this.isRayFacingRight ? TILE_SIZE : 0;

    // Find the y-coordinate of the closest vertical grid intersetion
    yIntercept = player.y + (xIntercept - player.x) * Math.tan(this.rayAngle);

    // Calculate the increment xstep and ystep
    xStep = TILE_SIZE;
    xStep *= this.isRayFacingLeft ? -1 : 1;

    yStep = TILE_SIZE * Math.tan(this.rayAngle);
    yStep *= this.isRayFacingUp && yStep > 0 ? -1 : 1;
    yStep *= this.isRayFacingDown && yStep < 0 ? -1 : 1;

    let nextVertTouchX = xIntercept;
    let nextVertTouchY = yIntercept;

    // Increment xStep and yStep until we find a wall
    while (
      nextVertTouchX >= 0 &&
      nextVertTouchX <= WINDOW_WIDTH &&
      nextVertTouchY >= 0 &&
      nextVertTouchY <= WINDOW_WIDTH
    ) {
      if (grid.hasWallAt(nextVertTouchX - (this.isRayFacingLeft ? 1 : 0), nextVertTouchY)) {
        foundVertWallHit = true;
        vertWallHitX = nextVertTouchX;
        vertWallHitY = nextVertTouchY;

        break;
      }
      nextVertTouchX += xStep;
      nextVertTouchY += yStep;
    }

    // Calculate both horizontal and vertical distances and choose the smallest value
    const horzHitDistance = foundHorzWallHit
      ? distanceBetweenPoints(player.x, player.y, horzWallHitX, horzWallHitY)
      : Number.MAX_VALUE;

    const vertHitDistance = foundVertWallHit
      ? distanceBetweenPoints(player.x, player.y, vertWallHitX, vertWallHitY)
      : Number.MAX_VALUE;

    // only store the smallest of the distances
    this.wallHitX = horzHitDistance < vertHitDistance ? horzWallHitX : vertWallHitX;
    this.wallHitY = horzHitDistance < vertHitDistance ? horzWallHitY : vertWallHitY;
    this.distance = horzHitDistance < vertHitDistance ? horzHitDistance : vertHitDistance;
    this.wasHitVertical = vertHitDistance < horzHitDistance;
  }
}

const grid = new Grid();
const player = new Player();
let rays = [];

function keyPressed() {
  if (keyCode == UP_ARROW) {
    player.walkDirection = 1;
  } else if (keyCode == DOWN_ARROW) {
    player.walkDirection = -1;
  } else if (keyCode == RIGHT_ARROW) {
    player.turnDirection = 1;
  } else if (keyCode == LEFT_ARROW) {
    player.turnDirection = -1;
  }
}

function keyReleased() {
  if (keyCode == UP_ARROW) {
    player.walkDirection = 0;
  } else if (keyCode == DOWN_ARROW) {
    player.walkDirection = 0;
  } else if (keyCode == RIGHT_ARROW) {
    player.turnDirection = 0;
  } else if (keyCode == LEFT_ARROW) {
    player.turnDirection = 0;
  }
}

function render3DProjectedWalls() {
  // loop every ray in the array of rays
  for (let i = 0; i < NUM_RAYS; i++) {
    const ray = rays[i];

    const perpendicularWallDist = ray.distance * Math.cos(ray.rayAngle - player.rotationAngle);
    const distanceProjectPlane = WINDOW_WIDTH / 2 / Math.tan(FOV_ANGLE / 2);

    // projected wall height
    const wallStripHeight = (TILE_SIZE / perpendicularWallDist) * distanceProjectPlane;

    fill('rgba(255, 255, 255, 1.0)');
    noStroke();
    rect(i * WALL_STRIP_WIDTH, WINDOW_HEIGHT / 2 - wallStripHeight / 2, WALL_STRIP_WIDTH, wallStripHeight);
  }
}

function normalizeAngle(angle) {
  angle = angle % (2 * Math.PI);
  if (angle < 0) {
    angle += 2 * Math.PI;
  }
  return angle;
}

function distanceBetweenPoints(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function castAllRays() {
  let columnId = 0;

  let rayAngle = player.rotationAngle - FOV_ANGLE / 2;
  rays = [];

  for (let i = 0; i < NUM_RAYS; i++) {
    const ray = new Ray(rayAngle);
    ray.cast(columnId);
    rays.push(ray);

    rayAngle += FOV_ANGLE / NUM_RAYS;
    columnId++;
  }
}

function setup() {
  createCanvas(WINDOW_WIDTH, WINDOW_HEIGHT);
}

function update() {
  player.update(grid);
  castAllRays();
}

function draw() {
  clear('#212121');
  update();
  render3DProjectedWalls();
  grid.render();
  for (const ray of rays) {
    ray.render();
  }
  player.render();
}
