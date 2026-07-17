export type TAlertSound = 'none' | 'alert1' | 'alert2'
export declare const ALERT_SOUNDS: Record<Exclude<TAlertSound, 'none'>, string>
export declare function playAlertSound(sound?: TAlertSound): void
