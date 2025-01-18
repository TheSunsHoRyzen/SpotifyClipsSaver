import React from "react";
// The major difference between classes and IDs is that an element can only have one ID. It cannot be repeated on a single page and should not contain any whitespace:
const LoginButton: React.FC = () => {
  const handleLogin = () => {
    window.location.href = "http://localhost:8080/auth/login";
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
          className="bg-green-500 p-2 rounded text-white"
          onClick={handleLogin}
        >
          Login with Spotify
        </button>
      </div>
    </div>
  );
};

export default LoginButton;
