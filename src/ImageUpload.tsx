import { useCallback, useState, useRef } from 'react'

interface ImageUploadProps {
  onImageLoad: (src: string) => void
  hasImage: boolean
}

export default function ImageUpload({ onImageLoad, hasImage }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          onImageLoad(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    },
    [onImageLoad]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
        className="hidden"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          w-full rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer
          ${
            isDragging
              ? 'border-primary bg-primary/5'
              : hasImage
                ? 'border-border hover:border-muted-foreground py-2'
                : 'border-border hover:border-muted-foreground py-6'
          }
        `}
      >
        <div className="flex flex-col items-center gap-1 px-4">
          {!hasImage && (
            <svg
              className="w-6 h-6 text-muted-foreground mb-1"
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
          <span className="text-[13px] text-foreground">
            {hasImage ? 'Change image' : 'Upload image'}
          </span>
          {!hasImage && (
            <span className="text-[11px] text-muted-foreground">
              Drop an image or click to browse
            </span>
          )}
        </div>
      </button>
    </div>
  )
}
