import type { HalftoneSettings } from './types'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider as ShadcnSlider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ControlsProps {
  settings: HalftoneSettings
  onChange: (settings: HalftoneSettings) => void
  onResetAnimation: () => void
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-[13px]">{label}</Label>
        <span className="text-[12px] text-muted-foreground tabular-nums font-mono">
          {value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)}
        </span>
      </div>
      <ShadcnSlider
        min={min}
        max={max}
        step={step}
        value={[value]}
        onValueChange={(values) => onChange(values[0])}
        className="w-full"
      />
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={label} className="text-[13px] cursor-pointer">
        {label}
      </Label>
      <Switch
        id={label}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

export default function Controls({ settings, onChange, onResetAnimation }: ControlsProps) {
  const update = <K extends keyof HalftoneSettings>(
    key: K,
    value: HalftoneSettings[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  const isLight = settings.colorMode === 'light'

  return (
    <div className="space-y-5">
      <Section title="Colour">
        <div className="flex flex-col gap-1.5">
          <Select
            value={settings.colorMode}
            onValueChange={(value) => update('colorMode', value as 'default' | 'light')}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="light">Light</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-[13px]">Preview Background</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.previewBgColor}
              onChange={(e) => update('previewBgColor', e.target.value)}
              className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
            />
            <span className="text-[12px] text-muted-foreground font-mono uppercase">
              {settings.previewBgColor}
            </span>
          </div>
        </div>

        {!isLight && (
          <Toggle
            label="Tint Color"
            checked={settings.useTint}
            onChange={(v) => update('useTint', v)}
          />
        )}

        {!isLight && settings.useTint && (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.tintColor}
              onChange={(e) => update('tintColor', e.target.value)}
              className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
            />
            <span className="text-[12px] text-muted-foreground font-mono uppercase">
              {settings.tintColor}
            </span>
          </div>
        )}
      </Section>

      <Section title="Halftone">
        <Slider
          label="Scale"
          value={settings.scale}
          min={3}
          max={50}
          step={1}
          onChange={(v) => update('scale', v)}
        />
        <Slider
          label="Gamma"
          value={settings.gamma}
          min={0.5}
          max={4}
          step={0.1}
          onChange={(v) => update('gamma', v)}
        />
        {!isLight && !settings.useTint && (
          <Slider
            label="Saturation"
            value={settings.saturation}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => update('saturation', v)}
          />
        )}
        {!isLight && (
          <Slider
            label="Brightness"
            value={settings.brightness}
            min={0.5}
            max={3}
            step={0.05}
            onChange={(v) => update('brightness', v)}
          />
        )}
      </Section>

      <Section title="Background">
        <div className="space-y-3">
          <Toggle
            label="Remove Image Background"
            checked={settings.removeBackground}
            onChange={(v) => update('removeBackground', v)}
          />
          {settings.removeBackground && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[13px]">Replacement</Label>
                <Select
                  value={settings.backgroundType}
                  onValueChange={(value) => update('backgroundType', value as 'transparent' | 'color')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transparent">Transparent (PNG)</SelectItem>
                    <SelectItem value="color">Solid Color</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings.backgroundType === 'color' && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => update('backgroundColor', e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <span className="text-[12px] text-muted-foreground font-mono uppercase">
                    {settings.backgroundColor}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </Section>

      <Section title="Halftone Pattern">
        {!isLight && (
          <div className="space-y-1.5">
            <Toggle
              label="White Background Fill"
              checked={settings.background}
              onChange={(v) => update('background', v)}
            />
            <p className="text-[11px] text-muted-foreground">
              Adds white fill behind halftone dots
            </p>
          </div>
        )}
        <Toggle
          label="Fill Empty Areas"
          checked={settings.fillPattern}
          onChange={(v) => update('fillPattern', v)}
        />
        {settings.fillPattern && (
          <Slider
            label="Pattern Opacity"
            value={settings.patternOpacity}
            min={0.05}
            max={1}
            step={0.05}
            onChange={(v) => update('patternOpacity', v)}
          />
        )}
      </Section>

      <Section title="Animation">
        <Toggle
          label="Reveal"
          checked={settings.reveal}
          onChange={(v) => {
            update('reveal', v)
            if (v) onResetAnimation()
          }}
        />
        {settings.reveal && (
          <>
            <Slider
              label="Reveal Delay"
              value={settings.revealDelay}
              min={0}
              max={5}
              step={0.1}
              onChange={(v) => update('revealDelay', v)}
            />
            <Slider
              label="Reveal Duration"
              value={settings.revealDuration}
              min={0.5}
              max={10}
              step={0.1}
              onChange={(v) => update('revealDuration', v)}
            />
          </>
        )}
        <Slider
          label="Sparkle"
          value={settings.sparkleIntensity}
          min={0}
          max={1}
          step={0.05}
          onChange={(v) => update('sparkleIntensity', v)}
        />
        <Slider
          label="Sparkle Speed"
          value={settings.sparkleSpeed}
          min={0.5}
          max={10}
          step={0.1}
          onChange={(v) => update('sparkleSpeed', v)}
        />
      </Section>
    </div>
  )
}
