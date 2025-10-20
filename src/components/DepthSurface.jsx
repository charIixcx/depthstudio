import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import { useControls } from 'leva'
import '../shaders/DepthDisplaceMaterial.js'

export default function DepthSurface({ colorURL, depthURL, wowMode }) {
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

  const depth = useControls('Depth', {
    useDepth: { value: true },
    invertDepth: { value: false },
    depthScale: { value: 0.25, min: -1, max: 1, step: 0.001 },
    depthBias: { value: 0.5, min: 0, max: 1, step: 0.001 },
    normalStrength: { value: 6.0, min: 0, max: 20, step: 0.1 }
  })
  const lighting = useControls('Lighting', {
    ambient: { value: 0.22, min: 0, max: 1, step: 0.01 },
    directionalColor: '#ffffff',
    directionalIntensity: { value: 1.2, min: 0, max: 4, step: 0.01 },
    directionalDir: { x: -0.7, y: 0.9, z: 0.3 },
    pointColor: '#a4b2ff',
    pointIntensity: { value: 0.8, min: 0, max: 8, step: 0.01 },
    pointPos: { x: 0.7, y: 0.6, z: 0.8 },
    specular: { value: 0.55, min: 0, max: 1, step: 0.01 },
    shininess: { value: 32, min: 1, max: 128, step: 1 }
  })
  const colorFx = useControls('Color', {
    brightness: { value: 0.0, min: -1, max: 1, step: 0.001 },
    contrast: { value: 1.0, min: 0, max: 2, step: 0.001 },
    saturation: { value: 1.0, min: 0, max: 2, step: 0.001 },
    hue: { value: 0.0, min: -Math.PI, max: Math.PI, step: 0.001 },
    tint: '#ffffff'
  })
  const anim = useControls('Animation', {
    noiseAmp: { value: 0.025, min: 0, max: 0.25, step: 0.001 },
    noiseFreq: { value: 6.0, min: 0, max: 20, step: 0.01 },
    noiseSpeed: { value: 0.2, min: 0, max: 2, step: 0.01 },
    jitter: { value: 0.02, min: 0, max: 0.2, step: 0.001 }
  })
  const mathEdit = useControls('Math Edit', {
    mode: { options: { None: 0, Ripples: 1, Stripes: 2, Swirl: 3 }, value: 1 },
    mathAmp: { value: 0.05, min: 0, max: 0.5, step: 0.001 },
    mathFreq: { value: 6.0, min: 0, max: 40, step: 0.1 }
  })

  useFrame((state, dt) => {
    if (!matRef.current) return
    matRef.current.uTime += dt

    if (wowMode) {
      const t = state.clock.elapsedTime
      matRef.current.uNoiseAmp = 0.02 + Math.sin(t * 0.8) * 0.01
      matRef.current.uHue = Math.sin(t * 0.25) * 0.3
      matRef.current.uBrightness = Math.sin(t * 0.5) * 0.06
    }
  })

  return (
    <mesh ref={meshRef}>
      <PlaneGeometry colorTex={colorTex} />
      <depthDisplaceMaterial
        ref={matRef}
        key={`${colorURL || 'color'}-${depthURL || 'depth'}`}
        uColorMap={colorTex}
        uDepthMap={depthTex}
        uTexelSize={texelSize}
        uUseDepth={depth.useDepth ? 1 : 0}
        uInvertDepth={depth.invertDepth ? 1 : 0}
        uDepthScale={depth.depthScale}
        uDepthBias={depth.depthBias}
        uNormalStrength={depth.normalStrength}
        uAmbient={lighting.ambient}
        uLightDir={[lighting.directionalDir.x, lighting.directionalDir.y, lighting.directionalDir.z]}
        uLightColor={new THREE.Color(lighting.directionalColor)}
        uLightIntensity={lighting.directionalIntensity}
        uPointLightPos={[lighting.pointPos.x, lighting.pointPos.y, lighting.pointPos.z]}
        uPointLightColor={new THREE.Color(lighting.pointColor)}
        uPointLightIntensity={lighting.pointIntensity}
        uSpecular={lighting.specular}
        uShininess={lighting.shininess}
        uBrightness={colorFx.brightness}
        uContrast={colorFx.contrast}
        uSaturation={colorFx.saturation}
        uHue={colorFx.hue}
        uTint={new THREE.Color(colorFx.tint)}
        uNoiseAmp={anim.noiseAmp}
        uNoiseFreq={anim.noiseFreq}
        uNoiseSpeed={anim.noiseSpeed}
        uJitter={anim.jitter}
        uMathMode={mathEdit.mode}
        uMathAmp={mathEdit.mathAmp}
        uMathFreq={mathEdit.mathFreq}
      />
    </mesh>
  )
}

function PlaneGeometry({ colorTex }) {
  const geomRef = useRef()
  const width = useMemo(() => {
    const w = colorTex?.image?.width || 1
    const h = colorTex?.image?.height || 1
    return h ? w / h : 1
  }, [colorTex])

  return <planeGeometry ref={geomRef} args={[width, 1, 256, 256]} />
}
