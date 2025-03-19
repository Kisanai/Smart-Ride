import React, { useState } from "react";
import axios from "axios";

function RegisterForm() {
  const [userType, setUserType] = useState("customer");
  const [formData, setFormData] = useState({ name: "", email: "", vehicle_info: "" });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url =
      userType === "customer"
        ? "/api/register/customer"
        : "/api/register/driver";

    const payload = {
      name: formData.name,
      email: formData.email,
      ...(userType === "driver" && { vehicle_info: formData.vehicle_info }),
    };

    try {
      const res = await axios.post(url, payload);
      alert(res.data.message + "\nID: " + res.data.id);
    } catch (err) {
      alert("Lỗi khi đăng ký!");
    }
  };

  return (
    <div>
      <h2>📝 Đăng ký người dùng</h2>
      <label>
        <input
          type="radio"
          value="customer"
          checked={userType === "customer"}
          onChange={() => setUserType("customer")}
        />
        Khách hàng
      </label>
      <label style={{ marginLeft: "1rem" }}>
        <input
          type="radio"
          value="driver"
          checked={userType === "driver"}
          onChange={() => setUserType("driver")}
        />
        Tài xế
      </label>
      <form onSubmit={handleSubmit} style={{ marginTop: "1rem" }}>
        <input name="name" placeholder="Họ tên" onChange={handleChange} required />
        <br />
        <input name="email" placeholder="Email" onChange={handleChange} required />
        <br />
        {userType === "driver" && (
          <input name="vehicle_info" placeholder="Thông tin xe" onChange={handleChange} required />
        )}
        <br />
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}

export default RegisterForm;
