import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function LoginCustomer() {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/login/customer", formData);

      localStorage.setItem("customer_id", res.data.id);
      alert("🎉 Đăng nhập thành công!");

      navigate("/ride/request");
    } catch (err) {
      console.error(err);
      alert("❌ Đăng nhập thất bại!");
    }
  };

  return (
    <div>
      <h2>🔐 Đăng nhập Khách hàng</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="identifier"
          placeholder="Email hoặc Số điện thoại"
          value={formData.identifier}
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
        <button type="submit">Đăng nhập</button>
      </form>
    </div>
  );
}

export default LoginCustomer;
