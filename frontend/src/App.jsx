import React from "react";
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Toaster } from 'react-hot-toast';
import Navbar from "./components/Navbar";
import RegisterUser from "./components/RegisterUser";
import RegisterDriver from "./components/RegisterDriver";
import LoginUser from "./components/LoginUser";
import LoginDriver from "./components/LoginDriver";
import RideRequestForm from "./components/RideRequestForm";
import AdminDashboard from './components/AdminDashboard';
import DriverDashboard from './components/DriverDashboard';

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: {
              background: '#00c853',
            },
          },
          error: {
            style: {
              background: '#ff1744',
            },
          },
        }}
      />
      <div className="app-container">
        <nav className="main-navbar">
          <div className="nav-brand">
            <Link to="/">SmartRide 🚗</Link>
          </div>
          <div className="nav-links">
            <div className="dropdown">
              <span>User</span>
              <div className="dropdown-content">
                <Link to="/login/user">Login</Link>
                <Link to="/register/user">Register</Link>
              </div>
            </div>
            <div className="dropdown">
              <span>Driver</span>
              <div className="dropdown-content">
                <Link to="/login/driver">Login</Link>
                <Link to="/register/driver">Register</Link>
              </div>
            </div>
          </div>
        </nav>

        <div className="main-content">
          <Routes>
            <Route path="/" element={<RideRequestForm />} />
            <Route path="/register/user" element={<RegisterUser />} />
            <Route path="/register/driver" element={<RegisterDriver />} />
            <Route path="/login/user" element={<LoginUser />} />
            <Route path="/login/driver" element={<LoginDriver />} />
            <Route path="/ride/request" element={<RideRequestForm />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<DriverDashboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
