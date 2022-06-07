
class Book {
    constructor(
      title = 'Unknown',
      author = 'Unknown',
      totalPages = 0,
      completedPages = 0,
      completed = false
    ) {
      this.id = ++uniqueId;
      this.title = title;
      this.author = author;
      this.totalPages = totalPages;
      this.completedPages = completedPages;
      this.completed = completed;
    }
}

class Library {
    constructor() {
        this.books= []
    }

    appendBook(newBook) {
        if(!this.isInLibrary(newBook)) {
            this.books.push(newBook)
        }
    }

    deleteBook(title) {
        this.books = this.books.filter((book) => book.title !== title)
    }

    retrieveBook(title) {
        return this.books.find((book) => book.title === title)
    }

    isInLibrary(newBook) {
        return this.books.some((book) => book.title === newBook.title)
    }
}

const library = new Library()

const accountBtn = document.getElementById('signIn')
const accountModal = document.getElementById('accountModal')
const addBtn = document.getElementById('addBtn')
const appendModal = document.getElementById('appendModal')
const errorMsg = document.getElementById('errorMsg')
const overlay = document.getElementById('overlay')
const appendForm = document.getElementById('appendForm')
const booksGrid = document.getElementById('grid')


/* Modals */
  
const startAppendModal = () => {
    appendForm.reset()
    appendModal.classList.add('active')
    overlay.classList.add('active')
}
  
const endAppendModal = () => {
    appendModal.classList.remove('active')
    overlay.classList.remove('active')
    errorMsg.classList.remove('active')
    errorMsg.textContent = ''
}
  
const startAccountModal = () => {
    accountModal.classList.add('active')
    overlay.classList.add('active')
}
  
const endAccountModal = () => {
    accountModal.classList.remove('active')
    overlay.classList.remove('active')
}
  
const endAllModals = () => {
    endAppendModal()
    endAccountModal()
}
  
const handleKeyboardInput = (e) => {
    if (e.key === 'Escape') endAllModals()
}


/* Book Entries */

const updateGrid = () => {
    resetGrid()
    for (let book of library.books) {
      createBookEntry(book)
    }
}
  
const resetGrid = () => {
    booksGrid.innerHTML = ''
}

const createBookEntry = (book) => {
    const bookEntry = document.createElement('div')
    const title = document.createElement('p')
    const author = document.createElement('p')
    const totalPages = document.createElement('p')
    const completedPages = document.createElement('p')
    const btnContainer = document.createElement('div')
    const readBtn = document.createElement('button')
    const deleteBtn = document.createElement('button')
  
    bookEntry.classList.add('book-entry')
    btnContainer.classList.add('button-container')
    readBtn.classList.add('btn')
    deleteBtn.classList.add('btn')
    readBtn.onclick = toggleRead
    deleteBtn.onclick = removeBook
  
    title.textContent = `"${book.title}"`
    author.textContent = book.author
    totalPages.textContent = `${book.totalPages} pages`
    completedPages.textContent = `${book.completedPages} pages`
    deleteBtn.textContent = 'Delete'
  
    if (book.completed) {
      readBtn.textContent = 'Completed'
      readBtn.classList.add('btn-light-green')
    } else {
      readBtn.textContent = 'Not completed'
      readBtn.classList.add('btn-light-red')
    }
  
    bookEntry.appendChild(title)
    bookEntry.appendChild(author)
    bookEntry.appendChild(totalPages)
    bookEntry.appendChild(completedPages)
    btnContainer.appendChild(readBtn)
    btnContainer.appendChild(deleteBtn)
    bookEntry.appendChild(btnContainer)
    booksGrid.appendChild(bookEntry)
}


const createBook = () => {
    const title = document.getElementById('title').value
    const author = document.getElementById('author').value
    const totalPages = document.getElementById('totalPages').value
    const completePages = document.getElementById('completedPages').value
    const completed = document.getElementById('completed').checked
    return new Book(title, author, totalPages, completePages, completed)
  }
  
const appendBook = (e) => {
    e.preventDefault()
    const newBook = createBook()
  
    if (library.isInLibrary(newBook)) {
      errorMsg.textContent = 'This book title already exists in the library'
      errorMsg.classList.add('active')
      return
    }
  
    if (auth.currentUser) {
      addBookDB(newBook)
    } else {
      library.addBook(newBook)
      saveLocal()
      updateGrid()
    }
  
    endAppendModal()
}
  
const deleteBook = (e) => {
    const title = e.target.parentNode.parentNode.firstChild.innerHTML.replaceAll(
      '"',
      ''
    )
  
    if (auth.currentUser) {
      deleteBookDB(title)
    } else {
      library.deleteBook(title)
      saveLocal()
      updateGrid()
    }
}
  
const toggleCompleted = (e) => {
    const title = e.target.parentNode.parentNode.firstChild.innerHTML.replaceAll(
      '"',
      ''
    )
    const book = library.retrieveBook(title)
  
    if (auth.currentUser) {
      toggleCompleteddDB(book)
    } else {
      book.completed = !book.completed
      saveLocal()
      updateGrid()
    }
}

/* Local Storage */

const saveLocal = () => {
    localStorage.setItem('library', JSON.stringify(library.books))
}
  
const restoreLocal = () => {
    const books = JSON.parse(localStorage.getItem('library'))
    if (books) {
      library.books = books.map((book) => JSONToBook(book))
    } else {
      library.books = []
    }
}

/* Conversion */

const docsToBook = (docs) => {
    return docs.map((doc) => {
      return new Book(
        doc.data().title,
        doc.data().author,
        doc.data().totalPages,
        doc.data().completedPages,
        doc.data().completed
      )
    })
}
  
const JSONToBook = (book) => {
    return new Book(book.title, book.author, book.totalPages, book.completePages, book.completed)
}
  
const bookToDoc = (book) => {
    return {
      ownerId: auth.currentUser.uid,
      title: book.title,
      author: book.author,
      totalPages: book.totalPages,
      completedPages: book.completePages,
      completed: book.completed,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }
}



/* Auth */

const auth = firebase.auth()

auth.onAuthStateChanged(async (user) => {
  if (user) {
    setupRealTimeListener()
  } else {
    if (unsubscribe) unsubscribe()
    restoreLocal()
    updateGrid()
  }
  startAccountModal(user)
  startNavbar(user)
})

const signIn = () => {
  const provider = new firebase.auth.GoogleAuthProvider()
  auth.signInWithPopup(provider)
}

const signOut = () => {
  auth.signOut()
}

