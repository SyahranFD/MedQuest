export const libraryKeys = {
  cases: ['library', 'cases'] as const,
  /** Same key the history feature uses, so a reset there refreshes card status here. */
  sessions: ['sessions', 'list'] as const,
}
