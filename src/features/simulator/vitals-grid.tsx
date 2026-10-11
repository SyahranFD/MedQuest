import { Brain, Check, Droplets, Gauge, HeartPulse, Thermometer, Wind, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { Vitals } from '@/features/cases/types'
import { cn } from '@/lib/utils'
import { useST } from './use-st'
import { LEVEL_VARIANT, vitalStatus, type VitalKey } from './vital-range'

const CELLS: { key: VitalKey; icon: LucideIcon; unit: string; value: (v: Vitals) => string }[] = [
  { key: 'hr', icon: HeartPulse, unit: '/mnt', value: (v) => String(Math.round(v.hr)) },
  { key: 'bp', icon: Gauge, unit: 'mmHg', value: (v) => `${Math.round(v.sbp)}/${Math.round(v.dbp)}` },
  { key: 'rr', icon: Wind, unit: '/mnt', value: (v) => String(Math.round(v.rr)) },
  { key: 'spo2', icon: Droplets, unit: '%', value: (v) => String(Math.round(v.spo2)) },
  { key: 'temp', icon: Thermometer, unit: 'C', value: (v) => v.temp.toFixed(1) },
  { key: 'gcs', icon: Brain, unit: '', value: (v) => String(Math.round(v.gcs)) },
]

/** The six vital signs with icon, big value and a solid condition chip when outside the adult range. Shared by the exam tab and the case brief. */
export function VitalsGrid({ vitals, className }: { vitals: Vitals; className?: string }) {
  const st = useST()
  return (
    <dl className={cn('grid grid-cols-2 gap-2 sm:grid-cols-3', className)} data-testid="vitals-grid">
      {CELLS.map(({ key, icon: Icon, unit, value }) => {
        const status = vitalStatus(key, vitals)
        return (
          <div key={key} className="flex min-w-0 flex-col gap-1.5 rounded-md border border-line bg-surface p-3" data-level={status.level}>
            <dt className="flex items-center gap-2 text-meta font-medium text-ink-3">
              <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span className="truncate">{st(`vitals.${key}`)}</span>
            </dt>
            <dd className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-title font-semibold text-ink-1 tabular-nums">
                {value(vitals)}
                {unit && <span className="ml-1 text-meta font-normal text-ink-3">{unit}</span>}
              </span>
              {status.labelKey ? (
                <Badge variant={LEVEL_VARIANT[status.level as keyof typeof LEVEL_VARIANT]}>{st(status.labelKey)}</Badge>
              ) : (
                <>
                  <Check className="size-4 text-ink-4" strokeWidth={2} aria-hidden="true" />
                  <span className="sr-only">{st('orders.normal')}</span>
                </>
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
