import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dosen/mahasiswa')({
  staticData: { title: 'nav.students' },
  component: Outlet,
})
