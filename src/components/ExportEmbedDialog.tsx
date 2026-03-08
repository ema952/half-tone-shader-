import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy, Check } from '@phosphor-icons/react'

interface ExportEmbedDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children?: React.ReactNode
}

export default function ExportEmbedDialog({ open, onOpenChange, children }: ExportEmbedDialogProps) {
  const [copiedTab, setCopiedTab] = useState<string | null>(null)

  const copyToClipboard = async (text: string, tabId: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedTab(tabId)
    setTimeout(() => setCopiedTab(null), 2000)
  }

  const reactCode = `import HalftoneCanvas from './HalftoneCanvas'

export default function MyComponent() {
  return (
    <HalftoneCanvas
      imageSrc="/your-image.jpg"
      width={800}
      height={600}
      settings={{
        scale: 12,
        gamma: 1.8,
        brightness: 1.0,
        colorMode: 'dark'
      }}
    />
  )
}`

  const nextjsCode = `import HalftoneCanvas from '@/components/HalftoneCanvas'

export default function Page() {
  return (
    <div className="w-full h-screen">
      <HalftoneCanvas
        imageSrc="/your-image.jpg"
        width={800}
        height={600}
        settings={{
          scale: 12,
          gamma: 1.8,
          brightness: 1.0,
          colorMode: 'dark'
        }}
      />
    </div>
  )
}`

  const vanillaCode = `<!-- Add to your HTML -->
<canvas id="halftone-canvas" width="800" height="600"></canvas>

<!-- Include the WebGL shader -->
<script src="/path/to/halftone-shader.js"></script>
<script>
  const canvas = document.getElementById('halftone-canvas');
  const halftone = new HalftoneEffect(canvas, {
    imageSrc: '/your-image.jpg',
    scale: 12,
    gamma: 1.8,
    brightness: 1.0,
    colorMode: 'dark'
  });
  halftone.init();
</script>`

  const llmInstructions = `# Anam Halftone Generator Integration

I want to integrate the Anam Halftone WebGL shader into my project.

## For React / Vite

Copy the following files to your project:
- \`HalftoneCanvas.tsx\` (main component)
- \`halftoneShader.ts\` (WebGL shader logic)
- \`types.ts\` (TypeScript definitions)

**Basic Usage:**
\`\`\`jsx
import HalftoneCanvas from './HalftoneCanvas'

export default function MyComponent() {
  return (
    <HalftoneCanvas
      imageSrc="/your-image.jpg"
      width={800}
      height={600}
      settings={{
        scale: 12,           // Dot size (5-30)
        gamma: 1.8,          // Contrast (0.5-3.0)
        brightness: 1.0,     // Brightness (0-2)
        colorMode: 'dark',   // 'dark' or 'light'
        sparkleIntensity: 0.3, // Sparkle effect (0-1)
        reveal: false,       // Animated reveal
        useTint: false,      // Apply color tint
        tintColor: '#FF6200' // Tint color (hex)
      }}
    />
  )
}
\`\`\`

## For Next.js

Same as React, but import from your components directory:
\`\`\`jsx
import HalftoneCanvas from '@/components/HalftoneCanvas'
\`\`\`

Make sure to use \`'use client'\` directive if using App Router.

## Settings Reference

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| \`scale\` | number | 5-30 | Halftone dot size |
| \`gamma\` | number | 0.5-3.0 | Image contrast |
| \`brightness\` | number | 0-2 | Image brightness |
| \`colorMode\` | string | 'dark'/'light' | Black or white dots |
| \`sparkleIntensity\` | number | 0-1 | Random sparkle effect |
| \`reveal\` | boolean | - | Enable reveal animation |
| \`revealDelay\` | number | 0-5 | Delay before reveal (seconds) |
| \`revealDuration\` | number | 0-10 | Reveal animation duration |
| \`useTint\` | boolean | - | Apply color tint |
| \`tintColor\` | string | hex | Tint color |
| \`removeBackground\` | boolean | - | Remove image background |

## Important Notes

- The canvas requires explicit width and height
- WebGL support is required (check with \`canvas.getContext('webgl2')\`)
- Background removal requires \`@imgly/background-removal\` package
- Images must be same-origin or CORS-enabled
- For best performance, use square or near-square images

## Performance Tips

- Use lower \`scale\` values (5-10) for better performance
- Disable \`reveal\` animation if not needed
- Avoid background removal for real-time use
- Preload images before rendering

## Links
- GitHub: [Your repository URL]
- Demo: [Your demo URL]
- Docs: [Your documentation URL]`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="dark max-w-[calc(100vw-2rem)] w-full sm:max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle className="text-base">Export as Embed</DialogTitle>
          <DialogDescription className="text-xs">
            Copy the code to integrate the halftone generator into your project
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="react" className="w-full flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 shrink-0">
            <TabsTrigger value="react">React/Vite</TabsTrigger>
            <TabsTrigger value="nextjs">Next.js</TabsTrigger>
            <TabsTrigger value="vanilla">Vanilla JS</TabsTrigger>
            <TabsTrigger value="llm">LLM Docs</TabsTrigger>
          </TabsList>

          <TabsContent value="react" className="flex-1 min-h-0 overflow-y-auto">
            <div className="relative pb-4">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-[11px] leading-relaxed text-foreground">
                <code>{reactCode}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 h-7"
                onClick={() => copyToClipboard(reactCode, 'react')}
              >
                {copiedTab === 'react' ? (
                  <>
                    <Check className="size-3.5 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="nextjs" className="flex-1 min-h-0 overflow-y-auto">
            <div className="relative pb-4">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-[11px] leading-relaxed text-foreground">
                <code>{nextjsCode}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 h-7"
                onClick={() => copyToClipboard(nextjsCode, 'nextjs')}
              >
                {copiedTab === 'nextjs' ? (
                  <>
                    <Check className="size-3.5 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="vanilla" className="flex-1 min-h-0 overflow-y-auto">
            <div className="relative pb-4">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-[11px] leading-relaxed text-foreground">
                <code>{vanillaCode}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 h-7"
                onClick={() => copyToClipboard(vanillaCode, 'vanilla')}
              >
                {copiedTab === 'vanilla' ? (
                  <>
                    <Check className="size-3.5 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="llm" className="flex-1 min-h-0 overflow-y-auto">
            <div className="relative pb-4">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-[11px] leading-relaxed text-foreground whitespace-pre-wrap break-words">
                <code>{llmInstructions}</code>
              </pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 h-7"
                onClick={() => copyToClipboard(llmInstructions, 'llm')}
              >
                {copiedTab === 'llm' ? (
                  <>
                    <Check className="size-3.5 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5 mr-1.5" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
