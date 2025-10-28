# 2.5D Depth Studio

Depth Studio is a React + Vite experience for turning a flat image and its grayscale depth map into a wow-factor 2.5D scene. Upload paired assets, then sculpt parallax, lighting, post-processing, and procedural deformations in real time with Leva controls.

## Features

- Image + depth upload pipeline with automatic GPU displacement and live normal estimation
- Directional + point lights, specular highlights, and ambient fill
- Post-processing stack: bloom, chromatic aberration, vignette, glitch, film grain, and depth of field (now with audio-reactive depth-of-field boosts)
- Motion system with mouse parallax, auto-orbit camera rig, animated noise jitter, and “Wow Mode” showcase preset
- Math-driven displacement layers with ripples, stripes, swirl, kaleidoscope, and fractal noise options plus fine-grained time/detail controls
- Expanded audio analysis with smoothed low/mid/high energy detection driving bloom, color, lighting, math deformation, and camera depth pulses
- Refined Leva UI with Master, Visual FX, Environment, Performance, Audio, Surface, and Layers panels for quicker navigation

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
5. Experiment with **Animation** and **Math Edit** panels for ripples, stripes, swirls, and Wow Mode presets.

### Tips

- Use the **invertDepth** toggle if your depth map polarity is flipped.
- Increase plane segment density in `DepthSurface.jsx` for higher fidelity on dense depth maps.
- Bloom, glitch, and depth of field can be performance heavy; dial them down when targeting lower-end hardware.
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
