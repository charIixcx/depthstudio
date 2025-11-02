import { Effect } from 'postprocessing';
import { Uniform } from 'three';

/**
 * Enhanced CRT/Scanline Effect
 * Provides retro CRT monitor aesthetics with scanlines, flicker, and noise
 * Based on research recommendations for custom GLSL shader effects
 */
const fragmentShader = `
uniform float time;
uniform float scanlineCount;
uniform float scanlineIntensity;
uniform float scanlineSpeed;
uniform float scanlineThickness;
uniform float flickerIntensity;
uniform float noiseIntensity;
uniform float crtCurvature;
uniform float crtVignette;
uniform float rgbShift;

// Simple noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// CRT barrel distortion
vec2 barrelDistortion(vec2 coord, float amt) {
  vec2 cc = coord - 0.5;
  float dist = dot(cc, cc);
  return coord + cc * dist * amt;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  // Apply CRT curvature
  vec2 distortedUV = barrelDistortion(uv, crtCurvature);
  
  // Check if we're outside the screen bounds after distortion
  if (distortedUV.x < 0.0 || distortedUV.x > 1.0 || 
      distortedUV.y < 0.0 || distortedUV.y > 1.0) {
    outputColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  
  vec4 color = inputColor;
  
  // RGB color separation (chromatic aberration)
  if (rgbShift > 0.0) {
    vec2 offset = vec2(rgbShift, 0.0);
    float r = texture2D(inputBuffer, distortedUV - offset).r;
    float g = texture2D(inputBuffer, distortedUV).g;
    float b = texture2D(inputBuffer, distortedUV + offset).b;
    color = vec4(r, g, b, 1.0);
  }
  
  // Scanlines with animation
  float scanline = sin(distortedUV.y * scanlineCount + time * scanlineSpeed);
  scanline = pow(scanline * 0.5 + 0.5, scanlineThickness);
  scanline = mix(1.0, scanline, scanlineIntensity);
  
  // Flicker effect
  float flicker = noise(vec2(time * 10.0, 0.0)) * flickerIntensity;
  flicker = mix(1.0, 1.0 - flicker, 0.5);
  
  // RGB noise
  vec3 noiseColor = vec3(
    noise(distortedUV + time),
    noise(distortedUV + time + 1.0),
    noise(distortedUV + time + 2.0)
  );
  noiseColor = mix(vec3(1.0), noiseColor, noiseIntensity);
  
  // CRT vignette
  vec2 vignetteUV = distortedUV * (1.0 - distortedUV.yx);
  float vignette = vignetteUV.x * vignetteUV.y * 15.0;
  vignette = pow(vignette, crtVignette);
  
  // Combine all effects
  color.rgb *= scanline * flicker * noiseColor * vignette;
  
  outputColor = color;
}
`;

export class CRTEffect extends Effect {
  constructor({
    scanlineCount = 800.0,
    scanlineIntensity = 0.3,
    scanlineSpeed = 1.0,
    scanlineThickness = 2.0,
    flickerIntensity = 0.1,
    noiseIntensity = 0.05,
    crtCurvature = 0.0,
    crtVignette = 0.3,
    rgbShift = 0.0,
  } = {}) {
    super('CRTEffect', fragmentShader, {
      uniforms: new Map([
        ['time', new Uniform(0)],
        ['scanlineCount', new Uniform(scanlineCount)],
        ['scanlineIntensity', new Uniform(scanlineIntensity)],
        ['scanlineSpeed', new Uniform(scanlineSpeed)],
        ['scanlineThickness', new Uniform(scanlineThickness)],
        ['flickerIntensity', new Uniform(flickerIntensity)],
        ['noiseIntensity', new Uniform(noiseIntensity)],
        ['crtCurvature', new Uniform(crtCurvature)],
        ['crtVignette', new Uniform(crtVignette)],
        ['rgbShift', new Uniform(rgbShift)],
      ])
    });
  }

  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get('time').value += deltaTime;
  }
  
  // Expose getters/setters for dynamic control
  get scanlineCount() { return this.uniforms.get('scanlineCount').value; }
  set scanlineCount(value) { this.uniforms.get('scanlineCount').value = value; }
  
  get scanlineIntensity() { return this.uniforms.get('scanlineIntensity').value; }
  set scanlineIntensity(value) { this.uniforms.get('scanlineIntensity').value = value; }
  
  get scanlineSpeed() { return this.uniforms.get('scanlineSpeed').value; }
  set scanlineSpeed(value) { this.uniforms.get('scanlineSpeed').value = value; }
  
  get scanlineThickness() { return this.uniforms.get('scanlineThickness').value; }
  set scanlineThickness(value) { this.uniforms.get('scanlineThickness').value = value; }
  
  get flickerIntensity() { return this.uniforms.get('flickerIntensity').value; }
  set flickerIntensity(value) { this.uniforms.get('flickerIntensity').value = value; }
  
  get noiseIntensity() { return this.uniforms.get('noiseIntensity').value; }
  set noiseIntensity(value) { this.uniforms.get('noiseIntensity').value = value; }
  
  get crtCurvature() { return this.uniforms.get('crtCurvature').value; }
  set crtCurvature(value) { this.uniforms.get('crtCurvature').value = value; }
  
  get crtVignette() { return this.uniforms.get('crtVignette').value; }
  set crtVignette(value) { this.uniforms.get('crtVignette').value = value; }
  
  get rgbShift() { return this.uniforms.get('rgbShift').value; }
  set rgbShift(value) { this.uniforms.get('rgbShift').value = value; }
}
