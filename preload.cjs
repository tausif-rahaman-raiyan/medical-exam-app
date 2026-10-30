const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('msfUpdater', {
  checkForUpdates: () => ipcRenderer.invoke('msf:update:check'),
  downloadUpdate: () => ipcRenderer.invoke('msf:update:download'),
  installUpdate: () => ipcRenderer.invoke('msf:update:install'),
  onStatus: callback => { if (typeof callback !== 'function') return; const listener = (_event,payload) => callback(payload); ipcRenderer.on('msf:update-status',listener); return () => ipcRenderer.removeListener('msf:update-status',listener); }
});
