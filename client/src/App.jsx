import { useContext } from 'react';

import { Route, Routes } from 'react-router-dom';

import { AuthContext } from './utils/AuthProvider.jsx';

import CreateBook from './pages/CreateBook.jsx';
import EditBook from './pages/EditBook.jsx';
import Home from './pages/Home';
import Login from './pages/Login';
import ShowBook from './pages/ShowBook.jsx';

function App() {
  const { isLoggedIn } = useContext(AuthContext);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={isLoggedIn ? <Home /> : <Login />} />
      <Route
        path="/books/create"
        element={isLoggedIn ? <CreateBook /> : <Login />}
      />
      <Route
        path="/books/details/:id"
        element={isLoggedIn ? <ShowBook /> : <Login />}
      />
      <Route
        path="/books/edit/:id"
        element={isLoggedIn ? <EditBook /> : <Login />}
      />
    </Routes>
  );
}

export default App;
