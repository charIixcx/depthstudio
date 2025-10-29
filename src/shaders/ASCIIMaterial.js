import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const vertexShader = /* glsl */`
  precision highp float;

  uniform sampler2D uDepthMap;
  uniform vec2 uTexelSize;
  uniform int uInvertDepth;
  uniform int uUse3D;
  uniform float uDepthScale;
  uniform float uTime;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormal;

  float sampleDepth(vec2 uv) {
    float d = texture2D(uDepthMap, uv).r;
    if (uInvertDepth == 1) d = 1.0 - d;
    return d;
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    if (uUse3D == 1) {
      // Apply depth displacement
      float depth = sampleDepth(uv);
      float displacement = (depth - 0.5) * uDepthScale;
      pos += normal * displacement;
      
      // Calculate normal from depth gradient for lighting
      float epsx = uTexelSize.x;
      float epsy = uTexelSize.y;
      float hL = sampleDepth(uv - vec2(epsx, 0.0));
      float hR = sampleDepth(uv + vec2(epsx, 0.0));
      float hD = sampleDepth(uv - vec2(0.0, epsy));
      float hU = sampleDepth(uv + vec2(0.0, epsy));
      float dx = (hR - hL) * uDepthScale;
      float dy = (hU - hD) * uDepthScale;
      vNormal = normalize(vec3(-dx * 3.0, -dy * 3.0, 1.0));
    } else {
      vNormal = normal;
    }
    
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */`
  precision highp float;

  uniform sampler2D uColorMap;
  uniform sampler2D uDepthMap;
  uniform vec2 uResolution;
  uniform vec2 uTexelSize;
  uniform float uTime;
  uniform float uCellSize;
  uniform float uDepthInfluence;
  uniform int uInvertDepth;
  uniform float uBrightness;
  uniform float uContrast;
  uniform vec3 uTint;
  uniform int uColorize;
  uniform float uWaveAmp;
  uniform float uJitter;
  uniform int uUse3D;
  uniform float uDepthScale;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying vec3 vNormal;

  // Hash function for pseudo-random values
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

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
    // Add wave distortion
    vec2 animUV = vUv;
    if (uWaveAmp > 0.0) {
      animUV.x += sin(vUv.y * 20.0 + uTime * 2.0) * uWaveAmp;
      animUV.y += cos(vUv.x * 15.0 + uTime * 1.5) * uWaveAmp * 0.7;
    }
    
    // Calculate cell coordinates
    vec2 pixelPos = animUV * uResolution;
    vec2 cellCoord = floor(pixelPos / uCellSize);
    
    // Add jitter to cell coordinates
    if (uJitter > 0.0) {
      float jitterX = (hash(cellCoord + vec2(uTime * 0.1)) - 0.5) * uJitter * uCellSize;
      float jitterY = (hash(cellCoord + vec2(uTime * 0.13, 100.0)) - 0.5) * uJitter * uCellSize;
      pixelPos.x += jitterX;
      pixelPos.y += jitterY;
      cellCoord = floor(pixelPos / uCellSize);
    }
    
    vec2 cellCenter = (cellCoord + 0.5) * uCellSize;
    vec2 cellUV = cellCenter / uResolution;
    
    // Clamp UV to valid range
    cellUV = clamp(cellUV, 0.0, 1.0);
    
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
    
    // Apply color - use grayscale or original color based on uColorize
    vec3 baseColor = uColorize == 1 ? color : vec3(brightness);
    vec3 finalColor = baseColor * uTint * charMask;
    
    // Add subtle pulse animation based on depth
    float pulse = sin(uTime * 1.5 + depth * 8.0) * 0.03 + 0.97;
    finalColor *= pulse;
    
    // Apply lighting in 3D mode
    if (uUse3D == 1) {
      vec3 lightDir = normalize(vec3(-0.5, 0.8, 0.6));
      float ndotl = max(dot(vNormal, lightDir), 0.0);
      float lighting = 0.6 + ndotl * 0.4;
      finalColor *= lighting;
    }
    
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
    uTint: [1, 1, 1],
    uColorize: 1,
    uWaveAmp: 0.02,
    uJitter: 0.0,
    uTexelSize: [1.0 / 1024.0, 1.0 / 1024.0],
    uUse3D: 1,
    uDepthScale: 0.15,
    uJitter: 0.005
  },
  vertexShader,
  fragmentShader
)

extend({ ASCIIMaterial })
