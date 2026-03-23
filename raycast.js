const TILE_SIZE = 32;
const MAP_NUM_ROWS = 11;
const MAP_NUM_COLS = 15;

const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;

const FOV_ANGLE = 60 * (Math.PI / 180);

const WALL_STRIP_WIDTH = 30;
const NUM_RAYS = WINDOW_WIDTH / WALL_STRIP_WIDTH;

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
        rect(tileX, tileY, TILE_SIZE, TILE_SIZE);
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
    circle(this.x, this.y, this.radius);
    stroke('red');
    line(this.x, this.y, this.x + Math.cos(this.rotationAngle) * 30, this.y + Math.sin(this.rotationAngle) * 30);
  }
}

class Ray {
  constructor(rayAngle) {
    this.rayAngle = rayAngle;
  }

  render() {
    stroke('rgba(255, 0, 0, 0.3)');
    const gridRow = Math.floor(player.y / TILE_SIZE);
    const gridCol = Math.floor(player.x / TILE_SIZE);
    const rowOffset = gridRow * TILE_SIZE;
    const colOffset = gridCol * TILE_SIZE;

    //inside grid
    const playerGridX = player.x - colOffset;
    const playerGridY = player.y - rowOffset;

    let wallX;
    let wallY;

    if (this.rayAngle <= Math.PI) {
      const opposite = TILE_SIZE - playerGridY;
      const hypotenuse = opposite / Math.sin(this.rayAngle);

      const adjacent = Math.cos(this.rayAngle) * hypotenuse;
      wallX = player.x + adjacent;
      wallY = player.y + opposite;
    } else {
      const opposite = -playerGridY;
      const hypotenuse = opposite / Math.sin(this.rayAngle);
      const adjacent = Math.cos(this.rayAngle) * hypotenuse;
      wallX = player.x + adjacent;
      wallY = player.y + opposite;
    }

    line(player.x, player.y, wallX, wallY);
  }

  cast() {
    // TODO:
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

function castAllRays() {
  let columnId = 0;

  let rayAngle = player.rotationAngle - FOV_ANGLE / 2;
  rays = [];

  // for (let i = 0; i < NUM_RAYS; i++) {
  for (let i = 0; i < 1; i++) {
    if (rayAngle > 2 * Math.PI) {
      rayAngle -= 2 * Math.PI;
    }

    if (rayAngle < 0) {
      rayAngle += 2 * Math.PI;
    }
    const ray = new Ray(rayAngle);
    ray.cast();
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
  update();
  grid.render();
  for (const ray of rays) {
    ray.render();
  }
  player.render();
}
