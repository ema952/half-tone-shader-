import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import type { HalftoneSettings } from './types'

function parseColor(color: string): [number, number, number] {
  let hex = color.replace('#', '')
  if (hex.length === 3)
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [
      parseInt(hex.slice(0, 2), 16) / 255,
      parseInt(hex.slice(2, 4), 16) / 255,
      parseInt(hex.slice(4, 6), 16) / 255,
    ]
  }
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    return [
      parseInt(match[1]) / 255,
      parseInt(match[2]) / 255,
      parseInt(match[3]) / 255,
    ]
  }
  return [0, 0, 0]
}

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_texCoord;

void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
#extension GL_OES_standard_derivatives : enable
precision mediump float;

varying vec2 v_texCoord;
uniform vec2 u_resolution;
uniform float u_dotSize;
uniform float u_spacing;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_gamma;
uniform float u_time;
uniform float u_sparkleSpeed;
uniform float u_sparkleIntensity;
uniform float u_background;
uniform float u_reveal;
uniform float u_revealDelay;
uniform float u_revealDuration;
uniform float u_colorMode;
uniform float u_fillPattern;
uniform float u_patternOpacity;
uniform vec3 u_tintColor;
uniform float u_useTint;
uniform sampler2D u_texture;
uniform float u_imageAspect;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash2(vec2 p) {
    return fract(sin(dot(p, vec2(269.5, 183.3))) * 61357.9471);
}

float backOut(float t) {
    float c1 = 1.70158;
    float c3 = c1 + 1.0;
    float tm1 = t - 1.0;
    return 1.0 + c3 * tm1 * tm1 * tm1 + c1 * tm1 * tm1;
}

float sampleLum(sampler2D tex, vec2 uv, float refLum) {
    vec4 t = texture2D(tex, uv);
    if (t.a < 0.5) return refLum;
    vec3 c = t.rgb;
    if (t.a > 0.01) c = clamp((c - (1.0 - t.a)) / t.a, 0.0, 1.0);
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
    // Aspect-ratio-correct UV mapping
    vec2 canvasAspect = vec2(u_resolution.x / u_resolution.y, 1.0);
    vec2 imageAspect = vec2(u_imageAspect, 1.0);

    vec2 pixelCoord = v_texCoord * u_resolution;
    vec2 cellIndex = floor(pixelCoord / u_spacing);
    vec2 cellCenter = (cellIndex + 0.5) * u_spacing;
    vec2 sampleUV = cellCenter / u_resolution;

    // Cover-fit the image: scale UV so image covers canvas without distortion
    vec2 coverUV = sampleUV;
    float canvasRatio = u_resolution.x / u_resolution.y;
    if (u_imageAspect > 0.0) {
        if (canvasRatio > u_imageAspect) {
            float scale = canvasRatio / u_imageAspect;
            coverUV.y = (coverUV.y - 0.5) * scale + 0.5;
        } else {
            float scale = u_imageAspect / canvasRatio;
            coverUV.x = (coverUV.x - 0.5) * scale + 0.5;
        }
    }

    vec2 flippedUV = vec2(coverUV.x, 1.0 - coverUV.y);

    vec4 texColor = texture2D(u_texture, flippedUV);
    vec3 color = texColor.rgb;
    float alpha = texColor.a;

    // If UV is outside [0,1] range, treat as transparent
    if (coverUV.x < 0.0 || coverUV.x > 1.0 || coverUV.y < 0.0 || coverUV.y > 1.0) {
        alpha = 0.0;
        color = vec3(0.0);
    }

    if (alpha > 0.01) {
        color = clamp((color - (1.0 - alpha)) / alpha, 0.0, 1.0);
    }

    color = clamp(1.09 * (color - 0.5) + 0.5, 0.0, 1.0);

    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float rawDarkness = 1.0 - luminance;

    bool hasImage = alpha > 0.01;
    bool isPattern = !hasImage && u_fillPattern > 0.5;

    float sizeFactor;
    if (hasImage) {
        if (u_colorMode > 0.5) {
            sizeFactor = 1.0;
        } else {
            sizeFactor = clamp(rawDarkness * u_gamma, 0.0, 1.0);
        }
    } else if (isPattern) {
        sizeFactor = 1.0;
    } else {
        sizeFactor = 0.0;
    }

    float radius = u_dotSize * sizeFactor;

    float revealScale = 1.0;
    if (u_reveal > 0.5) {
        float delayedTime = max(u_time - u_revealDelay, 0.0);
        float revealProgress = clamp(delayedTime / u_revealDuration, 0.0, 1.0);
        float dotOrder = hash2(cellIndex);
        float appearStart = dotOrder * 0.85;
        float appearEnd = appearStart + 0.15;
        float t = clamp((revealProgress - appearStart) / (appearEnd - appearStart), 0.0, 1.0);
        revealScale = backOut(t);
    }

    radius *= revealScale;

    float dist = distance(pixelCoord, cellCenter);
    float edge = fwidth(dist);
    float circle = smoothstep(radius, radius - edge, dist);

    vec3 dotColor;
    if (u_colorMode > 0.5) {
        dotColor = vec3(1.0);
    } else if (hasImage) {
        if (u_useTint > 0.5) {
            dotColor = u_tintColor;
        } else {
            vec3 baseColor = mix(vec3(luminance), color, u_saturation);
            dotColor = (baseColor - rawDarkness * 0.3) * 1.4;
            dotColor = clamp(dotColor, 0.0, 1.0);
        }
        dotColor = pow(clamp(dotColor, 0.001, 1.0), vec3(1.0 / u_brightness));
    } else {
        if (u_useTint > 0.5) {
            dotColor = u_tintColor;
        } else {
            dotColor = vec3(0.45);
        }
        dotColor = pow(clamp(dotColor, 0.001, 1.0), vec3(1.0 / u_brightness));
    }

    float rnd = hash(cellIndex);
    float sparkleMask = step(0.6, hash(cellIndex + vec2(99.0, 53.0)));
    float wave = sin(u_time * u_sparkleSpeed + rnd * 6.2831);
    float sparkle = pow(max(wave, 0.0), 5.0) * u_sparkleIntensity * sparkleMask;
    float sparkleFade = 1.0 - sparkle;

    float patternAlpha = 1.0;
    if (isPattern) {
        float pRnd = hash(cellIndex + vec2(42.0, 17.0));
        float pMask = step(0.5, hash(cellIndex + vec2(77.0, 31.0)));
        float pWave = sin(u_time * u_sparkleSpeed + pRnd * 6.2831);
        float pDim = pow(max(pWave, 0.0), 5.0) * pMask;
        patternAlpha = u_patternOpacity * (1.0 - pDim * 0.7);
    }

    if (u_colorMode > 0.5) {
        float dotAlpha;
        if (hasImage) {
            vec2 cellOff = vec2(u_spacing) / u_resolution;
            float lL = sampleLum(u_texture, flippedUV + vec2(-cellOff.x, 0.0), luminance);
            float lR = sampleLum(u_texture, flippedUV + vec2( cellOff.x, 0.0), luminance);
            float lU = sampleLum(u_texture, flippedUV + vec2(0.0, -cellOff.y), luminance);
            float lD = sampleLum(u_texture, flippedUV + vec2(0.0,  cellOff.y), luminance);

            float localAvg = (lL + lR + lU + lD) * 0.25;
            float localDiff = luminance - localAvg;

            float enhanced = rawDarkness - localDiff * 3.0;
            enhanced = clamp(enhanced, 0.0, 1.0);

            float expanded = smoothstep(0.0, 0.7, enhanced);
            float baseAlpha = pow(max(expanded, 0.001), 1.0 / u_gamma);
            dotAlpha = circle * baseAlpha * sparkleFade;
        } else if (isPattern) {
            dotAlpha = circle * patternAlpha;
        } else {
            dotAlpha = 0.0;
        }
        gl_FragColor = vec4(dotColor * dotAlpha, dotAlpha);
    } else {
        if (u_background > 0.5) {
            float bgAlpha;
            if (hasImage) {
                bgAlpha = smoothstep(0.0, 0.15, alpha);
            } else if (isPattern) {
                bgAlpha = 1.0;
            } else {
                bgAlpha = 0.0;
            }
            float dotStrength;
            if (isPattern) {
                dotStrength = circle * patternAlpha;
            } else {
                dotStrength = circle * patternAlpha * sparkleFade;
            }
            vec3 finalColor = mix(vec3(1.0), dotColor, dotStrength);
            gl_FragColor = vec4(finalColor * bgAlpha, bgAlpha);
        } else {
            float baseAlpha = hasImage ? alpha : (isPattern ? 1.0 : 0.0);
            float dotAlpha;
            if (isPattern) {
                dotAlpha = circle * baseAlpha * patternAlpha;
            } else {
                dotAlpha = circle * baseAlpha * patternAlpha * sparkleFade;
            }
            gl_FragColor = vec4(dotColor * dotAlpha, dotAlpha);
        }
    }
}
`

function createShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader
): WebGLProgram | null {
  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  return program
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement): boolean {
  const dpr = window.devicePixelRatio || 1
  const width = Math.round(canvas.clientWidth * dpr)
  const height = Math.round(canvas.clientHeight * dpr)
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    return true
  }
  return false
}

interface GLResources {
  gl: WebGLRenderingContext
  program: WebGLProgram
  texture: WebGLTexture
  buffer: WebGLBuffer
  uniforms: Record<string, WebGLUniformLocation | null>
}

export interface HalftoneCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null
  resetAnimation: () => void
}

interface Props {
  imageSrc: string | null
  settings: HalftoneSettings
}

const HalftoneCanvas = forwardRef<HalftoneCanvasHandle, Props>(
  ({ imageSrc, settings }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const glRef = useRef<GLResources | null>(null)
    const [imageLoaded, setImageLoaded] = useState(false)
    const rafRef = useRef<number>(0)
    const startTimeRef = useRef<number>(0)
    const imageAspectRef = useRef<number>(1)

    useImperativeHandle(ref, () => ({
      getCanvas: () => canvasRef.current,
      resetAnimation: () => {
        startTimeRef.current = performance.now()
      },
    }))

    const {
      scale,
      saturation,
      brightness,
      gamma,
      sparkleSpeed,
      sparkleIntensity,
      background,
      reveal,
      revealDelay,
      revealDuration,
      colorMode,
      fillPattern,
      patternOpacity,
      useTint,
      tintColor,
    } = settings

    const tintRGB: [number, number, number] = useTint
      ? parseColor(tintColor)
      : [0, 0, 0]

    const needsAnimation =
      sparkleIntensity > 0 || reveal || (fillPattern && sparkleIntensity > 0)

    const render = useCallback(
      (time?: number) => {
        const res = glRef.current
        const canvas = canvasRef.current
        if (!res || !canvas) return

        const { gl, program, uniforms } = res
        const dpr = window.devicePixelRatio || 1

        const spacing = scale * dpr
        const dotSize = spacing * 0.48
        const elapsed =
          time !== undefined ? (time - startTimeRef.current) / 1000 : 0

        resizeCanvasToDisplaySize(canvas)
        gl.viewport(0, 0, canvas.width, canvas.height)

        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(program)
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height)
        gl.uniform1f(uniforms.dotSize, dotSize)
        gl.uniform1f(uniforms.spacing, spacing)
        gl.uniform1f(uniforms.saturation, saturation)
        gl.uniform1f(uniforms.brightness, brightness)
        gl.uniform1f(uniforms.gamma, gamma)
        gl.uniform1f(uniforms.time, elapsed)
        gl.uniform1f(uniforms.sparkleSpeed, sparkleSpeed)
        gl.uniform1f(uniforms.sparkleIntensity, sparkleIntensity)
        gl.uniform1f(uniforms.background, background ? 1.0 : 0.0)
        gl.uniform1f(uniforms.reveal, reveal ? 1.0 : 0.0)
        gl.uniform1f(uniforms.revealDelay, revealDelay)
        gl.uniform1f(uniforms.revealDuration, revealDuration)
        gl.uniform1f(uniforms.colorMode, colorMode === 'light' ? 1.0 : 0.0)
        gl.uniform1f(uniforms.fillPattern, fillPattern ? 1.0 : 0.0)
        gl.uniform1f(uniforms.patternOpacity, patternOpacity)
        gl.uniform3f(uniforms.tintColor, tintRGB[0], tintRGB[1], tintRGB[2])
        gl.uniform1f(uniforms.useTint, useTint ? 1.0 : 0.0)
        gl.uniform1i(uniforms.texture, 0)
        gl.uniform1f(uniforms.imageAspect, imageAspectRef.current)

        gl.drawArrays(gl.TRIANGLES, 0, 6)
      },
      [
        scale, saturation, brightness, gamma, sparkleSpeed, sparkleIntensity,
        background, reveal, revealDelay, revealDuration, colorMode,
        fillPattern, patternOpacity, tintRGB[0], tintRGB[1], tintRGB[2], useTint,
      ]
    )

    useEffect(() => {
      if (!imageLoaded && !fillPattern) return

      startTimeRef.current = performance.now()

      const animate = (time: number) => {
        render(time)
        rafRef.current = requestAnimationFrame(animate)
      }

      if (needsAnimation) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        render()
      }

      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
      }
    }, [imageLoaded, render, needsAnimation, fillPattern])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const gl = canvas.getContext('webgl', {
        alpha: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
      })
      if (!gl) {
        console.error('WebGL not supported')
        return
      }

      gl.enable(gl.BLEND)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      gl.clearColor(0, 0, 0, 0)
      gl.getExtension('OES_standard_derivatives')

      const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
      const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
      if (!vs || !fs) return

      const program = createProgram(gl, vs, fs)
      if (!program) return

      gl.deleteShader(vs)
      gl.deleteShader(fs)

      const buffer = gl.createBuffer()
      if (!buffer) return
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      )

      const posLoc = gl.getAttribLocation(program, 'a_position')
      gl.enableVertexAttribArray(posLoc)
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)

      const texture = gl.createTexture()
      if (!texture) return
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([255, 255, 255, 255])
      )
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

      const uniformNames = [
        'resolution', 'dotSize', 'spacing', 'saturation', 'brightness',
        'gamma', 'time', 'sparkleSpeed', 'sparkleIntensity', 'background',
        'reveal', 'revealDelay', 'revealDuration', 'colorMode', 'fillPattern',
        'patternOpacity', 'tintColor', 'useTint', 'texture', 'imageAspect',
      ]

      const uniforms: Record<string, WebGLUniformLocation | null> = {}
      for (const name of uniformNames) {
        uniforms[name] = gl.getUniformLocation(program, `u_${name}`)
      }

      glRef.current = { gl, program, texture, buffer, uniforms }

      return () => {
        gl.deleteTexture(texture)
        gl.deleteBuffer(buffer)
        gl.deleteProgram(program)
        glRef.current = null
      }
    }, [])

    useEffect(() => {
      if (!imageSrc) {
        setImageLoaded(false)
        return
      }
      const res = glRef.current
      if (!res) return

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const { gl, texture } = res
        imageAspectRef.current = img.naturalWidth / img.naturalHeight
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
        setImageLoaded(true)
      }
      img.onerror = () => {
        console.error('Failed to load image')
        setImageLoaded(false)
      }
      img.src = imageSrc
    }, [imageSrc])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const observer = new ResizeObserver(() => {
        if (imageLoaded || fillPattern) render()
      })
      observer.observe(canvas)
      return () => observer.disconnect()
    }, [imageLoaded, render, fillPattern])

    return (
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    )
  }
)

HalftoneCanvas.displayName = 'HalftoneCanvas'

export default HalftoneCanvas
