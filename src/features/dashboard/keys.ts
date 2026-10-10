export const dashboardKeys = {
  all: ['dashboard'] as const,
  overview: () => [...dashboardKeys.all, 'overview'] as const,
  students: () => [...dashboardKeys.all, 'students'] as const,
  student: (id: string) => [...dashboardKeys.all, 'student', id] as const,
  caseStats: () => [...dashboardKeys.all, 'case-stats'] as const,
  missed: () => [...dashboardKeys.all, 'missed'] as const,
  trend: () => [...dashboardKeys.all, 'trend'] as const,
}
