import React, { useState } from "react";
import axios from "axios";

function RegisterCustomer() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/register/customer", formData);
      alert(res.data.message + "\nID: " + res.data.id);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        alert("❌ " + err.response.data.message);
      } else {
        alert("❌ Lỗi khi đăng ký!");
      }
    }
  };

  return (
    <div>
      <h2>📝 Đăng ký Khách hàng</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Họ tên"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <br />
        <input
          name="phone"
          placeholder="Số điện thoại"
          value={formData.phone}
          onChange={handleChange}
          required
        />
        <br />
        <input
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <br />
        <input
          type="password"
          name="password"
          placeholder="Mật khẩu"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <br />
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}

export default RegisterCustomer;
