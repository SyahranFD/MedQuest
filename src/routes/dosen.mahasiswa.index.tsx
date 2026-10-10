import { createFileRoute } from '@tanstack/react-router'
import { StudentsPage } from '@/features/dashboard/students-page'

export const Route = createFileRoute('/dosen/mahasiswa/')({
  component: StudentsPage,
})
