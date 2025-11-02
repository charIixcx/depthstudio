import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// Animated container for the Leva panel with slide-in effect
export const AnimatedPanel = ({ children }) => {
  return (
    <motion.div
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

// Animated file upload zone with modern glassmorphism
export const AnimatedDropZone = ({ onFileSelect, hasFile, label = 'Drop or click to upload', top = '20px', left = '20px', inputId = 'file-input' }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onFileSelect(file);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 100 }}
      style={{
        position: 'fixed',
        top,
        left,
        zIndex: 1000,
      }}
    >
      <motion.label
        htmlFor={inputId}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        animate={{
          backgroundColor: isDragging 
            ? 'rgba(99, 102, 241, 0.15)' 
            : hasFile 
            ? 'rgba(16, 185, 129, 0.15)' 
            : 'rgba(26, 29, 38, 0.7)',
          borderColor: isDragging 
            ? 'rgba(99, 102, 241, 0.5)' 
            : hasFile 
            ? 'rgba(16, 185, 129, 0.5)' 
            : 'rgba(241, 243, 249, 0.12)',
          boxShadow: isDragging
            ? '0 8px 32px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : hasFile
            ? '0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
        style={{
          display: 'block',
          padding: '1.25rem 1.875rem',
          borderRadius: '1rem',
          border: '2px dashed',
          cursor: 'pointer',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          color: 'var(--text-primary)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif',
          fontSize: '0.875rem',
          fontWeight: '600',
          userSelect: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ 
            rotate: isDragging ? [0, -3, 3, -3, 0] : 0,
            scale: isDragging ? 1.05 : 1
          }}
          transition={{ duration: 0.3 }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative', zIndex: 1 }}
        >
          <motion.span 
            style={{ fontSize: '1.5rem' }}
            animate={{ 
              rotate: isDragging ? 360 : 0,
              scale: hasFile ? [1, 1.2, 1] : 1
            }}
            transition={{ duration: 0.5 }}
          >
            {hasFile ? '✅' : isDragging ? '📥' : '📁'}
          </motion.span>
          <span style={{ letterSpacing: '0.01em' }}>
            {isDragging 
              ? 'Drop image here' 
              : hasFile 
              ? 'Image loaded - Change?' 
              : label}
          </span>
        </motion.div>
        
        {/* Gradient overlay on hover */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)',
            opacity: 0,
            pointerEvents: 'none'
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        <input
          id={inputId}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </motion.label>
    </motion.div>
  );
};

// Animated help overlay with keyboard shortcuts
export const AnimatedHelpOverlay = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'Space', action: 'Toggle audio playback' },
    { key: 'F', action: 'Toggle fullscreen' },
    { key: 'R', action: 'Reset camera position' },
    { key: 'H', action: 'Toggle this help menu' },
    { key: 'S', action: 'Save current preset' },
    { key: 'E', action: 'Export screenshot' },
    { key: '1-9', action: 'Quick switch shader modes' },
    { key: '←→', action: 'Adjust effect intensity' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              zIndex: 9998,
            }}
          />

          {/* Help panel */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(40, 42, 54, 0.95)',
              borderRadius: '24px',
              padding: '40px',
              maxWidth: '600px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(98, 114, 164, 0.3)',
              backdropFilter: 'blur(20px)',
              zIndex: 9999,
              color: '#F8F8F2',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h2 style={{ 
                margin: '0 0 10px 0', 
                fontSize: '28px', 
                fontWeight: '700',
                background: 'linear-gradient(135deg, #64C8FF, #FF79C6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                2.5D Depth Studio
              </h2>
              <p style={{ 
                margin: '0 0 30px 0', 
                color: '#6272A4', 
                fontSize: '14px',
              }}>
                Interactive audio-reactive depth visualization
              </p>
            </motion.div>

            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '15px',
                color: '#BD93F9',
              }}>
                Keyboard Shortcuts
              </h3>
              <div style={{ display: 'grid', gap: '12px' }}>
                {shortcuts.map((shortcut, index) => (
                  <motion.div
                    key={shortcut.key}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                    }}
                  >
                    <kbd style={{
                      backgroundColor: 'rgba(98, 114, 164, 0.2)',
                      border: '1px solid rgba(98, 114, 164, 0.4)',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: '600',
                      minWidth: '70px',
                      textAlign: 'center',
                      color: '#8BE9FD',
                      fontFamily: 'monospace',
                    }}>
                      {shortcut.key}
                    </kbd>
                    <span style={{ 
                      fontSize: '14px', 
                      color: '#F8F8F2',
                    }}>
                      {shortcut.action}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.button
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(98, 114, 164, 0.3)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              style={{
                marginTop: '30px',
                width: '100%',
                padding: '14px',
                backgroundColor: 'rgba(98, 114, 164, 0.2)',
                border: '1px solid rgba(98, 114, 164, 0.4)',
                borderRadius: '12px',
                color: '#F8F8F2',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Close (ESC)
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Animated preset card component
export const AnimatedPresetCard = ({ preset, onLoad, onDelete, index }) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ 
        delay: index * 0.05,
        type: 'spring',
        damping: 20,
        stiffness: 300,
      }}
      whileHover={{ scale: 1.05, y: -5 }}
      onHoverStart={() => setIsHovering(true)}
      onHoverEnd={() => setIsHovering(false)}
      style={{
        backgroundColor: 'rgba(68, 71, 90, 0.6)',
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        border: '1px solid rgba(98, 114, 164, 0.3)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <motion.div
        animate={{ opacity: isHovering ? 0.1 : 0 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #64C8FF, #FF79C6)',
        }}
      />
      
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div onClick={() => onLoad(preset)}>
          <h4 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '16px',
            color: '#F8F8F2',
            fontWeight: '600',
          }}>
            {preset.name}
          </h4>
          <p style={{ 
            margin: 0, 
            fontSize: '12px',
            color: '#6272A4',
          }}>
            {new Date(preset.timestamp).toLocaleDateString()}
          </p>
        </div>
        
        <AnimatePresence>
          {isHovering && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 85, 85, 0.3)' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(preset.id);
              }}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 85, 85, 0.2)',
                border: '1px solid rgba(255, 85, 85, 0.4)',
                color: '#FF5555',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              ×
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Animated audio level meter
export const AnimatedAudioMeter = ({ audioData }) => {
  const bands = [
    { label: 'SUB', value: audioData?.subBass || 0, color: '#FF79C6' },
    { label: 'BASS', value: audioData?.bass || 0, color: '#BD93F9' },
    { label: 'MID', value: audioData?.mid || 0, color: '#8BE9FD' },
    { label: 'TREBLE', value: audioData?.treble || 0, color: '#50FA7B' },
  ];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(40, 42, 54, 0.85)',
        borderRadius: '16px',
        padding: '16px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(98, 114, 164, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
      }}
    >
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        alignItems: 'flex-end',
        height: '80px',
      }}>
        {bands.map((band, index) => (
          <div key={band.label} style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: '8px',
          }}>
            <motion.div
              style={{
                width: '32px',
                height: '100%',
                backgroundColor: 'rgba(68, 71, 90, 0.5)',
                borderRadius: '8px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <motion.div
                animate={{ 
                  height: `${band.value * 100}%`,
                  opacity: band.value > 0.1 ? 1 : 0.3,
                }}
                transition={{ 
                  type: 'spring',
                  damping: 10,
                  stiffness: 100,
                  mass: 0.5,
                }}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: band.color,
                  borderRadius: '8px',
                  boxShadow: band.value > 0.5 ? `0 0 20px ${band.color}` : 'none',
                }}
              />
            </motion.div>
            <span style={{ 
              fontSize: '10px', 
              color: '#6272A4',
              fontWeight: '600',
              fontFamily: 'monospace',
            }}>
              {band.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Loading indicator
export const AnimatedLoader = ({ text = 'Loading...' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 10000,
        gap: '20px',
      }}
    >
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
          scale: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
        }}
        style={{
          width: '60px',
          height: '60px',
          border: '4px solid rgba(98, 114, 164, 0.3)',
          borderTopColor: '#64C8FF',
          borderRadius: '50%',
        }}
      />
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          color: '#F8F8F2',
          fontSize: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {text}
      </motion.p>
    </motion.div>
  );
};

// Modern toast notification with glassmorphism
export const AnimatedToast = ({ message, type = 'info', isVisible, onClose }) => {
  const colors = {
    success: { 
      bg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)', 
      text: '#ffffff',
      border: 'rgba(16, 185, 129, 0.5)',
      icon: '✅'
    },
    error: { 
      bg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)', 
      text: '#ffffff',
      border: 'rgba(239, 68, 68, 0.5)',
      icon: '❌'
    },
    info: { 
      bg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)', 
      text: '#ffffff',
      border: 'rgba(59, 130, 246, 0.5)',
      icon: 'ℹ️'
    },
    warning: { 
      bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9) 0%, rgba(217, 119, 6, 0.9) 100%)', 
      text: '#ffffff',
      border: 'rgba(245, 158, 11, 0.5)',
      icon: '⚠️'
    },
  };

  const style = colors[type] || colors.info;

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -100, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: 'var(--space-lg)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: style.bg,
            color: style.text,
            padding: '1rem 1.5rem',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
            border: `1px solid ${style.border}`,
            backdropFilter: 'blur(12px) saturate(180%)',
            WebkitBackdropFilter: 'blur(12px) saturate(180%)',
            zIndex: 10001,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif',
            fontSize: '0.875rem',
            fontWeight: '600',
            maxWidth: '500px',
            minWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            overflow: 'hidden',
          }}
        >
          {/* Background shine effect */}
          <motion.div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
              pointerEvents: 'none',
            }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
          />
          
          <motion.span
            style={{ fontSize: '1.25rem', flexShrink: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
          >
            {style.icon}
          </motion.span>
          
          <span style={{ flex: 1, letterSpacing: '0.01em' }}>{message}</span>
          
          <motion.button
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'inherit',
              fontSize: '1.125rem',
              cursor: 'pointer',
              padding: 0,
              flexShrink: 0,
              transition: 'all 0.2s ease',
            }}
          >
            ×
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Quick actions menu
export const QuickActionsMenu = ({ onCameraPreset, onColorPreset, onRandomize, onShare }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1002,
      }}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(139, 233, 253, 0.2)',
          border: '2px solid rgba(139, 233, 253, 0.4)',
          color: '#8BE9FD',
          fontSize: '24px',
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isOpen ? '×' : '⚡'}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '66px',
              right: '0',
              backgroundColor: 'rgba(40, 42, 54, 0.95)',
              borderRadius: '16px',
              padding: '12px',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(98, 114, 164, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              minWidth: '200px',
            }}
          >
            <motion.button
              whileHover={{ backgroundColor: 'rgba(139, 233, 253, 0.2)' }}
              onClick={() => { onRandomize(); setIsOpen(false); }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#F8F8F2',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              🎲 Randomize
            </motion.button>

            <motion.button
              whileHover={{ backgroundColor: 'rgba(139, 233, 253, 0.2)' }}
              onClick={() => { onShare(); setIsOpen(false); }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: '#F8F8F2',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                marginBottom: '8px',
              }}
            >
              🔗 Share URL
            </motion.button>

            <div style={{
              height: '1px',
              backgroundColor: 'rgba(98, 114, 164, 0.3)',
              margin: '8px 0',
            }} />

            <div style={{
              color: '#6272A4',
              fontSize: '11px',
              padding: '8px 12px',
              fontWeight: '600',
            }}>
              CAMERA MODES
            </div>

            {['Orbit', 'Spiral', 'Bounce', 'Wave', 'Figure-8', 'Drunk'].map((mode) => (
              <motion.button
                key={mode}
                whileHover={{ backgroundColor: 'rgba(139, 233, 253, 0.2)' }}
                onClick={() => { onCameraPreset(mode.toLowerCase().replace('-', '')); setIsOpen(false); }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F8F8F2',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '4px',
                }}
              >
                📹 {mode}
              </motion.button>
            ))}

            <div style={{
              height: '1px',
              backgroundColor: 'rgba(98, 114, 164, 0.3)',
              margin: '8px 0',
            }} />

            <div style={{
              color: '#6272A4',
              fontSize: '11px',
              padding: '8px 12px',
              fontWeight: '600',
            }}>
              COLOR GRADES
            </div>

            {['Cyberpunk', 'Vintage', 'Noir', 'Sunset', 'Matrix', 'Neon'].map((grade) => (
              <motion.button
                key={grade}
                whileHover={{ backgroundColor: 'rgba(139, 233, 253, 0.2)' }}
                onClick={() => { onColorPreset(grade.toLowerCase()); setIsOpen(false); }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#F8F8F2',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  marginBottom: '4px',
                }}
              >
                🎨 {grade}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Recording indicator
export const RecordingIndicator = ({ isRecording, duration }) => {
  return (
    <AnimatePresence>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            position: 'fixed',
            top: '100px',
            right: '20px',
            backgroundColor: 'rgba(255, 85, 85, 0.9)',
            borderRadius: '12px',
            padding: '12px 16px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 85, 85, 0.4)',
            boxShadow: '0 8px 32px rgba(255, 85, 85, 0.5)',
            zIndex: 1001,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#FFF',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#FFF',
            }}
          />
          <span>REC {duration}s</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// FPS Counter
export const FPSCounter = ({ fps }) => {
  const getColor = () => {
    if (fps >= 50) return '#50FA7B';
    if (fps >= 30) return '#FFB86C';
    return '#FF5555';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        position: 'fixed',
        top: '200px',
        left: '20px',
        backgroundColor: 'rgba(40, 42, 54, 0.85)',
        borderRadius: '8px',
        padding: '8px 12px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(98, 114, 164, 0.3)',
        zIndex: 1000,
        fontFamily: 'monospace',
        fontSize: '12px',
        fontWeight: '600',
        color: getColor(),
      }}
    >
      {fps} FPS
    </motion.div>
  );
};
