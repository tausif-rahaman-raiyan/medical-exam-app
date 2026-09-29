/**
 * Medical Secret Files - Standalone Windows Offline Engine
 */
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'Medical Secret Files',
    icon: path.join(__dirname, 'www', 'assets', 'icon.svg'),
    backgroundColor: '#0F172A',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false
    }
  });

  // Remove default menu for clean medical exam workstation interface
  Menu.setApplicationMenu(null);

  // Load offline local application entry
  win.loadFile(path.join(__dirname, 'www', 'index.html'));

  win.on('page-title-updated', (e) => {
    e.preventDefault();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
