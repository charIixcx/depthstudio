# New Features 🚀

## Quick Actions Menu ⚡

A new floating action button in the top-right corner provides instant access to powerful features:

### 🎲 Randomize
Instantly randomizes all visual parameters for creative exploration. Perfect for:
- Breaking creative blocks
- Discovering unexpected combinations
- Quick experimentation

### 🔗 Share URL
Copies a shareable URL to your clipboard that includes all current settings. Anyone with the link can load your exact setup.

### 📹 Camera Modes (8 Presets)
Choose from 8 different camera movement patterns:

1. **Orbit** - Classic circular rotation around the scene
2. **Spiral** - Spiral movement inward and outward
3. **Bounce** - Bouncing motion with varying height
4. **Wave** - Smooth wave-like motion
5. **Figure-8** - Figure-eight pattern for dynamic viewing
6. **Drunk** - Random, unpredictable camera movement
7. **Closeup** - Tight orbit for detailed viewing
8. **Flyby** - Fast circular motion for dramatic effect

### 🎨 Color Grading (10 Presets)
Apply cinematic color grades instantly:

1. **Normal** - Neutral, balanced colors
2. **Cyberpunk** - Pink/cyan neon aesthetic
3. **Vintage** - Warm, faded film look
4. **Noir** - High-contrast black & white
5. **Sunset** - Warm orange/red tones
6. **Arctic** - Cool blue tones
7. **Matrix** - Green digital aesthetic
8. **Dreamy** - Soft, desaturated pastels
9. **Horror** - Dark, desaturated with red tint
10. **Neon** - Oversaturated, bright colors

## Performance Indicators

### FPS Counter
- Located in the top-left corner
- Color-coded for quick status:
  - **Green**: 50+ FPS (excellent)
  - **Orange**: 30-49 FPS (good)
  - **Red**: <30 FPS (consider reducing quality)

### Recording Indicator
- Appears when recording is active (future feature)
- Shows recording duration
- Pulsing red dot for visibility

## URL Sharing System

The app now supports preset sharing via URL parameters:

```
https://your-site.com/?preset=base64EncodedSettings
```

When someone opens your shared link, all your settings are automatically loaded.

## Technical Details

### Camera Preset Implementation
Each camera mode uses mathematical functions for smooth, predictable motion:
- Trigonometric functions for circular paths
- Perlin noise for organic movement
- Time-based animation for consistency

### Color Grading System
Color presets modify four properties:
- **Hue** (-1 to 1): Color shift
- **Brightness** (-0.3 to 0.2): Exposure adjustment
- **Contrast** (0.3 to 1.6): Dynamic range
- **Saturation** (0.3 to 2.0): Color intensity

### URL Encoding
Settings are encoded using base64 for compact, shareable URLs. The system:
1. Extracts all Leva control values
2. Serializes to JSON
3. Encodes with btoa()
4. Appends to URL as query parameter

## Usage Tips

### Creative Workflow
1. Start with **Randomize** to discover interesting combinations
2. Select a **Camera Mode** that complements your scene
3. Apply a **Color Grade** for mood
4. Fine-tune with Leva controls
5. **Share URL** to save or collaborate

### Performance Optimization
- Monitor the FPS counter while adjusting settings
- Use camera modes instead of manual OrbitControls for better performance
- Consider simpler shader modes if FPS drops below 30

### Collaboration
Share your creations by:
1. Clicking the ⚡ button
2. Selecting "🔗 Share URL"
3. Pasting the copied link to others

They'll see exactly what you see, with all settings preserved.

## Keyboard Shortcuts

All existing shortcuts still work:
- `H` - Toggle help overlay
- `F` - Toggle fullscreen
- `S` - Toggle presets panel
- `Ctrl+S` / `Cmd+S` - Save current preset
- `Ctrl+E` / `Cmd+E` - Export screenshot
- `ESC` - Close overlays

## Coming Soon

Future enhancements planned:
- Beat detection and sync
- Video export/recording
- Image sequence import
- Advanced transition effects
- More camera presets
- More color grades
