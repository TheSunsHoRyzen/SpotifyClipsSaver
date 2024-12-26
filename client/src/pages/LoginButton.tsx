import React from "react";
const LoginButton: React.FC = () => {
  const handleLogin = () => {
    window.location.href = "http://localhost:8080/auth/login";
  };
  return (
    <div>
      <div className="main-heading">
        <h1>Welcome to Spotify Clip Saver</h1>
      </div>
      <button className = "bg-green-500 p-2 rounded" onClick={handleLogin}>Login with Spotify</button>
    </div>
)

};
export default LoginButton;
