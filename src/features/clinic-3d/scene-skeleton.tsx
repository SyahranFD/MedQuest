import { Skeleton } from '@/components/ui/skeleton'
import { useClinicCopy } from './copy'

/** Suspense loader while the 3D chunk downloads: same footprint as the scene. */
export function SceneSkeleton() {
  const copy = useClinicCopy()
  return (
    <div role="status" aria-label={copy.loading} className="absolute inset-0 overflow-hidden rounded-[inherit] bg-panel">
      <Skeleton className="absolute inset-x-0 bottom-0 h-[38%] rounded-none" />
      <Skeleton className="absolute left-[8%] top-[14%] h-[34%] w-[24%] rounded-md" />
      <Skeleton className="absolute bottom-[26%] left-[40%] h-[30%] w-[18%] rounded-full" />
      <Skeleton className="absolute bottom-[14%] right-[10%] h-[16%] w-[28%] rounded-md" />
    </div>
  )
}
