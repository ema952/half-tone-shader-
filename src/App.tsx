import { useState, useRef, useCallback, useEffect } from 'react'
import HalftoneCanvas from './HalftoneCanvas'
import type { HalftoneCanvasHandle } from './HalftoneCanvas'
import Controls from './Controls'
import ImageUpload from './ImageUpload'
import { DEFAULT_SETTINGS } from './types'
import type { HalftoneSettings } from './types'
import { removeBackground } from '@imgly/background-removal'
import { Button } from '@/components/ui/button'
import ExportDropdown from './components/ExportDropdown'

const PRESETS: Record<string, Partial<HalftoneSettings>> = {
  'Default': {},
  'Bold': { scale: 18, gamma: 2.5, brightness: 1.3, sparkleIntensity: 0 },
  'Fine': { scale: 5, gamma: 1.2, brightness: 1, sparkleIntensity: 0.3 },
  'Orange Tint': { useTint: true, tintColor: '#FF6200', scale: 12, gamma: 1.8 },
  'Light Mode': { colorMode: 'light', scale: 10, gamma: 1.5 },
  'Reveal': { reveal: true, revealDelay: 0.2, revealDuration: 2.5, sparkleIntensity: 0.6 },
}

export default function App() {
  const [settings, setSettings] = useState<HalftoneSettings>(DEFAULT_SETTINGS)
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null)
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null)
  const [removedBgImageSrc, setRemovedBgImageSrc] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageAspect, setImageAspect] = useState<number | null>(null)
  const canvasRef = useRef<HalftoneCanvasHandle>(null)

  const handleImageLoad = useCallback((src: string) => {
    setOriginalImageSrc(src)
    const img = new Image()
    img.onload = () => setImageAspect(img.naturalWidth / img.naturalHeight)
    img.src = src
  }, [])

  const handleResetAnimation = useCallback(() => {
    canvasRef.current?.resetAnimation()
  }, [])

  // Step 1: Remove background when toggle is enabled (expensive operation)
  useEffect(() => {
    if (!originalImageSrc) {
      setRemovedBgImageSrc(null)
      return
    }

    if (!settings.removeBackground) {
      setRemovedBgImageSrc(null)
      return
    }

    const processImage = async () => {
      setIsProcessing(true)
      try {
        const blob = await removeBackground(originalImageSrc)
        setRemovedBgImageSrc(URL.createObjectURL(blob))
      } catch (error) {
        console.error('Background removal failed:', error)
        setRemovedBgImageSrc(null)
      } finally {
        setIsProcessing(false)
      }
    }

    processImage()
  }, [originalImageSrc, settings.removeBackground])

  // Step 2: Apply background color to removed-bg image (fast operation)
  useEffect(() => {
    if (!originalImageSrc) {
      setProcessedImageSrc(null)
      return
    }

    if (!settings.removeBackground) {
      setProcessedImageSrc(originalImageSrc)
      return
    }

    if (!removedBgImageSrc) {
      return
    }

    if (settings.backgroundType === 'transparent') {
      setProcessedImageSrc(removedBgImageSrc)
      return
    }

    // Apply background color
    const applyBackgroundColor = async () => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = removedBgImageSrc

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.fillStyle = settings.backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)

        canvas.toBlob((resultBlob) => {
          if (resultBlob) {
            setProcessedImageSrc(URL.createObjectURL(resultBlob))
          }
        })
      }
    }

    applyBackgroundColor()
  }, [originalImageSrc, removedBgImageSrc, settings.removeBackground, settings.backgroundType, settings.backgroundColor])

  const handlePreset = useCallback(
    (name: string) => {
      const preset = PRESETS[name]
      if (preset) {
        setSettings({ ...DEFAULT_SETTINGS, ...preset })
        setTimeout(() => canvasRef.current?.resetAnimation(), 50)
      }
    },
    []
  )

  const animationDuration = settings.reveal
    ? settings.revealDelay + settings.revealDuration + 1
    : 3

  return (
    <div className="min-h-screen bg-background flex flex-col dark">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <h1 className="text-[15px] font-semibold tracking-[0.03em] text-foreground" style={{ fontFamily: "'Grotesk Remix', sans-serif" }}>
          Anam Halftone Generator
        </h1>
        <div className="flex items-center gap-4">
         
          <span className="text-[11px] text-muted-foreground">
            WebGL shader tool
          </span>
          <ExportDropdown
            canvasRef={canvasRef}
            hasImage={!!processedImageSrc || settings.fillPattern}
            animationDuration={animationDuration}
          />
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Preview */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-10 min-h-[400px] overflow-hidden">
          <div
            className="relative rounded-xl overflow-hidden"
            style={{
              backgroundColor: settings.previewBgColor,
              ...(imageAspect
                ? {
                    aspectRatio: String(imageAspect),
                    width: `min(100%, calc(calc(100vh - 120px) * ${imageAspect}))`,
                  }
                : { width: '100%', minHeight: '300px' }),
            }}
          >
            <HalftoneCanvas
              ref={canvasRef}
              imageSrc={processedImageSrc}
              settings={settings}
            />
            {!processedImageSrc && !settings.fillPattern && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <p className="text-[13px] text-muted-foreground">
                  {isProcessing ? 'Processing image...' : 'Upload an image to preview'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Controls sidebar */}
        <aside className="w-full lg:w-[320px] border-t lg:border-t-0 lg:border-l border-border overflow-y-auto bg-card">
          <div className="p-5 space-y-6">
            <ImageUpload
              onImageLoad={handleImageLoad}
              hasImage={!!originalImageSrc}
            />

            {/* Presets */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Presets
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(PRESETS).map((name) => (
                  <Button
                    key={name}
                    onClick={() => handlePreset(name)}
                    variant="outline"
                    size="sm"
                    className="h-7 text-[12px]"
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </div>

            <Controls
              settings={settings}
              onChange={setSettings}
              onResetAnimation={handleResetAnimation}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
