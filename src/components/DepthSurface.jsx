import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import '../shaders/DepthDisplaceMaterial.js'
import audioBus from '../lib/audioBus'
import { createMaterialController } from '../lib/audioMapper'

const DEFAULT_DEPTH = Object.freeze({ useDepth: true, invertDepth: false, depthScale: 0.25, depthBias: 0.5, normalStrength: 6.0 })
const DEFAULT_LIGHTING = Object.freeze({
  ambient: 0.22,
  directionalColor: '#ffffff',
  directionalIntensity: 1.2,
  directionalDir: { x: -0.7, y: 0.9, z: 0.3 },
  pointColor: '#a4b2ff',
  pointIntensity: 0.8,
  pointPos: { x: 0.7, y: 0.6, z: 0.8 },
  specular: 0.55,
  shininess: 32
})
const DEFAULT_COLOR = Object.freeze({ brightness: 0.0, contrast: 1.0, saturation: 1.0, hue: 0.0, tint: '#ffffff' })
const DEFAULT_ANIMATION = Object.freeze({ noiseAmp: 0.025, noiseFreq: 6.0, noiseSpeed: 0.2, jitter: 0.02 })
const DEFAULT_MATH = Object.freeze({
  mode: 1,
  mathAmp: 0.05,
  mathFreq: 6.0,
  timeScale: 1.0,
  detail: 1.0,
  warp: 0.0,
  blend: 0.5,
  symmetry: 6.0
})
const DEFAULT_QUALITY = Object.freeze({ segments: 128 })
const DEFAULT_AUDIO = Object.freeze({
  audioReactive: true,
  sensitivity: 1.0,
  threshold: 0.05,
  power: 1.2,
  noiseAmpMult: 0.12,
  depthScaleMult: 0.5,
  hueMult: 0.6,
  brightnessMult: 0.25,
  contrastMult: 0.0,
  saturationMult: 0.0,
  mathAmpMult: 0.2,
  mathFreqSwing: 0.2,
  mathWarpSwing: 0.25,
  ambientMult: 0.0,
  pointLightMult: 0.0,
  jitterOnBeat: 0.08,
  smoothing: 0.2
})

export default function DepthSurface({
  colorURL,
  depthURL,
  wowMode,
  depthScaleMult = 1.0,
  opacity = 1.0,
  transparent = false,
  depthSettings,
  lightingSettings,
  colorSettings,
  animationSettings,
  mathSettings,
  qualitySettings,
  audioSettings
}) {
  const meshRef = useRef()
  const matRef = useRef()
  const { gl } = useThree()

  const colorTex = useLoader(THREE.TextureLoader, colorURL || '/placeholder-color.png', (loader) => {
    loader.setCrossOrigin('anonymous')
  })
  const depthTex = useLoader(THREE.TextureLoader, depthURL || '/placeholder-depth.png', (loader) => {
    loader.setCrossOrigin('anonymous')
  })

  useEffect(() => {
    if (colorTex) {
      colorTex.colorSpace = THREE.SRGBColorSpace
      colorTex.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy() || 1)
      colorTex.wrapS = colorTex.wrapT = THREE.ClampToEdgeWrapping
      colorTex.needsUpdate = true
    }
    if (depthTex) {
      depthTex.colorSpace = THREE.NoColorSpace
      depthTex.anisotropy = 1
      depthTex.wrapS = depthTex.wrapT = THREE.ClampToEdgeWrapping
      depthTex.minFilter = THREE.LinearFilter
      depthTex.magFilter = THREE.LinearFilter
      depthTex.needsUpdate = true
    }
  }, [colorTex, depthTex, gl])

  const texelSize = useMemo(() => {
    const w = depthTex?.image?.width || 1024
    const h = depthTex?.image?.height || 1024
    return [1 / w, 1 / h]
  }, [depthTex])

  const depth = depthSettings || DEFAULT_DEPTH
  const lighting = lightingSettings || DEFAULT_LIGHTING
  const colorFx = colorSettings || DEFAULT_COLOR
  const anim = animationSettings || DEFAULT_ANIMATION
  const audioConfig = audioSettings || DEFAULT_AUDIO
  const mathEdit = mathSettings || DEFAULT_MATH
  const quality = qualitySettings || DEFAULT_QUALITY

  // material controller centralizes smoothing and beat boosts for the material
  const controllerRef = useRef(
    createMaterialController({
      controls: audioConfig,
      base: {
        noiseAmp: anim.noiseAmp,
        depthScale: depth.depthScale,
        hue: colorFx.hue,
        brightness: colorFx.brightness,
        contrast: colorFx.contrast,
        saturation: colorFx.saturation,
        mathAmp: mathEdit.mathAmp,
        mathFreq: mathEdit.mathFreq,
        mathWarp: mathEdit.warp,
        ambient: lighting.ambient,
        pointIntensity: lighting.pointIntensity,
        jitter: anim.jitter
      }
    })
  )
  useEffect(() => controllerRef.current.setControls(audioConfig), [audioConfig])
  useEffect(() => controllerRef.current.setBase({
    noiseAmp: anim.noiseAmp,
    depthScale: depth.depthScale,
    hue: colorFx.hue,
    brightness: colorFx.brightness,
    contrast: colorFx.contrast,
    saturation: colorFx.saturation,
    mathAmp: mathEdit.mathAmp,
    mathFreq: mathEdit.mathFreq,
    mathWarp: mathEdit.warp,
    ambient: lighting.ambient,
    pointIntensity: lighting.pointIntensity,
    jitter: anim.jitter
  }), [anim.noiseAmp, depth.depthScale, colorFx.hue, colorFx.brightness, colorFx.contrast, colorFx.saturation, mathEdit.mathAmp, mathEdit.mathFreq, mathEdit.warp, lighting.ambient, lighting.pointIntensity, anim.jitter])
  useEffect(() => {
    const unsub = audioBus.subscribe((ev) => controllerRef.current.onBeat(ev))
    return unsub
  }, [])

  // memoized lighting/color values so we don't allocate on every render
  const uLightDirVal = useMemo(() => [lighting.directionalDir.x, lighting.directionalDir.y, lighting.directionalDir.z], [lighting.directionalDir.x, lighting.directionalDir.y, lighting.directionalDir.z])
  const uLightColorVal = useMemo(() => new THREE.Color(lighting.directionalColor), [lighting.directionalColor])
  const uPointLightPosVal = useMemo(() => [lighting.pointPos.x, lighting.pointPos.y, lighting.pointPos.z], [lighting.pointPos.x, lighting.pointPos.y, lighting.pointPos.z])
  const uPointLightColorVal = useMemo(() => new THREE.Color(lighting.pointColor), [lighting.pointColor])
  const uTintVal = useMemo(() => new THREE.Color(colorFx.tint), [colorFx.tint])

  useFrame((state, dt) => {
    if (!matRef.current) return
    matRef.current.uTime += dt

    // existing wow-mode animation
    if (wowMode) {
      const t = state.clock.elapsedTime
      matRef.current.uNoiseAmp = 0.02 + Math.sin(t * 0.8) * 0.01
      matRef.current.uHue = Math.sin(t * 0.25) * 0.3
      matRef.current.uBrightness = Math.sin(t * 0.5) * 0.06
    }

    // audio-driven material updates via controller
    if (audioConfig.audioReactive) {
      const dyn = controllerRef.current.update(audioBus.latest, dt)
      if (dyn) {
        matRef.current.uNoiseAmp = dyn.noiseAmp
  matRef.current.uDepthScale = dyn.depthScale * depthScaleMult
        matRef.current.uHue = dyn.hue
        matRef.current.uBrightness = dyn.brightness
        matRef.current.uContrast = dyn.contrast
        matRef.current.uSaturation = dyn.saturation
        matRef.current.uMathAmp = dyn.mathAmp
        matRef.current.uMathFreq = dyn.mathFreq
        matRef.current.uMathWarp = dyn.mathWarp
        matRef.current.uAmbient = dyn.ambient
        matRef.current.uPointLightIntensity = dyn.pointLightIntensity
        matRef.current.uJitter = dyn.jitter
      }
    } else if (matRef.current) {
      matRef.current.uNoiseAmp = anim.noiseAmp
  matRef.current.uDepthScale = depth.depthScale * depthScaleMult
      matRef.current.uHue = colorFx.hue
      matRef.current.uBrightness = colorFx.brightness
      matRef.current.uContrast = colorFx.contrast
      matRef.current.uSaturation = colorFx.saturation
      matRef.current.uMathAmp = mathEdit.mathAmp
      matRef.current.uMathFreq = mathEdit.mathFreq
      matRef.current.uMathWarp = mathEdit.warp
      matRef.current.uAmbient = lighting.ambient
      matRef.current.uPointLightIntensity = lighting.pointIntensity
      matRef.current.uJitter = anim.jitter
    }
  })

  return (
    <mesh ref={meshRef}>
  <PlaneGeometry colorTex={colorTex} segments={quality.segments} />
      <depthDisplaceMaterial
        ref={matRef}
        key={`${colorURL || 'color'}-${depthURL || 'depth'}`}
        uColorMap={colorTex}
        uDepthMap={depthTex}
        uTexelSize={texelSize}
        uUseDepth={depth.useDepth ? 1 : 0}
        uInvertDepth={depth.invertDepth ? 1 : 0}
  uDepthScale={depth.depthScale * depthScaleMult}
        uDepthBias={depth.depthBias}
        uNormalStrength={depth.normalStrength}
  uAmbient={lighting.ambient}
  uLightDir={uLightDirVal}
  uLightColor={uLightColorVal}
  uLightIntensity={lighting.directionalIntensity}
  uPointLightPos={uPointLightPosVal}
  uPointLightColor={uPointLightColorVal}
        uPointLightIntensity={lighting.pointIntensity}
        uSpecular={lighting.specular}
        uShininess={lighting.shininess}
        uBrightness={colorFx.brightness}
        uContrast={colorFx.contrast}
        uSaturation={colorFx.saturation}
        uHue={colorFx.hue}
  uTint={uTintVal}
    uOpacity={opacity}
  uNoiseAmp={anim.noiseAmp}
        uNoiseFreq={anim.noiseFreq}
        uNoiseSpeed={anim.noiseSpeed}
        uJitter={anim.jitter}
        uMathMode={mathEdit.mode}
        uMathAmp={mathEdit.mathAmp}
        uMathFreq={mathEdit.mathFreq}
  uMathTimeScale={mathEdit.timeScale}
  uMathDetail={mathEdit.detail}
  uMathWarp={mathEdit.warp}
  uMathBlend={mathEdit.blend}
  uMathSymmetry={mathEdit.symmetry}
    transparent={transparent || opacity < 1}
    depthWrite={!((transparent || opacity < 1))}
      />
    </mesh>
  )
}

function PlaneGeometry({ colorTex, segments = 128 }) {
  const geomRef = useRef()
  const width = useMemo(() => {
    const w = colorTex?.image?.width || 1
    const h = colorTex?.image?.height || 1
    return h ? w / h : 1
  }, [colorTex])

  return <planeGeometry ref={geomRef} args={[width, 1, segments, segments]} />
}
