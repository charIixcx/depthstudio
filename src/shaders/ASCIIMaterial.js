import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const vertexShader = /* glsl */`
  precision highp float;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */`
  precision highp float;

  uniform sampler2D uColorMap;
  uniform sampler2D uDepthMap;
  uniform vec2 uResolution;
  uniform float uTime;
  uniform float uCellSize;
  uniform float uDepthInfluence;
  uniform int uInvertDepth;
  uniform float uBrightness;
  uniform float uContrast;
  uniform vec3 uTint;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  // ASCII character patterns stored as bit patterns
  // Each character is 8x8 grid compressed into floats
  float getCharPattern(int charIndex, vec2 cellPos) {
    // Map brightness to character density
    // Characters ordered from least to most dense:
    // space, dot, comma, apostrophe, hyphen, equals, plus, hash, at, block
    
    int x = int(cellPos.x * 8.0);
    int y = int(cellPos.y * 8.0);
    
    if (charIndex == 0) { // space
      return 0.0;
    } else if (charIndex == 1) { // .
      return (x == 3 || x == 4) && (y == 6 || y == 7) ? 1.0 : 0.0;
    } else if (charIndex == 2) { // ,
      return (x >= 3 && x <= 4 && y >= 6) ? 1.0 : 0.0;
    } else if (charIndex == 3) { // '
      return (x >= 3 && x <= 4 && y <= 2) ? 1.0 : 0.0;
    } else if (charIndex == 4) { // -
      return (y >= 3 && y <= 4 && x >= 1 && x <= 6) ? 1.0 : 0.0;
    } else if (charIndex == 5) { // =
      return ((y == 2 || y == 3 || y == 5 || y == 6) && x >= 1 && x <= 6) ? 1.0 : 0.0;
    } else if (charIndex == 6) { // +
      return ((y >= 3 && y <= 4 && x >= 1 && x <= 6) || (x >= 3 && x <= 4 && y >= 1 && y <= 6)) ? 1.0 : 0.0;
    } else if (charIndex == 7) { // #
      return ((x == 2 || x == 5) || (y == 2 || y == 5)) ? 1.0 : 0.0;
    } else if (charIndex == 8) { // @
      return ((x >= 1 && x <= 6 && (y == 1 || y == 6)) || 
              (y >= 1 && y <= 6 && (x == 1 || x == 6)) ||
              (x >= 3 && x <= 5 && y >= 3 && y <= 5)) ? 1.0 : 0.0;
    } else if (charIndex == 9) { // █ (full block)
      return 1.0;
    }
    
    return 0.0;
  }

  int selectCharFromBrightness(float brightness) {
    // Map brightness to character index (0-9)
    brightness = clamp(brightness, 0.0, 1.0);
    return int(floor(brightness * 9.99));
  }

  void main() {
    // Calculate cell coordinates
    vec2 pixelPos = vUv * uResolution;
    vec2 cellCoord = floor(pixelPos / uCellSize);
    vec2 cellCenter = (cellCoord + 0.5) * uCellSize;
    vec2 cellUV = cellCenter / uResolution;
    
    // Sample color and depth at cell center
    vec3 color = texture2D(uColorMap, cellUV).rgb;
    float depth = texture2D(uDepthMap, cellUV).r;
    if (uInvertDepth == 1) depth = 1.0 - depth;
    
    // Calculate brightness
    float brightness = dot(color, vec3(0.299, 0.587, 0.114));
    
    // Apply color adjustments
    brightness = brightness + uBrightness;
    brightness = (brightness - 0.5) * uContrast + 0.5;
    brightness = clamp(brightness, 0.0, 1.0);
    
    // Modulate character density by depth
    float depthMod = mix(1.0, depth, uDepthInfluence);
    brightness *= depthMod;
    
    // Select character based on brightness
    int charIndex = selectCharFromBrightness(brightness);
    
    // Get position within the cell (0-1)
    vec2 cellLocalPos = fract(pixelPos / uCellSize);
    
    // Sample character pattern
    float charMask = getCharPattern(charIndex, cellLocalPos);
    
    // Apply color
    vec3 finalColor = color * uTint * charMask;
    
    // Add slight animation based on time and depth
    float pulse = sin(uTime * 2.0 + depth * 10.0) * 0.05 + 0.95;
    finalColor *= pulse;
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

const ASCIIMaterial = shaderMaterial(
  {
    uColorMap: null,
    uDepthMap: null,
    uResolution: [1024, 1024],
    uTime: 0.0,
    uCellSize: 8.0,
    uDepthInfluence: 0.5,
    uInvertDepth: 0,
    uBrightness: 0.0,
    uContrast: 1.0,
    uTint: [1, 1, 1]
  },
  vertexShader,
  fragmentShader
)

extend({ ASCIIMaterial })
