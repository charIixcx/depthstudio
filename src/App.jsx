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

      {/* Modern example images quick selector */}
      <div style={{
        position: 'fixed',
        top: 'var(--space-lg)',
        left: 'var(--space-lg)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(26, 29, 38, 0.85) 0%, rgba(18, 20, 26, 0.85) 100%)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        }}>
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: '700',
            color: 'var(--accent-purple)',
            marginBottom: 'var(--space-sm)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-xs)',
          }}>
            <span style={{ fontSize: '1rem' }}>📷</span>
            Examples
          </div>
          <button
            onClick={() => loadExampleImages('bunny')}
            style={{
              width: '100%',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              marginBottom: 'var(--space-xs)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)'
              e.target.style.transform = 'translateX(3px)'
              e.target.style.borderColor = 'var(--accent-primary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
              e.target.style.transform = 'translateX(0)'
              e.target.style.borderColor = 'var(--border-default)'
            }}
          >
            <span style={{ fontSize: '1.125rem' }}>🐰</span>
            <span>Bunny</span>
          </button>
          <button
            onClick={() => loadExampleImages('car')}
            style={{
              width: '100%',
              padding: 'var(--space-sm) var(--space-md)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.8125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)'
              e.target.style.transform = 'translateX(3px)'
              e.target.style.borderColor = 'var(--accent-primary)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)'
              e.target.style.transform = 'translateX(0)'
              e.target.style.borderColor = 'var(--border-default)'
            }}
          >
            <span style={{ fontSize: '1.125rem' }}>🚗</span>
            <span>Car</span>
          </button>
        </div>
      </div>

      {/* Modern preset manager panel */}
      {showPresets && (
        <div style={{
          position: 'fixed',
          top: '50%',
          right: 'var(--space-lg)',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(135deg, rgba(26, 29, 38, 0.95) 0%, rgba(18, 20, 26, 0.95) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-xl)',
          maxWidth: '360px',
          width: 'calc(100vw - 3rem)',
          maxHeight: '85vh',
          overflowY: 'auto',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-2xl), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          zIndex: 1001,
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: 'var(--space-lg)',
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: '1.5rem',
              fontWeight: '700',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-sm)',
            }}>
              <span>💾</span>
              Presets
            </h3>
            <button
              onClick={() => setShowPresets(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '1.25rem',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0,
                transition: 'all var(--transition-base)',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                e.target.style.color = 'var(--accent-danger)'
                e.target.style.borderColor = 'var(--accent-danger)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.08)'
                e.target.style.color = 'var(--text-secondary)'
                e.target.style.borderColor = 'var(--border-default)'
              }}
            >
              ×
            </button>
          </div>
          
          <button
            onClick={savePreset}
            style={{
              width: '100%',
              padding: 'var(--space-md)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)',
              border: '1px solid var(--accent-success)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--accent-success)',
              fontSize: '0.9375rem',
              fontWeight: '700',
              cursor: 'pointer',
              marginBottom: 'var(--space-lg)',
              transition: 'all var(--transition-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-sm)',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.25) 100%)'
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 16px rgba(16, 185, 129, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.15) 100%)'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = 'none'
            }}
          >
            <span style={{ fontSize: '1.125rem' }}>➕</span>
            Save Current Settings
          </button>

          <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
            {presets.length === 0 ? (
              <p style={{ 
                color: 'var(--text-tertiary)', 
                fontSize: '0.875rem', 
                textAlign: 'center',
                margin: 'var(--space-xl) 0',
                lineHeight: '1.6',
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

      {/* Modern action buttons */}
      <div style={{
        position: 'fixed',
        bottom: 'var(--space-lg)',
        right: 'var(--space-lg)',
        display: 'flex',
        gap: 'var(--space-md)',
        zIndex: 1000,
        flexWrap: 'wrap',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={() => setShowPresets(prev => !prev)}
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            background: 'linear-gradient(135deg, rgba(26, 29, 38, 0.85) 0%, rgba(18, 20, 26, 0.85) 100%)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: '700',
            cursor: 'pointer',
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            transition: 'all var(--transition-base)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px)'
            e.target.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            e.target.style.borderColor = 'var(--accent-primary)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            e.target.style.borderColor = 'var(--border-default)'
          }}
        >
          <span style={{ fontSize: '1.125rem' }}>💾</span>
          Presets
        </button>
        
        <button
          onClick={exportScreenshot}
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            background: 'linear-gradient(135deg, rgba(26, 29, 38, 0.85) 0%, rgba(18, 20, 26, 0.85) 100%)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: '700',
            cursor: 'pointer',
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            transition: 'all var(--transition-base)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px)'
            e.target.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            e.target.style.borderColor = 'var(--accent-primary)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            e.target.style.borderColor = 'var(--border-default)'
          }}
        >
          <span style={{ fontSize: '1.125rem' }}>📸</span>
          Export
        </button>
        
        <button
          onClick={() => setShowHelp(true)}
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            background: 'linear-gradient(135deg, rgba(26, 29, 38, 0.85) 0%, rgba(18, 20, 26, 0.85) 100%)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            fontWeight: '700',
            cursor: 'pointer',
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            transition: 'all var(--transition-base)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px)'
            e.target.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            e.target.style.borderColor = 'var(--accent-primary)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.boxShadow = 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            e.target.style.borderColor = 'var(--border-default)'
          }}
        >
          <span style={{ fontSize: '1.125rem' }}>❓</span>
          Help
        </button>
        
        <button
          onClick={() => {
            try {
              localStorage.removeItem('leva')
              window.location.reload()
            } catch {}
          }}
          style={{
            padding: 'var(--space-md) var(--space-lg)',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
            border: '1px solid var(--accent-danger)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--accent-danger)',
            fontSize: '0.875rem',
            fontWeight: '700',
            cursor: 'pointer',
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            boxShadow: 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            transition: 'all var(--transition-base)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-3px)'
            e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.25) 0%, rgba(220, 38, 38, 0.25) 100%)'
            e.target.style.boxShadow = '0 8px 24px rgba(239, 68, 68, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)'
            e.target.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)'
            e.target.style.boxShadow = 'var(--shadow-lg), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
          }}
        >
          <span style={{ fontSize: '1.125rem' }}>🔄</span>
          Reset
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
