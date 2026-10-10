import { createFileRoute } from '@tanstack/react-router'
import { PrivacyPage } from '@/features/landing/legal-pages'
import { PAGE_TITLES } from '@/features/landing/titles'

export const Route = createFileRoute('/privasi')({
  staticData: { title: PAGE_TITLES.privacy },
  component: PrivacyPage,
})
