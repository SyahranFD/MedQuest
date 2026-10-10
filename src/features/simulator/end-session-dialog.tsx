import { TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { Session } from '@/features/session/types'
import { unfinishedItems } from './case-meta'
import { useST } from './use-st'

export interface Checklist {
  sum: boolean
  safe: boolean
  ice: boolean
}

interface EndSessionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: Session
  busy: boolean
  onConfirm: (checklist: Checklist) => void
}

const ITEMS = ['sum', 'safe', 'ice'] as const

export function EndSessionDialog({ open, onOpenChange, session, busy, onConfirm }: EndSessionDialogProps) {
  const st = useST()
  const [checklist, setChecklist] = useState<Checklist>({ sum: false, safe: false, ice: false })
  const unfinished = unfinishedItems(session)

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent hideClose={busy} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{st('end.title')}</DialogTitle>
          <DialogDescription>{st('end.body')}</DialogDescription>
        </DialogHeader>

        {unfinished.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-md border border-warning p-3.5" data-testid="end-unfinished">
            <p className="flex items-center gap-2 text-body-s font-semibold text-ink-1">
              <TriangleAlert className="size-4" aria-hidden="true" />
              {st('end.unfinished')}
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-body-s text-ink-2">
              {unfinished.map((u, i) => (
                <li key={i}>{st(`end.item.${u.key}`, { name: u.name, n: u.count ?? 0 })}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="rounded-md border border-line bg-panel p-3.5 text-body-s text-ink-2">{st('end.allDone')}</p>
        )}

        <fieldset className="flex flex-col gap-3">
          <legend className="pb-1 text-body-s font-semibold text-ink-1">{st('end.checklist')}</legend>
          {ITEMS.map((k) => (
            <div key={k} className="flex items-center justify-between gap-4">
              <Label htmlFor={`chk-${k}`} className="flex-1 text-body-s font-normal text-ink-2">
                {st(`end.check.${k}`)}
              </Label>
              <Switch id={`chk-${k}`} checked={checklist[k]} onCheckedChange={(v) => setChecklist((c) => ({ ...c, [k]: v }))} />
            </div>
          ))}
        </fieldset>

        <DialogFooter>
          <Button variant="secondary" disabled={busy} onClick={() => onOpenChange(false)}>
            {st('end.back')}
          </Button>
          <Button disabled={busy} onClick={() => onConfirm(checklist)} data-testid="end-confirm">
            {busy ? st('end.grading') : st('end.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
