import React, { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Environment, Stats } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette, Glitch, Noise, DepthOfField } from '@react-three/postprocessing'
import { BlendFunction, GlitchMode } from 'postprocessing'
import { useControls } from 'leva'
import DepthSurface from './DepthSurface.jsx'

function Rig({ children, parallax = 0.15, orbit = true }) {
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
      camera.position.z = Math.sin(s) * r
      camera.position.y = 0.7 + Math.sin(s * 0.8) * 0.15
      camera.lookAt(0, 0, 0)
    }
  })

  return <group ref={group}>{children}</group>
}

export default function Scene({ colorURL, depthURL }) {
  const { bloom, chroma, vignette, glitch, filmGrain, dof, wowMode, stats } = useControls('Effects', {
    bloom: { value: 0.9, min: 0, max: 2, step: 0.01 },
    chroma: { value: 0.006, min: 0, max: 0.02, step: 0.001 },
    vignette: { value: 0.45, min: 0, max: 1, step: 0.01 },
    glitch: { value: 0.0, min: 0, max: 1, step: 0.01 },
    filmGrain: { value: 0.15, min: 0, max: 1, step: 0.01 },
    dof: { value: 0.0, min: 0, max: 1, step: 0.01 },
    wowMode: false,
    stats: false
  })

  const { background, envIntensity, orbit } = useControls('Scene', {
    background: '#0b0d12',
    envIntensity: { value: 0.35, min: 0, max: 2, step: 0.01 },
    orbit: true
  })

  const chromaOffset = useMemo(() => [chroma, 0], [chroma])

  return (
    <Canvas
      camera={{ position: [0, 0.9, 2.7], fov: 45 }}
      gl={{ antialias: true }}
      dpr={[1, 2]}
      onCreated={({ gl }) => {
        gl.setClearColor(background)
      }}
    >
      {stats && <Stats showPanel={0} />}
      <color attach="background" args={[background]} />

      <ambientLight intensity={0.1} />

      <Suspense fallback={null}>
        <Environment preset="studio" environmentIntensity={envIntensity} />

        <Rig orbit={orbit}>
          <DepthSurface colorURL={colorURL} depthURL={depthURL} wowMode={wowMode} />
        </Rig>
      </Suspense>

      <OrbitControls enabled={!orbit} enableDamping dampingFactor={0.1} />

      <EffectComposer multisampling={0}>
        {bloom > 0 && (
          <Bloom mipmapBlur intensity={bloom} luminanceThreshold={0.15} luminanceSmoothing={0.25} />
        )}
        {chroma > 0 && (
          <ChromaticAberration offset={chromaOffset} radialModulation modulationOffset={0.2} />
        )}
        {vignette > 0 && <Vignette eskil={false} darkness={vignette} offset={0.5} />}
        {glitch > 0 && (
          <Glitch
            delay={[0.5, 1.0]}
            duration={[0.1, 0.35]}
            strength={[0.15 * glitch, 0.5 * glitch]}
            mode={GlitchMode.SPORADIC}
            columns={0.12}
            active
          />
        )}
        {filmGrain > 0 && <Noise premultiply blendFunction={BlendFunction.ADD} opacity={filmGrain} />}
        {dof > 0 && <DepthOfField focusDistance={0.01} focalLength={0.02 + dof * 0.05} bokehScale={2 + dof * 8} />}
      </EffectComposer>
    </Canvas>
  )
}
