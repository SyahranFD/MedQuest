export const simulatorKeys = {
  cases: ['simulator', 'cases'] as const,
  case: (id: string) => ['simulator', 'case', id] as const,
  sessions: ['simulator', 'sessions'] as const,
  session: (id: string) => ['simulator', 'session', id] as const,
}
