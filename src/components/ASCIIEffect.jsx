import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useLoader, useThree } from '@react-three/fiber'
import '../shaders/ASCIIMaterial.js'

export default function ASCIIEffect({
  colorURL,
  depthURL,
  cellSize = 8,
  depthInfluence = 0.5,
  invertDepth = false,
  brightness = 0.0,
  contrast = 1.0,
  tint = '#ffffff',
  enabled = false
}) {
  const meshRef = useRef()
  const matRef = useRef()
  const { gl, size } = useThree()

  const colorTex = useLoader(THREE.TextureLoader, colorURL || '/placeholder-color.png', (loader) => {
    loader.setCrossOrigin('anonymous')
  })
  const depthTex = useLoader(THREE.TextureLoader, depthURL || '/placeholder-depth.png', (loader) => {
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

  useFrame((state, dt) => {
    if (!matRef.current) return
    matRef.current.uTime += dt
    matRef.current.uResolution = resolution
  })

  if (!enabled) return null

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <aSCIIMaterial
        ref={matRef}
        uColorMap={colorTex}
        uDepthMap={depthTex}
        uResolution={resolution}
        uCellSize={cellSize}
        uDepthInfluence={depthInfluence}
        uInvertDepth={invertDepth ? 1 : 0}
        uBrightness={brightness}
        uContrast={contrast}
        uTint={tintColor}
        transparent={false}
      />
    </mesh>
  )
}
