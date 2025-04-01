import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function LoginDriver() {
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
      const res = await axios.post("/api/login/driver", formData);

      localStorage.setItem("driver_id", res.data.id);
      localStorage.setItem("token", res.data.token);
      toast.success("🎉 Đăng nhập thành công!");

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("❌ Đăng nhập thất bại!");
    }
  };

  return (
    <div>
      <h2>🔐 Đăng nhập Tài xế</h2>
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

export default LoginDriver;
