# 🎮 Quick Start Guide

## Welcome to 2.5D Depth Studio!

Transform your images into mesmerizing 3D audio-reactive visualizations.

---

## 📸 Getting Started

### 1. Upload Images
- **Top-left drop zone**: Upload your color/texture image
- **Second drop zone below**: Upload matching grayscale depth map
- Or click the zones to browse files

### 2. Explore Effects
- Open the **control panel** (right side)
- Try different **Deform modes** (16 options!)
- Adjust **post-processing effects** (Bloom, Glitch, etc.)

### 3. Add Music
- Use the hidden audio analyzer (press H for help)
- Enable audio reactivity toggles
- Watch your visualization dance to the beat!

---

## ⌨️ Essential Shortcuts

| Key | What It Does |
|-----|--------------|
| **H** | Show this help menu |
| **F** | Go fullscreen |
| **S** | Open presets panel |
| **Ctrl+S** | Save current settings |
| **Ctrl+E** | Export screenshot |
| **ESC** | Close overlays |

---

## 🎨 Shader Modes Explained

1. **None** - Pure depth displacement
2. **Ripples** - Concentric wave patterns
3. **Stripes** - Diagonal line patterns
4. **Swirl** - Spiral vortex effect
5. **Kaleidoscope** - Radial mirror symmetry
6. **Fractal** - Multi-layered noise
7. **Wave Interference** - Intersecting waves
8. **Voronoi** - Cellular/organic patterns
9. **Particles** - Orbiting particle field
10. **Hexagon** - Honeycomb tessellation
11. **Plasma** - Classic plasma effect
12. **Flow Field** - Directional flow lines
13. **Crystal** - Crystalline structure
14. **Helix** - DNA-like spirals
15. **Foam** - Bubble cluster patterns
16. **Mandelbrot** - Fractal iterations

---

## 🎛️ Key Parameters

### Surface Settings
- **Depth Scale**: How much the image "pops out"
- **Noise Amp**: Random texture variation
- **Deform Amp**: Strength of shader effect

### Post-Processing
- **Bloom**: Glow effect intensity
- **Chromatic Aberration**: RGB color split
- **Glitch**: Digital distortion (use sparingly!)

### Audio Reactivity
- Toggle **AudioReactive** for each effect
- Adjust **Multiplier** for intensity
- Use **Band** to choose frequency range

---

## 💾 Presets

### Save Your Work
1. Adjust settings to your liking
2. Press **Ctrl+S** or click **Presets** button
3. Name your preset
4. Done! It's saved locally

### Load Presets
1. Click **Presets** button (bottom-right)
2. Click on any saved preset
3. Page reloads with your settings

### Delete Presets
1. Open presets panel
2. Hover over a preset card
3. Click the **×** button

---

## 📊 Audio Meter

**Bottom-left corner** shows real-time frequencies:
- **SUB** (Pink) - Deep bass (20-60Hz)
- **BASS** (Purple) - Bass (60-250Hz)  
- **MID** (Cyan) - Mids (250-4kHz)
- **TREBLE** (Green) - Highs (4k-20kHz)

---

## 🎯 Pro Tips

### For Best Results
- Use high-quality source images
- Depth maps should be smooth gradients
- Brighter = closer, darker = farther
- Start with subtle effects, then increase

### Performance
- Lower **Resolution** if laggy
- Disable heavy effects (Glitch, Noise)
- Close other browser tabs
- Use modern GPU

### Creative Ideas
- Try photos with clear foreground/background
- Use AI-generated depth maps (MiDaS, DepthAnything)
- Combine multiple effects subtly
- Match audio bands to visual elements

---

## 🐛 Troubleshooting

### Image Not Showing
- Check file format (JPG, PNG, WebP)
- Ensure both color and depth are uploaded
- Try refreshing the page

### Audio Not Reacting
- Enable audio analyzer in scene
- Check browser audio permissions
- Toggle audio reactivity in controls
- Increase sensitivity/multiplier

### Performance Issues
- Reduce resolution/quality
- Disable post-processing
- Try simpler shader mode
- Close background apps

### Controls Not Working
- Check if typing in input field
- Press ESC to ensure no overlay
- Refresh page if stuck
- Clear localStorage (Reset button)

---

## 🌟 Example Workflows

### Chill Visualization
1. Upload portrait photo + depth
2. Set **Deform mode: Ripples**
3. Enable **Bloom** (high)
4. Add subtle **Chromatic Aberration**
5. Enable camera audio reactivity
6. Play lo-fi music

### Intense Experience
1. Upload abstract image + depth
2. Set **Deform mode: Mandelbrot**
3. Enable **Glitch** (low-med)
4. Add **Film Grain**
5. Enable material audio reactivity
6. Play electronic music

### Smooth Ambient
1. Upload landscape + depth
2. Set **Deform mode: Plasma**
3. Disable orbit, enable parallax
4. Subtle **Vignette**
5. Low depth scale
6. Play ambient soundscape

---

## 🔗 Resources

### Depth Map Tools
- **MiDaS**: AI depth estimation
- **DepthAnything**: Modern depth model
- **Photoshop**: Manual depth painting
- **Blender**: 3D render depth pass

### Music Sources
- **Spotify** (needs local playback)
- **YouTube Music**
- **SoundCloud**
- **Local music files**

### Community
- Share your creations!
- Report bugs on GitHub
- Request features
- Contribute code

---

## ❓ FAQ

**Q: Can I use my own music?**
A: Yes! The audio analyzer works with any playing audio.

**Q: Will my presets sync across devices?**
A: No, they're stored locally in your browser.

**Q: Can I export videos?**
A: Not yet, but screenshot export works! (Ctrl+E)

**Q: What's the best image size?**
A: 1920x1080 or 2560x1440 for quality vs. performance.

**Q: Can I use this commercially?**
A: Check the project license (usually MIT).

---

## 🎉 Have Fun!

Experiment, break things, discover combinations!

Press **H** anytime to see shortcuts again.

**Made with ❤️ using React, Three.js, and Framer Motion**
