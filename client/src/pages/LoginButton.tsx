import React from "react";
// The major difference between classes and IDs is that an element can only have one ID. It cannot be repeated on a single page and should not contain any whitespace:
const LoginButton: React.FC = () => {
  const handleLogin = () => {
    window.location.href = "https://scsbackend.onrender.com/auth/login";
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header at the top */}
      <header className="text-center p-4">
        <h1 className="text-2xl">Spotify Clip Saver</h1>
      </header>

      {/* Centered Button */}
      <div className="flex flex-col justify-center items-center">
        <button
          className="bg-green-500 p-2 rounded text-white mb-3"
          onClick={handleLogin}
        >
          Login with Spotify
        </button>
        <p className="text-gray-400 mb-2">
          Welcome to Spotify Clip Saver! You must have a Spotify Premium Account
          and you must Login with Spotify before using this webapp.
        </p>
        <p className="text-gray-400 mb-2">
          After you sign in, you will be brought back to this page and will be
          able to use any part of the website.
        </p>
        <p className="text-gray-400"> User interface overhaul coming soon!</p>
      </div>
    </div>
  );
};

export default LoginButton;
