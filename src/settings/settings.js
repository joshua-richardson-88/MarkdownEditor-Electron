const buildMakeSettings = (fs) => {
  return function makeSettings({
    fileTypes,
    defaultPath,
    pathToIndex,
    pathToBridge
  } = {}) {
    if (!fileTypes) {
      throw new Error('File types must exist');
    }
    if (fileTypes.length < 1) {
      throw new Error('Not enough file types')
    }
    if (!defaultPath) {
      throw new Error('The defualt path must be included');
    }
    if (!pathToIndex) {
      throw new Error('The index path must be included');
    }
    if (!pathToBridge) {
      throw new Error('The index path must be included');
    }
    if (!fs.existsSync(defaultPath)) {
      throw new Error('The default path must exist');
    }
    if (!fs.existsSync(pathToIndex)) {
      throw new Error('The index path must exist');
    }
    if (!fs.existsSync(pathToBridge)) {
      throw new Error('The Bridge path must exist');
    }

    return Object.freeze({
      getFileTypes: () => fileTypes,
      isValidFileType: (ext) => fileTypes.includes(ext),
      getDefaultPath: () => defaultPath,
      getIndexPath: () => pathToIndex,
      getBridgePath: () => pathToBridge
    })
  };
}

module.exports = settings;