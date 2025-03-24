import React, { useState } from "react";
import axios from "axios";

function RegisterDriver() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    vehicle_info: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/register/driver", formData);
      alert(res.data.message + "\nID: " + res.data.id);
    } catch (err) {
      alert("Lỗi khi đăng ký!");
    }
  };

  return (
    <div>
      <h2>📝 Đăng ký Tài xế</h2>
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
        <input
          name="vehicle_info"
          placeholder="Thông tin xe"
          value={formData.vehicle_info}
          onChange={handleChange}
          required
        />
        <br />
        <button type="submit">Đăng ký</button>
      </form>
    </div>
  );
}

export default RegisterDriver;
