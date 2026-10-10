import { MessagesSquare, ShieldCheck, Stethoscope, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useST } from './use-st'

export const ONBOARDING_KEY = 'mq-onboarded'

export function hasOnboarded() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1'
  } catch {
    return true
  }
}

function remember() {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1')
  } catch {
    // storage unavailable: the dialog may show again, which is harmless
  }
}

const STEPS: { key: 'what' | 'loop' | 'safe'; icon: LucideIcon }[] = [
  { key: 'what', icon: Stethoscope },
  { key: 'loop', icon: MessagesSquare },
  { key: 'safe', icon: ShieldCheck },
]

/** First visit only: three short steps, skippable, remembered in localStorage. */
export function OnboardingDialog() {
  const st = useST()
  const [open, setOpen] = useState(() => !hasOnboarded())
  const [step, setStep] = useState(0)
  const current = STEPS[step]!
  const last = step === STEPS.length - 1

  const close = () => {
    remember()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent hideClose aria-describedby="onboarding-body">
        <span className="grid size-12 place-items-center rounded-md bg-primary-quiet text-primary-hover">
          <current.icon size={24} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-2">
          <DialogTitle>{st(`onboarding.${current.key}.title`)}</DialogTitle>
          <DialogDescription id="onboarding-body">{st(`onboarding.${current.key}.body`)}</DialogDescription>
        </div>
        <div className="flex items-center justify-between gap-3">
          <ol className="flex gap-1.5" aria-label={st('onboarding.progress', { n: step + 1, total: STEPS.length })}>
            {STEPS.map((s, i) => (
              <li key={s.key} aria-current={i === step ? 'step' : undefined} className={cn('h-1.5 rounded-full transition-[width,background-color] duration-200', i === step ? 'w-6 bg-primary' : 'w-1.5 bg-line-strong')} />
            ))}
          </ol>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={close}>
              {st('onboarding.skip')}
            </Button>
            <Button onClick={() => (last ? close() : setStep(step + 1))} data-testid="onboarding-next">
              {last ? st('onboarding.start') : st('onboarding.next')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
