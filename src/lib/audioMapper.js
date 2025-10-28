function lerp(a, b, t) {
  return a + (b - a) * t
}

const DEFAULTS = {
  smoothing: 0.12,
  sensitivity: 1.0,
  threshold: 0.05,
  power: 1.2,
  beatDecay: { bloom: 1.6, glitch: 3.0, jitter: 2.0 }
}

export function createEffectsController({ controls = {}, base = {} } = {}) {
  const cfg = Object.assign({}, DEFAULTS, controls)
  let smoothing = cfg.smoothing

  const state = {
    smoothed: { volume: 0, bass: 0, mid: 0, treble: 0, low: 0, high: 0, lowMid: 0, highMid: 0 },
    boosts: { bloom: 0, glitch: 0 },
    mapping: { ...controls },
    base: { ...base }
  }

  function setControls(next) {
    state.mapping = Object.assign(state.mapping, next)
    if (next.smoothing !== undefined) smoothing = next.smoothing
  }
  function setBase(nextBase) {
    state.base = Object.assign(state.base, nextBase)
  }

  function onBeat(ev) {
    // scale boosts by bass energy and spectral strength
    const bass = ev.bands?.bass || 0
    state.boosts.bloom = Math.max(state.boosts.bloom, bass * (state.mapping.bloomMult || 1) * 1.5)
    state.boosts.glitch = Math.max(state.boosts.glitch, (ev.strength || 0) * (state.mapping.glitchMult || 1))
  }

  function update(bus, dt) {
    if (!bus || state.mapping.enabled === false) {
      return {
        bloom: state.base.bloom || 0,
        chroma: state.base.chroma || 0,
        vignette: state.base.vignette || 0,
        filmGrain: state.base.filmGrain || 0,
        glitch: state.base.glitch || 0
      }
    }

    const map = state.mapping
    const bands = bus.smoothBands || bus.bands || {}
    const energy3 = bus.energy3 || {
      low: (bands.subBass || 0) * 0.7 + (bands.bass || 0) * 0.3,
      mid: (bands.mid || 0),
      high: (bands.highMid || 0) * 0.6 + (bands.treble || 0) * 0.4
    }
    // smooth common band values
    const s = Math.max(0, Math.min(1, smoothing))
    state.smoothed.volume = lerp(state.smoothed.volume, (bus.volume || 0) * (map.sensitivity || 1), s)
    state.smoothed.bass = lerp(state.smoothed.bass, bands.bass || 0, s)
    state.smoothed.mid = lerp(state.smoothed.mid, bands.mid || 0, s)
    state.smoothed.treble = lerp(state.smoothed.treble, bands.treble || 0, s)
    state.smoothed.low = lerp(state.smoothed.low, energy3.low || 0, s)
    state.smoothed.high = lerp(state.smoothed.high, energy3.high || 0, s)
    state.smoothed.lowMid = lerp(state.smoothed.lowMid, bands.lowMid || 0, s)
    state.smoothed.highMid = lerp(state.smoothed.highMid, bands.highMid || 0, s)

    // shaping function with threshold and power curve
    const thr = map.threshold !== undefined ? map.threshold : DEFAULTS.threshold
    const pow = map.power !== undefined ? map.power : DEFAULTS.power
    const shape = (v) => {
      const t = Math.max(0, v - thr)
      return Math.pow(Math.max(0, t / (1 - thr + 1e-6)), pow)
    }

    // decay boosts
    state.boosts.bloom = Math.max(0, state.boosts.bloom - dt * (map.beatDecay?.bloom || DEFAULTS.beatDecay.bloom))
    state.boosts.glitch = Math.max(0, state.boosts.glitch - dt * (map.beatDecay?.glitch || DEFAULTS.beatDecay.glitch))

    const bloom = (state.base.bloom || 0) + shape(state.smoothed.bass) * (map.bloomMult || 0) + state.boosts.bloom
    const chroma = (state.base.chroma || 0) + shape(state.smoothed.treble) * (map.chromaMult || 0)
    const vignette = Math.max(0, (state.base.vignette || 0) + shape(state.smoothed.mid) * (map.vignetteMult || 0))
    const filmGrain = Math.max(0, (state.base.filmGrain || 0) + shape(state.smoothed.mid) * (map.filmGrainMult || 0))
    const glitch = Math.max(0, (state.base.glitch || 0) + state.boosts.glitch)

    return { bloom, chroma, vignette, filmGrain, glitch }
  }

  return { setControls, setBase, onBeat, update }
}

export function createMaterialController({ controls = {}, base = {} } = {}) {
  const cfg = Object.assign({}, DEFAULTS, controls)
  let smoothing = cfg.smoothing

  const state = {
    smoothed: { volume: 0, bass: 0, mid: 0, treble: 0, low: 0, high: 0, lowMid: 0, highMid: 0 },
    boosts: { jitter: 0 },
    mapping: { ...controls },
    base: { ...base }
  }

  function setControls(next) { state.mapping = Object.assign(state.mapping, next); if (next.smoothing !== undefined) smoothing = next.smoothing }
  function setBase(nextBase) { state.base = Object.assign(state.base, nextBase) }
  function onBeat(ev) { state.boosts.jitter = Math.max(state.boosts.jitter, (ev.bands?.bass || 0) * (state.mapping.jitterOnBeat || 0)) }

  function update(bus, dt) {
    if (!bus || state.mapping.audioReactive === false || state.mapping.enabled === false) {
      return {
        noiseAmp: state.base.noiseAmp || 0,
        depthScale: state.base.depthScale || 0,
        hue: state.base.hue || 0,
        brightness: state.base.brightness || 0,
        contrast: state.base.contrast || 1,
        saturation: state.base.saturation || 1,
        mathAmp: state.base.mathAmp || 0,
        mathFreq: state.base.mathFreq || 0,
        mathWarp: state.base.mathWarp || 0,
        ambient: state.base.ambient || 0,
        pointLightIntensity: state.base.pointIntensity || 0,
        jitter: state.base.jitter || 0
      }
    }
    const map = state.mapping
    const bands = bus.smoothBands || bus.bands || {}
    const energy3 = bus.energy3 || {
      low: (bands.subBass || 0) * 0.7 + (bands.bass || 0) * 0.3,
      mid: (bands.mid || 0),
      high: (bands.highMid || 0) * 0.6 + (bands.treble || 0) * 0.4
    }
    const s = Math.max(0, Math.min(1, smoothing))
    state.smoothed.volume = lerp(state.smoothed.volume, (bus.volume || 0) * (map.sensitivity || 1), s)
    state.smoothed.bass = lerp(state.smoothed.bass, bands.bass || 0, s)
    state.smoothed.mid = lerp(state.smoothed.mid, bands.mid || 0, s)
    state.smoothed.treble = lerp(state.smoothed.treble, bands.treble || 0, s)
    state.smoothed.low = lerp(state.smoothed.low, energy3.low || 0, s)
    state.smoothed.high = lerp(state.smoothed.high, energy3.high || 0, s)
    state.smoothed.lowMid = lerp(state.smoothed.lowMid, bands.lowMid || 0, s)
    state.smoothed.highMid = lerp(state.smoothed.highMid, bands.highMid || 0, s)

    // decay jitter boost
    state.boosts.jitter = Math.max(0, state.boosts.jitter - dt * (map.beatDecay?.jitter || DEFAULTS.beatDecay.jitter))

    const thr = map.threshold !== undefined ? map.threshold : DEFAULTS.threshold
    const pow = map.power !== undefined ? map.power : DEFAULTS.power
    const shape = (v) => {
      const t = Math.max(0, v - thr)
      return Math.pow(Math.max(0, t / (1 - thr + 1e-6)), pow)
    }

    const noiseAmp = (state.base.noiseAmp || 0) + shape(state.smoothed.volume) * (map.noiseAmpMult || 0)
    const depthScale = (state.base.depthScale || 0) + shape(state.smoothed.bass) * (map.depthScaleMult || 0)
    const hue = (state.base.hue || 0) + shape(state.smoothed.volume) * (map.hueMult || 0)
    const brightness = (state.base.brightness || 0) + shape(state.smoothed.volume) * (map.brightnessMult || 0)
    const contrast = (state.base.contrast || 1) + shape(state.smoothed.mid) * (map.contrastMult || 0)
    const saturation = (state.base.saturation || 1) + shape(state.smoothed.high) * (map.saturationMult || 0)
    const mathAmp = (state.base.mathAmp || 0) + shape(state.smoothed.lowMid) * (map.mathAmpMult || 0)
    const mathFreq = Math.max(0, (state.base.mathFreq || 0) + shape(state.smoothed.highMid) * (map.mathFreqSwing || 0))
    const mathWarp = Math.max(0, (state.base.mathWarp || 0) + shape(state.smoothed.high) * (map.mathWarpSwing || 0))
    const ambient = Math.max(0, (state.base.ambient || 0) + shape(state.smoothed.mid) * (map.ambientMult || 0))
    const pointLightIntensity = Math.max(0, (state.base.pointIntensity || 0) + shape(state.smoothed.low) * (map.pointLightMult || 0))
    const jitter = (state.base.jitter || 0) + state.boosts.jitter

    return { noiseAmp, depthScale, hue, brightness, contrast, saturation, mathAmp, mathFreq, mathWarp, ambient, pointLightIntensity, jitter }
  }

  // Expose setBase so callers can update the material's baseline values
  return { setControls, setBase, onBeat, update }
}
