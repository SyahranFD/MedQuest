import { createFileRoute } from '@tanstack/react-router'
import { StudentDetailPage } from '@/features/dashboard/student-detail-page'

export const Route = createFileRoute('/dosen/mahasiswa/$studentId')({
  staticData: { title: 'dashboard.detail.crumb' },
  component: function StudentRoute() {
    const { studentId } = Route.useParams()
    return <StudentDetailPage studentId={studentId} />
  },
})
