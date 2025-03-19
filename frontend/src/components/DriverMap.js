import React, { useState, useEffect } from "react";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix icon bug
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

function DriverMap() {
  const [driverId, setDriverId] = useState("");
  const [location, setLocation] = useState(null);

  useEffect(() => {
    let interval;
    if (driverId) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`/api/driver/location/${driverId}`);
          if (res.data.lat && res.data.lng) {
            setLocation(res.data);
          }
        } catch (err) {
          console.error("Không lấy được vị trí tài xế", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [driverId]);

  return (
    <div>
      <h2>🗺️ Theo dõi tài xế trên bản đồ</h2>
      <input
        placeholder="Nhập Driver ID"
        value={driverId}
        onChange={(e) => setDriverId(e.target.value)}
      />

      {location && location.lat !== undefined && location.lng !== undefined ? (
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: "400px", width: "100%", marginTop: "1rem" }}
        >
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[location.lat, location.lng]}>
            <Popup>
              Tài xế ID: {driverId} <br />
              Vị trí hiện tại
            </Popup>
          </Marker>
        </MapContainer>
      ) : (
        <p style={{ marginTop: "1rem" }}>
        </p>
      )}
    </div>
  );
}

export default DriverMap;
