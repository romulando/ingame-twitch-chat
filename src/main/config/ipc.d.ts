import { BrowserWindow } from 'electron'
export interface configDataProps {
  kick: {
    slug: string
    id?: number
    user_id?: number
  }
  twitch: {
    channel: string
  }
  youtube: {
    channelName: string
    channelId?: string
  }
  font: {
    size: number
    weight: number
  }
  messageDuration?: number
  alertSound?: 'none' | 'alert1' | 'alert2'
  x: number
  y: number
  width: number
  height: number
}
export declare const registerConfigIPC: (win: BrowserWindow) => BrowserWindow | null
