import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'

const vertexShader = /* glsl */`
  precision highp float;

  uniform sampler2D uDepthMap;
  uniform int uUseDepth;
  uniform int uInvertDepth;
  uniform float uDepthScale;
  uniform float uDepthBias;
  uniform float uNoiseAmp;
  uniform float uNoiseFreq;
  uniform float uNoiseSpeed;
  uniform float uJitter;
  uniform float uTime;
  uniform vec2 uTexelSize;
  uniform int uMathMode;
  uniform float uMathAmp;
  uniform float uMathFreq;
  uniform float uMathTimeScale;
  uniform float uMathDetail;
  uniform float uMathWarp;
  uniform float uMathBlend;
  uniform float uMathSymmetry;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float sampleDepth(vec2 uv) {
    float d = texture2D(uDepthMap, uv).r;
    if (uInvertDepth == 1) d = 1.0 - d;
    return d;
  }

  float mathPattern(vec2 uv, float t) {
    float time = t * uMathTimeScale;
    if (uMathMode == 1) {
      float r = length(uv - 0.5) + 1e-4;
      float shaped = pow(r, max(0.2, uMathDetail));
      return sin(shaped * uMathFreq * 6.28318 - time) * uMathAmp;
    } else if (uMathMode == 2) {
      float angle = atan(uv.y - 0.5, uv.x - 0.5);
      float stripes = (uv.x + uv.y * 0.2) * uMathFreq * 6.28318;
      stripes += sin(angle * (1.0 + uMathWarp)) * uMathBlend;
      return sin(stripes + time) * uMathAmp;
    } else if (uMathMode == 3) {
      vec2 p = uv - 0.5;
      float ang = atan(p.y, p.x) + time * 0.35;
      float r = pow(length(p) + 1e-4, max(0.4, uMathDetail));
      return sin((ang * (1.0 + uMathWarp) + r * (uMathFreq + 0.2)) + time) * uMathAmp;
    } else if (uMathMode == 4) {
      vec2 p = uv - 0.5;
      float sectors = max(1.0, uMathSymmetry);
      float angle = atan(p.y, p.x);
      float radius = pow(length(p) + 1e-4, max(0.2, uMathDetail));
      float mirrored = abs(fract((angle / 3.14159265) * sectors * 0.5) - 0.5) * 2.0;
      float wave = sin((mirrored * (1.0 + uMathWarp) + radius * (uMathFreq + uMathBlend)) * 6.28318 + time);
      return wave * uMathAmp;
    } else if (uMathMode == 5) {
      vec2 p = (uv - 0.5) * (1.0 + uMathWarp) + vec2(time * 0.08, -time * 0.05);
      float amp = 1.0;
      float freq = uMathFreq * 0.5 + 0.001;
      float sum = 0.0;
      for (int i = 0; i < 4; i++) {
        float n = vnoise(p * (freq + float(i) * max(0.0, uMathBlend)) + vec2(time * 0.2 * float(i), time * 0.17 * float(3 - i)));
        sum += (n - 0.5) * 2.0 * amp;
        amp *= 0.55 + uMathDetail * 0.05;
        freq *= 1.7;
      }
      return sum * uMathAmp * 0.7;
    } else if (uMathMode == 6) {
      // Wave Interference - multiple wave sources creating interference patterns
      vec2 p = uv - 0.5;
      float d1 = length(p - vec2(cos(time * 0.3) * 0.3, sin(time * 0.3) * 0.3));
      float d2 = length(p - vec2(-cos(time * 0.4) * 0.25, -sin(time * 0.5) * 0.25));
      float d3 = length(p - vec2(sin(time * 0.35) * 0.2, cos(time * 0.45) * 0.2));
      float wave1 = sin(d1 * uMathFreq * 6.28318 - time * 2.0);
      float wave2 = sin(d2 * uMathFreq * 6.28318 - time * 2.5);
      float wave3 = sin(d3 * uMathFreq * 6.28318 - time * 3.0);
      return ((wave1 + wave2 + wave3) / 3.0) * uMathAmp * (1.0 + uMathWarp * 0.5);
    } else if (uMathMode == 7) {
      // Voronoi-like cellular pattern
      vec2 p = uv * uMathFreq;
      vec2 i = floor(p);
      vec2 f = fract(p);
      float minDist = 1.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = vec2(hash(i + neighbor), hash(i + neighbor + vec2(13.7, 27.3)));
          point = 0.5 + 0.5 * sin(time * uMathTimeScale + 6.2831 * point);
          vec2 diff = neighbor + point - f;
          float dist = length(diff);
          minDist = min(minDist, dist);
        }
      }
      float pattern = sin(minDist * 6.28318 * (1.0 + uMathWarp * 2.0) + time);
      return pattern * uMathAmp * (1.0 + uMathDetail * 0.5);
    } else if (uMathMode == 8) {
      // Particle field displacement
      vec2 p = uv - 0.5;
      float pattern = 0.0;
      int particleCount = int(mix(4.0, 12.0, uMathDetail));
      for (int i = 0; i < 12; i++) {
        if (i >= particleCount) break;
        float fi = float(i);
        float angle = time * (0.3 + fi * 0.1) + fi * 2.0;
        float radius = 0.15 + sin(time * 0.5 + fi) * 0.1;
        vec2 particlePos = vec2(cos(angle), sin(angle)) * radius * (1.0 + uMathWarp);
        float dist = length(p - particlePos);
        pattern += (1.0 / (dist * uMathFreq * 10.0 + 1.0)) * uMathBlend;
      }
      return sin(pattern * 3.14159) * uMathAmp;
    }
    return 0.0;
  }

  float heightAt(vec2 uv, float t) {
    float h = 0.0;
    if (uUseDepth == 1) {
      h += (sampleDepth(uv) - uDepthBias) * uDepthScale;
    }
    float n = vnoise(uv * uNoiseFreq + vec2(t * uNoiseSpeed));
    h += (n - 0.5) * 2.0 * uNoiseAmp;
    h += mathPattern(uv, t);
    return h;
  }

  void main() {
    vUv = uv;
  float t = uTime;

    float line = step(0.98, fract(vUv.y * 80.0 + t * 0.5));
    float jitter = (line > 0.5) ? (uJitter * (vnoise(vec2(vUv.y * 10.0, t)) - 0.5)) : 0.0;

    float h = heightAt(vUv, t) + jitter;

    vec3 displaced = position + normal * h;
    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vWorldPos = world.xyz;

    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */`
  precision highp float;

  uniform sampler2D uColorMap;
  uniform sampler2D uDepthMap;
  uniform vec2 uTexelSize;

  uniform int uUseDepth;
  uniform int uInvertDepth;
  uniform float uDepthScale;
  uniform float uDepthBias;
  uniform float uNormalStrength;

  uniform float uNoiseAmp;
  uniform float uNoiseFreq;
  uniform float uNoiseSpeed;
  uniform float uTime;

  uniform float uAmbient;
  uniform vec3 uLightDir;
  uniform vec3 uLightColor;
  uniform float uLightIntensity;

  uniform vec3 uPointLightPos;
  uniform vec3 uPointLightColor;
  uniform float uPointLightIntensity;

  uniform float uSpecular;
  uniform float uShininess;

  uniform float uBrightness;
  uniform float uContrast;
  uniform float uSaturation;
  uniform float uHue;
  uniform vec3 uTint;
  uniform float uOpacity;

  uniform int uMathMode;
  uniform float uMathAmp;
  uniform float uMathFreq;
  uniform float uMathTimeScale;
  uniform float uMathDetail;
  uniform float uMathWarp;
  uniform float uMathBlend;
  uniform float uMathSymmetry;

  varying vec2 vUv;
  varying vec3 vWorldPos;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float sampleDepth(vec2 uv) {
    float d = texture2D(uDepthMap, uv).r;
    if (uInvertDepth == 1) d = 1.0 - d;
    return d;
  }

  float mathPattern(vec2 uv, float t) {
    float time = t * uMathTimeScale;
    if (uMathMode == 1) {
      float r = length(uv - 0.5) + 1e-4;
      float shaped = pow(r, max(0.2, uMathDetail));
      return sin(shaped * uMathFreq * 6.28318 - time) * uMathAmp;
    } else if (uMathMode == 2) {
      float angle = atan(uv.y - 0.5, uv.x - 0.5);
      float stripes = (uv.x + uv.y * 0.2) * uMathFreq * 6.28318;
      stripes += sin(angle * (1.0 + uMathWarp)) * uMathBlend;
      return sin(stripes + time) * uMathAmp;
    } else if (uMathMode == 3) {
      vec2 p = uv - 0.5;
      float ang = atan(p.y, p.x) + time * 0.35;
      float r = pow(length(p) + 1e-4, max(0.4, uMathDetail));
      return sin((ang * (1.0 + uMathWarp) + r * (uMathFreq + 0.2)) + time) * uMathAmp;
    } else if (uMathMode == 4) {
      vec2 p = uv - 0.5;
      float sectors = max(1.0, uMathSymmetry);
      float angle = atan(p.y, p.x);
      float radius = pow(length(p) + 1e-4, max(0.2, uMathDetail));
      float mirrored = abs(fract((angle / 3.14159265) * sectors * 0.5) - 0.5) * 2.0;
      float wave = sin((mirrored * (1.0 + uMathWarp) + radius * (uMathFreq + uMathBlend)) * 6.28318 + time);
      return wave * uMathAmp;
    } else if (uMathMode == 5) {
      vec2 p = (uv - 0.5) * (1.0 + uMathWarp) + vec2(time * 0.08, -time * 0.05);
      float amp = 1.0;
      float freq = uMathFreq * 0.5 + 0.001;
      float sum = 0.0;
      for (int i = 0; i < 4; i++) {
        float n = vnoise(p * (freq + float(i) * max(0.0, uMathBlend)) + vec2(time * 0.2 * float(i), time * 0.17 * float(3 - i)));
        sum += (n - 0.5) * 2.0 * amp;
        amp *= 0.55 + uMathDetail * 0.05;
        freq *= 1.7;
      }
      return sum * uMathAmp * 0.7;
    } else if (uMathMode == 6) {
      // Wave Interference - multiple wave sources creating interference patterns
      vec2 p = uv - 0.5;
      float d1 = length(p - vec2(cos(time * 0.3) * 0.3, sin(time * 0.3) * 0.3));
      float d2 = length(p - vec2(-cos(time * 0.4) * 0.25, -sin(time * 0.5) * 0.25));
      float d3 = length(p - vec2(sin(time * 0.35) * 0.2, cos(time * 0.45) * 0.2));
      float wave1 = sin(d1 * uMathFreq * 6.28318 - time * 2.0);
      float wave2 = sin(d2 * uMathFreq * 6.28318 - time * 2.5);
      float wave3 = sin(d3 * uMathFreq * 6.28318 - time * 3.0);
      return ((wave1 + wave2 + wave3) / 3.0) * uMathAmp * (1.0 + uMathWarp * 0.5);
    } else if (uMathMode == 7) {
      // Voronoi-like cellular pattern
      vec2 p = uv * uMathFreq;
      vec2 i = floor(p);
      vec2 f = fract(p);
      float minDist = 1.0;
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec2 neighbor = vec2(float(x), float(y));
          vec2 point = vec2(hash(i + neighbor), hash(i + neighbor + vec2(13.7, 27.3)));
          point = 0.5 + 0.5 * sin(time * uMathTimeScale + 6.2831 * point);
          vec2 diff = neighbor + point - f;
          float dist = length(diff);
          minDist = min(minDist, dist);
        }
      }
      float pattern = sin(minDist * 6.28318 * (1.0 + uMathWarp * 2.0) + time);
      return pattern * uMathAmp * (1.0 + uMathDetail * 0.5);
    } else if (uMathMode == 8) {
      // Particle field displacement
      vec2 p = uv - 0.5;
      float pattern = 0.0;
      int particleCount = int(mix(4.0, 12.0, uMathDetail));
      for (int i = 0; i < 12; i++) {
        if (i >= particleCount) break;
        float fi = float(i);
        float angle = time * (0.3 + fi * 0.1) + fi * 2.0;
        float radius = 0.15 + sin(time * 0.5 + fi) * 0.1;
        vec2 particlePos = vec2(cos(angle), sin(angle)) * radius * (1.0 + uMathWarp);
        float dist = length(p - particlePos);
        pattern += (1.0 / (dist * uMathFreq * 10.0 + 1.0)) * uMathBlend;
      }
      return sin(pattern * 3.14159) * uMathAmp;
    }
    return 0.0;
  }

  float heightAt(vec2 uv, float t) {
    float h = 0.0;
    if (uUseDepth == 1) {
      h += (sampleDepth(uv) - uDepthBias) * uDepthScale;
    }
    float n = vnoise(uv * uNoiseFreq + vec2(t * uNoiseSpeed));
    h += (n - 0.5) * 2.0 * uNoiseAmp;
    h += mathPattern(uv, t);
    return h;
  }

  vec3 estimateNormal(vec2 uv, float t) {
    float epsx = uTexelSize.x;
    float epsy = uTexelSize.y;
    float hL = heightAt(uv - vec2(epsx, 0.0), t);
    float hR = heightAt(uv + vec2(epsx, 0.0), t);
    float hD = heightAt(uv - vec2(0.0, epsy), t);
    float hU = heightAt(uv + vec2(0.0, epsy), t);
    float dx = (hR - hL);
    float dy = (hU - hD);
    vec3 n = normalize(vec3(-dx * uNormalStrength, -dy * uNormalStrength, 1.0));
    return n;
  }

  mat3 hueRotate(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
      0.213 + 0.787 * c - 0.213 * s, 0.715 - 0.715 * c - 0.715 * s, 0.072 - 0.072 * c + 0.928 * s,
      0.213 - 0.213 * c + 0.143 * s, 0.715 + 0.285 * c + 0.140 * s, 0.072 - 0.072 * c - 0.283 * s,
      0.213 - 0.213 * c - 0.787 * s, 0.715 - 0.715 * c + 0.715 * s, 0.072 + 0.928 * c + 0.072 * s
    );
  }

  vec3 adjustColor(vec3 c) {
    c = c + vec3(uBrightness);
    c = (c - 0.5) * uContrast + 0.5;
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(lum), c, uSaturation);
    c = clamp(hueRotate(uHue) * c, 0.0, 1.0);
    c *= uTint;
    return c;
  }

  void main() {
    float t = uTime;

    float line = step(0.985, fract(vUv.y * 120.0 + t * 0.3));
    vec2 uv = vUv;
    uv.x += line * (vnoise(vec2(vUv.y * 20.0, t)) - 0.5) * 0.01;

    vec3 base = texture2D(uColorMap, uv).rgb;
    vec3 N = estimateNormal(vUv, t);
    vec3 V = normalize(cameraPosition - vWorldPos);

    vec3 Ld = normalize(-uLightDir);
    float NdotLd = max(dot(N, Ld), 0.0);
    vec3 diffDir = NdotLd * uLightColor * uLightIntensity;

    vec3 Lp = normalize(uPointLightPos - vWorldPos);
    float dist = max(length(uPointLightPos - vWorldPos), 0.001);
    float attenuation = 1.0 / (dist * dist);
    float NdotLp = max(dot(N, Lp), 0.0);
    vec3 diffPt = NdotLp * uPointLightColor * uPointLightIntensity * attenuation * 2.0;

    vec3 Hdir = normalize(Ld + V);
    float spec1 = pow(max(dot(N, Hdir), 0.0), uShininess) * uSpecular * uLightIntensity;

    vec3 Hpt = normalize(Lp + V);
    float spec2 = pow(max(dot(N, Hpt), 0.0), uShininess) * uSpecular * uPointLightIntensity * attenuation;

    vec3 color = adjustColor(base);
    vec3 lighting = color * (uAmbient + diffDir + diffPt) + (spec1 * uLightColor + spec2 * uPointLightColor);

    gl_FragColor = vec4(lighting, uOpacity);
  }
`

const DepthDisplaceMaterial = shaderMaterial(
  {
    uColorMap: null,
    uDepthMap: null,
    uTexelSize: [1 / 1024, 1 / 1024],

    uUseDepth: 1,
    uInvertDepth: 0,
    uDepthScale: 0.2,
    uDepthBias: 0.5,
    uNormalStrength: 6.0,

    uNoiseAmp: 0.02,
    uNoiseFreq: 6.0,
    uNoiseSpeed: 0.2,
    uJitter: 0.02,
    uTime: 0.0,

    uAmbient: 0.2,
    uLightDir: [-0.6, 0.8, 0.3],
    uLightColor: [1, 1, 1],
    uLightIntensity: 1.2,

    uPointLightPos: [0.7, 0.6, 0.8],
    uPointLightColor: [0.65, 0.7, 1.0],
    uPointLightIntensity: 0.8,

    uSpecular: 0.55,
    uShininess: 32.0,

    uBrightness: 0.0,
    uContrast: 1.0,
    uSaturation: 1.0,
    uHue: 0.0,
    uTint: [1, 1, 1],
  uOpacity: 1.0,

    uMathMode: 1,
    uMathAmp: 0.05,
    uMathFreq: 6.0,
    uMathTimeScale: 1.0,
    uMathDetail: 1.0,
    uMathWarp: 0.0,
    uMathBlend: 0.5,
    uMathSymmetry: 6.0
  },
  vertexShader,
  fragmentShader
)

extend({ DepthDisplaceMaterial })
