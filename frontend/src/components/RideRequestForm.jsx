import React, { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet/dist/leaflet.css";
import debounce from "lodash.debounce";

const Routing = ({ pickup, dropoff, onRouteInfo }) => {
  const map = useMap();
  const routingRef = useRef(null);

  useEffect(() => {
    const removeRoutingControl = () => {
      if (routingRef.current) {
        try {
          map.removeControl(routingRef.current);
        } catch (err) {
          console.warn("Không thể xóa Routing control:", err.message);
        } finally {
          routingRef.current = null;
        }
      }
    };

    // Nếu chưa có điểm đón hoặc trả, xóa nếu có control rồi return
    if (!pickup || !dropoff) {
      removeRoutingControl();
      return;
    }

    // Nếu đã có routing cũ thì xóa trước
    removeRoutingControl();

    try {
      const control = L.Routing.control({
        waypoints: [
          L.latLng(pickup.lat, pickup.lon),
          L.latLng(dropoff.lat, dropoff.lon),
        ],
        router: new L.Routing.OSRMv1({
          serviceUrl: "https://routing.openstreetmap.de/routed-car/route/v1",
        }),
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        createMarker: () => null,
      })
        .on("routesfound", function (e) {
          const route = e.routes[0];
          if (route && route.summary) {
            const distance = route.summary.totalDistance;
            const duration = route.summary.totalTime;
            onRouteInfo({ distance, duration });
          }
        })
        .on("routingerror", function (err) {
          console.warn("Routing API gặp lỗi:", err.message || err);
        })
        .addTo(map);

      routingRef.current = control;
    } catch (error) {
      console.warn("Không thể tạo routing control:", error.message);
    }

    return () => {
      removeRoutingControl();
    };
  }, [pickup, dropoff, map, onRouteInfo]);

  return null;
};


const RideRequestForm = () => {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDropoff, setSelectedDropoff] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [fare, setFare] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);

  const fetchSuggestions = async (query, type) => {
    if (!query) {
      type === "pickup" ? setPickupSuggestions([]) : setDropoffSuggestions([]);
      return;
    }
  
    try {
      const response = await fetch(`/api/location-suggestions?q=${query}`);
      if (!response.ok) {
        const text = await response.text();
        console.warn("Lỗi phản hồi từ server:", text); // chỉ log warning
        return;
      }
  
      const data = await response.json();
      type === "pickup" ? setPickupSuggestions(data) : setDropoffSuggestions(data);
    } catch (error) {
      console.warn("Lỗi lấy gợi ý địa điểm:", error); // không dùng alert
    }
  };
  

  const debouncedFetchSuggestions = useRef(
    debounce((query, type) => {
      fetchSuggestions(query, type);
    }, 300),
    []
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPickup || !selectedDropoff) {
      alert("Vui lòng chọn điểm đón và điểm đến từ danh sách gợi ý.");
      return;
    }

    alert("🚗 Yêu cầu đặt xe đã được gửi thành công!");
  };

  return (
    <div className="ride-request-form">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={pickup}
          onChange={(e) => {
            setPickup(e.target.value);
            debouncedFetchSuggestions.current(e.target.value, "pickup");
          }}
          placeholder="Điểm đón"
        />
        {pickupSuggestions.length > 0 && (
          <ul className="suggestions">
            {pickupSuggestions.map((s, idx) => (
              <li
                key={idx}
                onClick={() => {
                  setPickup(s.display_name);
                  setSelectedPickup(s);
                  setPickupSuggestions([]);
                  document.activeElement.blur();
                }}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}

        <input
          type="text"
          value={dropoff}
          onChange={(e) => {
            setDropoff(e.target.value);
            debouncedFetchSuggestions.current(e.target.value, "dropoff");
          }}
          placeholder="Điểm đến"
        />
        {dropoffSuggestions.length > 0 && (
          <ul className="suggestions">
            {dropoffSuggestions.map((s, idx) => (
              <li
                key={idx}
                onClick={() => {
                  setDropoff(s.display_name);
                  setSelectedDropoff(s);
                  setDropoffSuggestions([]);
                  document.activeElement.blur();
                }}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}

        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="cash">Tiền mặt</option>
          <option value="card">Thẻ</option>
        </select>

        <button type="submit">Đặt xe</button>
      </form>

      {distance && duration && (
        <div className="ride-info">
          <p>📏 Quãng đường: {(distance / 1000).toFixed(2)} km</p>
          <p>⏱️ Thời gian dự kiến: {(duration / 60).toFixed(0)} phút</p>
          <p>💸 Giá cước ước tính: {fare?.toLocaleString()} VND</p>
        </div>
      )}

<MapContainer
  center={[21.0285, 105.8542]}
  zoom={13}
  style={{ height: "400px", width: "100%", marginTop: "20px" }}
>
  <TileLayer
    url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
  />
 

  <TileLayer
    url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
    opacity={0.3}
  />


  {selectedPickup && (
    <Marker position={[selectedPickup.lat, selectedPickup.lon]}>
      <Popup>Điểm đón</Popup>
    </Marker>
  )}
  {selectedDropoff && (
    <Marker position={[selectedDropoff.lat, selectedDropoff.lon]}>
      <Popup>Điểm đến</Popup>
    </Marker>
  )}
  {selectedPickup && selectedDropoff && (
    <Routing
      pickup={selectedPickup}
      dropoff={selectedDropoff}
      onRouteInfo={({ distance, duration }) => {
        setDistance(distance);
        setDuration(duration);

        const BASE_FARE = 10000;
        const PRICE_PER_KM = 5000;
        const estimatedFare = BASE_FARE + (distance / 1000) * PRICE_PER_KM;
        setFare(Math.round(estimatedFare));
      }}
    />
  )}
</MapContainer>

    </div>
  );
};

export default RideRequestForm;
