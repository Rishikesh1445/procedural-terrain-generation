/** This final version adds map zooming and panning. */

class TerrainType {
  constructor(minHeight, maxHeight, minColor, maxColor, lerpAdjustment = 0) {
    this.minHeight = minHeight;
    this.maxHeight = maxHeight;
    this.minColor = minColor;
    this.maxColor = maxColor;
    // An adjustment to the color lerp for the map type, this weighs the color
    // towards the min or max color.
    this.lerpAdjustment = lerpAdjustment;
  }
}

let waterTerrain;
let sandTerrain;
let grassTerrain;
let treesTerrain;

let terrainType = [];
let terrainTypes = [];

let zoomFactor = 100;
let mapChanged = true;
// The x and y offset need to be large because Perlin noise mirrors around 0.
let xOffset = 10000;
let yOffset = 10000;
const cameraSpeed = 10;

function setup() {
  createCanvas(1000, 1000);

  // Adjusts the level of detail created by the Perlin noise by layering
  // multiple versions of it together.
  noiseDetail(6, 0.5);

  // Perlin noise doesn't often go below 0.2, so pretend the min is 0.2 and not
  // 0 so that the colors are more evenly distributed. Otherwise, there is 
  // little deep water represented. This is the same for setting the max for 
  // 'trees' to 0.75: noise rarely goes above 0.8 and the tree colors look 
  // better assuming 0.75 as the max.
  waterTerrain =
    new TerrainType(0.2, 0.3, color(30, 176, 251), color(40, 255, 255));
  sandTerrain =
    new TerrainType(0.4, 0.5, color(215, 192, 158), color(255, 246, 193), 0.3);
  grassTerrain =
    new TerrainType(0.5, 0.7, color(2, 166, 155), color(118, 239, 124));
  treesTerrain =
    new TerrainType(0.7, 0.75, color(22, 181, 141), color(10, 145, 113), -0.5);

  terrainType = [waterTerrain, sandTerrain, grassTerrain, treesTerrain];
}

function draw() {
  mapChanged = true;

  for (x = 0; x < width; x++) {
    terrainTypes[x] = [];
    for (y = 0; y < height; y++) {
      // Set xVal and yVal for the noise such that the map is centered around
      // the center of the canvas. Adding x and y offset values allows us to
      // move around the noise with the arrow keys.
      const xVal = (x - width / 2) / zoomFactor + xOffset;
      const yVal = (y - height / 2) / zoomFactor + yOffset;
      const noiseValue = noise(xVal, yVal);

      let terrainColor;
      // Compare the current noise value to each mapType max height and get the
      // terrain color accordingly. For easier extendability and less code 
      // repetition you could store the terrain types in an array and iterate
      // over it with a for loop checking for maxHeight. For this example I just
      // wanted to keep it simple and similar to previous versions.
      if (noiseValue < waterTerrain.maxHeight) {
        terrainColor = getTerrainColor(noiseValue, waterTerrain);
        terrainType = 0;
      } else if (noiseValue < sandTerrain.maxHeight) {
        terrainColor = getTerrainColor(noiseValue, sandTerrain);
        terrainType = 1;
      } else if (noiseValue < grassTerrain.maxHeight) {
        terrainColor = getTerrainColor(noiseValue, grassTerrain);
        terrainType = 2;
      } else {
        terrainColor = getTerrainColor(noiseValue, treesTerrain);
        terrainType = 3;
      }
      set(x, y, terrainColor);

      terrainTypes[x][y] = terrainType;
    }
  }

  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const xVal = (x - width / 2) / zoomFactor + xOffset;
      const yVal = (y - height / 2) / zoomFactor + yOffset;
      const noiseValue = noise(xVal, yVal);

      let terrainColor;
      // Get terrain color as before
      if (noiseValue < waterTerrain.maxHeight) {
        terrainColor = getTerrainColor(noiseValue, waterTerrain);
      } else if (noiseValue < sandTerrain.maxHeight) {
        terrainColor = getTerrainColor(noiseValue, sandTerrain);
      } else if (noiseValue < grassTerrain.maxHeight) {
        terrainColor = getTerrainColor(noiseValue, grassTerrain);
      } else {
        terrainColor = getTerrainColor(noiseValue, treesTerrain);
      }
      
      // Check for terrain boundaries
      let isBoundary = false;
      
      // Check neighboring pixels
      const checkNeighbors = [
        [x-1, y],   // left
        [x+1, y],   // right
        [x, y-1],   // top
        [x, y+1]    // bottom
      ];
      
      for (let [nx, ny] of checkNeighbors) {
        // Ensure we're within canvas bounds
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          // If any neighbor has a different terrain type, this is a boundary
          if (terrainTypes[nx][ny] !== terrainTypes[x][y]) {
            isBoundary = true;
            break;
          }
        }
      }
      
      // If it's a boundary, draw black. Otherwise, draw the terrain color
      if (isBoundary) {
        set(x, y, color(0, 0, 0)); // Black boundary
      } else {
        set(x, y, terrainColor);
      }
    }
  }
  
  updatePixels();
  mapChanged = false;
}

function getTerrainColor(noiseValue, mapType) {
  // Given a noise value, normalize to to be between 0 to 1 representing how
  // close it is to the min or max height for the given terrain type.
  const normalized =
    normalize(noiseValue, mapType.maxHeight, mapType.minHeight);
  // Blend between the min and max height colors based on the normalized
  // noise value.
  return lerpColor(mapType.minColor, mapType.maxColor,
    normalized + mapType.lerpAdjustment);
}

// Return a number between 0 and 1 between max and min based on value.
function normalize(value, max, min) {
  if (value > max) {
    return 1;
  }
  if (value < min) {
    return 0;
  }
  return (value - min) / (max - min);
}
