import { useEffect, useState } from 'react'
import { useShowWindowStore } from '../store/useShowWindowStore'

export default function useHeader() {
  const { showWindow, setShowWindow } = useShowWindowStore()
  const [fullScreen, setFullScreen] = useState(false)

  function handleShowWindow() {
    setShowWindow(!showWindow)
    window.electron.ipcRenderer.send('alwaysOnTop', showWindow)
    window.electron.ipcRenderer.send('setIgnoreMouseEvents', showWindow)
  }

  useEffect(() => {
    window.electron.ipcRenderer.on('toggle-show-window', handleShowWindow)
    return () => {
      window.electron.ipcRenderer.removeListener('toggle-show-window', handleShowWindow)
    }
  }, [showWindow])

  const openConfigWindow = () => {
    window.electron.ipcRenderer.send('open-config')
  }

  return {
    showWindow,
    fullScreen,
    setFullScreen,
    openConfigWindow,
    handleShowWindow
  }
}
