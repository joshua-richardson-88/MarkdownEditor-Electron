const { dialog } = require('electron');

const Dialog = () => {
  const fileTypes = ['md', 'markdown', 'txt'];
  const defaultPath = 'C:/Users/jrichardson/Documents/Programming/Full Stack/Electron in Motion/MarkDownEditor/'

  const openFileDialog = (window) => {
    let options = {
      title: "Choose a markdown file to open",
      defaultPath: defaultPath,
      buttonLabel: "Choose File",
      properties: ["openFile"],
      filters: [
        { name: "Markdown Files", extensions: ["md", "markdown"] },
        { name: "Text Files", extensions: ["txt"] },
      ],
    };

    return dialog.showOpenDialog(window, options);
  };

  const saveNewFileDialog = (window, path) => {
    let options = {
      title: 'Save Markdown',
      defaultPath: path,
      filters: [
        { name: 'Markdown Files', extensions: ['md', 'markdown'] }
      ]
    };

    return dialog.showSaveDialog(window, options);
  }

  const exportFileDialog = (window, path) => {
    let options = {
      title: 'Save HTML',
      defaultPath: path,
      buttonLabel: 'Save file',
      filters: [
        { name: 'HTML Files', extensions: ['html', 'htm'] }
      ]
    };

    return dialog.showSaveDialog(window, options);
  };

  const overwriteChangesDialog = (window) => {
    let options = {
      type: 'warning',
      title: 'Overwrite current unsaved changes?',
      message: 'Opening a new file in this window will overwrite you unsaved changes. Proceed anyways?',
      noLink: true,
      buttons: [
        'Yes',
        'Cancel'
      ],
      defaultId: 0,
      cancelId: 1
    }

    return dialog.showMessageBox(window, options);
  };

  const quitWithUnsavedChangesDialog = (window) => {
    let options = {
      type: 'warning',
      title: 'Quit with Unsaved Changes?',
      message: 'Your changes will be lost if you do not save.',
      noLink: true,
      buttons: [
        'Continue',
        'Cancel'
      ],
      defaultId: 0,
      cancelId: 1
    };

    return dialog.showMessageBox(window, options);
  };

  const externalChangesUnsavedDialog = (window) => {
    let options = {
      type: 'warning',
      title: 'Overwrite Current Unsaved Changes?',
      message: 'Another application has changed this file. Load those changes?',
      noLink: true,
      buttons: [
        'Yes',
        'Cancel'
      ],
      defaultId: 0,
      cancelId: 1
    };

    return dialog.showMessageBox(window, options);
  }

  const errorDialog = (message) => {
    return dialog.showErrorBox(message.title, message.content);
  }

  return {
    open: openFileDialog,
    saveNew: saveNewFileDialog,
    export: exportFileDialog,
    overwrite: overwriteChangesDialog,
    quitUnsaved: quitWithUnsavedChangesDialog,
    externalUnsaved: externalChangesUnsavedDialog,
    error: errorDialog,
  }
};

exports.dialog = Dialog();