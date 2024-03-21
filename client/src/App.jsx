import { Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import CreateBook from './pages/CreateBook.jsx'
import ShowBook from './pages/ShowBook.jsx'
import EditBook from './pages/EditBook.jsx'
import DeleteBook from './pages/DeleteBook.jsx'

function App() {
  return (
    <Routes>
      <Route>
        <Route path="/" element={<Home />} />
        <Route path="/books/create" element={<CreateBook />} />
        <Route path="/books/details/:id" element={<ShowBook />} />
        <Route path="/books/edit/:id" element={<EditBook />} />
        <Route path="/books/delete/:id" element={<DeleteBook />} />
      </Route>
    </Routes>
  )
}

export default App
