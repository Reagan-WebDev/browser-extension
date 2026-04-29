import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  const [token, setToken] = useState(localStorage.getItem('adminToken'));

  const saveToken = (userToken) => {
    localStorage.setItem('adminToken', userToken);
    setToken(userToken);
  };

  const currentToken = token || localStorage.getItem('adminToken');

  return (
    <BrowserRouter>
      <div className="min-h-screen w-full bg-background text-textPrimary">
        <Routes>
          <Route path="/login" element={<Login setToken={saveToken} />} />
          <Route 
            path="/dashboard" 
            element={currentToken ? <Dashboard token={currentToken} setToken={setToken} /> : <Navigate to="/login" />} 
          />
          <Route path="*" element={<Navigate to={currentToken ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
