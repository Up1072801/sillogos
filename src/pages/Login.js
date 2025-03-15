import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";

export default function Login({ setUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Hardcoded χρήστες
  const users = [
    { username: "user", password: "1234", role: "user" },
    { username: "admin", password: "1234", role: "admin" },
  ];

  const handleLogin = () => {
    const user = users.find(
      (u) => u.username === username && u.password === password
    );
  
    if (user) {
      // Επιτυχής σύνδεση
      setUser({ role: user.role, username: user.username });
      localStorage.setItem("user", JSON.stringify({ role: user.role, username: user.username })); // Αποθήκευση στο local storage
      navigate("/");
    } else {
      setError("Λάθος όνομα χρήστη ή κωδικός πρόσβασης.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Σύνδεση</h2>
        <input
          type="text"
          placeholder="Όνομα χρήστη"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="login-input"
        />
        <input
          type="password"
          placeholder="Κωδικός πρόσβασης"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
        />
        <button onClick={handleLogin} className="login-button">
          Σύνδεση
        </button>
        {error && <p className="login-error">{error}</p>}
      </div>
    </div>
  );
}