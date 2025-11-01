# Audio Controls Quick Reference

## 🎯 Three Independent Audio Systems

```
┌─────────────────────────────────────────────────────────────────┐
│  🎵 GLOBAL AUDIO SETTINGS (affects all three systems below)     │
│  • Enable Audio (master on/off)                                 │
│  • Sensitivity (overall multiplier)                             │
│  • Threshold (noise gate)                                       │
│  • Power (response curve)                                       │
│  • Smoothing (temporal smoothing)                               │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
┌───────────────────┐ ┌──────────────────┐ ┌─────────────────┐
│ 1️⃣ POST-FX       │ │ 2️⃣ MATERIAL      │ │ 3️⃣ CAMERA       │
│ (Visual FX)       │ │ (Surface)        │ │ (Camera)        │
├───────────────────┤ ├──────────────────┤ ├─────────────────┤
│ 💫 Bloom          │ │ 🌀 Noise Amp     │ │ 📏 Z Position   │
│   ← BASS          │ │   ← VOLUME       │ │   ← ALL BANDS   │
│   + BEAT BOOST    │ │                  │ │   + BEAT KICK   │
│                   │ │ 🌊 Depth Scale   │ │                 │
│ 🌈 Chroma         │ │   ← BASS         │ │ Weights:        │
│   ← TREBLE        │ │                  │ │ • Sub Bass      │
│                   │ │ 🌈 Hue Shift     │ │ • Bass (main)   │
│ 🎭 Vignette       │ │   ← VOLUME       │ │ • Mid           │
│   ← MID           │ │                  │ │ • Treble        │
│                   │ │ 💡 Brightness    │ │                 │
│ 📹 Film Grain     │ │   ← VOLUME       │ └─────────────────┘
│   ← MID           │ │                  │
│                   │ │ 🔆 Contrast      │
│ ⚡ Glitch         │ │   ← MID          │
│   ← BEATS ONLY    │ │                  │
│                   │ │ 🎨 Saturation    │
│ Each has:         │ │   ← HIGH         │
│ • Toggle          │ │                  │
│ • Multiplier      │ │ 📐 Math Amp      │
└───────────────────┘ │   ← LOW-MID      │
                      │                  │
                      │ 〰️ Math Freq     │
                      │   ← HIGH-MID     │
                      │                  │
                      │ 🌀 Math Warp     │
                      │   ← HIGH         │
                      │                  │
                      │ 🔦 Ambient       │
                      │   ← MID          │
                      │                  │
                      │ 💡 Point Light   │
                      │   ← LOW          │
                      │                  │
                      │ 📳 Jitter        │
                      │   ← BEATS        │
                      │                  │
                      │ Each has:        │
                      │ • Toggle         │
                      │ • Multiplier     │
                      └──────────────────┘
```

## 🎨 Frequency Band Reference

| Band | Frequency | Typical Sounds | Affects |
|------|-----------|----------------|---------|
| **Sub Bass** | 20-60Hz | Deep sub, rumble | Camera weight, Point light |
| **Bass** | 60-250Hz | Kick drum, bass guitar | Bloom, Depth, Camera (main) |
| **Low-Mid** | 250-500Hz | Lower vocals, toms | Math Amp |
| **Mid** | 500-2kHz | Vocals, snare | Vignette, Grain, Contrast, Ambient |
| **High-Mid** | 2-4kHz | Upper vocals, guitar | Math Freq |
| **Treble** | 4-20kHz | Cymbals, hi-hats | Chroma, Saturation, Math Warp |
| **Beat** | Detected | Kick hits, drops | Bloom boost, Glitch, Jitter, Camera kick |

## 🔀 Signal Flow

```
Audio Input
    │
    ▼
┌─────────────────┐
│  Audio Analyzer │ (AudioAnalyzer.jsx)
│  • FFT          │
│  • Beat Detect  │
└─────────────────┘
    │
    ▼
┌─────────────────┐
│   Audio Bus     │ (audioBus.js)
│  • 6 bands      │ ← Components read from here in useFrame()
│  • 3 energies   │
│  • Beat queue   │
└─────────────────┘
    │
    ├──────────────────────┐
    │                      │
    ▼                      ▼
┌─────────────────┐  ┌─────────────────┐
│ Effects         │  │ Material        │
│ Controller      │  │ Controller      │
│ (audioMapper)   │  │ (audioMapper)   │
│                 │  │                 │
│ • Smoothing     │  │ • Smoothing     │
│ • Shaping       │  │ • Shaping       │
│ • Beat boosts   │  │ • Beat boosts   │
└─────────────────┘  └─────────────────┘
    │                      │
    ▼                      ▼
┌─────────────────┐  ┌─────────────────┐
│ EffectComposer  │  │ DepthSurface    │
│ • Bloom         │  │ • Material      │
│ • Chroma        │  │ • Lighting      │
│ • Vignette      │  │ • Deformations  │
│ • Glitch        │  └─────────────────┘
│ • FilmGrain     │
└─────────────────┘

Camera reads directly from audioBus and applies weighted formula
```

## 🎚️ Control Locations in UI

### Post-Processing Effects
```
🎬 Post Processing panel
  └─ Bloom folder
      └─ 🎵 Audio Reactive toggle
      └─ 〰️ Audio Mult slider
  └─ Chromatic folder
      └─ 🎵 Audio Reactive toggle
      └─ 〰️ Audio Mult slider
  └─ Vignette folder
      └─ 🎵 Audio Reactive toggle
      └─ 〰️ Audio Mult slider
  └─ Glitch folder
      └─ 🎵 Audio Reactive toggle
      └─ 〰️ Audio Mult slider
  └─ FilmGrain folder
      └─ 🎵 Audio Reactive toggle
      └─ 〰️ Audio Mult slider
```

### Material/Surface Effects
```
🎨 Surface panel
  └─ AudioReactive folder
      └─ 🎵 Audio Reactive toggle (MASTER for all material)
      └─ 🌀 Noise Mult
      └─ 🌊 Depth Mult
      └─ 🌈 Hue Mult
      └─ 💡 Brightness Mult
      └─ 🔆 Contrast Mult
      └─ 🎨 Saturation Mult
      └─ 📐 Math Amp Mult
      └─ 〰️ Freq Swing
      └─ 🌀 Warp Swing
      └─ 🔦 Ambient Mult
      └─ 💡 Point Light Mult
      └─ 📳 Jitter on Beat
```

### Camera Effects
```
📷 Camera panel
  └─ 🎵 Audio Reactive toggle
  └─ 📏 Base Z
  └─ 🌊 Range
  └─ 〰️ Smooth
  └─ 🔊 Sub Bass weight
  └─ 🎸 Bass weight
  └─ 🎹 Mid weight
  └─ 🎺 Treble weight
  └─ 🥁 Beat Kick
  └─ ⏱️ Decay
```

### Global Settings (affects ALL)
```
🎵 Audio Settings panel
  └─ 🔊 Enable Audio (MASTER)
  └─ 📡 Sensitivity (global multiplier)
  └─ 🎚️ Threshold (noise gate)
  └─ ⚡ Power (response curve)
  └─ 〰️ Smoothing (temporal smoothing)
```

## ⚡ Quick Start Examples

### "I want the image to glow with the beat"
1. Go to `🎬 Post Processing` → `Bloom`
2. Enable `🎵 Audio Reactive`
3. Increase `〰️ Audio Mult` to 1.5-2.0
4. Adjust `💫 Intensity` slider for base glow

### "I want the 3D depth to pulse with bass"
1. Go to `🎨 Surface` → `AudioReactive`
2. Enable `🎵 Audio Reactive` (master toggle)
3. Increase `🌊 Depth Mult` to 0.7-1.0
4. Bass will now push/pull the depth

### "I want colors to shift with the music"
1. Go to `🎨 Surface` → `AudioReactive`
2. Enable `🎵 Audio Reactive`
3. Increase `🌈 Hue Mult` to 0.8-1.2
4. Colors shift based on overall volume

### "I want the camera to move with the music"
1. Go to `📷 Camera`
2. Enable `🎵 Audio Reactive`
3. Increase `🌊 Range` to 1.0-1.5
4. Adjust `🎸 Bass` weight to 1.5-2.0 for strong response

### "I want everything to react MORE"
1. Go to `🎵 Audio Settings`
2. Increase `📡 Sensitivity` to 2.0-3.0
3. Increase `⚡ Power` to 1.5-2.0 for dramatic response

### "I want everything to react LESS / smoother"
1. Go to `🎵 Audio Settings`
2. Increase `〰️ Smoothing` to 0.3-0.5
3. Decrease `📡 Sensitivity` to 0.5-0.8
4. Lower individual multipliers

## 🎓 Understanding the Math

### Shaping Function
Every audio value goes through this process:

```javascript
// 1. Apply threshold (noise gate)
aboveThreshold = max(0, audioValue - threshold)

// 2. Normalize
normalized = aboveThreshold / (1.0 - threshold)

// 3. Apply power curve
shaped = normalized ^ power

// 4. Apply to effect
effectValue = baseValue + (shaped × sensitivity × multiplier)
```

**Examples:**
- `threshold=0.1, power=1.0` = Linear response, ignores quiet sounds
- `threshold=0.05, power=1.5` = Exponential response, quiet sounds barely affect, loud sounds affect a lot
- `threshold=0.0, power=0.8` = Sublinear response, even quiet sounds have effect

### Smoothing (Temporal)
```javascript
// Each frame, move toward target value gradually
smoothedValue = oldValue + (newValue - oldValue) × smoothing
```

**Examples:**
- `smoothing=0.0` = Instant (no smoothing) → jittery
- `smoothing=0.2` = Default, responsive but smooth
- `smoothing=0.5` = Very smooth, slow to react
- `smoothing=1.0` = Maximum smoothing, barely reacts

## 🔍 Full Documentation

See **[AUDIO_SYSTEM_GUIDE.md](./AUDIO_SYSTEM_GUIDE.md)** for:
- Detailed explanation of each system
- Complete formula reference
- Genre-specific presets
- Advanced troubleshooting
- Beat detection details
- ASCII mode audio specifics

---

**TL;DR:** Three independent systems (Post-FX, Material, Camera) all read from the same audio bus but affect different visuals. Each has toggles and multipliers. Global settings affect all three.
