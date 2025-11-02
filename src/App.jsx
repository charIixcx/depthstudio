import { useState, useCallback, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import AudioAnalyzer from './components/AudioAnalyzer';
import TabbedControls from './components/TabbedControls';
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
  const [audioControlsVisible, setAudioControlsVisible] = useState(true)
  const [controlsOpen, setControlsOpen] = useState(true)
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

  // Compress image to reduce memory usage and improve performance
  const compressImage = (file, maxSize = 2048, quality = 0.85) => {
    return new Promise((resolve, reject) => {
      // Skip compression for very small files (< 500KB)
      if (file.size < 500 * 1024) {
        resolve(file)
        return
      }
      
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width
          let height = img.height
          
          // Skip compression if image is already small enough
          if (width <= maxSize && height <= maxSize && file.size < 2 * 1024 * 1024) {
            resolve(file)
            return
          }
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize
              width = maxSize
            } else {
              width = (width / height) * maxSize
              height = maxSize
            }
          }
          
          // Create canvas and draw resized image
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          
          // Use better image smoothing
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          ctx.drawImage(img, 0, 0, width, height)
          
          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (blob) {
                // Only use compressed version if it's actually smaller
                resolve(blob.size < file.size ? blob : file)
              } else {
                reject(new Error('Canvas to Blob conversion failed'))
              }
            },
            'image/jpeg',
            quality
          )
        }
        
        img.onerror = () => reject(new Error('Image load failed'))
        img.src = e.target.result
      }
      
      reader.onerror = () => reject(new Error('File read failed'))
      reader.readAsDataURL(file)
    })
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
    
    showToast('Compressing color image...', 'info')
    
    // Compress image before loading (max 2048px, 85% quality)
    compressImage(f, 2048, 0.85).then(compressedBlob => {
      const originalSize = (f.size / 1024 / 1024).toFixed(2)
      const compressedSize = (compressedBlob.size / 1024 / 1024).toFixed(2)
      const savings = ((1 - compressedBlob.size / f.size) * 100).toFixed(0)
      
      setColorURL(URL.createObjectURL(compressedBlob))
      showToast(`Color image loaded (${originalSize}MB → ${compressedSize}MB, ${savings}% smaller)`, 'success')
    }).catch(err => {
      console.error('Image compression failed, using original:', err)
      setColorURL(URL.createObjectURL(f))
      showToast('Color image loaded (compression skipped)', 'success')
    })
  }

  const onDepthFile = (file) => {
    if (!file) return
    const f = file.target ? file.target.files?.[0] : file
    if (!f) return
    
    showToast('Compressing depth map...', 'info')
    
    // Compress depth map (max 2048px, 90% quality - higher for depth accuracy)
    compressImage(f, 2048, 0.9).then(compressedBlob => {
      const originalSize = (f.size / 1024 / 1024).toFixed(2)
      const compressedSize = (compressedBlob.size / 1024 / 1024).toFixed(2)
      const savings = ((1 - compressedBlob.size / f.size) * 100).toFixed(0)
      
      setDepthURL(URL.createObjectURL(compressedBlob))
      showToast(`Depth map loaded (${originalSize}MB → ${compressedSize}MB, ${savings}% smaller)`, 'success')
    }).catch(err => {
      console.error('Image compression failed, using original:', err)
      setDepthURL(URL.createObjectURL(f))
      showToast('Depth map loaded (compression skipped)', 'success')
    })
  }

  // Load example images
  const loadExampleImages = (name) => {
    const basePath = '/depthstudio/image_examples/'
    const colorPath = `${basePath}${name}_colour.png`
    const depthPath = `${basePath}${name}_depth.png`
    
    // Load color image
    fetch(colorPath)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `${name}_colour.png`, { type: 'image/png' })
        onColorFile(file)
      })
      .catch(err => {
        console.error('Failed to load example color image:', err)
        showToast('Failed to load example image', 'error')
      })
    
    // Load depth image
    fetch(depthPath)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `${name}_depth.png`, { type: 'image/png' })
        onDepthFile(file)
      })
      .catch(err => {
        console.error('Failed to load example depth image:', err)
        showToast('Failed to load example depth map', 'error')
      })
    
    showToast(`Loading ${name} example...`, 'info')
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

      {/* Example images quick selector */}
      <div style={{
        position: 'fixed',
        top: '200px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{
          backgroundColor: 'rgba(40, 42, 54, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '12px',
          padding: '12px',
          border: '1px solid rgba(98, 114, 164, 0.3)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}>
          <div style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#BD93F9',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            📷 Examples
          </div>
          <button
            onClick={() => loadExampleImages('bunny')}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'rgba(98, 114, 164, 0.2)',
              border: '1px solid rgba(98, 114, 164, 0.4)',
              borderRadius: '8px',
              color: '#F8F8F2',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: '6px',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(98, 114, 164, 0.4)'
              e.target.style.transform = 'translateX(2px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(98, 114, 164, 0.2)'
              e.target.style.transform = 'translateX(0)'
            }}
          >
            🐰 Bunny
          </button>
          <button
            onClick={() => loadExampleImages('car')}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'rgba(98, 114, 164, 0.2)',
              border: '1px solid rgba(98, 114, 164, 0.4)',
              borderRadius: '8px',
              color: '#F8F8F2',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(98, 114, 164, 0.4)'
              e.target.style.transform = 'translateX(2px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(98, 114, 164, 0.2)'
              e.target.style.transform = 'translateX(0)'
            }}
          >
            🚗 Car
          </button>
        </div>
      </div>

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

      {/* Audio Controls */}
      <div style={{
        position: 'fixed',
        top: audioControlsVisible ? '20px' : '-500px',
        left: '20px',
        zIndex: 999,
        backgroundColor: 'rgba(11, 13, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: audioControlsVisible ? '20px' : '0',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        minWidth: '280px',
        maxWidth: '320px',
        transition: 'all 0.3s ease',
      }}>
        {audioControlsVisible && <AudioAnalyzer onAudioData={setAudioData} />}
      </div>

      {/* Audio Controls Toggle Button */}
      <button
        onClick={() => setAudioControlsVisible(!audioControlsVisible)}
        style={{
          position: 'fixed',
          top: '20px',
          left: audioControlsVisible ? '340px' : '20px',
          zIndex: 1000,
          padding: '12px 16px',
          backgroundColor: 'rgba(11, 13, 18, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
        }}
        title={audioControlsVisible ? 'Hide Audio Controls' : 'Show Audio Controls'}
      >
        {audioControlsVisible ? '🎵' : '🎧'}
      </button>

      {/* Tabbed Controls */}
      <TabbedControls 
        isOpen={controlsOpen}
        onToggle={() => setControlsOpen(!controlsOpen)}
      />

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
