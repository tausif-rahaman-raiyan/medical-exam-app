const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
let mainWindow = null;
function sendUpdateStatus(status, details = {}) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('msf:update-status', { status, ...details }); }
function configureAutoUpdater() {
  autoUpdater.autoDownload = false; autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('checking-for-update', () => sendUpdateStatus('checking'));
  autoUpdater.on('update-available', info => sendUpdateStatus('available', { version: info.version }));
  autoUpdater.on('update-not-available', info => sendUpdateStatus('not-available', { version: info.version }));
  autoUpdater.on('download-progress', p => sendUpdateStatus('downloading', { percent: Math.round(p.percent || 0) }));
  autoUpdater.on('update-downloaded', info => sendUpdateStatus('downloaded', { version: info.version }));
  autoUpdater.on('error', error => sendUpdateStatus('error', { message: error?.message || 'Update check failed.' }));
  ipcMain.handle('msf:update:check', async () => { if (!app.isPackaged) return {status:'development'}; try { await autoUpdater.checkForUpdates(); return {status:'checking'}; } catch (e) { sendUpdateStatus('error',{message:e?.message||'Could not check for updates.'}); return {status:'error'}; } });
  ipcMain.handle('msf:update:download', async () => { try { await autoUpdater.downloadUpdate(); return {status:'downloading'}; } catch (e) { sendUpdateStatus('error',{message:e?.message||'Download failed.'}); return {status:'error'}; } });
  ipcMain.handle('msf:update:install', () => { autoUpdater.quitAndInstall(); return {status:'installing'}; });
}
function createWindow() {
  mainWindow = new BrowserWindow({ width:1280,height:820,minWidth:900,minHeight:600,title:'Medical Secret Files',icon:path.join(__dirname,'www','assets','icon.ico'),backgroundColor:'#0F172A',webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,webSecurity:false} });
  Menu.setApplicationMenu(null);
  mainWindow.webContents.setWindowOpenHandler(({url}) => { if (/^https?:\/\//i.test(url)) { shell.openExternal(url); return {action:'deny'}; } return {action:'allow'}; });
  mainWindow.loadFile(path.join(__dirname,'www','index.html'));
  mainWindow.on('closed',()=>{mainWindow=null;});
  mainWindow.on('page-title-updated',event=>event.preventDefault());
}
app.whenReady().then(()=>{ configureAutoUpdater(); createWindow(); if(app.isPackaged) setTimeout(()=>autoUpdater.checkForUpdates().catch(e=>sendUpdateStatus('error',{message:e?.message||'Automatic update check failed.'})),8000); app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow();}); });
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
