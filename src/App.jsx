import React, { useState, useRef, useEffect } from 'react'
import Scene from './components/Scene.jsx'
import AudioAnalyzer from './components/AudioAnalyzer.jsx'

export default function App() {
  const [colorURL, setColorURL] = useState(null)
  const [depthURL, setDepthURL] = useState(null)
  const colorRef = useRef(null)
  const depthRef = useRef(null)

  // Reset Leva state to defaults on first load
  useEffect(() => {
    try {
      const flagKey = 'ds-initialized'
      if (!localStorage.getItem(flagKey)) {
        // Leva persists control values in localStorage under the 'leva' key
        localStorage.removeItem('leva')
        localStorage.setItem(flagKey, '1')
      }
    } catch {}
  }, [])

  useEffect(() => {
    return () => {
      if (colorURL?.startsWith('blob:')) URL.revokeObjectURL(colorURL)
      if (depthURL?.startsWith('blob:')) URL.revokeObjectURL(depthURL)
    }
  }, [colorURL, depthURL])

  const onColorFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (colorURL?.startsWith('blob:')) URL.revokeObjectURL(colorURL)
    setColorURL(URL.createObjectURL(f))
  }

  const onDepthFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (depthURL?.startsWith('blob:')) URL.revokeObjectURL(depthURL)
    setDepthURL(URL.createObjectURL(f))
  }

  return (
    <>
      <div className="ui">
        <span className="badge">2.5D Depth Studio</span>
        <label>
          <input ref={colorRef} type="file" accept="image/*" onChange={onColorFile} />
        </label>
        <label>
          <input ref={depthRef} type="file" accept="image/*" onChange={onDepthFile} />
        </label>
        <button
          className="badge"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            try {
              localStorage.removeItem('leva')
              // Reload to ensure all defaults rehydrate
              window.location.reload()
            } catch {}
          }}
        >Reset Defaults</button>
        <div style={{ marginLeft: 12 }}>
          <AudioAnalyzer />
        </div>
      </div>
      <Scene colorURL={colorURL} depthURL={depthURL} />
      <div className="hint">
        Tip: upload a color image and its matching grayscale depth map. Toggle "Wow mode" in the Effects panel.
      </div>
    </>
  )
}
