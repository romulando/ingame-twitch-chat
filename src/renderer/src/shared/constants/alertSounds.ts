import alert1 from '../assets/alert-1.wav'
import alert2 from '../assets/alert-2.wav'

export type TAlertSound = 'none' | 'alert1' | 'alert2'

export const ALERT_SOUNDS: Record<Exclude<TAlertSound, 'none'>, string> = {
  alert1,
  alert2
}

export function playAlertSound(sound?: TAlertSound): void {
  if (!sound || sound === 'none') return

  const src = ALERT_SOUNDS[sound]
  if (!src) return

  const audio = new Audio(src)
  audio.volume = 0.6
  audio.play().catch(() => {})
}
