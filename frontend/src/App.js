import React from "react";
import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import RegisterUser from "./components/RegisterUser";
import RegisterDriver from "./components/RegisterDriver";
import LoginUser from "./components/LoginUser";
import LoginDriver from "./components/LoginDriver";
import RideRequestForm from "./components/RideRequestForm";
import RouteMap from "./components/RouteMap";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="p-4">
        <Routes>
          <Route path="/" element={<LoginUser />} />
          <Route path="/register/user" element={<RegisterUser />} />
          <Route path="/register/driver" element={<RegisterDriver />} />
          <Route path="/login/user" element={<LoginUser />} />
          <Route path="/login/driver" element={<LoginDriver />} />
          <Route path="/ride/request" element={<RideRequestForm/>}/>
          <Route path="/map" element={<RouteMap />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
