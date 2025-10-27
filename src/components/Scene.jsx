import React, { Suspense, useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Stats } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Glitch, Noise, DepthOfField, SMAA, SSAO } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useControls, button, folder, levaStore } from 'leva'
import { BlendFunction, GlitchMode } from 'postprocessing'
import DepthSurface from './DepthSurface.jsx'
import audioBus from '../lib/audioBus'
import { createEffectsController } from '../lib/audioMapper'

function Rig({ children, parallax = 0.15, orbit = true, zOffset = 0 }) {
  const group = useRef()
  const t = useRef(0)
  const { camera, pointer } = useThree()

  useFrame((state, delta) => {
    t.current += delta

    const tx = pointer.x * parallax
    const ty = pointer.y * parallax
    group.current.rotation.y += (tx - group.current.rotation.y) * 0.07
    group.current.rotation.x += (ty - group.current.rotation.x) * 0.07

    if (orbit) {
      const r = 2.5
      const s = t.current * 0.15
      camera.position.x = Math.cos(s) * r
      camera.position.z = Math.sin(s) * r + zOffset
      camera.position.y = 0.7 + Math.sin(s * 0.8) * 0.15
      camera.lookAt(0, 0, 0)
    }
  })

  return <group ref={group}>{children}</group>
}

export default function Scene({ colorURL, depthURL }) {
  // Simple preset catalog focused on effects/perf and material base values
  const PRESETS = {
    Default: {
      effects: { bloom: 0.9, chroma: 0.006, vignette: 0.45, filmGrain: 0.15, glitch: 0, dof: 0.0 },
      material: {
        noiseAmp: 0.02,
        depthScale: 0.25,
        hue: 0.0,
        brightness: 0.0,
        jitter: 0.02,
        contrast: 1.0,
        saturation: 1.0,
        mathAmp: 0.05,
        mathFreq: 6.0,
        mathWarp: 0.0,
        mathDetail: 1.0,
        mathBlend: 0.5,
        mathSymmetry: 6.0,
        mathTimeScale: 1.0
      }
    },
    Cinematic: {
      effects: { bloom: 1.2, chroma: 0.003, vignette: 0.6, filmGrain: 0.2, glitch: 0, dof: 0.35 },
      material: {
        noiseAmp: 0.015,
        depthScale: 0.22,
        hue: 0.0,
        brightness: -0.02,
        jitter: 0.015,
        contrast: 1.2,
        saturation: 0.95,
        mathAmp: 0.04,
        mathFreq: 5.5,
        mathWarp: 0.2,
        mathDetail: 1.35,
        mathBlend: 0.45,
        mathSymmetry: 8.0,
        mathTimeScale: 0.8
      }
    },
    Dreamy: {
      effects: { bloom: 1.6, chroma: 0.008, vignette: 0.35, filmGrain: 0.1, glitch: 0, dof: 0.25 },
      material: {
        noiseAmp: 0.03,
        depthScale: 0.18,
        hue: 0.3,
        brightness: 0.04,
        jitter: 0.018,
        contrast: 0.95,
        saturation: 1.15,
        mathAmp: 0.07,
        mathFreq: 4.6,
        mathWarp: 0.6,
        mathDetail: 0.8,
        mathBlend: 0.7,
        mathSymmetry: 10.0,
        mathTimeScale: 0.65
      }
    },
    Aggressive: {
      effects: { bloom: 0.8, chroma: 0.012, vignette: 0.5, filmGrain: 0.25, glitch: 0.2, dof: 0.15 },
      material: {
        noiseAmp: 0.04,
        depthScale: 0.3,
        hue: -0.2,
        brightness: 0.02,
        jitter: 0.06,
        contrast: 1.25,
        saturation: 1.1,
        mathAmp: 0.09,
        mathFreq: 7.2,
        mathWarp: 1.1,
        mathDetail: 1.6,
        mathBlend: 0.35,
        mathSymmetry: 5.0,
        mathTimeScale: 1.4
      }
    }
  }
  const master = useControls('Master', {
    preset: { options: Object.keys(PRESETS), value: 'Default', label: 'Look' },
    Apply: button((get) => {
      const name = get('Master.preset') || 'Default'
      applyPreset(name)
    }),
    wowMode: { value: false, label: 'Wow Mode' },
    showStats: { value: false, label: 'Show Stats' }
  })
  const { preset, wowMode, showStats } = master

  const visualFx = useControls('Visual FX', {
    bloom: { value: 0.9, min: 0, max: 2, step: 0.01 },
    chroma: { value: 0.006, min: 0, max: 0.02, step: 0.001 },
    vignette: { value: 0.45, min: 0, max: 1, step: 0.01 },
    glitch: { value: 0.0, min: 0, max: 1, step: 0.01 },
    filmGrain: { value: 0.15, min: 0, max: 1, step: 0.01 },
    dof: { value: 0.0, min: 0, max: 1, step: 0.01 }
  })
  const { bloom, chroma, vignette, glitch, filmGrain, dof } = visualFx

  const { background, envIntensity, orbit } = useControls('Environment', {
    background: { value: '#0b0d12', label: 'Background' },
    envIntensity: { value: 0.35, min: 0, max: 2, step: 0.01, label: 'Env Intensity' },
    orbit: { value: true, label: 'Auto Orbit' }
  })

  const perf = useControls('Performance', {
    adaptiveDpr: { value: true, label: 'Adaptive DPR' },
    targetFps: { value: 55, min: 30, max: 120, step: 1, label: 'Target FPS' },
    minDpr: { value: 0.75, min: 0.25, max: 2, step: 0.05, label: 'Min DPR' },
    maxDpr: { value: 1.75, min: 1, max: 3, step: 0.05, label: 'Max DPR' },
    postScale: { value: 0.9, min: 0.5, max: 1.0, step: 0.01, label: 'Post Scale' },
    antialias: { value: false, label: 'Hardware AA' },
    smaa: { value: true, label: 'SMAA' },
    ssao: { value: false, label: 'SSAO (WebGL2)' }
  })

  const audio = useControls('Audio', {
    General: folder({
      enabled: { value: true, label: 'Enable Audio' },
      sensitivity: { value: 1.0, min: 0.1, max: 5, step: 0.01, label: 'Sensitivity' },
      threshold: { value: 0.05, min: 0, max: 1, step: 0.005, label: 'Threshold' },
      power: { value: 1.2, min: 0.5, max: 3, step: 0.05, label: 'Power' },
      smoothing: { value: 0.2, min: 0, max: 1, step: 0.01, label: 'Response Smoothing' }
    }, { collapsed: false }),
    Effects: folder({
      bloomMult: { value: 0.8, min: 0, max: 4, step: 0.01, label: 'Bloom Boost' },
      chromaMult: { value: 0.01, min: -0.05, max: 0.05, step: 0.001, label: 'Chromatic Shift' },
      vignetteMult: { value: 0.35, min: 0, max: 1, step: 0.01, label: 'Vignette Boost' },
      filmGrainMult: { value: 0.35, min: 0, max: 2, step: 0.01, label: 'Grain Boost' },
      glitchMult: { value: 1.0, min: 0, max: 4, step: 0.05, label: 'Glitch Boost' },
      dofMult: { value: 0.35, min: 0, max: 2, step: 0.01, label: 'DOF Boost' }
    }),
    Camera: folder({
      camEnabled: { value: false, label: 'Enable Camera' },
      camZBase: { value: 0.0, min: -2, max: 2, step: 0.01, label: 'Base Offset' },
      camZRange: { value: 0.6, min: 0, max: 2, step: 0.01, label: 'Audio Range' },
      camSmoothing: { value: 0.2, min: 0, max: 1, step: 0.01, label: 'Smoothing' },
      camSubBass: { value: 0.4, min: 0, max: 2, step: 0.01, label: 'Sub Bass Weight' },
      camBass: { value: 1.0, min: 0, max: 2, step: 0.01, label: 'Bass Weight' },
      camMid: { value: 0.4, min: 0, max: 2, step: 0.01, label: 'Mid Weight' },
      camTreble: { value: 0.2, min: 0, max: 2, step: 0.01, label: 'Treble Weight' },
      camBeatKick: { value: 0.25, min: 0, max: 1, step: 0.01, label: 'Beat Kick' },
      camBeatDecay: { value: 2.0, min: 0.2, max: 8, step: 0.1, label: 'Beat Decay' }
    }),
    Material: folder({
      materialReactive: { value: true, label: 'Enable Material' },
      materialNoiseAmpMult: { value: 0.12, min: 0, max: 1, step: 0.001, label: 'Noise Boost' },
      materialDepthScaleMult: { value: 0.5, min: -1, max: 2, step: 0.01, label: 'Depth Boost' },
      materialHueMult: { value: 0.6, min: -2, max: 2, step: 0.01, label: 'Hue Shift' },
      materialBrightnessMult: { value: 0.25, min: -1, max: 1, step: 0.01, label: 'Brightness Boost' },
      materialContrastMult: { value: 0.15, min: -1, max: 1, step: 0.01, label: 'Contrast Boost' },
      materialSaturationMult: { value: 0.2, min: -1, max: 1, step: 0.01, label: 'Saturation Boost' },
      materialMathAmpMult: { value: 0.35, min: -1, max: 2, step: 0.01, label: 'Math Amp Boost' },
      materialMathFreqSwing: { value: 0.4, min: -2, max: 2, step: 0.01, label: 'Math Freq Swing' },
      materialMathWarpSwing: { value: 0.3, min: -2, max: 2, step: 0.01, label: 'Math Warp Swing' },
      materialAmbientMult: { value: 0.2, min: -1, max: 2, step: 0.01, label: 'Ambient Pulse' },
      materialPointLightMult: { value: 0.6, min: -1, max: 4, step: 0.01, label: 'Point Light Pulse' },
      materialJitterOnBeat: { value: 0.08, min: 0, max: 0.6, step: 0.01, label: 'Jitter Kick' }
    })
  })

  const surface = useControls('Surface', {
    Depth: folder({
      useDepth: { value: true, label: 'Use Depth' },
      invertDepth: { value: false, label: 'Invert Depth' },
      depthScale: { value: 0.25, min: -1, max: 1, step: 0.001, label: 'Depth Scale' },
      depthBias: { value: 0.5, min: 0, max: 1, step: 0.001, label: 'Depth Bias' },
      normalStrength: { value: 6.0, min: 0, max: 20, step: 0.1, label: 'Normal Strength' }
    }, { collapsed: true }),
    Lighting: folder({
      ambient: { value: 0.22, min: 0, max: 1, step: 0.01, label: 'Ambient' },
      directionalColor: { value: '#ffffff', label: 'Key Color' },
      directionalIntensity: { value: 1.2, min: 0, max: 4, step: 0.01, label: 'Key Intensity' },
      directionalDir: { value: { x: -0.7, y: 0.9, z: 0.3 }, label: 'Key Direction' },
      pointColor: { value: '#a4b2ff', label: 'Fill Color' },
      pointIntensity: { value: 0.8, min: 0, max: 8, step: 0.01, label: 'Fill Intensity' },
      pointPos: { value: { x: 0.7, y: 0.6, z: 0.8 }, label: 'Fill Position' },
      specular: { value: 0.55, min: 0, max: 1, step: 0.01, label: 'Specular' },
      shininess: { value: 32, min: 1, max: 128, step: 1, label: 'Shininess' }
    }, { collapsed: true }),
    Color: folder({
      brightness: { value: 0.0, min: -1, max: 1, step: 0.001, label: 'Brightness' },
      contrast: { value: 1.0, min: 0, max: 2, step: 0.001, label: 'Contrast' },
      saturation: { value: 1.0, min: 0, max: 2, step: 0.001, label: 'Saturation' },
      hue: { value: 0.0, min: -Math.PI, max: Math.PI, step: 0.001, label: 'Hue' },
      tint: { value: '#ffffff', label: 'Tint' }
    }),
    Motion: folder({
      noiseAmp: { value: 0.025, min: 0, max: 0.25, step: 0.001, label: 'Noise Amp' },
      noiseFreq: { value: 6.0, min: 0, max: 20, step: 0.01, label: 'Noise Freq' },
      noiseSpeed: { value: 0.2, min: 0, max: 2, step: 0.01, label: 'Noise Speed' },
      jitter: { value: 0.02, min: 0, max: 0.2, step: 0.001, label: 'Jitter' }
    }),
    Deform: folder({
      mode: { options: { None: 0, Ripples: 1, Stripes: 2, Swirl: 3, Kaleidoscope: 4, Fractal: 5 }, value: 1, label: 'Mode' },
      mathAmp: { value: 0.05, min: 0, max: 0.5, step: 0.001, label: 'Deform Amp' },
      mathFreq: { value: 6.0, min: 0, max: 40, step: 0.1, label: 'Deform Freq' },
      timeScale: { value: 1.0, min: 0, max: 4, step: 0.01, label: 'Time Scale' },
      detail: { value: 1.0, min: 0.1, max: 3, step: 0.01, label: 'Detail' },
      warp: { value: 0.0, min: 0, max: 3, step: 0.01, label: 'Warp' },
      blend: { value: 0.5, min: 0, max: 1, step: 0.01, label: 'Blend' },
      symmetry: { value: 6, min: 2, max: 16, step: 1, label: 'Symmetry' }
    }, { collapsed: true }),
    Geometry: folder({
      segments: { value: 128, min: 16, max: 512, step: 1, label: 'Segments' }
    }, { collapsed: true })
  })

  const {
    enabled: audioEnabled,
    sensitivity: audioSensitivity,
    threshold: audioThreshold,
    power: audioPower,
    smoothing: audioSmoothing,
    bloomMult,
    chromaMult,
    vignetteMult,
    filmGrainMult,
    glitchMult,
    dofMult,
    camEnabled: rawCamEnabled,
    camZBase,
    camZRange,
    camSmoothing,
    camSubBass,
    camBass,
    camMid,
    camTreble,
    camBeatKick,
    camBeatDecay,
    materialReactive: rawMaterialReactive,
    materialNoiseAmpMult,
    materialDepthScaleMult,
    materialHueMult,
    materialBrightnessMult,
    materialContrastMult,
    materialSaturationMult,
    materialMathAmpMult,
    materialMathFreqSwing,
    materialMathWarpSwing,
    materialAmbientMult,
    materialPointLightMult,
    materialJitterOnBeat
  } = audio

  const effectsAudio = useMemo(
    () => ({
      enabled: audioEnabled,
      sensitivity: audioSensitivity,
      threshold: audioThreshold,
      power: audioPower,
      smoothing: audioSmoothing,
      bloomMult,
      chromaMult,
      vignetteMult,
      filmGrainMult,
      glitchMult,
      dofMult
    }),
    [audioEnabled, audioSensitivity, audioThreshold, audioPower, audioSmoothing, bloomMult, chromaMult, vignetteMult, filmGrainMult, glitchMult, dofMult]
  )

  const materialAudio = useMemo(
    () => ({
      audioReactive: rawMaterialReactive && audioEnabled,
      sensitivity: audioSensitivity,
      threshold: audioThreshold,
      power: audioPower,
      smoothing: audioSmoothing,
      noiseAmpMult: materialNoiseAmpMult,
      depthScaleMult: materialDepthScaleMult,
      hueMult: materialHueMult,
      brightnessMult: materialBrightnessMult,
      contrastMult: materialContrastMult,
      saturationMult: materialSaturationMult,
      mathAmpMult: materialMathAmpMult,
      mathFreqSwing: materialMathFreqSwing,
      mathWarpSwing: materialMathWarpSwing,
      ambientMult: materialAmbientMult,
      pointLightMult: materialPointLightMult,
      jitterOnBeat: materialJitterOnBeat
    }),
    [
      rawMaterialReactive,
      audioEnabled,
      audioSensitivity,
      audioThreshold,
      audioPower,
      audioSmoothing,
      materialNoiseAmpMult,
      materialDepthScaleMult,
      materialHueMult,
      materialBrightnessMult,
      materialContrastMult,
      materialSaturationMult,
      materialMathAmpMult,
      materialMathFreqSwing,
      materialMathWarpSwing,
      materialAmbientMult,
      materialPointLightMult,
      materialJitterOnBeat
    ]
  )

  const camAudio = useMemo(
    () => ({
      enabled: rawCamEnabled && audioEnabled,
      zBase: camZBase,
      zRange: camZRange,
      smoothing: camSmoothing,
      subBass: camSubBass,
      bass: camBass,
      mid: camMid,
      treble: camTreble,
      beatKick: camBeatKick,
      beatDecay: camBeatDecay
    }),
    [rawCamEnabled, audioEnabled, camZBase, camZRange, camSmoothing, camSubBass, camBass, camMid, camTreble, camBeatKick, camBeatDecay]
  )

  const {
    useDepth,
    invertDepth,
    depthScale,
    depthBias,
    normalStrength,
    ambient,
    directionalColor,
    directionalIntensity,
    directionalDir,
    pointColor,
    pointIntensity,
    pointPos,
    specular,
    shininess,
    brightness,
    contrast,
    saturation,
    hue,
    tint,
    noiseAmp,
    noiseFreq,
    noiseSpeed,
    jitter,
    mode,
    mathAmp,
    mathFreq,
    timeScale,
    detail,
    warp,
    blend,
    symmetry,
    segments
  } = surface

  const depthSettings = useMemo(
    () => ({ useDepth, invertDepth, depthScale, depthBias, normalStrength }),
    [useDepth, invertDepth, depthScale, depthBias, normalStrength]
  )

  const lightingSettings = useMemo(
    () => ({
      ambient,
      directionalColor,
      directionalIntensity,
      directionalDir,
      pointColor,
      pointIntensity,
      pointPos,
      specular,
      shininess
    }),
    [ambient, directionalColor, directionalIntensity, directionalDir, pointColor, pointIntensity, pointPos, specular, shininess]
  )

  const colorSettings = useMemo(
    () => ({ brightness, contrast, saturation, hue, tint }),
    [brightness, contrast, saturation, hue, tint]
  )

  const animationSettings = useMemo(
    () => ({ noiseAmp, noiseFreq, noiseSpeed, jitter }),
    [noiseAmp, noiseFreq, noiseSpeed, jitter]
  )

  const mathSettings = useMemo(
    () => ({ mode, mathAmp, mathFreq, timeScale, detail, warp, blend, symmetry }),
    [mode, mathAmp, mathFreq, timeScale, detail, warp, blend, symmetry]
  )

  const qualitySettings = useMemo(
    () => ({ segments }),
    [segments]
  )

  const surfaceConfig = useMemo(
    () => ({
      depthSettings,
      lightingSettings,
      colorSettings,
      animationSettings,
      mathSettings,
      qualitySettings,
      audioSettings: materialAudio
    }),
    [depthSettings, lightingSettings, colorSettings, animationSettings, mathSettings, qualitySettings, materialAudio]
  )

  const chromaOffset = useMemo(() => [chroma, 0], [chroma])
  const dofAmount = effectsState.dof ?? dof

  // effects state — updated at a limited rate from EffectsUpdater to keep
  // re-renders manageable and avoid passing refs into the effect components
  const [effectsState, setEffectsState] = useState(() => ({
    bloom,
    chroma,
    vignette,
    filmGrain,
    glitch: 0,
    dof
  }))

  // audio controller that centralizes smoothing and beat boosts
  const controllerRef = useRef(createEffectsController({ controls: effectsAudio, base: { bloom, chroma, vignette, filmGrain, glitch, dof } }))
  // keep controller mapping and base values in sync with controls
  useEffect(() => controllerRef.current.setControls(effectsAudio), [effectsAudio])
  useEffect(() => controllerRef.current.setBase({ bloom, chroma, vignette, filmGrain, glitch, dof }), [bloom, chroma, vignette, filmGrain, glitch, dof])

  // forward beat events to the controller (controller will keep internal boosts)
  useEffect(() => {
    const unsub = audioBus.subscribe((ev) => controllerRef.current.onBeat(ev))
    return unsub
  }, [])

  // EffectsUpdater must be mounted inside the Canvas so useFrame has the
  // proper r3f context. It computes dynamic effect values from the audio
  // controller and updates a small React state at a throttled rate so the
  // effect components receive serializable props only.
  const layersCtl = useControls('Layers', {
    multiLayer: false,
    count: { value: 3, min: 1, max: 6, step: 1 },
    spreadZ: { value: 0.08, min: 0.0, max: 0.5, step: 0.005 },
    scaleSpread: { value: 0.03, min: 0.0, max: 0.2, step: 0.001 },
    depthScaleFalloff: { value: 0.85, min: 0.5, max: 1.0, step: 0.01 },
    opacityStart: { value: 0.9, min: 0.1, max: 1.0, step: 0.01 },
    opacityFalloff: { value: 0.75, min: 0.4, max: 1.0, step: 0.01 }
  })

  function EffectsUpdater() {
    const lastRef = useRef(0)
    useFrame((state, dt) => {
      const bus = audioBus.latest
      const dyn = controllerRef.current.update(bus, dt)
      if (!dyn) return
      const now = performance.now()
      // throttle to ~20-30 FPS
      if (now - lastRef.current < 40) return
      lastRef.current = now
  setEffectsState({ bloom: dyn.bloom, chroma: dyn.chroma, vignette: dyn.vignette, filmGrain: dyn.filmGrain, glitch: dyn.glitch, dof: dyn.dof })
    })
    return null
  }

  // Adaptive DPR controller inside Canvas context
  function AdaptiveDPR({ enabled, target, min, max }) {
    const { gl } = useThree()
    const dprRef = useRef(gl.getPixelRatio ? gl.getPixelRatio() : (typeof window !== 'undefined' ? window.devicePixelRatio : 1))
    const accRef = useRef({ t: 0, f: 0 })
    useEffect(() => {
      if (!enabled) {
        const base = typeof window !== 'undefined' ? window.devicePixelRatio : 1
        const next = Math.min(max, Math.max(min, base))
        dprRef.current = next
        gl.setPixelRatio(next)
      }
    }, [enabled, min, max, gl])
    useFrame((state, dt) => {
      if (!enabled) return
      const acc = accRef.current
      acc.t += dt
      acc.f += 1
      if (acc.t >= 0.5) {
        const fps = acc.f / acc.t
        acc.t = 0
        acc.f = 0
        let next = dprRef.current
        if (fps < target - 5) next = Math.max(min, next * 0.9)
        else if (fps > target + 5) next = Math.min(max, next * 1.05)
        if (Math.abs(next - dprRef.current) > 0.01) {
          dprRef.current = next
          gl.setPixelRatio(next)
        }
      }
    })
    return null
  }

  const [canSSAO, setCanSSAO] = useState(false)

  function applyPreset(name) {
    const p = PRESETS[name] || PRESETS.Default
    // Override post effects values via effectsState (these feed the effects)
    setEffectsState({
      bloom: p.effects.bloom,
      chroma: p.effects.chroma,
      vignette: p.effects.vignette,
      filmGrain: p.effects.filmGrain,
      glitch: p.effects.glitch,
      dof: p.effects.dof ?? 0
    })
    // sync audio-driven effect base values
    try {
      controllerRef.current.setBase({
        bloom: p.effects.bloom,
        chroma: p.effects.chroma,
        vignette: p.effects.vignette,
        filmGrain: p.effects.filmGrain,
        glitch: p.effects.glitch,
        dof: p.effects.dof ?? 0
      })
    } catch {}

    // Try to reflect values in Leva UI sliders for consistency
    try {
      const setPath = (path, value) => {
        if (!levaStore) return
        // Leva store may expose setValueAtPath; fall back to generic set
        if (typeof levaStore.setValueAtPath === 'function') {
          levaStore.setValueAtPath(path, value)
        } else if (typeof levaStore.set === 'function') {
          // Some versions expose a zustand-like set with internal schema
          // Common paths are "Group.control"; attempt best-effort update
          levaStore.set({ [path]: value })
        }
      }
      // Effects sliders
  setPath('Visual FX.bloom', p.effects.bloom)
  setPath('Visual FX.chroma', p.effects.chroma)
  setPath('Visual FX.vignette', p.effects.vignette)
      setPath('Visual FX.filmGrain', p.effects.filmGrain)
      setPath('Visual FX.glitch', p.effects.glitch)
      setPath('Visual FX.dof', p.effects.dof ?? 0)
  // Material-related sliders mapped into Surface folders
  setPath('Surface.Motion.noiseAmp', p.material.noiseAmp)
  setPath('Surface.Depth.depthScale', p.material.depthScale)
  setPath('Surface.Color.hue', p.material.hue)
  setPath('Surface.Color.brightness', p.material.brightness)
      setPath('Surface.Color.contrast', p.material.contrast ?? 1)
      setPath('Surface.Color.saturation', p.material.saturation ?? 1)
      setPath('Surface.Motion.jitter', p.material.jitter)
      setPath('Surface.Deform.mathAmp', p.material.mathAmp ?? 0.05)
      setPath('Surface.Deform.mathFreq', p.material.mathFreq ?? 6.0)
      setPath('Surface.Deform.timeScale', p.material.mathTimeScale ?? 1.0)
      setPath('Surface.Deform.detail', p.material.mathDetail ?? 1.0)
      setPath('Surface.Deform.warp', p.material.mathWarp ?? 0.0)
      setPath('Surface.Deform.blend', p.material.mathBlend ?? 0.5)
      setPath('Surface.Deform.symmetry', p.material.mathSymmetry ?? 6.0)
    } catch {}
  }

  // Auto-apply when dropdown changes
  useEffect(() => { applyPreset(preset) }, [preset])

  const camZRef = useRef(0)
  const beatBoostRef = useRef(0)
  useEffect(() => {
    const unsub = audioBus.subscribe((ev) => {
      beatBoostRef.current = Math.max(beatBoostRef.current, (ev.strength || 0) * camAudio.beatKick)
    })
    return unsub
  }, [camAudio.beatKick])

  function AudioCameraZ() {
    useFrame((state, dt) => {
      if (!camAudio.enabled) { camZRef.current = 0; return }
      const a = audioBus.latest
      if (!a) return
      const bands = a.smoothBands || a.bands || {}
      const shape = (v) => {
        const t = Math.max(0, v - audioThreshold)
        return Math.pow(Math.max(0, t / (1 - audioThreshold + 1e-6)), audioPower)
      }
      const weighted =
        shape(bands.subBass || 0) * camAudio.subBass +
        shape(bands.bass || 0) * camAudio.bass +
        shape(bands.mid || 0) * camAudio.mid +
        shape(bands.treble || 0) * camAudio.treble
      // normalize by sum of multipliers to keep scale stable
      const normDen = (camAudio.subBass + camAudio.bass + camAudio.mid + camAudio.treble) || 1
      const normalized = weighted / normDen
      let target = camAudio.zBase + normalized * audioSensitivity * camAudio.zRange + beatBoostRef.current
      // decay beat boost
      beatBoostRef.current = Math.max(0, beatBoostRef.current - dt * camAudio.beatDecay)
      // smooth toward target
      const s = Math.max(0, Math.min(1, camAudio.smoothing))
      camZRef.current = camZRef.current + (target - camZRef.current) * s
    })
    return null
  }

  return (
    <Canvas
      camera={{ position: [0, 0.9, 2.7], fov: 45 }}
      gl={{ antialias: perf.antialias, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor(background)
        setCanSSAO(!!gl.capabilities.isWebGL2)
      }}
    >
  {showStats && <Stats showPanel={0} />}
      <color attach="background" args={[background]} />

      {/* Adaptive DPR to maintain target FPS */}
      <AdaptiveDPR enabled={perf.adaptiveDpr} target={perf.targetFps} min={perf.minDpr} max={perf.maxDpr} />

      <ambientLight intensity={0.1} />

      <Suspense fallback={null}>
        <Environment preset="studio" environmentIntensity={envIntensity} />

        <AudioCameraZ />
        <Rig orbit={orbit} zOffset={camZRef.current}>
          {layersCtl.multiLayer ? (
            (() => {
              const items = []
              const n = Math.max(1, Math.floor(layersCtl.count))
              for (let i = 0; i < n; i++) {
                const z = -i * layersCtl.spreadZ
                const s = 1 + i * layersCtl.scaleSpread
                const depthMult = Math.pow(layersCtl.depthScaleFalloff, i)
                const opacity = Math.max(0, Math.min(1, layersCtl.opacityStart * Math.pow(layersCtl.opacityFalloff, i)))
                items.push(
                  <group key={i} position={[0, 0, z]} scale={[s, s, 1]}>
                    <DepthSurface
                      colorURL={colorURL}
                      depthURL={depthURL}
                      wowMode={wowMode}
                      depthScaleMult={depthMult}
                      opacity={opacity}
                      transparent
                      {...surfaceConfig}
                    />
                  </group>
                )
              }
              return items
            })()
          ) : (
            <DepthSurface colorURL={colorURL} depthURL={depthURL} wowMode={wowMode} {...surfaceConfig} />
          )}
        </Rig>
      </Suspense>

      <OrbitControls enabled={!orbit} enableDamping dampingFactor={0.1} />

      <EffectComposer multisampling={0} frameBufferType={THREE.HalfFloatType} resolutionScale={perf.postScale}>
        {/* Initial/base values are set from the Leva controls. They will be
            updated imperatively in the r3f render loop using audioBus data. */}
    {/* Disable mipmap blur to avoid instantiating KawaseBlurPass which can
      cause circular structures when internal passes are inspected by
      older library internals. Use the simpler bloom implementation. */}
    <Bloom intensity={effectsState.bloom ?? bloom} luminanceThreshold={0.15} luminanceSmoothing={0.25} />
        <ChromaticAberration offset={[effectsState.chroma ?? chroma, 0]} radialModulation modulationOffset={0.2} />
        <Vignette eskil={false} darkness={effectsState.vignette ?? vignette} offset={0.5} />
        <Glitch
          delay={[0.5, 1.0]}
          duration={[0.1, 0.35]}
          strength={[0.15 * (effectsState.glitch ?? 0), 0.5 * (effectsState.glitch ?? 0)]}
          mode={GlitchMode.SPORADIC}
          columns={0.12}
          active={(effectsState.glitch ?? 0) > 0.01}
        />
        {/* If hardware AA is off, apply lightweight SMAA */}
        {perf.smaa && !perf.antialias && <SMAA />}
        {/* Optional SSAO to enhance depth cues (WebGL2 only) */}
        {perf.ssao && canSSAO && (
          <SSAO samples={8} rings={4} radius={0.15} intensity={12} distanceThreshold={0.3} distanceFalloff={0.6} />
        )}
  <Noise premultiply blendFunction={BlendFunction.ADD} opacity={effectsState.filmGrain ?? filmGrain} />
  {dofAmount > 0.001 && <DepthOfField focusDistance={0.01} focalLength={0.02 + dofAmount * 0.05} bokehScale={2 + dofAmount * 8} />}
      </EffectComposer>
      <EffectsUpdater />
    </Canvas>
  )
}
