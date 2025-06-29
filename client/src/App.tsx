import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginButton from "./pages/LoginButton";
import Dashboard from "./pages/Dashboard";
import Navbar from "./pages/Navbar";
import Playlists from "./pages/Playlists";
import Callback from "./pages/Callback";

const App: React.FC = () => {
  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/" element={<LoginButton />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/playlists" element={<Playlists />} />
        <Route path="*" element={<div>Page not found!</div>} />
      </Routes>
    </div>
  );
};

export default App;
