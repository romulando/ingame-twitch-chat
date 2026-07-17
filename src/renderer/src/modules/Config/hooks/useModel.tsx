import { useEffect, useState } from 'react'
import { TConfigDataProps, useConfigStore } from '../../../shared/store/useConfigStore'
import { DEFAULT_CONFIG_DATA } from '../../../shared/constants/defaultConfig'

export default function useModel() {
  const { config, setConfig } = useConfigStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await window.electron.ipcRenderer.invoke('get-config')

        if (response && typeof response === 'object' && response.success) {
          setConfig({ ...DEFAULT_CONFIG_DATA, ...response.data })
        } else {
          setConfig(response?.data ?? DEFAULT_CONFIG_DATA)
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err)
        setConfig(DEFAULT_CONFIG_DATA)
      }
    }

    fetchConfig()
  }, [])

  function updateConfig<K extends keyof TConfigDataProps>(
    key: K,
    value: TConfigDataProps[K]
  ): void {
    setConfig({
      ...(config ?? DEFAULT_CONFIG_DATA),
      [key]: value
    } as TConfigDataProps)
  }

  async function handleUpdateConfig(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()

    if (!config) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await window.electron.ipcRenderer.invoke('save-config', config)

      if (response?.success) {
        setSuccessMessage(response.message ?? 'Configurações salvas com sucesso!')
      } else {
        setError(response?.error ?? 'Erro ao salvar configurações')
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err)
      setError('Erro ao salvar configurações')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    config,
    isLoading,
    error,
    successMessage,
    updateConfig,
    handleUpdateConfig,
    setError,
    setSuccessMessage
  }
}
