import { useQuery } from '@tanstack/react-query'
import { getCase, listCases } from '@/features/cases/repository'
import { getSessionResult, listSessionResults } from '@/features/session/repository'
import { simulatorKeys } from './keys'

export const useCases = () => useQuery({ queryKey: simulatorKeys.cases, queryFn: () => listCases() })
export const useCase = (id: string) => useQuery({ queryKey: simulatorKeys.case(id), queryFn: () => getCase(id) })
export const useSessionResults = () => useQuery({ queryKey: simulatorKeys.sessions, queryFn: listSessionResults })
export const useSessionResult = (id: string) =>
  useQuery({ queryKey: simulatorKeys.session(id), queryFn: () => getSessionResult(id) })
