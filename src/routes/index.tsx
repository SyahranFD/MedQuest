import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '@/features/landing/landing-page'
import { PAGE_TITLES } from '@/features/landing/titles'

export const Route = createFileRoute('/')({
  staticData: { title: PAGE_TITLES.home },
  component: LandingPage,
})
