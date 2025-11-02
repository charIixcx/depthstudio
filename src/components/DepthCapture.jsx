import { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * DepthCapture component captures the scene's depth buffer to a texture
 * This enables TouchDesigner-like depth mask manipulation workflows
 * No additional dependencies required - uses native Three.js
 */
export default function DepthCapture({ onDepthUpdate, enabled = true }) {
  const { gl, scene, camera, size } = useThree();
  const [isReady, setIsReady] = useState(false);
  
  const depthTarget = useMemo(() => {
    if (!enabled) return null;
    
    const depthTexture = new THREE.DepthTexture(
      size.width,
      size.height
    );
    depthTexture.type = THREE.UnsignedShortType;
    depthTexture.format = THREE.DepthFormat;
    
    const target = new THREE.WebGLRenderTarget(size.width, size.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthTexture: depthTexture,
      depthBuffer: true,
    });
    
    return target;
  }, [size, enabled]);

  useFrame(() => {
    if (!enabled || !depthTarget) return;
    
    // Capture depth buffer to texture
    gl.setRenderTarget(depthTarget);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    
    // Pass depth texture to parent on first frame
    if (!isReady && depthTarget.depthTexture) {
      setIsReady(true);
      if (onDepthUpdate) {
        onDepthUpdate(depthTarget.depthTexture);
      }
    }
  });

  // Cleanup
  useMemo(() => {
    return () => {
      if (depthTarget) {
        depthTarget.dispose();
      }
    };
  }, [depthTarget]);

  return null;
}
