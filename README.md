# @anam-ai/halftone-shader

A React component that renders a real-time WebGL halftone effect on images. No pre-exported files — the effect runs live in the browser on a `<canvas>` element, making it the right format for web applications.


![anam halftone shader demo](src/assets/anam-halftone-shader-demo.gif)

Demo: [half-tone-shader.vercel.app](https://half-tone-shader.vercel.app)

## Install

```bash
npm install @anam-ai/halftone-shader
```

## Usage

```tsx
import { HalftoneCanvas, DEFAULT_SETTINGS } from '@anam-ai/halftone-shader'

function App() {
  return (
    <div style={{ width: 600, height: 400 }}>
      <HalftoneCanvas
        imageSrc="/your-image.png"
        settings={DEFAULT_SETTINGS}
      />
    </div>
  )
}
```

The canvas fills its parent container. Size it with CSS.

## Settings

Pass a `settings` object to control the effect. Start with `DEFAULT_SETTINGS` and override what you need:

```tsx
import { HalftoneCanvas, DEFAULT_SETTINGS } from '@anam-ai/halftone-shader'

const settings = {
  ...DEFAULT_SETTINGS,
  scale: 12,
  sparkleIntensity: 0.5,
  useTint: true,
  tintColor: '#FF6200',
}
```

| Setting | Type | Default | Description |
|---|---|---|---|
| `scale` | `number` | `10` | Dot grid size in pixels |
| `gamma` | `number` | `1.5` | Controls dot size relative to image luminance |
| `saturation` | `number` | `1` | Color saturation of dots |
| `brightness` | `number` | `1` | Dot brightness |
| `colorMode` | `'default' \| 'light'` | `'default'` | `'light'` renders white dots with variable opacity |
| `background` | `boolean` | `true` | Render a white background behind the dots |
| `useTint` | `boolean` | `false` | Apply a single tint color to all dots |
| `tintColor` | `string` | `'#FF6200'` | Hex or RGB color for the tint |
| `fillPattern` | `boolean` | `false` | Fill empty (non-image) areas with an animated dot pattern |
| `patternOpacity` | `number` | `0.5` | Opacity of the fill pattern |
| `sparkleIntensity` | `number` | `0.8` | How strongly dots twinkle (0 = none) |
| `sparkleSpeed` | `number` | `2` | Speed of the sparkle animation |
| `reveal` | `boolean` | `false` | Animate dots appearing on load |
| `revealDelay` | `number` | `0` | Seconds before reveal starts |
| `revealDuration` | `number` | `2` | Seconds for reveal to complete |

## Ref handle

Use the ref to access the underlying canvas (e.g. to export a frame) or reset the animation:

```tsx
import { useRef } from 'react'
import { HalftoneCanvas, HalftoneCanvasHandle } from '@anam-ai/halftone-shader'

function App() {
  const ref = useRef<HalftoneCanvasHandle>(null)

  const exportFrame = () => {
    const canvas = ref.current?.getCanvas()
    // canvas.toDataURL(), canvas.toBlob(), etc.
  }

  const restart = () => {
    ref.current?.resetAnimation()
  }

  return (
    <HalftoneCanvas
      ref={ref}
      imageSrc="/your-image.png"
      settings={DEFAULT_SETTINGS}
    />
  )
}
```

## How it works

The component initialises a WebGL context on a `<canvas>` element and runs a custom GLSL fragment shader. Each frame, the shader:

1. Divides the canvas into a grid of cells based on `scale`
2. Samples the image color at each cell center
3. Derives dot size from the luminance of that pixel
4. Renders antialiased circles with optional sparkle animation via `requestAnimationFrame`

The image never gets rasterized or exported — everything is computed on the GPU in real time.

## Requirements

- React 18+
- A browser with WebGL support (all modern browsers)
