import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import Scene from './components/Scene';
import AudioAnalyzer from './components/AudioAnalyzer';
import './App.css';
import {
  AnimatedDropZone,
  AnimatedHelpOverlay,
  AnimatedPresetCard,
  AnimatedAudioMeter,
  AnimatedToast,
  AnimatedLoader,
  QuickActionsMenu,
  RecordingIndicator,
  FPSCounter,
} from './components/AnimatedUI';
import { generateRandomPreset, CAMERA_PRESETS, COLOR_PRESETS } from './lib/presets';
import { copySettingsURL, getSettingsFromURL, decodeSettings } from './lib/urlParams';
import { levaStore } from 'leva';

export default function App() {
  const [colorURL, setColorURL] = useState(null)
  const [depthURL, setDepthURL] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false })
  const [presets, setPresets] = useState([])
  const [showPresets, setShowPresets] = useState(false)
  const [audioData, setAudioData] = useState(null)
  const [cameraMode, setCameraMode] = useState('orbit')
  const [fps, setFps] = useState(60)
  const [isRecording, setIsRecording] = useState(false)
  const [recordDuration, setRecordDuration] = useState(0)
  const colorRef = useRef(null)
  const depthRef = useRef(null)
  const sceneRef = useRef(null)

  // Reset Leva state to defaults on first load
  useEffect(() => {
    try {
      const flagKey = 'ds-initialized'
      if (!localStorage.getItem(flagKey)) {
        // Leva persists control values in localStorage under the 'leva' key
        localStorage.removeItem('leva')
        localStorage.setItem(flagKey, '1')
      }
      // Load saved presets
      const savedPresets = localStorage.getItem('ds-presets')
      if (savedPresets) {
        setPresets(JSON.parse(savedPresets))
      }
    } catch {}
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if typing in input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      switch(e.key.toLowerCase()) {
        case 'h':
          setShowHelp(prev => !prev)
          break
        case 'escape':
          setShowHelp(false)
          setShowPresets(false)
          break
        case 'f':
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            showToast('Entered fullscreen', 'info')
          } else {
            document.exitFullscreen()
            showToast('Exited fullscreen', 'info')
          }
          break
        case 's':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            savePreset()
          } else {
            setShowPresets(prev => !prev)
          }
          break
        case 'e':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            exportScreenshot()
          }
          break
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          const mode = parseInt(e.key) - 1
          // This would need to be connected to Leva controls
          showToast(`Switched to shader mode ${e.key}`, 'info')
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  const showToast = (message, type = 'info') => {
    setToast({ message, type, visible: true })
  }

  const savePreset = () => {
    try {
      const levaState = localStorage.getItem('leva')
      if (!levaState) {
        showToast('No settings to save', 'warning')
        return
      }

      const presetName = prompt('Enter preset name:')
      if (!presetName) return

      const newPreset = {
        id: Date.now(),
        name: presetName,
        timestamp: Date.now(),
        settings: levaState,
      }

      const updatedPresets = [...presets, newPreset]
      setPresets(updatedPresets)
      localStorage.setItem('ds-presets', JSON.stringify(updatedPresets))
      showToast(`Preset "${presetName}" saved!`, 'success')
    } catch (err) {
      showToast('Failed to save preset', 'error')
    }
  }

  const loadPreset = (preset) => {
    try {
      localStorage.setItem('leva', preset.settings)
      window.location.reload()
      showToast(`Loading preset "${preset.name}"`, 'info')
    } catch (err) {
      showToast('Failed to load preset', 'error')
    }
  }

  const deletePreset = (presetId) => {
    const updatedPresets = presets.filter(p => p.id !== presetId)
    setPresets(updatedPresets)
    localStorage.setItem('ds-presets', JSON.stringify(updatedPresets))
    showToast('Preset deleted', 'info')
  }

  const exportScreenshot = () => {
    try {
      const canvas = document.querySelector('canvas')
      if (!canvas) {
        showToast('No canvas found', 'error')
        return
      }

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `depth-studio-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
        showToast('Screenshot saved!', 'success')
      })
    } catch (err) {
      showToast('Failed to export screenshot', 'error')
    }
  }

  const handleRandomize = () => {
    try {
      const randomSettings = generateRandomPreset()
      const store = levaStore.getVisiblePaths()
      
      // Apply random settings to Leva
      Object.entries(randomSettings).forEach(([key, value]) => {
        try {
          levaStore.setValueAtPath(key, value, false)
        } catch {}
      })
      
      showToast('Settings randomized! 🎲', 'success')
    } catch (err) {
      showToast('Failed to randomize', 'error')
    }
  }

  const handleShareURL = async () => {
    try {
      const url = await copySettingsURL()
      showToast('Share URL copied to clipboard! 🔗', 'success')
    } catch (err) {
      showToast('Failed to copy URL', 'error')
    }
  }

  const handleCameraPreset = (mode) => {
    setCameraMode(mode)
    const preset = CAMERA_PRESETS[mode]
    if (preset) {
      showToast(`Camera: ${preset.name} 📹`, 'info')
    }
  }

  const handleColorPreset = (preset) => {
    try {
      const colors = COLOR_PRESETS[preset]
      if (!colors) return
      
      levaStore.setValueAtPath('hue', colors.hue, false)
      levaStore.setValueAtPath('brightness', colors.brightness, false)
      levaStore.setValueAtPath('contrast', colors.contrast, false)
      levaStore.setValueAtPath('saturation', colors.saturation, false)
      
      showToast(`Color: ${preset} 🎨`, 'success')
    } catch (err) {
      showToast('Failed to apply color preset', 'error')
    }
  }

  // Load settings from URL on mount
  useEffect(() => {
    try {
      const urlSettings = getSettingsFromURL()
      if (urlSettings) {
        const decoded = decodeSettings(urlSettings)
        if (decoded) {
          showToast('Loaded settings from URL', 'success')
        }
      }
    } catch {}
  }, [])

  // FPS counter
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()
    
    const countFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round(frameCount * 1000 / (currentTime - lastTime)))
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(countFPS)
    }
    
    const rafId = requestAnimationFrame(countFPS)
    return () => cancelAnimationFrame(rafId)
  }, [])

  useEffect(() => {
    const url = colorURL
    return () => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }, [colorURL])

  useEffect(() => {
    const url = depthURL
    return () => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
    }
  }, [depthURL])

  const onColorFile = (file) => {
    if (!file) return
    // If called from event, extract file
    const f = file.target ? file.target.files?.[0] : file
    if (!f) return
    setColorURL(URL.createObjectURL(f))
    showToast('Color image loaded', 'success')
  }

  const onDepthFile = (file) => {
    if (!file) return
    const f = file.target ? file.target.files?.[0] : file
    if (!f) return
    setDepthURL(URL.createObjectURL(f))
    showToast('Depth map loaded', 'success')
  }

  return (
    <>
      {/* Animated toast notifications */}
      <AnimatedToast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast(prev => ({ ...prev, visible: false }))}
      />

      {/* Quick actions menu */}
      <QuickActionsMenu
        onCameraPreset={handleCameraPreset}
        onColorPreset={handleColorPreset}
        onRandomize={handleRandomize}
        onShare={handleShareURL}
      />

      {/* FPS Counter */}
      <FPSCounter fps={fps} />

      {/* Recording indicator */}
      <RecordingIndicator isRecording={isRecording} duration={recordDuration} />

      {/* Animated help overlay */}
      <AnimatedHelpOverlay
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />

      {/* Animated audio meter */}
      <AnimatedAudioMeter audioData={audioData} />

      {/* Animated file upload zones */}
      <AnimatedDropZone
        onFileSelect={onColorFile}
        hasFile={!!colorURL}
        label="Drop color image"
        top="20px"
        left="20px"
        inputId="color-file-input"
      />
      <AnimatedDropZone
        onFileSelect={onDepthFile}
        hasFile={!!depthURL}
        label="Drop depth map"
        top="110px"
        left="20px"
        inputId="depth-file-input"
      />

      {/* Preset manager panel */}
      {showPresets && (
        <div style={{
          position: 'fixed',
          top: '50%',
          right: '20px',
          transform: 'translateY(-50%)',
          backgroundColor: 'rgba(40, 42, 54, 0.95)',
          borderRadius: '20px',
          padding: '24px',
          maxWidth: '320px',
          maxHeight: '80vh',
          overflowY: 'auto',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(98, 114, 164, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          zIndex: 1001,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '20px',
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '20px',
              fontWeight: '700',
              color: '#F8F8F2',
            }}>
              Presets
            </h3>
            <button
              onClick={() => setShowPresets(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#6272A4',
                fontSize: '24px',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
          
          <button
            onClick={savePreset}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'rgba(80, 250, 123, 0.2)',
              border: '1px solid rgba(80, 250, 123, 0.4)',
              borderRadius: '12px',
              color: '#50FA7B',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
          >
            + Save Current Settings
          </button>

          <div style={{ display: 'grid', gap: '12px' }}>
            {presets.length === 0 ? (
              <p style={{ 
                color: '#6272A4', 
                fontSize: '14px', 
                textAlign: 'center',
                margin: '20px 0',
              }}>
                No saved presets
              </p>
            ) : (
              presets.map((preset, index) => (
                <AnimatedPresetCard
                  key={preset.id}
                  preset={preset}
                  index={index}
                  onLoad={loadPreset}
                  onDelete={deletePreset}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 1000,
      }}>
        <button
          onClick={() => setShowPresets(prev => !prev)}
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(40, 42, 54, 0.85)',
            border: '1px solid rgba(98, 114, 164, 0.3)',
            borderRadius: '12px',
            color: '#F8F8F2',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          💾 Presets
        </button>
        
        <button
          onClick={exportScreenshot}
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(40, 42, 54, 0.85)',
            border: '1px solid rgba(98, 114, 164, 0.3)',
            borderRadius: '12px',
            color: '#F8F8F2',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          📸 Export
        </button>
        
        <button
          onClick={() => setShowHelp(true)}
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(40, 42, 54, 0.85)',
            border: '1px solid rgba(98, 114, 164, 0.3)',
            borderRadius: '12px',
            color: '#F8F8F2',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          ❓ Help
        </button>
        
        <button
          onClick={() => {
            try {
              localStorage.removeItem('leva')
              window.location.reload()
            } catch {}
          }}
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(255, 85, 85, 0.2)',
            border: '1px solid rgba(255, 85, 85, 0.4)',
            borderRadius: '12px',
            color: '#FF5555',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          }}
        >
          🔄 Reset
        </button>
      </div>

      {/* Old UI (hidden but keeping AudioAnalyzer) */}
      <div style={{ display: 'none' }}>
        <AudioAnalyzer onAudioData={setAudioData} />
      </div>

      <Scene 
        ref={sceneRef}
        colorURL={colorURL} 
        depthURL={depthURL}
        onAudioData={setAudioData}
        cameraMode={cameraMode}
      />
    </>
  )
}
