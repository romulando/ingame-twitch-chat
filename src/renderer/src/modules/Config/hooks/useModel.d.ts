import { TConfigDataProps } from '../../../shared/store/useConfigStore'
export default function useModel(): {
  config: TConfigDataProps | null
  isLoading: boolean
  error: string | null
  successMessage: string | null
  updateConfig: <K extends keyof TConfigDataProps>(key: K, value: TConfigDataProps[K]) => void
  handleUpdateConfig: (event: React.FormEvent<HTMLFormElement>) => Promise<void>
  setError: import('react').Dispatch<import('react').SetStateAction<string | null>>
  setSuccessMessage: import('react').Dispatch<import('react').SetStateAction<string | null>>
}
