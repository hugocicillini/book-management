import { Route, Routes } from 'react-router-dom'

import "bootstrap/dist/css/bootstrap.min.css"

import CreateBook from './pages/CreateBook.jsx'
import EditBook from './pages/EditBook.jsx'
import Home from './pages/Home'
import ShowBook from './pages/ShowBook.jsx'

function App() {
  return (
    <Routes>
      <Route>
        <Route path="/" element={<Home />} />
        <Route path="/books/create" element={<CreateBook />} />
        <Route path="/books/details/:id" element={<ShowBook />} />
        <Route path="/books/edit/:id" element={<EditBook />} />
      </Route>
    </Routes>
  )
}

export default App
