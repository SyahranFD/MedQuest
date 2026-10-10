import { MeterBars } from '@/components/charts/meter-bars'
import { DIMENSIONS } from '@/features/cases/types'
import { useClassOverview } from '../use-dashboard-data'
import { useDt } from '../use-dt'
import { Panel, PanelError, RowsSkeleton } from './panel'

export function CompetencyPanel() {
  const { dt, dimension } = useDt()
  const { data, isPending, isError, refetch } = useClassOverview()
  return (
    <Panel title={dt('competency.title')} description={dt('competency.desc')}>
      {isPending && <RowsSkeleton rows={6} />}
      {isError && <PanelError onRetry={() => void refetch()} />}
      {data && (
        <MeterBars
          rows={DIMENSIONS.map((d) => ({ key: d, label: dimension(d), value: data.dimensionAverages[d] }))}
          describe={(row) => dt('competency.aria', { dim: row.label, value: Math.round(row.value) })}
        />
      )}
    </Panel>
  )
}
