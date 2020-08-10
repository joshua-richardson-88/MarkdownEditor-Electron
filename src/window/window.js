const window = ({ BrowserWindow, coordinates, pathToBridge }) => {
  return new BrowserWindow({
    x: coordinates.x,
    y: coordinates.y,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: pathToBridge
    }
  });
}

module.exports = window();