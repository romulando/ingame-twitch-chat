import { Tray, Menu, app } from 'electron';
import { platform } from './platform';
let tray = null;
export function createTray(win) {
    if (tray)
        return; // Evita múltiplas bandejas em modo dev
    const trayImage = platform.getTrayIcon();
    tray = new Tray(trayImage);
    win?.webContents.send('toggle-show-window');
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Esconder/aparecer',
            click: () => win?.webContents.send('toggle-show-window')
        },
        {
            label: 'Minimizar',
            click: () => win.minimize()
        },
        {
            label: 'Abrir janela',
            click: () => win.show()
        },
        {
            label: 'Sair',
            click: () => {
                tray?.destroy();
                app.quit();
            }
        }
    ]);
    tray.setToolTip('Seu App');
    tray.setContextMenu(contextMenu);
    tray.on('click', () => {
        win.show();
    });
}
