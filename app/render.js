const markdownView = document.querySelector("#markdown");
const htmlView = document.querySelector("#html");
const newFileButton = document.querySelector("#new-file");
const openFileButton = document.querySelector("#open-file");
const saveMarkdownButton = document.querySelector("#save-markdown");
const revertButton = document.querySelector("#revert");
const saveHtmlButton = document.querySelector("#save-html");
const showFileButton = document.querySelector("#show-file");
const openInDefaultButton = document.querySelector("#open-in-default");
const toast = document.querySelector('#toast');

// global variables for tracking current file
let currentFilePath = null;
let originalContent = '';

// Get from main process
window.api.receive('file-opened', (content) => {
  // if the filepath is given
  if (content.path.length > 0) {
    currentFilePath = content.path;
    currentWindow.setRepresentedFilename(content.path);
  }
  if (content.text.length > 0) {
    originalContent = content.text;
    renderMarkdownToHtml(content.text);

    // When we open for the first time, the file has not been edited yet
    updateUserInterface(false);
  }
});

// After a file has been saved
window.api.receive('file-saved', (message) => {
  // sets the message for the toast
  toast.innerHTML = `<span>${message.text}</span>`;
  // assigns the color scheme, and makes the toast visible
  toast.classList.toggle(message.status);
  toast.classList.toggle('hide');
  // after 2 seconds, hide the toast and remove any styling
  setTimeout(() => { 
    toast.classList.toggle('hide');
    toast.remove('success', 'error');
  }, 2000);
});

// helper function wrapping the marked module
const renderMarkdownToHtml = (markdown) => {
  markdownView.value = markdown;
  htmlView.innerHTML = marked(markdown);
};