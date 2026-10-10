import { useQuery } from '@tanstack/react-query'
import { dashboardKeys } from './keys'
import { getCaseStats, getClassOverview, getMostMissedCriteria, getStudent, getWeeklyTrend, listStudents } from './repository'

export const useClassOverview = () => useQuery({ queryKey: dashboardKeys.overview(), queryFn: getClassOverview })
export const useStudents = () => useQuery({ queryKey: dashboardKeys.students(), queryFn: listStudents })
export const useStudent = (id: string) => useQuery({ queryKey: dashboardKeys.student(id), queryFn: () => getStudent(id) })
export const useCaseStats = () => useQuery({ queryKey: dashboardKeys.caseStats(), queryFn: getCaseStats })
export const useMissedCriteria = () => useQuery({ queryKey: dashboardKeys.missed(), queryFn: () => getMostMissedCriteria(6) })
export const useWeeklyTrend = () => useQuery({ queryKey: dashboardKeys.trend(), queryFn: getWeeklyTrend })
