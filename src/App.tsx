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
  'Reveal': { reveal: true, revealDelay: 0.2, revealDuration: 2.5, sparkleIntensity: 0.6 },
  'Light Mode': { colorMode: 'light', scale: 10, gamma: 1.5 },
  
}

export default function App() {
  const [settings, setSettings] = useState<HalftoneSettings>(DEFAULT_SETTINGS)
  const [originalImageSrc, setOriginalImageSrc] = useState<string | null>(null)
  const [processedImageSrc, setProcessedImageSrc] = useState<string | null>(null)
  const [removedBgImageSrc, setRemovedBgImageSrc] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageAspect, setImageAspect] = useState<number | null>(null)
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
  const canvasRef = useRef<HalftoneCanvasHandle>(null)
  const canvasFileInputRef = useRef<HTMLInputElement>(null)

  const handleImageLoad = useCallback((src: string) => {
    setOriginalImageSrc(src)
    const img = new Image()
    img.onload = () => setImageAspect(img.naturalWidth / img.naturalHeight)
    img.src = src
  }, [])

  const handleCanvasFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result) {
        handleImageLoad(e.target.result as string)
      }
    }
    reader.readAsDataURL(file)
  }, [handleImageLoad])

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingCanvas(false)
    const file = e.dataTransfer.files[0]
    if (file) handleCanvasFile(file)
  }, [handleCanvasFile])

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!processedImageSrc && !settings.fillPattern) {
      setIsDraggingCanvas(true)
    }
  }, [processedImageSrc, settings.fillPattern])

  const handleCanvasDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingCanvas(false)
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
        <div className="flex items-center gap-3">
          <ImageUpload
            onImageLoad={handleImageLoad}
            hasImage={!!originalImageSrc}
            compact
          />
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
          <input
            ref={canvasFileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleCanvasFile(file)
            }}
            className="hidden"
          />
          <div
            onClick={() => {
              if (!processedImageSrc && !settings.fillPattern && !isProcessing) {
                canvasFileInputRef.current?.click()
              }
            }}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onDragLeave={handleCanvasDragLeave}
            className={`relative rounded-xl overflow-hidden transition-all ${
              !processedImageSrc && !settings.fillPattern && !isProcessing
                ? 'cursor-pointer border-2 border-dashed hover:border-primary/50 ' +
                  (isDraggingCanvas ? 'border-primary bg-primary/5' : 'border-border')
                : ''
            }`}
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
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                {!isProcessing && (
                  <svg
                    className="w-12 h-12 text-muted-foreground/50 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                )}
                <p className="text-[14px] font-medium text-foreground">
                  {isProcessing ? 'Processing image...' : 'Click or drop an image to start'}
                </p>
                {!isProcessing && (
                  <p className="text-[12px] text-muted-foreground mt-1">
                    PNG, JPG, GIF up to 10MB
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Controls sidebar */}
        <aside className="w-full lg:w-[480px] border-t lg:border-t-0 lg:border-l border-border overflow-y-auto bg-card">
          <div className="p-4 space-y-3.5">
            {/* Presets */}
            <div className="space-y-1.5">
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
              hasImage={!!processedImageSrc}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
