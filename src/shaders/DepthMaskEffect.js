import { Effect } from 'postprocessing';
import { Uniform } from 'three';

/**
 * Depth Mask Effect
 * Uses depth buffer for TouchDesigner-like depth-based masking and effects
 * Enables depth-aware post-processing and selective effect application
 */
const fragmentShader = `
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;
uniform vec2 depthMaskRange;
uniform float depthEdgeSoftness;
uniform float depthInvert;
uniform float depthPower;
uniform vec3 depthTint;
uniform float depthTintStrength;
uniform float depthFadeEnabled;
uniform float depthVisualize;

#include <packing>

float readDepth(sampler2D depthSampler, vec2 coord) {
  float fragCoordZ = texture2D(depthSampler, coord).x;
  float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
  return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec4 color = inputColor;
  
  // Read depth value
  float depth = readDepth(tDepth, uv);
  
  // Apply depth power for contrast
  depth = pow(depth, depthPower);
  
  // Invert if requested
  if (depthInvert > 0.5) {
    depth = 1.0 - depth;
  }
  
  // Create depth-based mask with smooth edges
  float mask = smoothstep(
    depthMaskRange.x - depthEdgeSoftness,
    depthMaskRange.x + depthEdgeSoftness,
    depth
  );
  mask *= smoothstep(
    depthMaskRange.y + depthEdgeSoftness,
    depthMaskRange.y - depthEdgeSoftness,
    depth
  );
  
  // Apply depth fade if enabled
  if (depthFadeEnabled > 0.5) {
    color.rgb *= mask;
  }
  
  // Apply depth-based tint
  if (depthTintStrength > 0.0) {
    vec3 tintedColor = mix(color.rgb, depthTint, depth * depthTintStrength);
    color.rgb = tintedColor;
  }
  
  // Visualize depth for debugging
  if (depthVisualize > 0.5) {
    color.rgb = vec3(depth);
  }
  
  outputColor = color;
}
`;

export class DepthMaskEffect extends Effect {
  constructor({
    depthTexture = null,
    cameraNear = 0.1,
    cameraFar = 100,
    depthMaskRange = [0.0, 1.0],
    depthEdgeSoftness = 0.05,
    depthInvert = false,
    depthPower = 1.0,
    depthTint = [1.0, 1.0, 1.0],
    depthTintStrength = 0.0,
    depthFadeEnabled = false,
    depthVisualize = false,
  } = {}) {
    super('DepthMaskEffect', fragmentShader, {
      uniforms: new Map([
        ['tDepth', new Uniform(depthTexture)],
        ['cameraNear', new Uniform(cameraNear)],
        ['cameraFar', new Uniform(cameraFar)],
        ['depthMaskRange', new Uniform([depthMaskRange[0], depthMaskRange[1]])],
        ['depthEdgeSoftness', new Uniform(depthEdgeSoftness)],
        ['depthInvert', new Uniform(depthInvert ? 1.0 : 0.0)],
        ['depthPower', new Uniform(depthPower)],
        ['depthTint', new Uniform(depthTint)],
        ['depthTintStrength', new Uniform(depthTintStrength)],
        ['depthFadeEnabled', new Uniform(depthFadeEnabled ? 1.0 : 0.0)],
        ['depthVisualize', new Uniform(depthVisualize ? 1.0 : 0.0)],
      ])
    });
  }

  // Expose getters/setters for dynamic control
  get depthTexture() { return this.uniforms.get('tDepth').value; }
  set depthTexture(value) { this.uniforms.get('tDepth').value = value; }
  
  get cameraNear() { return this.uniforms.get('cameraNear').value; }
  set cameraNear(value) { this.uniforms.get('cameraNear').value = value; }
  
  get cameraFar() { return this.uniforms.get('cameraFar').value; }
  set cameraFar(value) { this.uniforms.get('cameraFar').value = value; }
  
  get depthMaskRange() { return this.uniforms.get('depthMaskRange').value; }
  set depthMaskRange(value) { this.uniforms.get('depthMaskRange').value = value; }
  
  get depthEdgeSoftness() { return this.uniforms.get('depthEdgeSoftness').value; }
  set depthEdgeSoftness(value) { this.uniforms.get('depthEdgeSoftness').value = value; }
  
  get depthInvert() { return this.uniforms.get('depthInvert').value > 0.5; }
  set depthInvert(value) { this.uniforms.get('depthInvert').value = value ? 1.0 : 0.0; }
  
  get depthPower() { return this.uniforms.get('depthPower').value; }
  set depthPower(value) { this.uniforms.get('depthPower').value = value; }
  
  get depthTint() { return this.uniforms.get('depthTint').value; }
  set depthTint(value) { this.uniforms.get('depthTint').value = value; }
  
  get depthTintStrength() { return this.uniforms.get('depthTintStrength').value; }
  set depthTintStrength(value) { this.uniforms.get('depthTintStrength').value = value; }
  
  get depthFadeEnabled() { return this.uniforms.get('depthFadeEnabled').value > 0.5; }
  set depthFadeEnabled(value) { this.uniforms.get('depthFadeEnabled').value = value ? 1.0 : 0.0; }
  
  get depthVisualize() { return this.uniforms.get('depthVisualize').value > 0.5; }
  set depthVisualize(value) { this.uniforms.get('depthVisualize').value = value ? 1.0 : 0.0; }
}
