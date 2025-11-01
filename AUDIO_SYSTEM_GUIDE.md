# Audio System Guide - DepthStudio

## Overview
DepthStudio has a sophisticated audio reactivity system with **THREE separate audio control systems** that affect different parts of the visualization. This guide explains what controls what.

---

## 🎵 Audio System Architecture

### The Three Audio Control Systems:

1. **🎬 Post-Processing Effects** (Visual FX Panel)
2. **🎨 Surface/Material** (Surface Panel → AudioReactive folder)
3. **📷 Camera** (Camera Panel)

Each system has its own audio settings and affects different visual elements.

---

## 📊 Audio Bus (Core System)

**File:** `src/lib/audioBus.js`

The audio bus analyzes audio in real-time and provides:

### Frequency Bands:
- **subBass** (20-60Hz) - Deep sub frequencies
- **bass** (60-250Hz) - Bass and kick drums
- **lowMid** (250-500Hz) - Lower mids
- **mid** (500-2kHz) - Midrange
- **highMid** (2kHz-4kHz) - Upper mids
- **treble** (4kHz-20kHz) - High frequencies

### Energy Groups (3-band simplified):
- **low** = 70% subBass + 30% bass
- **mid** = mid range
- **high** = 60% highMid + 40% treble

### Other Metrics:
- **volume** - Overall volume/RMS
- **spectralFlux** - Rate of spectral change
- **centroid** - Brightness of sound
- **Beat detection** - Kicks and beats

---

## 1️⃣ POST-PROCESSING EFFECTS AUDIO

**Location:** `🎬 Post Processing` panel in Leva UI  
**File:** `src/components/Scene.jsx` + `src/lib/audioMapper.js`

### Global Audio Settings
Found in `🎵 Audio Settings` panel - these affect ALL audio reactivity:

- **Enable Audio** - Master on/off switch
- **Sensitivity** (0.1-5.0) - Overall audio response multiplier
- **Threshold** (0-1) - Minimum audio level to trigger (noise gate)
- **Power** (0.5-3.0) - Response curve exponent (higher = more dramatic)
- **Smoothing** (0-1) - How quickly values change (0 = instant, 1 = very smooth)

### Individual Effect Controls

Each effect has:
- **🎵 Audio Reactive** toggle - Enable/disable audio for this effect
- **〰️ Audio Mult** - How much audio affects this effect

#### 💫 Bloom (Glow)
- **Base Control:** Bloom intensity slider
- **Audio Source:** **BASS** frequencies
- **Audio Mult:** `bloomMult` (default 0.8)
- **Beat Boost:** Gets extra boost on kick/beat detection
- **Decay Speed:** 1.6 (fades quickly after beat)
- **Formula:** `bloom = baseBloom + shaped(bass) × bloomMult + beatBoost`

#### 🌈 Chromatic Aberration (RGB Split)
- **Base Control:** Chroma slider
- **Audio Source:** **TREBLE** frequencies (high-end)
- **Audio Mult:** `chromaMult` (default 0.01)
- **No Beat Boost**
- **Formula:** `chroma = baseChroma + shaped(treble) × chromaMult`

#### 🎭 Vignette (Edge Darkness)
- **Base Control:** Vignette slider
- **Audio Source:** **MID** frequencies
- **Audio Mult:** `vignetteMult` (default 0.35)
- **No Beat Boost**
- **Formula:** `vignette = baseVignette + shaped(mid) × vignetteMult`

#### 📹 Film Grain (Noise)
- **Base Control:** Film grain slider
- **Audio Source:** **MID** frequencies
- **Audio Mult:** `filmGrainMult` (default 0.35)
- **No Beat Boost**
- **Formula:** `filmGrain = baseFilmGrain + shaped(mid) × filmGrainMult`

#### ⚡ Glitch
- **Base Control:** Glitch slider
- **Audio Source:** **Beat detection only**
- **Audio Mult:** `glitchMult` (default 1.0)
- **Beat Boost:** Gets boost on beat with spectral strength
- **Decay Speed:** 3.0 (fades slower than bloom)
- **Formula:** `glitch = baseGlitch + beatBoost × glitchMult`

---

## 2️⃣ SURFACE/MATERIAL AUDIO

**Location:** `🎨 Surface` panel → `AudioReactive` folder  
**File:** `src/components/DepthSurface.jsx` + `src/lib/audioMapper.js`

### Material Audio Settings
Found in `Surface → AudioReactive` folder:

- **🎵 Audio Reactive** - Enable/disable material audio (master toggle)
- Individual multipliers for each property (below)

### Material Properties Affected

#### 🌀 Noise Amp (Surface Noise)
- **Audio Source:** Overall **VOLUME**
- **Control:** `materialNoiseAmpMult` (default 0.12)
- **Base:** Motion → Noise Amp slider
- **Formula:** `noiseAmp = baseNoiseAmp + shaped(volume) × noiseAmpMult`
- **Effect:** Makes surface more noisy/turbulent

#### 🌊 Depth Scale (3D Pop)
- **Audio Source:** **BASS** frequencies
- **Control:** `materialDepthScaleMult` (default 0.5)
- **Base:** Depth → Scale slider
- **Formula:** `depthScale = baseDepthScale + shaped(bass) × depthScaleMult`
- **Effect:** Makes depth displacement stronger

#### 🌈 Hue Shift
- **Audio Source:** Overall **VOLUME**
- **Control:** `materialHueMult` (default 0.6)
- **Base:** Color → Hue slider
- **Formula:** `hue = baseHue + shaped(volume) × hueMult`
- **Effect:** Shifts colors around the color wheel

#### 💡 Brightness
- **Audio Source:** Overall **VOLUME**
- **Control:** `materialBrightnessMult` (default 0.25)
- **Base:** Color → Brightness slider
- **Formula:** `brightness = baseBrightness + shaped(volume) × brightnessMult`
- **Effect:** Makes image brighter

#### 🔆 Contrast
- **Audio Source:** **MID** frequencies
- **Control:** `materialContrastMult` (default 0.15)
- **Base:** Color → Contrast slider
- **Formula:** `contrast = baseContrast + shaped(mid) × contrastMult`
- **Effect:** Increases contrast

#### 🎨 Saturation
- **Audio Source:** **HIGH** energy (highMid + treble)
- **Control:** `materialSaturationMult` (default 0.2)
- **Base:** Color → Saturation slider
- **Formula:** `saturation = baseSaturation + shaped(high) × saturationMult`
- **Effect:** Makes colors more vibrant

#### 📐 Math Amp (Deformation Strength)
- **Audio Source:** **LOW-MID** frequencies
- **Control:** `materialMathAmpMult` (default 0.35)
- **Base:** Deform → Amp slider
- **Formula:** `mathAmp = baseMathAmp + shaped(lowMid) × mathAmpMult`
- **Effect:** Makes math deformations stronger

#### 〰️ Math Freq (Deformation Detail)
- **Audio Source:** **HIGH-MID** frequencies
- **Control:** `materialMathFreqSwing` (default 0.4)
- **Base:** Deform → Freq slider
- **Formula:** `mathFreq = baseMathFreq + shaped(highMid) × mathFreqSwing`
- **Effect:** Changes frequency/detail of math patterns

#### 🌀 Math Warp (Deformation Twist)
- **Audio Source:** **HIGH** energy
- **Control:** `materialMathWarpSwing` (default 0.3)
- **Base:** Deform → Warp slider
- **Formula:** `mathWarp = baseMathWarp + shaped(high) × mathWarpSwing`
- **Effect:** Adds warping/twisting to patterns

#### 🔦 Ambient Light
- **Audio Source:** **MID** frequencies
- **Control:** `materialAmbientMult` (default 0.2)
- **Base:** Lighting → Ambient slider
- **Formula:** `ambient = baseAmbient + shaped(mid) × ambientMult`
- **Effect:** Increases ambient lighting

#### 💡 Point Light Intensity
- **Audio Source:** **LOW** energy (subBass + bass)
- **Control:** `materialPointLightMult` (default 0.6)
- **Base:** Lighting → Fill slider
- **Formula:** `pointLight = basePointLight + shaped(low) × pointLightMult`
- **Effect:** Increases fill light brightness

#### 📳 Jitter (Position Shake)
- **Audio Source:** **Beat detection only**
- **Control:** `materialJitterOnBeat` (default 0.08)
- **Base:** Motion → Jitter slider
- **Beat Boost:** Adds jitter on kick/beat
- **Decay Speed:** 2.0
- **Formula:** `jitter = baseJitter + beatBoost × jitterOnBeat`
- **Effect:** Shakes/vibrates the surface on beats

---

## 3️⃣ CAMERA AUDIO

**Location:** `📷 Camera` panel  
**File:** `src/components/Scene.jsx`

### Camera Audio Settings

- **🎵 Audio Reactive** - Enable/disable camera audio
- **📏 Base Z** - Starting Z position offset
- **🌊 Range** - How much the camera moves
- **〰️ Smooth** - Smoothing factor for camera movement
- **🔊-🎺 Band Weights** - How much each frequency band affects camera

### Frequency Band Weights

#### 🔊 Sub Bass Weight
- **Control:** `camSubBass` (default 0.4)
- **Frequency:** 20-60Hz
- **Effect:** Deep bass pushes/pulls camera

#### 🎸 Bass Weight
- **Control:** `camBass` (default 1.0)
- **Frequency:** 60-250Hz
- **Effect:** Main bass movement

#### 🎹 Mid Weight
- **Control:** `camMid` (default 0.4)
- **Frequency:** 500-2kHz
- **Effect:** Mid frequencies affect camera

#### 🎺 Treble Weight
- **Control:** `camTreble` (default 0.2)
- **Frequency:** 4kHz-20kHz
- **Effect:** High frequencies affect camera

### Beat Response

#### 🥁 Beat Kick
- **Control:** `camBeatKick` (default 0.25)
- **Effect:** Extra camera push on kick/beat detection

#### ⏱️ Beat Decay
- **Control:** `camBeatDecay` (default 2.0)
- **Effect:** How fast beat boost fades

### Camera Position Formula

```javascript
// Weighted sum of frequency bands
weighted = shaped(subBass) × camSubBass +
           shaped(bass) × camBass +
           shaped(mid) × camMid +
           shaped(treble) × camTreble

// Normalize by sum of weights
normalized = weighted / (camSubBass + camBass + camMid + camTreble)

// Final camera Z position
cameraZ = camZBase + (normalized × sensitivity × camZRange) + beatBoost
```

The camera moves forward/backward on the Z-axis based on audio.

---

## 4️⃣ ASCII MODE AUDIO

**Location:** `🎬 Post Processing` → `ASCII` folder  
**File:** `src/components/ASCIIEffect.jsx`

ASCII mode has **limited audio reactivity** compared to the full surface:

### Properties Affected:
- **🌊 Depth Scale** - How much depth affects ASCII (uses bass)
- **💡 Brightness** - Overall brightness (uses volume)
- **🔆 Contrast** - Contrast (uses mid)
- **📳 Jitter** - Character shake on beat

ASCII mode uses the **same audio multipliers** as the Material Audio but only affects these 4 properties.

---

## 🔧 Audio Processing Pipeline

### Step 1: Audio Analysis (audioBus.js)
```
Audio Input → FFT Analysis → Frequency Bands → Smoothing → audioBus.latest
                           ↓
                    Beat Detection → audioBus.pushBeat()
```

### Step 2: Shaping Function (audioMapper.js)
All audio values go through a "shaping" function:

```javascript
// Remove values below threshold (noise gate)
aboveThreshold = max(0, value - threshold)

// Apply power curve for dramatic response
shaped = (aboveThreshold / (1 - threshold)) ^ power
```

**Threshold** = Noise gate (default 0.05)  
**Power** = Response curve (default 1.2)
- Power < 1: More linear, subtle response
- Power = 1: Linear response
- Power > 1: Exponential, dramatic response

### Step 3: Smoothing
All values are smoothed over time to prevent jittery visuals:

```javascript
smoothed = previousValue + (newValue - previousValue) × smoothing
```

**Smoothing** = 0 to 1 (default 0.2)
- 0 = Instant response (jittery)
- 1 = Maximum smoothing (very slow)

### Step 4: Application
Shaped and smoothed values are multiplied by their respective multipliers and added to base values:

```javascript
finalValue = baseValue + shaped(audioSource) × multiplier + beatBoost
```

---

## 💡 Quick Reference: What Frequency Affects What

### Bass (60-250Hz) - Kicks & Low End
- ✅ Bloom (glow)
- ✅ Depth Scale (3D pop)
- ✅ Point Light Intensity
- ✅ Camera Z position (main driver)

### Sub-Bass (20-60Hz) - Deep Bass
- ✅ Camera Z position (weighted)

### Low-Mid (250-500Hz)
- ✅ Math Deformation Amplitude

### Mid (500-2kHz) - Vocals & Snares
- ✅ Vignette
- ✅ Film Grain
- ✅ Contrast
- ✅ Ambient Light
- ✅ Camera Z position (weighted)

### High-Mid (2kHz-4kHz)
- ✅ Math Frequency (pattern detail)

### Treble (4kHz-20kHz) - Cymbals & Highs
- ✅ Chromatic Aberration
- ✅ Saturation
- ✅ Math Warp
- ✅ Camera Z position (weighted)

### Overall Volume/RMS
- ✅ Noise Amplitude
- ✅ Hue Shift
- ✅ Brightness

### Beat Detection (Kicks)
- ✅ Bloom boost (fast decay)
- ✅ Glitch (slower decay)
- ✅ Jitter (surface shake)
- ✅ Camera kick

---

## 🎛️ Recommended Settings for Different Music

### Electronic/EDM (Heavy Bass)
```
Bass Effects:
- bloomMult: 1.2-2.0 (strong glow on kick)
- materialDepthScaleMult: 0.6-1.0 (bass pop)
- camBass: 1.5-2.0 (camera punch)

Beat Effects:
- glitchMult: 0.5-1.0 (glitch on drops)
- materialJitterOnBeat: 0.1-0.2 (shake)
- camBeatKick: 0.3-0.5 (camera kick)

Power: 1.5-2.0 (dramatic response)
Threshold: 0.1-0.15 (filter quiet parts)
```

### Rock/Metal (Full Spectrum)
```
Mid Effects:
- vignetteMult: 0.4-0.6 (rhythmic darkening)
- materialContrastMult: 0.2-0.4 (punch)
- filmGrainMult: 0.3-0.5 (gritty texture)

Treble Effects:
- chromaMult: 0.015-0.025 (cymbal shimmer)
- materialSaturationMult: 0.3-0.5 (vibrant)

Power: 1.2-1.5 (balanced)
Smoothing: 0.15-0.25 (responsive but smooth)
```

### Ambient/Chill (Subtle)
```
All Multipliers: 0.5× defaults (halve them)

Smooth Response:
- Smoothing: 0.3-0.5 (very smooth)
- Power: 0.8-1.0 (gentle)
- Threshold: 0.02-0.05 (sensitive to quiet)

Focus on:
- Hue shift (gentle color changes)
- Bloom (soft glow)
- Camera movement (slow breathing)
```

### Hip-Hop (Sub-Bass & Kicks)
```
Low-End Focus:
- camSubBass: 0.8-1.2 (sub hits)
- camBass: 1.5-2.0 (kick punch)
- materialDepthScaleMult: 0.7-1.2 (bass depth)
- bloomMult: 1.0-1.5 (kick glow)

Beat Response:
- camBeatKick: 0.4-0.6 (strong kick)
- materialJitterOnBeat: 0.1-0.15 (shake)

Power: 1.5-2.0 (punchy)
```

---

## 🐛 Troubleshooting

### "Audio doesn't seem to react"
1. Check `🎵 Audio Settings` → **Enable Audio** is ON
2. Check specific effect's **🎵 Audio Reactive** toggle is ON
3. Increase **Sensitivity** (try 2.0+)
4. Lower **Threshold** (try 0.02)
5. Increase the specific **Multiplier** for that effect
6. Check if audio is actually playing (audio analyzer visible)

### "Audio reacts too much / jittery"
1. Increase **Smoothing** (0.3-0.5)
2. Decrease **Sensitivity** (0.5-0.8)
3. Increase **Threshold** (0.1-0.15)
4. Decrease specific effect **Multipliers**
5. Lower **Power** (0.8-1.0)

### "Only some effects react"
Each system is independent:
- Post-processing effects: Check Visual FX audio toggles
- Material effects: Check Surface → AudioReactive toggle
- Camera: Check Camera → Audio Reactive toggle

### "Beat detection doesn't work"
- Beat detection is automatic and can't be tuned
- Only affects: Bloom boost, Glitch, Jitter, Camera kick
- Works best with clear kick drums / bass hits
- May not detect beats in ambient/sparse music

---

## 📝 Summary

**THREE INDEPENDENT AUDIO SYSTEMS:**

1. **Post-Processing** (Bloom, Chroma, Vignette, Film Grain, Glitch)
   - Controlled in Visual FX panel
   - Uses treble (chroma), mid (vignette/grain), bass (bloom), beats (glitch)

2. **Surface/Material** (Depth, Colors, Lighting, Math Deformations)
   - Controlled in Surface → AudioReactive panel
   - Uses all frequency bands + volume + beats
   - Most comprehensive audio reactivity

3. **Camera** (Z position movement)
   - Controlled in Camera panel
   - Uses weighted sum of all frequency bands + beats
   - Independent from other systems

**Global Settings** in `🎵 Audio Settings` affect ALL three systems.

Each system can be toggled independently, and each effect within has its own multiplier.

---

## 🎓 Pro Tips

1. **Start with defaults** - They're balanced for most music
2. **Test with familiar music** - Use a song you know well
3. **Adjust one parameter at a time** - Don't change everything at once
4. **Use presets** - Save your favorite settings for different genres
5. **Lower multipliers are often better** - Subtle > overwhelming
6. **Match audio to visual content** - Bass for heavy elements, treble for light details
7. **Smoothing is your friend** - Prevents jittery visuals
8. **Power curve for drama** - Use higher power (1.5-2.5) for dramatic drops/hits
9. **Threshold for noise gating** - Filter out quiet/ambient sections
10. **Disable what you don't need** - Not everything needs to react to audio

---

**Happy audio-reactive visualizing! 🎵✨**
