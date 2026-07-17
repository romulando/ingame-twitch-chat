// src/electron/shortcuts.ts
import { globalShortcut } from 'electron'
export const registerShortcuts = (win) => {
  globalShortcut.register('control+alt+a', () => {
    win?.webContents.send('toggle-show-window')
  })
}
