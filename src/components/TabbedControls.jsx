import React, { useState, useEffect } from 'react';
import { Leva } from 'leva';
import './TabbedControls.css';

const tabs = [
  { id: 'master', label: '🎨 Master', icon: '🎨' },
  { id: 'effects', label: '✨ Effects', icon: '✨' },
  { id: 'surface', label: '🌊 Surface', icon: '🌊' },
  { id: 'environment', label: '🌍 Scene', icon: '🌍' },
  { id: 'audio', label: '🎵 Audio', icon: '🎵' },
  { id: 'advanced', label: '⚙️ Advanced', icon: '⚙️' },
];

export default function TabbedControls({ isOpen, onToggle }) {
  const [activeTab, setActiveTab] = useState('master');
  const [isMinimized, setIsMinimized] = useState(false);

  const getVisiblePanels = (tabId) => {
    const tabPanelMap = {
      'master': ['🎨 Master'],
      'effects': ['🎬 Post Processing'],
      'surface': ['🎨 Surface'],
      'environment': ['🌍 Environment', '📷 Camera', '🎭 Layers'],
      'audio': ['🎵 Audio Settings'],
      'advanced': ['⚙️ Performance']
    };
    return tabPanelMap[tabId] || [];
  };

  // Use CSS to hide/show panels based on active tab
  useEffect(() => {
    if (!isOpen) return;

    const visiblePanels = getVisiblePanels(activeTab);

    const updatePanelVisibility = () => {
      // Wait for Leva to render
      requestAnimationFrame(() => {
        // Find the Leva container
        const levaContainers = document.querySelectorAll('[class*="leva"]');
        
        levaContainers.forEach(container => {
          // Find all folder wrappers (these contain the panel titles)
          const folders = container.querySelectorAll('[class*="Folder"]');
          
          folders.forEach(folder => {
            // Check if this folder has a title element
            const titleElement = folder.querySelector('[class*="title"], [class*="Title"]');
            if (titleElement) {
              const titleText = titleElement.textContent;
              
              // Check if this title matches any of our panels
              const allPanels = [
                '🎨 Master',
                '🎬 Post Processing',
                '🎨 Surface',
                '🌍 Environment',
                '📷 Camera',
                '🎭 Layers',
                '🎵 Audio Settings',
                '⚙️ Performance'
              ];
              
              if (allPanels.includes(titleText)) {
                // Find the wrapper that contains this entire panel
                const panelWrapper = folder.closest('[class*="Wrapper"]') || folder.parentElement;
                if (panelWrapper) {
                  if (visiblePanels.includes(titleText)) {
                    panelWrapper.style.display = '';
                    panelWrapper.style.visibility = 'visible';
                    panelWrapper.style.height = 'auto';
                  } else {
                    panelWrapper.style.display = 'none';
                    panelWrapper.style.visibility = 'hidden';
                    panelWrapper.style.height = '0';
                  }
                }
              }
            }
          });
        });
      });
    };

    // Initial update
    updatePanelVisibility();

    // Also update after a delay to catch late renders
    const timeout = setTimeout(updatePanelVisibility, 150);

    return () => clearTimeout(timeout);
  }, [activeTab, isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="controls-toggle-button closed"
        title="Open Controls"
      >
        ⚙️
      </button>
    );
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="controls-toggle-button open"
        title="Close Controls"
      >
        ✕
      </button>

      {/* Tabbed Controls Panel */}
      <div className={`tabbed-controls ${isMinimized ? 'minimized' : ''}`}>
        {/* Header */}
        <div className="controls-header">
          <div className="controls-title">
            <span className="controls-icon">⚙️</span>
            <span>Controls</span>
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="minimize-button"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '▼' : '▲'}
          </button>
        </div>

        {!isMinimized && (
          <>
            {/* Tab Navigation */}
            <div className="tab-navigation">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  title={tab.label}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
              <div className="tab-description">
                {activeTab === 'master' && (
                  <p>Quick presets and master controls for the entire scene</p>
                )}
                {activeTab === 'effects' && (
                  <p>Post-processing effects like bloom, glitch, and chromatic aberration</p>
                )}
                {activeTab === 'surface' && (
                  <p>Control depth, lighting, colors, and deformations</p>
                )}
                {activeTab === 'environment' && (
                  <p>Environment settings, camera movement, and layer configuration</p>
                )}
                {activeTab === 'audio' && (
                  <p>Global audio reactivity settings and sensitivity</p>
                )}
                {activeTab === 'advanced' && (
                  <p>Performance optimization and quality settings</p>
                )}
              </div>

              {/* Leva Controls */}
              <div className="leva-container">
                <Leva 
                  flat
                  oneLineLabels
                  hideCopyButton
                  titleBar={false}
                  theme={{
                    colors: {
                      elevation1: 'transparent',
                      elevation2: 'rgba(255, 255, 255, 0.05)',
                      elevation3: 'rgba(255, 255, 255, 0.08)',
                      accent1: '#6272A4',
                      accent2: '#50FA7B',
                      accent3: '#FF79C6',
                      highlight1: 'rgba(98, 114, 164, 0.3)',
                      highlight2: 'rgba(98, 114, 164, 0.5)',
                      highlight3: 'rgba(98, 114, 164, 0.7)',
                      vivid1: '#FFB86C',
                      folderWidgetColor: '$highlight2',
                      folderTextColor: '$highlight3',
                      toolTipBackground: '$elevation3',
                      toolTipText: '$highlight3',
                    },
                    radii: {
                      xs: '4px',
                      sm: '6px',
                      lg: '8px',
                    },
                    space: {
                      xs: '4px',
                      sm: '6px',
                      md: '8px',
                      rowGap: '8px',
                      colGap: '6px',
                    },
                    fonts: {
                      mono: 'Monaco, monospace',
                      sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                    },
                    fontSizes: {
                      root: '12px',
                      toolTip: '11px',
                    },
                    sizes: {
                      rootWidth: '100%',
                      controlWidth: '100%',
                      numberInputMinWidth: '48px',
                      scrubberWidth: '12px',
                      scrubberHeight: '24px',
                      rowHeight: '28px',
                      folderTitleHeight: '32px',
                      checkboxSize: '16px',
                      joystickWidth: '120px',
                      joystickHeight: '120px',
                      colorPickerWidth: '180px',
                      colorPickerHeight: '120px',
                      imagePreviewWidth: '180px',
                      imagePreviewHeight: '120px',
                      monitorHeight: '60px',
                      titleBarHeight: '0px',
                    },
                    shadows: {
                      level1: '0 2px 8px rgba(0, 0, 0, 0.3)',
                      level2: '0 4px 16px rgba(0, 0, 0, 0.4)',
                    },
                  }}
                  fill
                  collapsed={false}
                  hidden={false}
                />
              </div>

              {/* Quick Tips */}
              <div className="quick-tips">
                <div className="tip-label">💡 Quick Tip:</div>
                {activeTab === 'master' && (
                  <div className="tip-text">Use presets to quickly switch between different visual styles</div>
                )}
                {activeTab === 'effects' && (
                  <div className="tip-text">Enable Audio Reactive toggles to sync effects with music</div>
                )}
                {activeTab === 'surface' && (
                  <div className="tip-text">Adjust Depth Scale to control the 3D pop-out effect</div>
                )}
                {activeTab === 'environment' && (
                  <div className="tip-text">Toggle Auto Orbit off to manually control the camera</div>
                )}
                {activeTab === 'audio' && (
                  <div className="tip-text">Higher Sensitivity = stronger audio response</div>
                )}
                {activeTab === 'advanced' && (
                  <div className="tip-text">Enable Adaptive DPR for better performance on lower-end devices</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
