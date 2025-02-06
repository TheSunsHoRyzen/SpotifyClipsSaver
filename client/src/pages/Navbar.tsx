import React from "react";
import { Link } from "react-router-dom";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-gray-300 p-4 shadow-md">
      <ul className="flex space-x-4">
        <li>
          <Link to="/" className="text-gray-800 hover:text-gray-500 hover:underline">Home</Link>
        </li>
        <li>
          <Link to="/dashboard" className="text-gray-800 hover:text-gray-500 hover:underline">Dashboard</Link>
        </li>
        <li>
            <Link to="/playlists" className="text-gray-800 hover:text-gray-500 hover:underline">Playlists</Link>
        </li>
        <li>
          <Link to="/playsongs" className="text-gray-800 hover:text-gray-500 hover:underline">PlaySong</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
