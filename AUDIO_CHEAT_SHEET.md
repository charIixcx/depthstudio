# 🎵 Audio Cheat Sheet - What Affects What

## 🎯 The Basics

**THREE SYSTEMS:**
1. **Post-FX** = Screen effects (bloom, glitch, etc.)
2. **Material** = The 3D surface itself (depth, colors, deformations)
3. **Camera** = Camera movement

**Each is controlled separately and can be turned on/off independently.**

---

## 🎬 POST-FX (Screen Effects)

| Effect | Frequency | What It Does | Default Mult |
|--------|-----------|--------------|--------------|
| 💫 **Bloom** | Bass (60-250Hz) + Beats | Glow on bright areas | 0.8 |
| 🌈 **Chroma** | Treble (4-20kHz) | RGB color split | 0.01 |
| 🎭 **Vignette** | Mid (500-2kHz) | Edge darkness | 0.35 |
| 📹 **Film Grain** | Mid (500-2kHz) | Grainy texture | 0.35 |
| ⚡ **Glitch** | Beats only | Digital glitch | 1.0 |

**Location:** `🎬 Post Processing` panel → Each effect folder has audio toggle + multiplier

---

## 🎨 MATERIAL (3D Surface)

| Property | Frequency | What It Does | Default Mult |
|----------|-----------|--------------|--------------|
| 🌀 **Noise** | Volume (all) | Surface turbulence | 0.12 |
| 🌊 **Depth** | Bass (60-250Hz) | 3D pop-out amount | 0.5 |
| 🌈 **Hue** | Volume (all) | Color wheel shift | 0.6 |
| 💡 **Brightness** | Volume (all) | Image brightness | 0.25 |
| 🔆 **Contrast** | Mid (500-2kHz) | Contrast boost | 0.15 |
| 🎨 **Saturation** | High (2-20kHz) | Color vibrance | 0.2 |
| 📐 **Math Amp** | Low-Mid (250-500Hz) | Deform strength | 0.35 |
| 〰️ **Math Freq** | High-Mid (2-4kHz) | Deform detail | 0.4 |
| 🌀 **Math Warp** | High (2-20kHz) | Deform twist | 0.3 |
| 🔦 **Ambient** | Mid (500-2kHz) | Ambient light | 0.2 |
| 💡 **Point Light** | Sub+Bass (20-250Hz) | Fill light | 0.6 |
| 📳 **Jitter** | Beats only | Surface shake | 0.08 |

**Location:** `🎨 Surface` panel → `AudioReactive` folder → Master toggle + all multipliers

---

## 📷 CAMERA (Movement)

| Band | Frequency | Default Weight |
|------|-----------|----------------|
| 🔊 Sub Bass | 20-60Hz | 0.4 |
| 🎸 Bass | 60-250Hz | **1.0** (main) |
| 🎹 Mid | 500-2kHz | 0.4 |
| 🎺 Treble | 4-20kHz | 0.2 |
| 🥁 Beat Kick | Beats | 0.25 |

**What it does:** Camera moves forward/backward on Z-axis based on weighted sum of all frequencies

**Location:** `📷 Camera` panel → Audio reactive toggle + individual weights

---

## 🎚️ GLOBAL SETTINGS (Affect Everything)

**Location:** `🎵 Audio Settings` panel

| Setting | Range | Default | What It Does |
|---------|-------|---------|--------------|
| **Enable Audio** | On/Off | On | Master switch for ALL audio |
| **Sensitivity** | 0.1-5.0 | 1.0 | Global multiplier (higher = more reactive) |
| **Threshold** | 0-1 | 0.05 | Noise gate (ignore quiet sounds) |
| **Power** | 0.5-3.0 | 1.2 | Response curve (higher = more dramatic) |
| **Smoothing** | 0-1 | 0.2 | How smooth (higher = smoother but slower) |

---

## 🎯 Common Scenarios

### "Nothing is reacting to audio"
✅ Check `🎵 Audio Settings` → `Enable Audio` = ON  
✅ Check specific system toggle (Post-FX, Material, or Camera)  
✅ Increase `Sensitivity` to 2.0+  
✅ Increase specific multipliers  

### "Too jittery/reactive"
✅ Increase `Smoothing` to 0.3-0.5  
✅ Decrease `Sensitivity` to 0.5-0.8  
✅ Decrease specific multipliers  

### "I want bass to hit harder"
✅ Go to bloom: increase Audio Mult to 1.5-2.0  
✅ Go to depth: increase Depth Mult to 0.8-1.2  
✅ Go to camera: increase Bass weight to 1.5-2.0  

### "I want subtle color changes"
✅ Surface → AudioReactive → Hue Mult: 0.3-0.6  
✅ Surface → AudioReactive → Saturation Mult: 0.1-0.3  
✅ Audio Settings → Smoothing: 0.4-0.6  

### "I want glitchy drops/beats"
✅ Post Processing → Glitch → Audio Reactive: ON  
✅ Post Processing → Glitch → Audio Mult: 1.0-2.0  
✅ Surface → AudioReactive → Jitter on Beat: 0.1-0.2  

---

## 📊 Frequency Bands Quick Ref

```
20Hz ──────────── Sub Bass ──────── Deep rumble
60Hz ──────────── Bass ────────────── Kick drum ★ MAIN DRIVER
250Hz ─────────── Low-Mid ────────── Toms, lower vocals
500Hz ─────────── Mid ──────────────── Snare, vocals
2kHz ──────────── High-Mid ────────── Upper vocals
4kHz ──────────── Treble ───────────── Cymbals, hi-hats
20kHz
```

**Beat Detection** = Automatic kick/drop detection (no tuning needed)

---

## 💡 Pro Tips

1. **Start with bass** - It's the main driver for most effects
2. **One change at a time** - Don't adjust everything at once
3. **Smoothing prevents jitter** - Use 0.2-0.4 for most music
4. **Power for drama** - Use 1.5-2.0 for EDM/electronic, 1.0-1.2 for smooth music
5. **Less is more** - Subtle effects often look better than maxed out
6. **Save presets** - Save settings for different genres
7. **Match music energy** - High-energy music = higher sensitivity & power
8. **Test all three systems** - Post-FX, Material, and Camera are independent

---

## 🎛️ Preset Recommendations

### EDM/Electronic
```
Sensitivity: 2.0
Power: 1.8
Smoothing: 0.2
Bloom Mult: 1.5
Depth Mult: 0.8
Camera Bass: 2.0
Glitch Mult: 1.0
```

### Rock/Metal
```
Sensitivity: 1.5
Power: 1.3
Smoothing: 0.25
Vignette Mult: 0.5
Contrast Mult: 0.3
Chroma Mult: 0.02
Film Grain Mult: 0.4
```

### Ambient/Chill
```
Sensitivity: 0.8
Power: 1.0
Smoothing: 0.4
Hue Mult: 0.4
Bloom Mult: 0.6
Camera Bass: 0.8
All others: 0.5× default
```

### Hip-Hop
```
Sensitivity: 1.8
Power: 1.6
Threshold: 0.08
Camera Sub Bass: 1.0
Camera Bass: 2.0
Depth Mult: 1.0
Bloom Mult: 1.3
```

---

## 📖 More Info

- **Full details:** [AUDIO_SYSTEM_GUIDE.md](./AUDIO_SYSTEM_GUIDE.md)
- **Diagrams:** [AUDIO_QUICK_REF.md](./AUDIO_QUICK_REF.md)
- **General usage:** [README.md](./README.md)
