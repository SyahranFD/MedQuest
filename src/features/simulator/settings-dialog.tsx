import { useQueryClient } from '@tanstack/react-query'
import { RotateCcw, Settings2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { clearSessionResults } from '@/features/session/repository'
import { useSessionStore } from '@/features/session/store'
import { useUiStore } from '@/stores/ui'
import type { Locale, MotionPreference, Quality } from '@/stores/ui'
import { cn } from '@/lib/utils'
import { Segmented } from './segmented'
import { clearTraces } from './session-flow'
import { ONBOARDING_KEY } from './onboarding-dialog'
import { useST } from './use-st'

/** Wipes everything the demo stored: sessions, traces and the onboarding flag. UI preferences stay. */
export async function resetDemoData() {
  await clearSessionResults()
  clearTraces()
  try {
    localStorage.removeItem(ONBOARDING_KEY)
  } catch {
    // storage unavailable: nothing to remove
  }
  useSessionStore.getState().reset()
}

export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const st = useST()
  const qc = useQueryClient()
  const { locale, quality, reducedMotion, setLocale, setQuality, setReducedMotion } = useUiStore()
  const [confirming, setConfirming] = useState(false)

  const reset = async () => {
    await resetDemoData()
    await qc.invalidateQueries()
    setConfirming(false)
    onOpenChange(false)
    toast.success(st('settings.resetDone'))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirming(false)
        onOpenChange(o)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{st('settings.title')}</DialogTitle>
          <DialogDescription>{st('settings.body')}</DialogDescription>
        </DialogHeader>

        <Segmented<Locale>
          label={st('settings.language')}
          value={locale}
          onChange={setLocale}
          options={[
            { value: 'id', label: 'Indonesia' },
            { value: 'en', label: 'English' },
          ]}
        />
        <Segmented<Quality>
          label={st('settings.quality')}
          hint={st('settings.qualityHint')}
          value={quality}
          onChange={setQuality}
          options={[
            { value: 'auto', label: st('settings.q.auto') },
            { value: 'high', label: st('settings.q.high') },
            { value: 'lite', label: st('settings.q.lite') },
          ]}
        />
        <Segmented<MotionPreference>
          label={st('settings.motion')}
          hint={st('settings.motionHint')}
          value={reducedMotion}
          onChange={setReducedMotion}
          options={[
            { value: 'system', label: st('settings.m.system') },
            { value: 'reduce', label: st('settings.m.reduce') },
            { value: 'full', label: st('settings.m.full') },
          ]}
        />

        <div className={cn('flex flex-col gap-2 border-t border-line pt-4')}>
          <p className="text-body-s font-semibold text-ink-1">{st('settings.data')}</p>
          <p className="text-body-s text-ink-2">{st('settings.dataBody')}</p>
          {confirming ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" onClick={reset} data-testid="reset-confirm">
                {st('settings.resetConfirm')}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                {st('end.back')}
              </Button>
            </div>
          ) : (
            <Button variant="secondary" className="self-start" onClick={() => setConfirming(true)}>
              <RotateCcw aria-hidden="true" />
              {st('settings.reset')}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Icon button that owns its own settings dialog; used in the shell bar and in the encounter. */
export function SettingsButton({ className }: { className?: string }) {
  const st = useST()
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="icon" className={className} aria-label={st('settings.title')} onClick={() => setOpen(true)}>
        <Settings2 aria-hidden="true" />
      </Button>
      <SettingsDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
