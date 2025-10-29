import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import '../shaders/ASCIIMaterial.js'
import audioBus from '../lib/audioBus'
import { createMaterialController } from '../lib/audioMapper'

export default function ASCIIEffect({
  colorURL,
  depthURL,
  cellSize = 8,
  depthInfluence = 0.5,
  invertDepth = false,
  brightness = 0.0,
  contrast = 1.0,
  tint = '#ffffff',
  colorize = true,
  animate = true,
  animSpeed = 1.0,
  waveAmp = 0.02,
  jitter = 0.005,
  use3D = true,
  depthScale = 0.15,
  segments = 128,
  audioReactive = true,
  enabled = false
}) {
  // Don't render if images are not provided or not enabled
  if (!colorURL || !depthURL || !enabled) return null

  return (
    <ASCIIEffectImpl
      colorURL={colorURL}
      depthURL={depthURL}
      cellSize={cellSize}
      depthInfluence={depthInfluence}
      invertDepth={invertDepth}
      brightness={brightness}
      contrast={contrast}
      tint={tint}
      colorize={colorize}
      animate={animate}
      animSpeed={animSpeed}
      waveAmp={waveAmp}
      jitter={jitter}
      use3D={use3D}
      depthScale={depthScale}
      segments={segments}
      audioReactive={audioReactive}
    />
  )
}

function ASCIIEffectImpl({
  colorURL,
  depthURL,
  cellSize,
  depthInfluence,
  invertDepth,
  brightness,
  contrast,
  tint,
  colorize,
  animate,
  animSpeed,
  waveAmp,
  jitter,
  use3D,
  depthScale,
  segments,
  audioReactive
}) {
  const meshRef = useRef()
  const matRef = useRef()
  const { size, gl } = useThree()

  const colorTex = useLoader(THREE.TextureLoader, colorURL, (loader) => {
    loader.setCrossOrigin('anonymous')
  })
  const depthTex = useLoader(THREE.TextureLoader, depthURL, (loader) => {
    loader.setCrossOrigin('anonymous')
  })

  useEffect(() => {
    if (colorTex) {
      colorTex.colorSpace = THREE.SRGBColorSpace
      colorTex.wrapS = colorTex.wrapT = THREE.ClampToEdgeWrapping
      colorTex.needsUpdate = true
    }
    if (depthTex) {
      depthTex.colorSpace = THREE.NoColorSpace
      depthTex.wrapS = depthTex.wrapT = THREE.ClampToEdgeWrapping
      depthTex.minFilter = THREE.LinearFilter
      depthTex.magFilter = THREE.LinearFilter
      depthTex.needsUpdate = true
    }
  }, [colorTex, depthTex])

  const resolution = useMemo(() => [size.width, size.height], [size.width, size.height])
  const tintColor = useMemo(() => new THREE.Color(tint), [tint])

  const texelSize = useMemo(() => {
    const w = depthTex?.image?.width || 1024
    const h = depthTex?.image?.height || 1024
    return [1 / w, 1 / h]
  }, [depthTex])

  // Audio controller for reactive effects
  const controllerRef = useRef(
    createMaterialController({
      controls: {
        audioReactive,
        sensitivity: 1.0,
        threshold: 0.05,
        power: 1.2,
        smoothing: 0.2,
        noiseAmpMult: 0,
        depthScaleMult: 0.3,
        hueMult: 0,
        brightnessMult: 0.15,
        contrastMult: 0.1,
        saturationMult: 0,
        mathAmpMult: 0,
        mathFreqSwing: 0,
        mathWarpSwing: 0,
        ambientMult: 0,
        pointLightMult: 0,
        jitterOnBeat: 0.06
      },
      base: {
        noiseAmp: 0,
        depthScale: depthScale,
        hue: 0,
        brightness: brightness,
        contrast: contrast,
        saturation: 1,
        mathAmp: 0,
        mathFreq: 0,
        mathWarp: 0,
        ambient: 0,
        pointIntensity: 0,
        jitter: jitter
      }
    })
  )

  // Subscribe to beat events
  useEffect(() => {
    const unsub = audioBus.subscribe((ev) => controllerRef.current.onBeat(ev))
    return unsub
  }, [])

  // Update base values when props change
  useEffect(() => {
    controllerRef.current.setBase({
      depthScale: depthScale,
      brightness: brightness,
      contrast: contrast,
      jitter: jitter
    })
  }, [depthScale, brightness, contrast, jitter])

  useFrame((state, dt) => {
    if (!matRef.current) return
    
    if (animate) {
      matRef.current.uTime += dt * animSpeed
    }
    
    // Apply audio reactivity
    if (audioReactive) {
      const bus = audioBus.latest
      const dyn = controllerRef.current.update(bus, dt)
      if (dyn) {
        matRef.current.uDepthScale = dyn.depthScale
        matRef.current.uBrightness = dyn.brightness
        matRef.current.uContrast = dyn.contrast
        matRef.current.uJitter = dyn.jitter
      }
    } else {
      matRef.current.uDepthScale = depthScale
      matRef.current.uBrightness = brightness
      matRef.current.uContrast = contrast
      matRef.current.uJitter = jitter
    }
    
    matRef.current.uResolution = resolution
    matRef.current.uWaveAmp = waveAmp
    matRef.current.uColorize = colorize ? 1 : 0
  })

  // Use plane for 2D or displaced geometry for 3D
  const geometry = useMemo(() => {
    if (use3D) {
      return <planeGeometry args={[2, 2, segments, segments]} />
    }
    return <planeGeometry args={[2, 2]} />
  }, [use3D, segments])

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      {geometry}
      <aSCIIMaterial
        ref={matRef}
        uColorMap={colorTex}
        uDepthMap={depthTex}
        uResolution={resolution}
        uTexelSize={texelSize}
        uCellSize={cellSize}
        uDepthInfluence={depthInfluence}
        uInvertDepth={invertDepth ? 1 : 0}
        uBrightness={brightness}
        uContrast={contrast}
        uTint={tintColor}
        uColorize={colorize ? 1 : 0}
        uWaveAmp={waveAmp}
        uJitter={jitter}
        uUse3D={use3D ? 1 : 0}
        uDepthScale={depthScale}
        transparent={false}
      />
    </mesh>
  )
}
