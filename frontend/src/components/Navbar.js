import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ padding: "1rem", background: "#eee", display: "flex", gap: "2rem" }}>
      <div>
        <strong>SmartRide 🚖</strong>
      </div>

      <div>
        <span><strong>User</strong></span> | 
        <Link to="/register/user" style={{ margin: "0 0.5rem" }}>Register</Link>
        <Link to="/login/user" style={{ margin: "0 0.5rem" }}>Login</Link>
      </div>

      <div>
        <span><strong>Driver</strong></span> | 
        <Link to="/register/driver" style={{ margin: "0 0.5rem" }}>Register</Link>
        <Link to="/login/driver" style={{ margin: "0 0.5rem" }}>Login</Link>
      </div>
      
    </nav>
  );
}
