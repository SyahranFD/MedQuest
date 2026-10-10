import { createFileRoute } from '@tanstack/react-router'
import { TermsPage } from '@/features/landing/legal-pages'
import { PAGE_TITLES } from '@/features/landing/titles'

export const Route = createFileRoute('/syarat')({
  staticData: { title: PAGE_TITLES.terms },
  component: TermsPage,
})
