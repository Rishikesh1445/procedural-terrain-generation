/** This final version adds map zooming and panning. */

let zoomFactor = 100;
let mapTypes;
let mapChanged = true;
// The x and y offset need to be large because Perlin noise mirrors around 0.
let xOffset = 10000;
let yOffset = 10000;
const cameraSpeed = 10;

class MapType {
  constructor(minHeight, maxHeight, minColor, maxColor, lerpAdjustment = 0) {
    this.minHeight = minHeight;
    this.maxHeight = maxHeight;
    this.minColor = minColor;
    this.maxColor = maxColor;
    // An adjustment to the color lerp for the map type, this weights the color
    // towards the min or max color.
    this.lerpAdjustment = lerpAdjustment;
  }
}

function setup() {
  createCanvas(400, 400);

  // Adjusts the level of detail created by the Perlin noise by layering
  // multiple versions of it together.
  noiseDetail(9, 0.5);

  // Perlin noise doesn't often go below 0.2, so set the min to so pretend the 
  // min is 0.2 and not 0 so that the colors are more evenly distributed. 
  // Otherwise there is little deep water represented. This is the same for
  // setting the max for 'trees' to 0.75. Noise rarely goes above 0.8 and the 
  // tree colors look better assuming 0.75 as the max.
  mapTypes = {
    'water': new MapType(0.2, 0.4, color(30, 176, 251),
      color(40, 255, 255)),
    'sand': new MapType(0.4, 0.5, color(215, 192, 158),
      color(255, 246, 193), 0.3),
    'grass': new MapType(0.5, .7, color(2, 166, 155),
      color(118, 239, 124)),
    'trees': new MapType(0.7, .75, color(22, 181, 141),
      color(10, 145, 113), -0.5),
  };
}

function draw() {
  if (keyIsDown(RIGHT_ARROW)) {
    xOffset += 1 / zoomFactor * cameraSpeed;
    mapChanged = true;
  }
  if (keyIsDown(LEFT_ARROW)) {
    xOffset -= 1 / zoomFactor * cameraSpeed;
    mapChanged = true;
  }
  if (keyIsDown(UP_ARROW)) {
    yOffset -= 1 / zoomFactor * cameraSpeed;
    mapChanged = true;
  }
  if (keyIsDown(DOWN_ARROW)) {
    yOffset += 1 / zoomFactor * cameraSpeed;
    mapChanged = true;
  }

  if (!mapChanged) {
    return;
  }

  for (x = 0; x < width; x++) {
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
      // repetition, this could be done in a for loop instead but I wanted to
      // keep this structure similar to the previous iterations.
      if (noiseValue < mapTypes.water.maxHeight) {
        terrainColor = getTerrainColor(noiseValue, mapTypes.water);
      } else if (noiseValue < mapTypes.sand.maxHeight) {
        terrainColor = getTerrainColor(noiseValue, mapTypes.sand);
      } else if (noiseValue < mapTypes.grass.maxHeight) {
        terrainColor = getTerrainColor(noiseValue, mapTypes.grass);
      } else {
        terrainColor = getTerrainColor(noiseValue, mapTypes.trees);
      }
      set(x, y, terrainColor);
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

function mouseWheel(event) {
  zoomFactor -= event.delta / 10;
  // Set the min zoom factor to 10 so that the map stays somewhat recognizeable.
  zoomFactor = Math.max(10, zoomFactor);
  mapChanged = true;
}