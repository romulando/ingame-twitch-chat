import alert1 from '../assets/alert-1.wav';
import alert2 from '../assets/alert-2.wav';
export const ALERT_SOUNDS = {
    alert1,
    alert2
};
export function playAlertSound(sound) {
    if (!sound || sound === 'none')
        return;
    const src = ALERT_SOUNDS[sound];
    if (!src)
        return;
    const audio = new Audio(src);
    audio.volume = 0.6;
    audio.play().catch(() => { });
}
