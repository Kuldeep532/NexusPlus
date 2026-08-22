const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('nexusAgent', {
  getState: () => ipcRenderer.invoke('agent-state'),
  forgetPhone: () => ipcRenderer.invoke('forget-phone'),
  onPairingRequest: (callback) => ipcRenderer.on('pairing-request', (_event, data) => callback(data)),
});
