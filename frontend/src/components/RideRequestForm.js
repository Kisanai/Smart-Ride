import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import L from "leaflet";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import RouteMap from "../components/RouteMap";
import "leaflet/dist/leaflet.css";
import "leaflet-geosearch/dist/geosearch.css";

function RideRequestForm() {
  const [formData, setFormData] = useState({ pickup: "", dropoff: "" });
  const [customerId, setCustomerId] = useState(null);
  const [result, setResult] = useState(null);
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [showPickupMap, setShowPickupMap] = useState(false);
  const [showDropoffMap, setShowDropoffMap] = useState(false);
  const mapRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem("customer_id");
    if (id) setCustomerId(id);
    else alert("Bạn cần đăng nhập trước khi đặt chuyến.");
  }, []);

  const initSearchMap = (onSelect, placeholder) => {
    if (mapRef.current) {
      mapRef.current.innerHTML = ""; // clear previous map
    }

    const map = L.map(mapRef.current, {
      center: [10.762622, 106.660172],
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

    const provider = new OpenStreetMapProvider({
      params: { countrycodes: "vn" },
    });

    const searchControl = new GeoSearchControl({
      provider,
      style: "bar",
      searchLabel: placeholder,
      autoClose: true,
      keepResult: false,
      showMarker: false,
    });

    map.addControl(searchControl);

    map.on("geosearch/showlocation", (result) => {
      const loc = result.location;
      onSelect({ name: loc.label, lat: loc.y, lng: loc.x });
      map.remove();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      alert("Chưa có thông tin khách hàng!");
      return;
    }

    if (!pickupCoords || !dropoffCoords) {
      alert("Bạn chưa chọn địa điểm hợp lệ!");
      return;
    }

    try {
      const res = await axios.post("/api/ride/request", {
        ...formData,
        customer_id: customerId,
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi yêu cầu chuyến đi!");
    }
  };

  return (
    <div>
      <h2>🚗 Yêu cầu đặt chuyến</h2>
      <form onSubmit={handleSubmit}>
        <input
          name="pickup"
          placeholder="Điểm đón"
          value={formData.pickup}
          onFocus={() => {
            setShowPickupMap(true);
            setShowDropoffMap(false);
            setTimeout(() => initSearchMap((loc) => {
              setFormData((f) => ({ ...f, pickup: loc.name }));
              setPickupCoords({ lat: loc.lat, lng: loc.lng });
              setShowPickupMap(false);
            }, "Tìm điểm đón..."), 100);
          }}
          readOnly
          required
        />
        <br />

        <input
          name="dropoff"
          placeholder="Điểm đến"
          value={formData.dropoff}
          onFocus={() => {
            setShowPickupMap(false);
            setShowDropoffMap(true);
            setTimeout(() => initSearchMap((loc) => {
              setFormData((f) => ({ ...f, dropoff: loc.name }));
              setDropoffCoords({ lat: loc.lat, lng: loc.lng });
              setShowDropoffMap(false);
            }, "Tìm điểm đến..."), 100);
          }}
          readOnly
          required
        />
        <br />

        <button type="submit">Gửi yêu cầu</button>
      </form>

      <div ref={mapRef} style={{ height: showPickupMap || showDropoffMap ? "300px" : 0, margin: "1rem 0" }} />

      {result && (
        <div style={{ marginTop: "1rem" }}>
          <p><strong>Trạng thái:</strong> {result.status}</p>
          <p><strong>Giá tiền:</strong> {result.fare}$</p>
          <p><strong>Tài xế:</strong> {result.driver_id || "Chưa có"}</p>
        </div>
      )}

      {pickupCoords && dropoffCoords && (
        <RouteMap pickup={pickupCoords} dropoff={dropoffCoords} />
      )}
    </div>
  );
}

export default RideRequestForm;
