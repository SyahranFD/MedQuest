import { LineChart } from '@/components/charts/line-chart'
import { Skeleton } from '@/components/ui/skeleton'
import { useDt } from '../use-dt'
import { useWeeklyTrend } from '../use-dashboard-data'
import { Panel, PanelError } from './panel'

export function TrendPanel() {
  const { dt } = useDt()
  const { data, isPending, isError, refetch } = useWeeklyTrend()
  const scored = data?.filter((p) => p.averagePercent !== null) ?? []
  const first = scored[0]
  const last = scored[scored.length - 1]
  return (
    <Panel title={dt('trend.title')} description={dt('trend.desc')}>
      {isPending && <Skeleton className="h-64 w-full" />}
      {isError && <PanelError onRetry={() => void refetch()} />}
      {data && first && last && (
        <LineChart
          label={dt('trend.label')}
          summary={dt('trend.summary', { first: first.averagePercent!, last: last.averagePercent!, week: last.week })}
          tableLabel={dt('chart.table')}
          xHeader={dt('chart.week')}
          hint={dt('chart.hint')}
          xLabels={data.map((p) => dt('chart.weekShort', { n: p.week }))}
          xTitles={data.map((p) => `${dt('chart.week')} ${p.week}`)}
          series={[
            { id: 'score', label: dt('trend.score'), values: data.map((p) => p.averagePercent), tone: 'primary' },
            { id: 'empathy', label: dt('trend.empathy'), values: data.map((p) => p.averageEmpathy), tone: 'ink' },
          ]}
        />
      )}
    </Panel>
  )
}
