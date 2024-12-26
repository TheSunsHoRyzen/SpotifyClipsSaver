import React from "react";
import { Routes, Route } from "react-router-dom";
import LoginButton from "./pages/LoginButton";
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard";


const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<LoginButton />} />
        <Route path="/callback" element={<Callback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<div>Page not found!</div>} />
      </Routes>
    </div>
  );
};

export default App;
