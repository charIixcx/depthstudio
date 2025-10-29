// Camera movement presets
export const CAMERA_PRESETS = {
  orbit: {
    name: 'Orbit',
    description: 'Smooth circular orbit',
    update: (camera, time, speed) => {
      const r = 2.5;
      const s = time * speed;
      camera.position.x = Math.cos(s) * r;
      camera.position.z = Math.sin(s) * r;
      camera.position.y = 0.7 + Math.sin(s * 0.8) * 0.15;
      camera.lookAt(0, 0, 0);
    }
  },
  
  spiral: {
    name: 'Spiral',
    description: 'Spiraling inward/outward',
    update: (camera, time, speed) => {
      const s = time * speed;
      const r = 2.5 + Math.sin(s * 0.3) * 1.0;
      camera.position.x = Math.cos(s) * r;
      camera.position.z = Math.sin(s) * r;
      camera.position.y = 1.0 + Math.sin(s * 0.5) * 0.5;
      camera.lookAt(0, 0, 0);
    }
  },
  
  bounce: {
    name: 'Bounce',
    description: 'Bouncing vertical motion',
    update: (camera, time, speed) => {
      const r = 2.5;
      const s = time * speed * 0.5;
      camera.position.x = Math.cos(s) * r;
      camera.position.z = Math.sin(s) * r;
      camera.position.y = Math.abs(Math.sin(time * speed * 2)) * 1.5 + 0.5;
      camera.lookAt(0, 0, 0);
    }
  },
  
  wave: {
    name: 'Wave',
    description: 'Wave-like motion',
    update: (camera, time, speed) => {
      const r = 2.5;
      const s = time * speed;
      camera.position.x = Math.cos(s) * r + Math.sin(s * 3) * 0.5;
      camera.position.z = Math.sin(s) * r + Math.cos(s * 2) * 0.5;
      camera.position.y = 0.7 + Math.sin(s * 1.5) * 0.3;
      camera.lookAt(0, 0, 0);
    }
  },
  
  figure8: {
    name: 'Figure-8',
    description: 'Infinity symbol path',
    update: (camera, time, speed) => {
      const s = time * speed;
      const r = 2.0;
      camera.position.x = Math.sin(s) * r;
      camera.position.z = Math.sin(s * 2) * r;
      camera.position.y = 0.7 + Math.cos(s) * 0.3;
      camera.lookAt(0, 0, 0);
    }
  },
  
  drunk: {
    name: 'Drunk',
    description: 'Random wobbly motion',
    update: (camera, time, speed) => {
      const r = 2.5;
      const s = time * speed;
      const wobble = (t) => Math.sin(t * 1.1) * 0.5 + Math.cos(t * 0.7) * 0.3;
      camera.position.x = Math.cos(s) * r + wobble(s);
      camera.position.z = Math.sin(s) * r + wobble(s + 1);
      camera.position.y = 0.7 + wobble(s + 2);
      camera.lookAt(0, 0, 0);
    }
  },
  
  closeup: {
    name: 'Close-up',
    description: 'Close circular orbit',
    update: (camera, time, speed) => {
      const r = 1.2;
      const s = time * speed;
      camera.position.x = Math.cos(s) * r;
      camera.position.z = Math.sin(s) * r;
      camera.position.y = 0.3 + Math.sin(s * 0.6) * 0.1;
      camera.lookAt(0, 0, 0);
    }
  },
  
  flyby: {
    name: 'Fly-by',
    description: 'Fast sweeping motion',
    update: (camera, time, speed) => {
      const s = time * speed * 2;
      const r = 3.0;
      camera.position.x = Math.cos(s) * r;
      camera.position.z = Math.sin(s) * r;
      camera.position.y = 1.5 + Math.sin(s * 0.4) * 0.8;
      camera.lookAt(0, 0, 0);
    }
  }
};

// Color grading presets (LUT-style filters)
export const COLOR_PRESETS = {
  normal: {
    name: 'Normal',
    hue: 0,
    brightness: 0,
    contrast: 1.0,
    saturation: 1.0
  },
  
  cyberpunk: {
    name: 'Cyberpunk',
    hue: 0.15,
    brightness: 0.1,
    contrast: 1.3,
    saturation: 1.5
  },
  
  vintage: {
    name: 'Vintage',
    hue: 0.05,
    brightness: -0.05,
    contrast: 0.9,
    saturation: 0.7
  },
  
  noir: {
    name: 'Noir',
    hue: 0,
    brightness: -0.2,
    contrast: 1.5,
    saturation: 0.3
  },
  
  sunset: {
    name: 'Sunset',
    hue: 0.08,
    brightness: 0.05,
    contrast: 1.1,
    saturation: 1.3
  },
  
  arctic: {
    name: 'Arctic',
    hue: 0.55,
    brightness: 0.15,
    contrast: 1.2,
    saturation: 0.9
  },
  
  matrix: {
    name: 'Matrix',
    hue: 0.35,
    brightness: -0.1,
    contrast: 1.4,
    saturation: 0.8
  },
  
  dreamy: {
    name: 'Dreamy',
    hue: 0.75,
    brightness: 0.1,
    contrast: 0.8,
    saturation: 1.2
  },
  
  horror: {
    name: 'Horror',
    hue: 0.0,
    brightness: -0.3,
    contrast: 1.6,
    saturation: 0.5
  },
  
  neon: {
    name: 'Neon',
    hue: 0.5,
    brightness: 0.2,
    contrast: 1.5,
    saturation: 2.0
  }
};

// Random preset generator
export const generateRandomPreset = () => {
  return {
    // Effects
    bloom: Math.random() * 2,
    chroma: Math.random() * 0.015,
    vignette: Math.random(),
    filmGrain: Math.random() * 0.3,
    glitch: Math.random() * 0.2,
    
    // Material
    noiseAmp: Math.random() * 0.1,
    depthScale: 0.1 + Math.random() * 0.5,
    hue: Math.random() * 2 - 1,
    brightness: Math.random() * 0.4 - 0.2,
    contrast: 0.5 + Math.random(),
    saturation: 0.5 + Math.random(),
    
    // Math pattern
    mathMode: Math.floor(Math.random() * 16),
    mathAmp: Math.random() * 0.3,
    mathFreq: 1 + Math.random() * 8,
    mathWarp: Math.random() * 2,
    mathBlend: Math.random() * 2,
    
    // Camera
    camSpeed: 0.05 + Math.random() * 0.2
  };
};

// Beat patterns for advanced audio reactivity
export const BEAT_PATTERNS = {
  kick: {
    name: 'Kick Drum',
    frequency: 'bass',
    threshold: 0.7,
    decay: 0.15
  },
  
  snare: {
    name: 'Snare',
    frequency: 'mid',
    threshold: 0.65,
    decay: 0.12
  },
  
  hihat: {
    name: 'Hi-hat',
    frequency: 'treble',
    threshold: 0.5,
    decay: 0.08
  },
  
  bass: {
    name: 'Bass Line',
    frequency: 'subBass',
    threshold: 0.6,
    decay: 0.2
  }
};
