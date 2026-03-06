import { useState, useCallback, useRef } from 'react'
import { saveAs } from 'file-saver'
// @ts-expect-error gif.js has no types
import GIF from 'gif.js'

type ExportStatus = 'idle' | 'recording' | 'encoding' | 'done'

export function useExport() {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [progress, setProgress] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  const exportPNG = useCallback((canvas: HTMLCanvasElement) => {
    canvas.toBlob((blob) => {
      if (blob) saveAs(blob, 'halftone.png')
    }, 'image/png')
  }, [])

  const exportGIF = useCallback(
    (canvas: HTMLCanvasElement, duration: number = 3, resetAnimation: () => void) => {
      setStatus('recording')
      setProgress(0)

      const fps = 20
      const totalFrames = Math.round(duration * fps)
      const frameInterval = 1000 / fps

      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: canvas.width,
        height: canvas.height,
        workerScript: '/gif.worker.js',
      })

      resetAnimation()

      let frameCount = 0

      const captureFrame = () => {
        if (frameCount >= totalFrames) {
          setStatus('encoding')
          gif.render()
          return
        }

        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = canvas.width
        tempCanvas.height = canvas.height
        const ctx = tempCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(canvas, 0, 0)
          gif.addFrame(tempCanvas, { delay: frameInterval, copy: true })
        }

        frameCount++
        setProgress(frameCount / totalFrames)
        setTimeout(captureFrame, frameInterval)
      }

      gif.on('finished', (blob: Blob) => {
        saveAs(blob, 'halftone.gif')
        setStatus('idle')
        setProgress(0)
      })

      setTimeout(captureFrame, 100)
    },
    []
  )

  const exportVideo = useCallback(
    (canvas: HTMLCanvasElement, duration: number = 4, resetAnimation: () => void) => {
      setStatus('recording')
      setProgress(0)

      resetAnimation()

      const stream = canvas.captureStream(30)
      const chunks: BlobPart[] = []

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5_000_000,
      })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        saveAs(blob, 'halftone.webm')
        setStatus('idle')
        setProgress(0)
        mediaRecorderRef.current = null
      }

      recorder.start(100)

      const startTime = Date.now()
      const updateProgress = () => {
        const elapsed = (Date.now() - startTime) / 1000
        setProgress(Math.min(elapsed / duration, 1))
        if (elapsed < duration) {
          requestAnimationFrame(updateProgress)
        }
      }
      requestAnimationFrame(updateProgress)

      setTimeout(() => {
        recorder.stop()
        setStatus('encoding')
        setTimeout(() => setStatus('idle'), 500)
      }, duration * 1000)
    },
    []
  )

  const cancelExport = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setStatus('idle')
    setProgress(0)
  }, [])

  return { status, progress, exportPNG, exportGIF, exportVideo, cancelExport }
}
