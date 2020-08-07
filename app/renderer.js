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
let loadedTitle = null;
let originalContent = '';
let scrolled = false;

// Get from main process
window.api.receive('file-opened', (content) => {
  // if the filepath is given
  if (content.path.length > 0) {
    currentFilePath = content.path;
    loadedTitle = currentFilePath.split('\\').pop();
    document.title = `${loadedTitle}`;
  }
  if (content.text.length > 0) {
    originalContent = content.text;
    renderMarkdownToHtml(content.text);

    // When we open for the first time, the file has 
    // not been edited yet
    updateUserInterface(false);
    updateScroll();
  }
});

// After a file has been saved
window.api.receive('file-saved', (message) => {
  // sets the message for the toast
  toast.innerHTML = `<span>${message.text}</span>`;
  // assigns the color scheme, and makes the toast visible
  toast.classList.toggle(message.status);
  toast.classList.toggle('hide');

  // reset the (edited) portion of the title, as we have now saved the file
  document.title = loadedTitle;

  // after 2 seconds, hide the toast and remove any styling
  setTimeout(() => {
    toast.classList.toggle('hide');
    toast.remove('success', 'error');
  }, 2000);
});

// If we are closing the browser window (this is kind of hacky)
window.api.receive('window-closed', () => {
  window.api.send('close-window');
});

// helper function wrapping the marked module
const renderMarkdownToHtml = (markdown) => {
  markdownView.value = markdown;
  htmlView.innerHTML = window.api.marked(markdown);
};

// helper function to update the title bar
const updateUserInterface = (isEdited) => {
  let newTitle = (isEdited) ? `${loadedTitle} (Edited)` : loadedTitle;

  // Set the window properties
  document.title = newTitle;
  window.api.send('set-edited', isEdited);

  // Enable buttons based on whether we are in an edited file
  saveMarkdownButton.disabled = !isEdited;
  revertButton.disabled = !isEdited;
}

// helper function to cause a scroll event
const updateScroll = () => {
  if (!scrolled) {
    markdownView.scrollTop = markdownView.scrollHeight;
    htmlView.scrollTop = htmlView.scrollHeight;
  }

}

// Pass the plain-text to the rendered markdown div
markdownView.addEventListener("input", (event) => {
  const currentContent = event.target.value;

  // reset the scrolled value when we start typing to focus it there
  scrolled = false;
  //keep the view focused on what you're typing
  updateScroll();

  renderMarkdownToHtml(currentContent);
  updateUserInterface(currentContent !== originalContent);
});

// when the markdown view has been scrolled, prevent it from scolling back
markdownView.addEventListener('scroll', () => {
  scrolled = true;
})

// Open File Action
openFileButton.addEventListener("click", () => {
  window.api.send('open-file');
});

// New File Action
newFileButton.addEventListener("click", () => {
  window.api.send('create-window');
});

// Export the file as HTML Action
saveHtmlButton.addEventListener('click', () => {
  let page = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
      <title>${currentFilePath}</title>
    </head>
    <body>
      ${htmlView.innerHTML}
    </body>
  </html>  
  `;
  window.api.send('export-html', page);
});

// Save the file
saveMarkdownButton.addEventListener('click', () => {
  // send the content to the main process for saving
  window.api.send('save-file', { path: currentFilePath, text: markdownView.value });
  originalContent = markdownView.value;
});

// Revert to previous state action
revertButton.addEventListener('click', () => {
  markdownView.value = originalContent;
  renderMarkdownToHtml(originalContent);
  updateUserInterface(false);
  document.title = loadedTitle;
});
