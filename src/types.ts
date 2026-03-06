export interface HalftoneSettings {
  colorMode: 'default' | 'light'
  useTint: boolean
  tintColor: string
  previewBgColor: string
  scale: number
  gamma: number
  saturation: number
  brightness: number
  background: boolean
  fillPattern: boolean
  patternOpacity: number
  reveal: boolean
  revealDelay: number
  revealDuration: number
  sparkleIntensity: number
  sparkleSpeed: number
  removeBackground: boolean
  backgroundType: 'transparent' | 'color'
  backgroundColor: string
}

export const DEFAULT_SETTINGS: HalftoneSettings = {
  colorMode: 'default',
  useTint: false,
  tintColor: '#FF6200',
  previewBgColor: '#0a0a0a',
  scale: 10,
  gamma: 1.5,
  saturation: 1,
  brightness: 1,
  background: true,
  fillPattern: false,
  patternOpacity: 0.5,
  reveal: false,
  revealDelay: 0,
  revealDuration: 2,
  sparkleIntensity: 0.8,
  sparkleSpeed: 2,
  removeBackground: false,
  backgroundType: 'transparent',
  backgroundColor: '#000000',
}
