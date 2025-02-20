// Constant for the key used to store notes in localStorage
const localStorageKey = "notes";

// DOM elements and modals
const topbar = document.getElementById('topbar')
const editor = document.getElementById('main');
const noteField = document.getElementById("note-name");
const editNoteField = document.getElementById("note-name-edit");
const createNoteButton = document.getElementById('btn-create');
const createNoteButtonTop = document.getElementById('btn-create-top');
const infoButtonTop = document.getElementById('btn-info-top');
const editButtonTop = document.getElementById('btn-edit-top');
const deleteButtonTop = document.getElementById('btn-delete-top');
const modalCloseButton = document.getElementById('modal-close');
const deleteNoteButton = document.getElementById('modal-close-delete');
const deleteNoteBody = document.getElementById('delete-modal-body')
const toastModalBody = document.getElementById('toast-modal-body')
const contentTitle = document.getElementById('content-title');
const content = document.getElementById('content');
const closeEditorButton = document.getElementById('close-editor');
const exportAsTxtButton = document.getElementById('export_as_text');
const exportAsPdfButton = document.getElementById('export_as_pdf');
const createModal = new bootstrap.Modal(document.getElementById('myModal'));
const editModal = new bootstrap.Modal(document.getElementById('myEditModal'));
const deleteModal = new bootstrap.Modal(document.getElementById('myDeleteModal'));
const infoModal = new bootstrap.Modal(document.getElementById('myInfoModal'));
const toastModal = new bootstrap.Modal(document.getElementById('myToastModal'));

// State variables for managing the current state of the app
let autoSaveInterval = null; // Stores interval for auto-saving notes
let currentNoteId = null; // ID of the currently open note
let selectedNoteIdForEdit = null; // ID of the note selected for editing
let selectedNoteIdForDelete = null; // ID of the note selected for deletion

// Load all notes from localStorage
const allNotes = getAllNotes();

// Initialize the app on page load
onInit();

/**
 * Initial setup to display notes, hide editor, and set up shortcut keys.
 */
function onInit() {
    displayNotes(); // Display all notes
    editor.style.display = 'none'; // Hide the editor initially
    setupShortcutKeys(); // Set up keyboard shortcuts
}

/**
 * Retrieve all notes from localStorage.
 * @returns {Array} Array of note objects.
 */
function getAllNotes() {
    const notes = localStorage.getItem(localStorageKey);
    return notes ? JSON.parse(notes) : [];
}

/**
 * Display all notes in the UI.
 */
function displayNotes() {
    const notesContainer = document.querySelector('.notes');
    const notesDropdown = document.querySelector('.dropdown-menu')
    notesContainer.innerHTML = '';
    notesDropdown.innerHTML = '';

    if (allNotes.length == 0) {
        const noteSelectOption = document.createElement('li')
        noteSelectOption.classList.add('dropdown-item')
        noteSelectOption.textContent = "No notes created"
        notesDropdown.appendChild(noteSelectOption)
    }

    allNotes.forEach(note => {
        // Create note element with title and action buttons
        const noteDiv = document.createElement('div');
        noteDiv.classList.add('note');

        const titleSpan = document.createElement('span');
        titleSpan.classList.add('note-title');
        titleSpan.textContent = note.name;

        const editSpan = document.createElement('span');
        editSpan.classList.add('material-symbols-outlined', 'icon-blue');
        editSpan.textContent = 'edit_note';
        editSpan.title = "Rename Note";

        const deleteSpan = document.createElement('span');
        deleteSpan.classList.add('material-symbols-outlined', 'icon-red');
        deleteSpan.textContent = 'close';
        deleteSpan.title = "Delete Note";

        // Append elements and set event listeners
        noteDiv.append(titleSpan, editSpan, deleteSpan);
        notesContainer.appendChild(noteDiv);

        noteDiv.addEventListener('click', () => openEditor(note.id));
        editSpan.addEventListener('click', () => openEditModal(note.id, note.name));
        deleteSpan.addEventListener('click', () => openDeleteModal(note.id, note.name));

        const noteSelectOption = document.createElement('li')
        noteSelectOption.classList.add('dropdown-item')
        noteSelectOption.textContent = note.name
        noteSelectOption.value = note.id;
        notesDropdown.appendChild(noteSelectOption)

        noteSelectOption.addEventListener('click', (event) => {
            if (event.target.classList.contains('dropdown-item')) {
                const selectedNoteId = event.target.value;
                openEditor(selectedNoteId);
            }
        });
    });
}

/**
 * Open the editor for a specific note by its ID.
 * @param {number} noteId - ID of the note to open.
 */
function openEditor(noteId) {
    const note = allNotes.find(note => note.id === noteId);
    if (note) {
        currentNoteId = noteId;
        editor.style.display = 'flex';
        contentTitle.innerHTML = note.name;
        content.innerHTML = note.content.trim() == '' ? "Click anywhere to start writing..." : note.content;
        if (content.innerHTML.trim() == "Click anywhere to start writing...") {
            content.style.color = '#b4b4b4'
        } else {
            content.style.color = 'white'
        }
        content.addEventListener('click', () => {
            if (content.innerHTML.trim() == "Click anywhere to start writing...") {
                content.innerHTML = ''
                content.style.color = 'white'
            }
        })
        startAutoSave(); // Start auto-save for the opened note
    }
}

/**
 * Close the editor and reset its state.
 */
function closeEditor() {
    editor.style.display = 'none';
    contentTitle.innerHTML = '';
    content.innerHTML = '';
    currentNoteId = null;
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
}

/**
 * Start the auto-save interval for saving the note content every second.
 */
function startAutoSave() {
    if (!autoSaveInterval) {
        autoSaveInterval = setInterval(autoSave, 1000);
    }
}

/**
 * Auto-save the current note's content to localStorage.
 */
function autoSave() {
    if (currentNoteId == null) return;

    const note = allNotes.find(note => note.id === currentNoteId);
    if (note) {
        note.content = content.innerHTML;
        localStorage.setItem(localStorageKey, JSON.stringify(allNotes));
    }
}

/**
 * Create and insert a new note.
 * @param {Event} event - The form submission event.
 */
function insertNewNote(event) {
    event.preventDefault();
    if (noteField.value.trim() == '') {
        noteField.focus()
        noteField.reportValidity();
        return
    }

    const name = noteField.value.trim();
    const newId = Math.max(...allNotes.map(note => note.id), -1) + 1;

    allNotes.push({ id: newId, name, content: '' });
    localStorage.setItem(localStorageKey, JSON.stringify(allNotes));
    displayNotes(); // Refresh the displayed notes
    openEditor(newId); // Open the newly created note
    createModal.hide(); // Close the create modal
}

/**
 * Remove a note by its ID.
 * @param {number} noteId - ID of the note to remove.
 */
function removeNoteById(noteId) {
    const index = allNotes.findIndex(note => note.id === noteId);
    if (index !== -1) {
        allNotes.splice(index, 1);
        localStorage.setItem(localStorageKey, JSON.stringify(allNotes));
        displayNotes(); // Refresh the displayed notes
    }
}

/**
 * Delete the selected note.
 */
function deleteNote() {
    if (selectedNoteIdForDelete !== null) {
        removeNoteById(selectedNoteIdForDelete);
        if (selectedNoteIdForDelete === currentNoteId) closeEditor();
        selectedNoteIdForDelete = null;
    }
}

/**
 * Edit a note's name.
 * @param {Event} event - The form submission event.
 */
function editNote(event) {
    event.preventDefault();
    if (selectedNoteIdForEdit !== null) {
        if (editNoteField.value.trim() == '') {
            editNoteField.focus()
            editNoteField.reportValidity();
            return
        }
        const note = allNotes.find(note => note.id === selectedNoteIdForEdit);
        if (note) {
            note.name = editNoteField.value.trim();
            localStorage.setItem(localStorageKey, JSON.stringify(allNotes));
            displayNotes();
        }
        editModal.hide(); // Close the edit modal
        openEditor(selectedNoteIdForEdit); // Reopen the note with the updated name
        selectedNoteIdForEdit = null;
    }
}

/**
 * Export the current note's content to .txt file.
 */
function exportAsTxt() {
    const note = allNotes.find(note => note.id === currentNoteId);
    if (note) {
        const noteName = note.name.trim().replace(/ /g, '_');
        const contentText = content.innerText.trim();
        const link = document.createElement('a');
        const blob = new Blob([contentText], { type: 'text/plain' });
        link.href = URL.createObjectURL(blob);
        link.download = `${noteName}.txt`;
        link.click();   
    }
}

/**
 * Export the current note's content to pdf file.
 */
function exportAsPdf() {
    const note = allNotes.find(note => note.id === currentNoteId);
    if (note) {
        const noteName = note.name.trim().replace(/ /g, '_');
        const contentText = content.innerText.trim();
        const link = document.createElement('a'); 
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const margin = 10;
        const maxWidth = 180;
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;
        const fontSize = 12;

        doc.setFontSize(22);
        const textWidth = doc.getTextWidth(note.name);
        const centerX = (pageWidth - textWidth) / 2;
        doc.text(note.name, centerX, margin + 10);

        doc.setFontSize(fontSize)

        const lines = doc.splitTextToSize(contentText, maxWidth);
        let yPosition = margin + 20;

        lines.forEach((line, index) => {
            if (yPosition + 10 > pageHeight) {
                doc.addPage();
                yPosition = margin + 10;
            }
            doc.text(line, margin, yPosition);
            yPosition += fontSize * 0.6;
        });

        link.href = URL.createObjectURL(doc.output('blob'));
        link.download = `${noteName}.pdf`;
        link.click()
    }
}
/**
 * Open the edit modal for a specific note.
 * @param {number} noteId - ID of the note to edit.
 * @param {string} noteName - Current name of the note.
 */
function openEditModal(noteId, noteName) {
    selectedNoteIdForEdit = noteId;
    editNoteField.value = noteName;
    editModal.show();
    editNoteField.focus()
}

/**
 * Open the delete modal for a specific note.
 * @param {number} noteId - ID of the note to delete.
 */
function openDeleteModal(noteId, nodeName) {
    selectedNoteIdForDelete = noteId;
    deleteNoteBody.innerHTML = ''
    const eleTop = document.createElement('p')
    const ele = document.createElement('p')
    const eleBottom = document.createElement('p')
    eleTop.innerHTML = 'Are you sure, you want to delete this note ?'
    ele.innerHTML = 'File to be deleted : '+nodeName
    eleBottom.innerHTML = 'You can see its content in the background. Make sure you have exported it.'
    ele.style.fontWeight = 'bold'
    ele.style.color = 'red'
    eleBottom.style.fontWeight = 'bold'
    deleteNoteBody.append(eleTop, ele, eleBottom)
    deleteModal.show();
}

/**
 * Set up keyboard shortcuts for creating notes and saving changes.
 */
function setupShortcutKeys() {
    document.addEventListener("keydown", event => {
        if (event.ctrlKey && event.key.toLowerCase() === "m") {
            event.preventDefault();
            openCreateModal();
        }

        if (event.ctrlKey && event.key.toLowerCase() === "i") {
            event.preventDefault();
            openInfoModal();
        }

        if (event.ctrlKey && event.key.toLowerCase() === "s") {
            event.preventDefault();
            if (editor.style.display === 'none') {
                openToastModal('Nothing to save...')
            } else {
                autoSave();
                openToastModal('Saved Successfully...')
            }
        }
    });

    document.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    });
}

/**
 * Open the create note modal and prepare for note creation.
 */
function openCreateModal() {
    createModal.show();
    noteField.value = '';
    noteField.focus();
}

/**
 * Open the info modal to display informations
 */
function openInfoModal() {
    infoModal.show();
}


/**
 * Open toast with entered message
 */
function openToastModal(message){
    toastModalBody.innerHTML = message
    toastModal.show()
    setTimeout(()=>{
        toastModal.hide()
    }, 1000)
}



// Event listeners for buttons
createNoteButton.addEventListener('click', openCreateModal);
createNoteButtonTop.addEventListener('click', openCreateModal);
infoButtonTop.addEventListener('click', openInfoModal)
closeEditorButton.addEventListener('click', closeEditor);
exportAsTxtButton.addEventListener('click', exportAsTxt);
exportAsPdfButton.addEventListener('click', exportAsPdf);
deleteNoteButton.addEventListener('click', deleteNote);
content.addEventListener('paste', function(event) {
    event.preventDefault(); 
    const pastedText = event.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, pastedText);
});
deleteButtonTop.addEventListener('click', () => {
    if (currentNoteId == null) {
        openToastModal("No note selected to delete...")
    } else {
        selectedNoteIdForDelete = currentNoteId
        const nodeInfo = allNotes.find(note => note.id === selectedNoteIdForDelete)
        if (nodeInfo) {
            openDeleteModal(selectedNoteIdForDelete, nodeInfo.name)   
        }
    }
})
editButtonTop.addEventListener('click', () => {
    if (currentNoteId == null) {
        openToastModal("No note selected to edit...")
    } else {
        selectedNoteIdForEdit = currentNoteId
        const nodeInfo = allNotes.find(note => note.id === selectedNoteIdForEdit)
        openEditModal(selectedNoteIdForEdit, nodeInfo.name)
    }
})