# 2.5D Depth Studio

Depth Studio is a React + Vite experience for turning a flat image and its grayscale depth map into a wow-factor 2.5D scene. Upload paired assets, then sculpt parallax, lighting, post-processing, and procedural deformations in real time with Leva controls.

## Features

### Core Rendering
- Image + depth upload pipeline with automatic GPU displacement and live normal estimation
- Advanced depth-based displacement with customizable scale, bias, and normal strength
- Multiple rendering modes including standard 3D displacement and ASCII art mode

### Lighting System
- Directional + point lights with specular highlights and ambient fill
- **NEW: Animated lighting** - automatic rotation of lights around the scene for dynamic effects
- Live lighting control with adjustable rotation speed
- Audio-reactive lighting pulses

### Visual Effects
- Post-processing stack: bloom, chromatic aberration, vignette, glitch, film grain, and depth of field
- **NEW: ASCII Art Mode** - Convert images to depth-modulated ASCII art with configurable cell size
- Audio-reactive effects with depth-of-field boosts and beat-synchronized pulses
- Motion system with mouse parallax, auto-orbit camera rig, and animated noise jitter

### Math Deformation Modes
- **Classic Modes**: Ripples, Stripes, Swirl, Kaleidoscope, Fractal Noise
- **NEW: Wave Interference** - Multiple wave sources creating complex interference patterns
- **NEW: Voronoi Patterns** - Animated cellular/Voronoi tessellation effects
- **NEW: Particle Field** - Dynamic particle displacement with configurable density
- Fine-grained time/detail/warp controls for each mode

### Audio Reactivity
- Expanded audio analysis with smoothed low/mid/high energy detection
- Drives bloom, color, lighting, math deformation, and camera depth pulses
- Beat detection with kick-based visual enhancements
- Customizable sensitivity and response smoothing

### User Interface
- Refined Leva UI with Master, Visual FX, Environment, Performance, Audio, Surface, and Layers panels
- "Wow Mode" showcase preset for instant impressive results
- Preset system with Default, Cinematic, Dreamy, and Aggressive looks
- Multi-layer rendering support with configurable depth separation

## Getting Started

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`).

## Usage

1. Click the **color** and **depth** file inputs to load an RGB image and a matching grayscale depth map (white = near by default).
2. Tune **Depth** controls for scale, bias, and normal strength.
3. Shape lighting with ambient, directional, and point light controls.
4. Layer post effects: Bloom, Chromatic Aberration, Vignette, Glitch, Film Grain, and Depth of Field.
5. Experiment with **Deform** panel for 8 different math-driven displacement modes.
6. Try **ASCII Mode** in Visual FX to convert your image to depth-based ASCII art.
7. Enable **Animate Lights** in the Lighting panel for dynamic rotating lights.

### New Feature Highlights

#### ASCII Art Mode
Toggle **ASCII Mode** in the Visual FX panel to convert your depth scene into ASCII art:
- **ASCII Cell Size**: Control the size of each ASCII character (4-24 pixels)
- **ASCII Depth Influence**: Adjust how much the depth map affects character density (0-1)
- Characters range from space (darkest) to full block (brightest)
- Depth modulation creates 3D effect even in 2D ASCII representation

#### Enhanced Math Deformations
Select from 8 deformation modes in the Surface → Deform panel:
- **Wave Interference**: Three animated wave sources create rippling interference patterns
- **Voronoi**: Cellular patterns with animated cell centers for organic effects
- **Particles**: Orbiting particles create force-field-like displacement

#### Animated Lighting
Enable in the Surface → Lighting panel:
- **Animate Lights**: Toggle automatic light rotation
- **Rotation Speed**: Control how fast lights orbit the scene (0-2x)
- Lights maintain proper shadows and specular highlights while moving

### Tips

- Use the **invertDepth** toggle if your depth map polarity is flipped.
- Increase plane segment density in Surface → Geometry for higher fidelity on dense depth maps.
- Bloom, glitch, and depth of field can be performance heavy; dial them down when targeting lower-end hardware.
- Try different **Deform modes** with varying **Warp** and **Detail** values for unique effects.
- ASCII mode works best with high-contrast images and moderate depth influence (0.3-0.7).
- Replace `public/placeholder-*.png` with your own defaults if desired.

## Build

```bash
npm run build
```

The production build emits to `dist/`. Large bundle warnings are expected because post-processing operators ship with sizeable GLSL payloads.

## Deploy to GitHub Pages

This project is configured for automatic deployment to GitHub Pages.

### Automatic Deployment

The repository includes a GitHub Actions workflow that automatically builds and deploys the app to GitHub Pages whenever changes are pushed to the `main` branch.

**Setup Steps:**
1. Go to your repository's Settings → Pages
2. Under "Build and deployment", set Source to "GitHub Actions"
3. Push to the `main` branch - the deployment will happen automatically

The app will be available at `https://yourusername.github.io/depthstudio/`

### Manual Deployment

You can also deploy manually using the deploy script:

```bash
npm run deploy
```

This builds the app and pushes it to the `gh-pages` branch.

## Tech Stack

- React + Vite
- three.js via `@react-three/fiber` and `@react-three/drei`
- `@react-three/postprocessing` + `postprocessing`
- Leva control panels
- Custom GLSL shaders for depth displacement and ASCII rendering
