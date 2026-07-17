import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
// Custom APIs for renderer
const api = {
  fetchYouTube: (url, payload) => ipcRenderer.invoke('fetch-youtube', url, payload),
  // Updater APIs
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // Updater event listeners
  onUpdaterCheckingForUpdate: (callback) => {
    ipcRenderer.on('updater-checking-for-update', callback)
  },
  onUpdaterUpdateAvailable: (callback) => {
    ipcRenderer.on('updater-update-available', (_, info) => callback(info))
  },
  onUpdaterUpdateNotAvailable: (callback) => {
    ipcRenderer.on('updater-update-not-available', (_, info) => callback(info))
  },
  onUpdaterError: (callback) => {
    ipcRenderer.on('updater-error', (_, error) => callback(error))
  },
  onUpdaterDownloadProgress: (callback) => {
    ipcRenderer.on('updater-download-progress', (_, progress) => callback(progress))
  },
  onUpdaterUpdateDownloaded: (callback) => {
    ipcRenderer.on('updater-update-downloaded', (_, info) => callback(info))
  },
  // Remove listeners
  removeAllUpdaterListeners: () => {
    ipcRenderer.removeAllListeners('updater-checking-for-update')
    ipcRenderer.removeAllListeners('updater-update-available')
    ipcRenderer.removeAllListeners('updater-update-not-available')
    ipcRenderer.removeAllListeners('updater-error')
    ipcRenderer.removeAllListeners('updater-download-progress')
    ipcRenderer.removeAllListeners('updater-update-downloaded')
  }
}
// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
