import { useExport } from './useExport'
import type { HalftoneCanvasHandle } from './HalftoneCanvas'
import { Button } from '@/components/ui/button'

interface ExportPanelProps {
  canvasRef: React.RefObject<HalftoneCanvasHandle | null>
  hasImage: boolean
  animationDuration: number
}

export default function ExportPanel({ canvasRef, hasImage, animationDuration }: ExportPanelProps) {
  const { status, progress, exportPNG, exportGIF, exportVideo, cancelExport } = useExport()

  const getCanvas = () => canvasRef.current?.getCanvas() ?? null
  const resetAnimation = () => canvasRef.current?.resetAnimation()

  const isExporting = status !== 'idle'

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        Export
      </h3>

      {isExporting && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-foreground">
              {status === 'recording' ? 'Recording...' : 'Encoding...'}
            </span>
            <span className="text-muted-foreground tabular-nums font-mono">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-150"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <Button
            onClick={cancelExport}
            variant="ghost"
            size="sm"
            className="w-full h-8 text-[12px]"
          >
            Cancel
          </Button>
        </div>
      )}

      {!isExporting && (
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => {
              const canvas = getCanvas()
              if (canvas) exportPNG(canvas)
            }}
            disabled={!hasImage}
            className="h-9 text-[13px]"
          >
            PNG
          </Button>
          <Button
            onClick={() => {
              const canvas = getCanvas()
              if (canvas) exportGIF(canvas, animationDuration, resetAnimation)
            }}
            disabled={!hasImage}
            variant="outline"
            className="h-9 text-[13px]"
          >
            GIF
          </Button>
          <Button
            onClick={() => {
              const canvas = getCanvas()
              if (canvas) exportVideo(canvas, animationDuration, resetAnimation)
            }}
            disabled={!hasImage}
            variant="outline"
            className="h-9 text-[13px]"
          >
            Video
          </Button>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {!hasImage
          ? 'Upload an image to enable export'
          : 'PNG exports a still frame. GIF and Video capture animation.'}
      </p>
    </div>
  )
}
