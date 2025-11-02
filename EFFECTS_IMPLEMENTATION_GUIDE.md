# Render Effects Implementation Guide

Quick reference for implementing recommended effects in Depth Studio.

## Table of Contents
1. [Depth Texture System](#depth-texture-system)
2. [Scanline Effects](#scanline-effects)
3. [BodyPix Segmentation](#bodypix-segmentation)
4. [Advanced Shader Effects](#advanced-shader-effects)
5. [Performance Optimization](#performance-optimization)

---

## Depth Texture System

### Installation
No additional dependencies needed - uses native Three.js.

### Basic Implementation

#### Step 1: Create Depth Render Target
```javascript
// src/components/DepthCapture.jsx
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function DepthCapture({ onDepthUpdate }) {
  const { gl, scene, camera, size } = useThree();
  
  const depthTarget = useMemo(() => {
    const depthTexture = new THREE.DepthTexture(
      size.width,
      size.height
    );
    depthTexture.type = THREE.UnsignedShortType;
    depthTexture.format = THREE.DepthFormat;
    
    return new THREE.WebGLRenderTarget(size.width, size.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthTexture: depthTexture,
      depthBuffer: true,
    });
  }, [size]);

  useFrame(() => {
    // Capture depth
    gl.setRenderTarget(depthTarget);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    
    // Pass depth texture to parent
    if (onDepthUpdate) {
      onDepthUpdate(depthTarget.depthTexture);
    }
  });

  return null;
}
```

#### Step 2: Use Depth Texture in Shader
```javascript
// In your material shader
const depthMaskShader = {
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 100 },
    depthMaskRange: { value: new THREE.Vector2(0.0, 1.0) },
  },
  
  vertexShader: `
    varying vec2 vUv;
    
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform float cameraNear;
    uniform float cameraFar;
    uniform vec2 depthMaskRange;
    
    varying vec2 vUv;
    
    float readDepth(sampler2D depthSampler, vec2 coord) {
      float fragCoordZ = texture2D(depthSampler, coord).x;
      float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
      return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
    }
    
    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float depth = readDepth(tDepth, vUv);
      
      // Create depth-based mask
      float mask = smoothstep(depthMaskRange.x, depthMaskRange.y, depth);
      
      // Apply mask to color
      gl_FragColor = vec4(color.rgb, color.a * mask);
    }
  `
};
```

#### Step 3: Add to Post-Processing
```javascript
import { DepthCapture } from './components/DepthCapture';

function Scene() {
  const [depthTexture, setDepthTexture] = useState(null);
  
  return (
    <>
      <DepthCapture onDepthUpdate={setDepthTexture} />
      
      {/* Use depthTexture in your effects */}
      <EffectComposer>
        <CustomDepthEffect depthTexture={depthTexture} />
      </EffectComposer>
    </>
  );
}
```

---

## Scanline Effects

### Option 1: Custom GLSL Shader (Recommended)

#### Scanline Post-Processing Effect
```javascript
// src/shaders/ScanlineEffect.js
import { Effect } from 'postprocessing';
import { Uniform } from 'three';

const fragmentShader = `
uniform float time;
uniform float scanlineCount;
uniform float scanlineIntensity;
uniform float scanlineSpeed;
uniform float scanlineThickness;
uniform float flickerIntensity;
uniform float noiseIntensity;

// Simple noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = inputColor;
  
  // Scanlines
  float scanline = sin(uv.y * scanlineCount + time * scanlineSpeed);
  scanline = pow(scanline * 0.5 + 0.5, scanlineThickness);
  scanline = mix(1.0, scanline, scanlineIntensity);
  
  // Flicker effect
  float flicker = noise(vec2(time * 10.0, 0.0)) * flickerIntensity;
  flicker = mix(1.0, 1.0 - flicker, 0.5);
  
  // RGB noise
  vec3 noiseColor = vec3(
    noise(uv + time),
    noise(uv + time + 1.0),
    noise(uv + time + 2.0)
  );
  noiseColor = mix(vec3(1.0), noiseColor, noiseIntensity);
  
  // Combine effects
  color.rgb *= scanline * flicker * noiseColor;
  
  outputColor = color;
}
`;

export class ScanlineEffect extends Effect {
  constructor({
    scanlineCount = 800.0,
    scanlineIntensity = 0.3,
    scanlineSpeed = 1.0,
    scanlineThickness = 2.0,
    flickerIntensity = 0.1,
    noiseIntensity = 0.05,
  } = {}) {
    super('ScanlineEffect', fragmentShader, {
      uniforms: new Map([
        ['time', new Uniform(0)],
        ['scanlineCount', new Uniform(scanlineCount)],
        ['scanlineIntensity', new Uniform(scanlineIntensity)],
        ['scanlineSpeed', new Uniform(scanlineSpeed)],
        ['scanlineThickness', new Uniform(scanlineThickness)],
        ['flickerIntensity', new Uniform(flickerIntensity)],
        ['noiseIntensity', new Uniform(noiseIntensity)],
      ])
    });
  }

  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get('time').value += deltaTime;
  }
}
```

#### Using Scanline Effect
```javascript
// In your Scene component
import { EffectComposer } from '@react-three/postprocessing';
import { ScanlineEffect } from '../shaders/ScanlineEffect';

function Scene() {
  const scanlineEffect = useMemo(() => new ScanlineEffect({
    scanlineCount: 800,
    scanlineIntensity: 0.3,
    scanlineSpeed: 1.0,
  }), []);

  return (
    <EffectComposer>
      <primitive object={scanlineEffect} />
    </EffectComposer>
  );
}
```

### Option 2: VFX-JS Integration

#### Installation
```bash
npm install vfx-js
```

#### Basic Usage
```javascript
import { VFX } from 'vfx-js';

// Apply to canvas or image element
const vfx = new VFX();
vfx.add(canvasElement, { shader: 'scanline' });
```

---

## BodyPix Segmentation

### Installation
```bash
npm install @tensorflow/tfjs @tensorflow-models/body-pix
# OR
npm install ml5
```

### Implementation with ml5.js (Simpler)

```javascript
// src/hooks/useSegmentation.js
import { useEffect, useState, useRef } from 'react';
import ml5 from 'ml5';

export function useSegmentation() {
  const [bodyPix, setBodyPix] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const model = await ml5.bodyPix();
        setBodyPix(model);
        setIsLoading(false);
      } catch (err) {
        setError(err);
        setIsLoading(false);
      }
    }
    loadModel();
  }, []);

  const segment = async (imageElement, options = {}) => {
    if (!bodyPix) return null;
    
    const segmentation = await bodyPix.segment(imageElement, {
      palette: options.palette || ml5.bodyPix.palette.rainbow,
      opacity: options.opacity || 0.5,
      maskType: options.maskType || 'parts', // 'parts' or 'person'
    });
    
    return segmentation;
  };

  const segmentWithParts = async (imageElement) => {
    if (!bodyPix) return null;
    
    return await bodyPix.segmentWithParts(imageElement);
  };

  return {
    segment,
    segmentWithParts,
    isLoading,
    error,
    isReady: !!bodyPix,
  };
}
```

### Implementation with TensorFlow.js (More Control)

```javascript
// src/hooks/useBodyPixTF.js
import { useEffect, useState } from 'react';
import * as bodyPix from '@tensorflow-models/body-pix';

export function useBodyPixTF(config = {}) {
  const [net, setNet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadModel() {
      const loadedNet = await bodyPix.load({
        architecture: config.architecture || 'MobileNetV1',
        outputStride: config.outputStride || 16,
        multiplier: config.multiplier || 0.75,
        quantBytes: config.quantBytes || 2,
      });
      setNet(loadedNet);
      setIsLoading(false);
    }
    loadModel();
  }, []);

  const segmentPerson = async (imageElement, options = {}) => {
    if (!net) return null;
    
    return await net.segmentPerson(imageElement, {
      flipHorizontal: options.flipHorizontal || false,
      internalResolution: options.internalResolution || 'medium',
      segmentationThreshold: options.segmentationThreshold || 0.7,
    });
  };

  const segmentMultiPerson = async (imageElement, options = {}) => {
    if (!net) return null;
    
    return await net.segmentMultiPerson(imageElement, {
      flipHorizontal: options.flipHorizontal || false,
      internalResolution: options.internalResolution || 'medium',
      segmentationThreshold: options.segmentationThreshold || 0.7,
      maxDetections: options.maxDetections || 5,
      scoreThreshold: options.scoreThreshold || 0.3,
      nmsRadius: options.nmsRadius || 20,
    });
  };

  return {
    segmentPerson,
    segmentMultiPerson,
    isLoading,
    isReady: !!net,
  };
}
```

### Using Segmentation in Component

```javascript
// src/components/SegmentationView.jsx
import { useEffect, useRef, useState } from 'react';
import { useSegmentation } from '../hooks/useSegmentation';

export function SegmentationView({ imageUrl }) {
  const { segment, isReady } = useSegmentation();
  const imageRef = useRef();
  const canvasRef = useRef();
  const [segmentationMask, setSegmentationMask] = useState(null);

  useEffect(() => {
    async function processImage() {
      if (!isReady || !imageRef.current) return;
      
      const result = await segment(imageRef.current);
      setSegmentationMask(result);
      
      // Draw segmentation to canvas
      if (result && canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.drawImage(result.backgroundMask, 0, 0);
      }
    }
    
    processImage();
  }, [imageUrl, isReady, segment]);

  return (
    <div>
      <img 
        ref={imageRef}
        src={imageUrl}
        alt="Source"
        style={{ display: 'none' }}
        onLoad={() => processImage()}
      />
      <canvas ref={canvasRef} />
    </div>
  );
}
```

### Integrating with Depth Rendering

```javascript
// src/components/SegmentedDepthSurface.jsx
import { useMemo } from 'react';
import * as THREE from 'three';
import { useSegmentation } from '../hooks/useSegmentation';

export function SegmentedDepthSurface({ colorImage, depthImage }) {
  const { segment, isReady } = useSegmentation();
  const [segmentationMask, setSegmentationMask] = useState(null);

  useEffect(() => {
    async function processSegmentation() {
      if (!isReady || !colorImage) return;
      
      const img = new Image();
      img.src = colorImage;
      await img.decode();
      
      const result = await segment(img);
      setSegmentationMask(result);
    }
    
    processSegmentation();
  }, [colorImage, isReady]);

  const segmentationTexture = useMemo(() => {
    if (!segmentationMask) return null;
    
    // Convert mask to Three.js texture
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = segmentationMask.width;
    canvas.height = segmentationMask.height;
    
    // Draw mask
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const data = segmentationMask.data;
    
    for (let i = 0; i < data.length; i++) {
      const isPerson = data[i] === 1;
      imageData.data[i * 4] = isPerson ? 255 : 0;
      imageData.data[i * 4 + 1] = isPerson ? 255 : 0;
      imageData.data[i * 4 + 2] = isPerson ? 255 : 0;
      imageData.data[i * 4 + 3] = 255;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [segmentationMask]);

  return (
    <mesh>
      <planeGeometry args={[2, 2, 256, 256]} />
      <shaderMaterial
        uniforms={{
          colorMap: { value: colorTexture },
          depthMap: { value: depthTexture },
          segmentationMap: { value: segmentationTexture },
        }}
        vertexShader={segmentedVertexShader}
        fragmentShader={segmentedFragmentShader}
      />
    </mesh>
  );
}
```

---

## Advanced Shader Effects

### CRT Effect

```glsl
// CRT shader with barrel distortion and color bleeding
uniform sampler2D tDiffuse;
uniform float time;
uniform float distortion;
uniform float colorBleed;
uniform float brightness;

varying vec2 vUv;

vec2 barrelDistortion(vec2 coord, float amt) {
  vec2 cc = coord - 0.5;
  float dist = dot(cc, cc);
  return coord + cc * dist * amt;
}

void main() {
  vec2 uv = vUv;
  
  // Barrel distortion
  uv = barrelDistortion(uv, distortion);
  
  // RGB color separation
  vec2 offset = vec2(colorBleed, 0.0);
  float r = texture2D(tDiffuse, uv - offset).r;
  float g = texture2D(tDiffuse, uv).g;
  float b = texture2D(tDiffuse, uv + offset).b;
  
  vec3 color = vec3(r, g, b);
  
  // Brightness pulse
  float pulse = sin(time * 2.0) * 0.05 + 0.95;
  color *= brightness * pulse;
  
  gl_FragColor = vec4(color, 1.0);
}
```

### Pixelation Effect

```glsl
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float pixelSize;

varying vec2 vUv;

void main() {
  vec2 dxy = pixelSize / resolution;
  vec2 coord = dxy * floor(vUv / dxy);
  
  gl_FragColor = texture2D(tDiffuse, coord);
}
```

### Edge Detection (Sobel)

```glsl
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float edgeStrength;

varying vec2 vUv;

void main() {
  vec2 texel = 1.0 / resolution;
  
  // Sobel kernels
  float gx[9];
  gx[0] = -1.0; gx[1] = 0.0; gx[2] = 1.0;
  gx[3] = -2.0; gx[4] = 0.0; gx[5] = 2.0;
  gx[6] = -1.0; gx[7] = 0.0; gx[8] = 1.0;
  
  float gy[9];
  gy[0] = -1.0; gy[1] = -2.0; gy[2] = -1.0;
  gy[3] =  0.0; gy[4] =  0.0; gy[5] =  0.0;
  gy[6] =  1.0; gy[7] =  2.0; gy[8] =  1.0;
  
  vec3 gradX = vec3(0.0);
  vec3 gradY = vec3(0.0);
  
  for (int i = 0; i < 9; i++) {
    int x = i % 3 - 1;
    int y = i / 3 - 1;
    vec2 offset = vec2(float(x), float(y)) * texel;
    vec3 sample = texture2D(tDiffuse, vUv + offset).rgb;
    
    gradX += sample * gx[i];
    gradY += sample * gy[i];
  }
  
  float edge = length(vec2(length(gradX), length(gradY)));
  edge *= edgeStrength;
  
  gl_FragColor = vec4(vec3(edge), 1.0);
}
```

---

## Performance Optimization

### 1. Segmentation Performance

```javascript
// Optimize BodyPix performance
const optimizedConfig = {
  // For desktop
  desktop: {
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.75,
    quantBytes: 2,
    internalResolution: 'medium',
  },
  
  // For mobile
  mobile: {
    architecture: 'MobileNetV1',
    outputStride: 16,
    multiplier: 0.50,
    quantBytes: 2,
    internalResolution: 'low',
  },
};

// Detect device
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const config = isMobile ? optimizedConfig.mobile : optimizedConfig.desktop;
```

### 2. Throttle Segmentation

```javascript
// Only segment every N frames
let frameCount = 0;
const segmentEveryNFrames = 3;

useFrame(() => {
  frameCount++;
  
  if (frameCount % segmentEveryNFrames === 0) {
    performSegmentation();
  }
});
```

### 3. Use Lower Resolution Render Targets

```javascript
// Render expensive effects at lower resolution
const effectResolution = useMemo(() => {
  const scale = 0.5; // Half resolution
  return {
    width: Math.floor(window.innerWidth * scale),
    height: Math.floor(window.innerHeight * scale),
  };
}, []);
```

### 4. Conditional Effect Loading

```javascript
// Load effects based on device capabilities
const canUseSegmentation = useMemo(() => {
  const hasWebGL = !!document.createElement('canvas').getContext('webgl2');
  const hasEnoughMemory = navigator.deviceMemory > 4; // GB
  return hasWebGL && hasEnoughMemory;
}, []);

return (
  <>
    {canUseSegmentation && <SegmentationEffect />}
  </>
);
```

### 5. Cleanup and Disposal

```javascript
useEffect(() => {
  return () => {
    // Dispose of textures and geometries
    if (texture) texture.dispose();
    if (geometry) geometry.dispose();
    if (material) material.dispose();
  };
}, []);
```

---

## Testing and Debugging

### Performance Monitoring

```javascript
// Add FPS counter
import { Stats } from '@react-three/drei';

<Canvas>
  <Stats />
  {/* Your scene */}
</Canvas>
```

### Debug Depth Texture

```javascript
// Visualize depth texture
const debugMaterial = new THREE.ShaderMaterial({
  uniforms: {
    tDepth: { value: depthTexture },
    cameraNear: { value: camera.near },
    cameraFar: { value: camera.far },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDepth;
    uniform float cameraNear;
    uniform float cameraFar;
    varying vec2 vUv;
    
    float readDepth(sampler2D depthSampler, vec2 coord) {
      float fragCoordZ = texture2D(depthSampler, coord).x;
      float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
      return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
    }
    
    void main() {
      float depth = readDepth(tDepth, vUv);
      gl_FragColor = vec4(vec3(depth), 1.0);
    }
  `,
});
```

### Log Segmentation Data

```javascript
// Debug segmentation results
const result = await segment(image);
console.log('Segmentation:', {
  width: result.width,
  height: result.height,
  data: result.data, // Uint8Array
  allPoses: result.allPoses,
});
```

---

## Next Steps

1. **Start Simple:** Implement depth texture capture first
2. **Add Effects Gradually:** Add one effect at a time and test performance
3. **Optimize Early:** Profile performance after each addition
4. **User Testing:** Get feedback on effect quality and controls
5. **Documentation:** Document new features as you add them

---

## Troubleshooting

### Issue: Segmentation is slow
**Solution:** 
- Use MobileNetV1 with lower multiplier (0.50)
- Reduce internal resolution to 'low'
- Process every 2-3 frames instead of every frame

### Issue: Depth texture appears black
**Solution:**
- Check camera near/far values
- Ensure depthBuffer is enabled on render target
- Verify depth texture format (DepthFormat)

### Issue: Shaders not compiling
**Solution:**
- Check GLSL syntax (precision qualifiers)
- Ensure all uniforms are declared
- Use browser console to see compilation errors

### Issue: Memory leaks
**Solution:**
- Dispose of textures, geometries, materials
- Remove event listeners in cleanup
- Clear references to large objects

---

*Implementation Guide for Depth Studio*
*November 2024*
