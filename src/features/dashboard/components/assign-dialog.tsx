import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL_CASES } from '@/features/cases/data'
import { useT } from '@/lib/i18n'
import { addAssignment, removeAssignment } from '../assignments'
import { useDt } from '../use-dt'

interface AssignDialogProps {
  studentId: string
  studentName: string
  recommendedCaseId: string | null
  onAssigned: () => void
}

/** "Beri tugas kasus": mock action that writes to localStorage and toasts, with undo. */
export function AssignDialog({ studentId, studentName, recommendedCaseId, onAssigned }: AssignDialogProps) {
  const { dt } = useDt()
  const t = useT()
  const [open, setOpen] = useState(false)
  const [caseId, setCaseId] = useState(recommendedCaseId ?? ALL_CASES[0]!.id)

  const confirm = () => {
    const created = addAssignment(studentId, caseId)
    setOpen(false)
    const title = ALL_CASES.find((c) => c.id === caseId)?.title ?? caseId
    if (!created) {
      toast.error(t('state.error.title'))
      return
    }
    onAssigned()
    toast.success(dt('assign.toast', { case: title, name: studentName }), {
      action: {
        label: dt('assign.undo'),
        onClick: () => {
          removeAssignment(created.id)
          onAssigned()
          toast(dt('assign.undone'))
        },
      },
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setCaseId(recommendedCaseId ?? ALL_CASES[0]!.id)
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button>{dt('assign.action')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dt('assign.title', { name: studentName })}</DialogTitle>
          <DialogDescription>{dt('assign.desc')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="assign-case">{dt('assign.case')}</Label>
          <Select value={caseId} onValueChange={setCaseId}>
            <SelectTrigger id="assign-case">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_CASES.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                  {c.id === recommendedCaseId ? ` (${dt('assign.recommended')})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={confirm}>{dt('assign.confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
