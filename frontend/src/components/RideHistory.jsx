import React, { useState } from "react";
import axios from "axios";

function RideHistory() {
  const [customerId, setCustomerId] = useState("");
  const [history, setHistory] = useState([]);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`/api/ride/history/${customerId}`);
      setHistory(res.data);
    } catch (err) {
      alert("Không thể lấy lịch sử chuyến đi");
    }
  };

  return (
    <div>
      <h2>📚 Lịch sử chuyến đi</h2>
      <input
        placeholder="Customer ID"
        value={customerId}
        onChange={(e) => setCustomerId(e.target.value)}
      />
      <button onClick={fetchHistory}>Xem</button>

      <ul>
        {history.map((ride) => (
          <li key={ride.id}>
            {ride.pickup} → {ride.dropoff} | Trạng thái: {ride.status} | Giá: {ride.fare}$ | Tài xế: {ride.driver_id || "Không có"}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RideHistory;
