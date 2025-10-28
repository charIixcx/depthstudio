# Depth-Based Features Implementation

This document describes the research, tooling, and implementation of depth mask features for the Depth Studio project.

## Overview

Implemented three major feature categories that leverage depth map data to create compelling visual effects:

1. **ASCII Art Effect** - Depth-modulated ASCII character rendering
2. **Enhanced Math Deformations** - Wave interference, Voronoi, and particle effects
3. **Animated Lighting** - Dynamic rotating lights for dramatic illumination

## Research & Tooling

### Depth Mask Capabilities

Depth masks provide per-pixel distance information that can be used for:
- **Displacement mapping**: Moving vertices based on depth values
- **Character density**: Selecting ASCII characters based on brightness and depth
- **Pattern modulation**: Controlling procedural patterns with depth data
- **Lighting effects**: Modulating light intensity and position based on scene depth

### Technology Stack

- **GLSL Shaders**: Custom vertex and fragment shaders for GPU-accelerated effects
- **Three.js**: WebGL rendering and shader material system
- **React Three Fiber**: React integration for declarative 3D scenes
- **Leva**: Real-time UI controls for parameter adjustment

## Feature Implementations

### 1. ASCII Art Effect

#### Implementation Details
**File**: `src/shaders/ASCIIMaterial.js`

The ASCII shader converts the depth scene into text-based art:

```glsl
// Character selection based on brightness
int selectCharFromBrightness(float brightness) {
  brightness = clamp(brightness, 0.0, 1.0);
  return int(floor(brightness * 9.99));
}

// Depth modulation
float depthMod = mix(1.0, depth, uDepthInfluence);
brightness *= depthMod;
```

**Character Set:**
0. Space (darkest)
1. Dot (.)
2. Comma (,)
3. Apostrophe (')
4. Hyphen (-)
5. Equals (=)
6. Plus (+)
7. Hash (#)
8. At sign (@)
9. Full block (█) (brightest)

**Controls:**
- `uCellSize`: 4-24 pixels per character
- `uDepthInfluence`: 0-1, controls depth modulation strength
- `uBrightness`, `uContrast`: Color adjustments

**Use Cases:**
- Retro/nostalgic visual style
- Artistic image interpretation
- Performance mode for low-end devices
- Unique depth visualization

### 2. Enhanced Math Deformation Modes

#### Mode 6: Wave Interference
**File**: `src/shaders/DepthDisplaceMaterial.js` (lines 87-94)

Creates interference patterns from multiple wave sources:

```glsl
vec2 p = uv - 0.5;
float d1 = length(p - vec2(cos(time * 0.3) * 0.3, sin(time * 0.3) * 0.3));
float d2 = length(p - vec2(-cos(time * 0.4) * 0.25, -sin(time * 0.5) * 0.25));
float d3 = length(p - vec2(sin(time * 0.35) * 0.2, cos(time * 0.45) * 0.2));
float wave1 = sin(d1 * uMathFreq * 6.28318 - time * 2.0);
float wave2 = sin(d2 * uMathFreq * 6.28318 - time * 2.5);
float wave3 = sin(d3 * uMathFreq * 6.28318 - time * 3.0);
return ((wave1 + wave2 + wave3) / 3.0) * uMathAmp * (1.0 + uMathWarp * 0.5);
```

**Parameters:**
- `uMathFreq`: Wave frequency
- `uMathWarp`: Pattern distortion amount
- `uMathAmp`: Displacement amplitude

**Physics:**
Based on real wave interference where overlapping waves create constructive and destructive patterns.

#### Mode 7: Voronoi Patterns
**File**: `src/shaders/DepthDisplaceMaterial.js` (lines 95-110)

Cellular tessellation with animated centers:

```glsl
vec2 p = uv * uMathFreq;
vec2 i = floor(p);
vec2 f = fract(p);
float minDist = 1.0;
for (int y = -1; y <= 1; y++) {
  for (int x = -1; x <= 1; x++) {
    vec2 neighbor = vec2(float(x), float(y));
    vec2 point = vec2(hash(i + neighbor), hash(i + neighbor + vec2(13.7, 27.3)));
    point = 0.5 + 0.5 * sin(time * uMathTimeScale + 6.2831 * point);
    vec2 diff = neighbor + point - f;
    float dist = length(diff);
    minDist = min(minDist, dist);
  }
}
```

**Parameters:**
- `uMathFreq`: Cell density
- `uMathDetail`: Pattern complexity
- `uMathWarp`: Edge sharpness

**Visual Effect:**
Creates organic, cell-like patterns similar to biological structures or cracked surfaces.

#### Mode 8: Particle Field
**File**: `src/shaders/DepthDisplaceMaterial.js` (lines 111-127)

Orbiting particles create force-field displacement:

```glsl
vec2 p = uv - 0.5;
float pattern = 0.0;
int particleCount = int(mix(4.0, 12.0, uMathDetail));
for (int i = 0; i < 12; i++) {
  if (i >= particleCount) break;
  float fi = float(i);
  float angle = time * (0.3 + fi * 0.1) + fi * 2.0;
  float radius = 0.15 + sin(time * 0.5 + fi) * 0.1;
  vec2 particlePos = vec2(cos(angle), sin(angle)) * radius * (1.0 + uMathWarp);
  float dist = length(p - particlePos);
  pattern += (1.0 / (dist * uMathFreq * 10.0 + 1.0)) * uMathBlend;
}
return sin(pattern * 3.14159) * uMathAmp;
```

**Parameters:**
- `uMathDetail`: Number of particles (4-12)
- `uMathBlend`: Particle influence strength
- `uMathWarp`: Orbit radius multiplier

**Physics:**
Simulates inverse-square force fields from multiple point sources.

### 3. Animated Lighting System

#### Implementation
**File**: `src/components/DepthSurface.jsx` (lines 157-189)

Dynamic light animation in the render loop:

```javascript
if (lighting.animateLights) {
  const t = state.clock.elapsedTime * (lighting.lightRotSpeed || 0.5)
  // Rotate directional light around the scene
  uLightDirRef.current[0] = Math.cos(t) * -0.7
  uLightDirRef.current[2] = Math.sin(t) * 0.7
  matRef.current.uLightDir = uLightDirRef.current
  
  // Orbit point light
  uPointLightPosRef.current[0] = Math.cos(t * 1.3) * 0.7
  uPointLightPosRef.current[2] = Math.sin(t * 1.3) * 0.8
  matRef.current.uPointLightPos = uPointLightPosRef.current
}
```

**Features:**
- Independent rotation speeds for different lights (1.0x and 1.3x)
- Maintains Y-axis (vertical) position for natural lighting
- Uses refs to avoid React re-renders
- Smooth circular paths

**Use Cases:**
- Time-lapse photography effects
- Dramatic shadow movement
- Product showcase animations
- Music video aesthetics

## UI Integration

All features are integrated into the existing Leva control panel system:

### Visual FX Panel
```javascript
visualFx: {
  asciiMode: { value: false, label: 'ASCII Mode' },
  asciiCellSize: { value: 8.0, min: 4, max: 24, step: 1 },
  asciiDepth: { value: 0.5, min: 0, max: 1, step: 0.01 }
}
```

### Surface → Lighting Panel
```javascript
Lighting: folder({
  animateLights: { value: false, label: 'Animate Lights' },
  lightRotSpeed: { value: 0.5, min: 0, max: 2, step: 0.01 }
})
```

### Surface → Deform Panel
```javascript
Deform: folder({
  mode: { 
    options: { 
      None: 0, 
      Ripples: 1, 
      Stripes: 2, 
      Swirl: 3, 
      Kaleidoscope: 4, 
      Fractal: 5,
      'Wave Interference': 6, 
      Voronoi: 7, 
      Particles: 8 
    }
  }
})
```

## Performance Considerations

### ASCII Effect
- **CPU**: Minimal, runs entirely on GPU
- **GPU**: Moderate, depends on resolution and cell size
- **Optimization**: Larger cell sizes (16-24) perform better

### Math Deformations
- **Wave Interference**: Low overhead (simple math)
- **Voronoi**: Moderate (nested loops, but small search space)
- **Particles**: Variable (scales with particle count)

### Animated Lighting
- **CPU**: Minimal, simple trigonometry per frame
- **GPU**: No additional cost (updates existing uniforms)

## Best Practices

### ASCII Mode
- Use with high-contrast images for best results
- Cell size 8-12 works well for most displays
- Depth influence 0.3-0.7 provides good 3D effect
- Combine with slight bloom for softer look

### Math Deformations
- Start with default parameters and adjust gradually
- Higher frequencies work better with higher segment density
- Combine different modes by switching between them
- Use with audio reactivity for music visualization

### Animated Lighting
- Speed 0.5-1.0 is generally most pleasing
- Works great with "Auto Orbit" camera disabled
- Combine with specular highlights for dramatic effect
- Try with different deformation modes

## Future Enhancements

Potential additions for future development:

1. **Additional ASCII Modes**
   - Custom character sets
   - Color ASCII (ANSI codes)
   - Stereoscopic ASCII

2. **More Math Patterns**
   - Mandelbrot/Julia sets
   - Turbulence/Perlin noise variants
   - Caustics simulation

3. **Advanced Lighting**
   - Rim lighting
   - Spot lights with cone falloff
   - Gobo projections
   - Dynamic shadows

4. **Depth-Based Effects**
   - Fog/atmospheric scattering
   - Selective focus blur
   - Edge detection highlighting
   - Depth-of-field particles

## Conclusion

The implemented features significantly expand the creative possibilities of Depth Studio by providing:
- Novel visualization modes (ASCII art)
- Advanced procedural deformations (3 new modes)
- Dynamic lighting control (animation system)

All features are GPU-accelerated, performant, and fully integrated with the existing UI system. The code is well-documented, maintainable, and follows the project's architectural patterns.
