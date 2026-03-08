import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import ExportEmbedDialog from './ExportEmbedDialog'
import { useExport } from '../useExport'
import type { HalftoneCanvasHandle } from '../HalftoneCanvas'
import { CaretDown, Image, FilmStrip, VideoCamera, FileHtml } from '@phosphor-icons/react'

interface ExportDropdownProps {
  canvasRef: React.RefObject<HalftoneCanvasHandle | null>
  hasImage: boolean
  animationDuration: number
}

export default function ExportDropdown({ canvasRef, hasImage, animationDuration }: ExportDropdownProps) {
  const { status, progress, exportPNG, exportGIF, exportVideo, cancelExport } = useExport()
  const [showEmbedDialog, setShowEmbedDialog] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  const getCanvas = () => canvasRef.current?.getCanvas() ?? null
  const resetAnimation = () => canvasRef.current?.resetAnimation()

  const isExporting = status !== 'idle'

  const handleExportPNG = () => {
    const canvas = getCanvas()
    if (canvas) exportPNG(canvas)
    setIsOpen(false)
  }

  const handleExportGIF = () => {
    const canvas = getCanvas()
    if (canvas) exportGIF(canvas, animationDuration, resetAnimation)
    setIsOpen(false)
  }

  const handleExportVideo = () => {
    const canvas = getCanvas()
    if (canvas) exportVideo(canvas, animationDuration, resetAnimation)
    setIsOpen(false)
  }

  const handleExportEmbed = () => {
    setShowEmbedDialog(true)
    setIsOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      {/* Export Progress Indicator (shown when exporting) */}
      {isExporting && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-24 h-1 bg-background rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-150"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums font-mono whitespace-nowrap">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <Button
            onClick={cancelExport}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-[11px]"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Export Dropdown */}
      {!isExporting && (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="sm" className="gap-1.5 focus-visible:ring-0 focus-visible:ring-offset-0">
              Export
              <CaretDown className="size-3.5" weight="bold" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 dark">
            <DropdownMenuItem
              disabled={!hasImage}
              onClick={handleExportPNG}
              className="gap-2 cursor-pointer"
            >
              <Image className="size-4" />
              <span>Export as PNG</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!hasImage}
              onClick={handleExportGIF}
              className="gap-2 cursor-pointer"
            >
              <FilmStrip className="size-4" />
              <span>Export as GIF</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!hasImage}
              onClick={handleExportVideo}
              className="gap-2 cursor-pointer"
            >
              <VideoCamera className="size-4" />
              <span>Export as Video</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleExportEmbed}
              className="gap-2 cursor-pointer"
            >
              <FileHtml className="size-4" />
              <span>Export as Embed</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Embed Dialog */}
      <ExportEmbedDialog
        open={showEmbedDialog}
        onOpenChange={setShowEmbedDialog}
      />
    </div>
  )
}
