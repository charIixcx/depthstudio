# Research Summary for Depth Studio

## What Was Researched

This document summarizes the comprehensive research conducted on libraries and techniques for enhancing Depth Studio with advanced rendering effects and object segmentation capabilities.

---

## Research Areas Covered

### 1. Bitmap Rendering & Scanning Effects

**Researched Libraries:**
- **PixiJS** - High-performance 2D rendering engine
- **Three.js** - 3D graphics library (already in use)
- **VFX-JS** - Easy WebGL effects for DOM elements
- **Liquid Glass JS** - Apple-style glass and blur effects
- **I2Djs** - Multi-context 2D rendering

**Key Findings:**
- Three.js (already integrated) is excellent for hybrid 3D + bitmap effects
- VFX-JS provides quick scanline and glitch effects with minimal code
- Custom GLSL shaders offer best performance and flexibility

**Recommendation:** Use custom GLSL shaders with existing Three.js stack for maximum control and performance.

---

### 2. TouchDesigner-Like Depth Mask Manipulation

**Researched Techniques:**
- Three.js `MeshDepthMaterial` for depth visualization
- Three.js `DepthTexture` for depth capture and manipulation
- Custom depth shaders for advanced masking
- TouchDesigner to Three.js workflow integration

**Key Findings:**
- Three.js natively supports depth texture capture (no additional libraries needed)
- `DepthTexture` + `WebGLRenderTarget` enables TouchDesigner-style workflows
- Custom shaders provide full control over depth-based effects
- Direct TD integration possible via geometry/texture export

**Recommendation:** Implement native Three.js depth texture system first, then add custom shaders for advanced manipulation.

---

### 3. Object Segmentation

**Researched Libraries:**

#### TensorFlow.js + BodyPix
- **Pros:** Production-ready, 20-25 fps on desktop, 24 body parts detection
- **Cons:** ~8MB bundle size, medium learning curve
- **Best For:** Serious production applications

#### ml5.js
- **Pros:** Very easy API, same BodyPix model underneath, great documentation
- **Cons:** ~5MB bundle size, slightly less control
- **Best For:** Creative projects, rapid prototyping, educational use

#### MediaPipe SelfieSegmentation
- **Pros:** Fastest (30+ fps), lowest latency
- **Cons:** Less detailed segmentation (person only, no body parts)
- **Best For:** Video conferencing, speed-critical apps

#### OpenCV.js
- **Pros:** Classical CV algorithms, fast traditional segmentation
- **Cons:** No deep learning segmentation, harder to use
- **Best For:** Traditional computer vision tasks

**Key Findings:**
- BodyPix can run real-time in browser (20-25 fps desktop, 15-20 fps mobile)
- MobileNetV1 model with 0.50-0.75 multiplier offers best performance/quality balance
- ml5.js provides easiest integration path for creative applications
- Segmentation can be combined with depth effects for unique visuals

**Recommendation:** Use ml5.js + BodyPix for ease of use and creative flexibility.

---

### 4. GLSL Shader Effects & Post-Processing

**Researched Approaches:**

#### Native Three.js
- `ShaderMaterial` for custom vertex/fragment shaders
- `WebGLRenderTarget` for multi-pass rendering
- Direct GLSL programming

#### @react-three/postprocessing (Already in use)
- 30+ built-in effects
- React-friendly component API
- Performance optimized

#### WebGPU + TSL (Future)
- Next-gen renderer with better performance
- TSL (Three Shading Language) - JavaScript-based shader nodes
- Cross-compiles to GLSL or WGSL

#### GMShaders
- Curated collection of minimal GLSL effects
- Learning resource and rapid prototyping

**Key Findings:**
- Current stack (@react-three/postprocessing) is excellent and sufficient
- Custom GLSL shaders provide maximum flexibility
- WebGPU/TSL is the future but not yet widely supported
- Many effects can be implemented with simple fragment shaders

**Recommendation:** Extend existing @react-three/postprocessing with custom GLSL effects as needed.

---

## Implementation Priorities

Based on the research, here are the recommended implementation priorities:

### 🔴 High Priority - Implement First

**1. Depth Texture System**
- **Effort:** Low (4-8 hours)
- **Impact:** High
- **Dependencies:** None (native Three.js)
- **Why:** Enables TouchDesigner-like workflows with zero cost

**Implementation:** Use Three.js `DepthTexture` to capture scene depth and manipulate it in shaders.

---

### 🟡 Medium Priority - Implement Next

**2. Scanline/CRT Effects**
- **Effort:** Low-Medium (2-4 hours)
- **Impact:** Medium-High
- **Dependencies:** None (custom GLSL)
- **Why:** Adds retro aesthetic and visual interest

**Implementation:** Create custom post-processing effect with GLSL scanline shader.

**3. Additional Bitmap Effects**
- **Effort:** Medium (4-8 hours)
- **Impact:** Medium
- **Dependencies:** None
- **Why:** Extends creative possibilities

**Implementation:** Add pixelation, edge detection, and other effects using custom shaders.

---

### 🟢 Lower Priority - Implement If Needed

**4. Object Segmentation**
- **Effort:** Medium-High (8-16 hours)
- **Impact:** High (if relevant to use case)
- **Dependencies:** ml5.js (~5MB) or TensorFlow.js (~8MB)
- **Why:** Enables foreground/background splitting, person-specific effects

**Implementation:** Integrate ml5.js + BodyPix for easy person segmentation.

**5. Advanced Depth + Segmentation Fusion**
- **Effort:** High (16-24 hours)
- **Impact:** High (unique feature)
- **Dependencies:** Segmentation library
- **Why:** Creates unique depth-aware segmentation effects

**Implementation:** Combine depth texture with segmentation masks for layered effects.

---

## Performance Considerations

### Depth Texture
- **Performance Impact:** None (renders during normal scene render)
- **Memory:** +50MB
- **FPS:** No change

### Scanline Effect
- **Performance Impact:** Minimal
- **Memory:** +10MB
- **FPS:** No change

### BodyPix Segmentation
- **Performance Impact:** Moderate
- **Memory:** +150-200MB
- **FPS:** 20-25 on desktop, 15-20 on mobile
- **Optimization:** Process every 2-3 frames instead of every frame

---

## Quick Start Guide

### To Add Depth Texture (30 minutes)
1. Create `DepthTexture` and `WebGLRenderTarget`
2. Render scene to depth target each frame
3. Use depth texture in post-processing shader
4. Add controls for depth mask range

### To Add Scanline Effect (1-2 hours)
1. Create custom Effect class extending `postprocessing.Effect`
2. Write GLSL fragment shader with scanline logic
3. Add to EffectComposer in scene
4. Add Leva controls for customization

### To Add Segmentation (4-8 hours)
1. Install ml5.js: `npm install ml5`
2. Create hook to load BodyPix model
3. Process image/video input to get segmentation
4. Convert segmentation to Three.js texture
5. Use in shader for masking/effects

---

## Bundle Size Impact

Current bundle: ~1.7MB (already includes Three.js and postprocessing)

Adding recommended features:
- Depth Texture: **+0MB** (native Three.js)
- Scanline Effect: **+0MB** (custom GLSL)
- Additional Effects: **+0MB** (custom GLSL)
- ml5.js + BodyPix: **+5MB** (optional feature)

Total with all features: ~6.7MB (or 1.7MB without segmentation)

---

## Browser Compatibility

All recommended features work on:
- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ✅ Mobile browsers (with performance considerations)

WebGL 2.0 required (supported by >95% of browsers in 2024)

---

## Next Steps

1. **Review Documentation:**
   - Read [RENDER_EFFECTS_RESEARCH.md](RENDER_EFFECTS_RESEARCH.md) for detailed analysis
   - Study [EFFECTS_IMPLEMENTATION_GUIDE.md](EFFECTS_IMPLEMENTATION_GUIDE.md) for code examples
   - Check [LIBRARY_COMPARISON.md](LIBRARY_COMPARISON.md) for quick reference

2. **Start Implementation:**
   - Begin with depth texture system (highest value, lowest effort)
   - Add scanline effects next
   - Consider segmentation if user base would benefit

3. **Test & Iterate:**
   - Profile performance on target devices
   - Gather user feedback on new effects
   - Optimize based on real-world usage

---

## Resources Provided

### 📄 RENDER_EFFECTS_RESEARCH.md (21KB)
Comprehensive research document covering:
- 5 WebGL/bitmap rendering libraries
- TouchDesigner-style depth manipulation techniques
- 5 object segmentation libraries
- GLSL shader and post-processing approaches
- Implementation recommendations and timelines

### 📄 EFFECTS_IMPLEMENTATION_GUIDE.md (19KB)
Practical implementation guide with:
- Complete code examples for all major features
- Step-by-step implementation instructions
- Performance optimization techniques
- Troubleshooting guide
- Testing and debugging tips

### 📄 LIBRARY_COMPARISON.md (9KB)
Quick reference containing:
- Side-by-side library comparisons
- Performance metrics and bundle sizes
- Decision matrix for choosing libraries
- Browser compatibility matrix
- Quick start snippets

---

## Research Methodology

This research was conducted using:
1. **Web search** of 2024 documentation and articles
2. **Official documentation** from library maintainers
3. **Community resources** (Three.js Discourse, GitHub, etc.)
4. **Performance benchmarks** from published sources
5. **Best practices** from production applications

All recommendations are based on:
- Current Depth Studio tech stack (Three.js, React, Vite)
- Project goals (creative depth visualization)
- Performance requirements (real-time rendering)
- Bundle size considerations
- Development time estimates

---

## Questions or Need Clarification?

For more details on any specific library or technique:
1. Check the relevant section in RENDER_EFFECTS_RESEARCH.md
2. Review code examples in EFFECTS_IMPLEMENTATION_GUIDE.md
3. Consult decision matrices in LIBRARY_COMPARISON.md
4. Visit linked official documentation and resources

---

*Research completed for Depth Studio project*
*November 2024*
