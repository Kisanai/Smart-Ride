import React, { useState, useRef, useEffect, useCallback } from "react";
import debounce from "lodash.debounce";
import RideMap from "./RideMap";

const VEHICLE_TYPES = {
  bike: {
    name: "Xe máy",
    icon: "🛵",
    baseFare: 8000,
    pricePerKm: 4000,
  },
  car: {
    name: "Ô tô 4 chỗ",
    icon: "🚗",
    baseFare: 15000,
    pricePerKm: 8000,
  },
  van: {
    name: "Ô tô 7 chỗ",
    icon: "🚐",
    baseFare: 20000,
    pricePerKm: 10000,
  },
};

const RideRequestForm = () => {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [selectedDropoff, setSelectedDropoff] = useState(null);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [vehicleType, setVehicleType] = useState("car");
  const [fare, setFare] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [driver, setDriver] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [driverToPickupDistance, setDriverToPickupDistance] = useState(null);
  const [driverToPickupDuration, setDriverToPickupDuration] = useState(null);
  const [showMainRoute, setShowMainRoute] = useState(true);
  const [rideId, setRideId] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [driverToPickupCountdown, setDriverToPickupCountdown] = useState(null);
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [showPickupInfo, setShowPickupInfo] = useState(false);

  const fetchSuggestions = async (query, type) => {
    if (!query) {
      type === "pickup" ? setPickupSuggestions([]) : setDropoffSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/location-suggestions?q=${query}`);
      if (!res.ok) return;
      const data = await res.json();
      type === "pickup" ? setPickupSuggestions(data) : setDropoffSuggestions(data);
    } catch (err) {
      console.warn("Lỗi khi lấy gợi ý:", err);
    }
  };

  const debouncedFetch = useRef(
    debounce((query, type) => fetchSuggestions(query, type), 300)
  ).current;

  const handleCancel = async () => {
    if (!rideId || !driver) {
        alert('Không có chuyến đi để hủy!');
        return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn hủy chuyến đi này?')) {
        return;
    }

    try {
        setIsCancelling(true);
        const res = await fetch(`/api/ride/cancel/${rideId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();

        if (res.ok) {
            // Reset all states
            setDriver(null);
            setDriverLocation(null);
            setShowMainRoute(true);
            setRideId(null);
            setDriverToPickupDistance(null);
            setDriverToPickupDuration(null);
            setDriverToPickupCountdown(null);
            setCountdownDisplay(null);
            setDistance(null);
            setDuration(null);
            setFare(null);
            
            // Reset map-related states
            setPickup("");
            setDropoff("");
            setSelectedPickup(null); // Xóa điểm đón
            setSelectedDropoff(null); // Xóa điểm đến
            
            // Thông báo thành công
            alert("Đã hủy chuyến thành công!");
        } else {
            // Thông báo lỗi
            alert(data.error || "Không thể hủy chuyến. Vui lòng thử lại!");
        }
    } catch (err) {
        console.error("Lỗi khi hủy chuyến:", err);
        alert("Đã xảy ra lỗi khi hủy chuyến!");
    } finally {
        setIsCancelling(false);
    }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPickup || !selectedDropoff) {
        alert('Vui lòng chọn điểm đón và điểm đến từ gợi ý');
        return;
    }

    if (driver) {
        alert('Bạn đã có tài xế được phân công');
        return;
    }

    setIsSubmitting(true);

    try {
        const payload = {
            pickup: {
                lat: parseFloat(selectedPickup.lat),
                lng: parseFloat(selectedPickup.lon),
                address: selectedPickup.display_name
            },
            dropoff: {
                lat: parseFloat(selectedDropoff.lat),
                lng: parseFloat(selectedDropoff.lon),
                address: selectedDropoff.display_name
            },
            vehicle_type: vehicleType,
            estimated_price: fare,
            estimated_distance: distance,
            estimated_duration: duration
        };

        console.log('Đang gửi request với payload:', JSON.stringify(payload, null, 2));

        const response = await fetch('/api/ride/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('Response từ server:', JSON.stringify(data, null, 2));

        if (response.ok) {
            if (data.driver) {
                console.log('Thông tin tài xế:', data.driver);
                setDriver(data.driver);
                setRideId(data.ride_id);
                if (data.driver.current_location) {
                    setDriverLocation({
                        lat: data.driver.current_location.lat,
                        lng: data.driver.current_location.lng || data.driver.current_location.lon
                    });
                    console.log('Đã set vị trí tài xế:', data.driver.current_location);
                }
                setShowMainRoute(false); // Ẩn thông tin tuyến đường chính
                setShowDriverInfo(true); // Hiển thị thông tin tài xế
                setShowPickupInfo(true); // Hiển thị thông tin đón khách
                alert(`Đã tìm thấy tài xế ${data.driver.name}! Tài xế đang trên đường đến đón bạn.`);
            } else {
                alert('Không tìm thấy tài xế phù hợp. Vui lòng thử lại sau.');
            }
        } else {
            alert(data.message || 'Có lỗi xảy ra khi tìm tài xế');
        }
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Có lỗi xảy ra khi gửi yêu cầu');
    } finally {
        setIsSubmitting(false);
    }
  };

  const completeRide = useCallback(async () => {
    if (!rideId) {
      console.warn("🚨 Không có rideId để hoàn thành chuyến đi!");
      return;
    }

    console.log(`📢 Gửi request hoàn thành chuyến đi với rideId: ${rideId}`);

    try {
      const response = await fetch(`/api/ride/complete/${rideId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        console.log("✅ Chuyến đi đã hoàn thành!");
        setDriver(null);
      } else {
        console.error("❌ Lỗi khi hoàn thành chuyến đi:", await response.json());
      }
    } catch (error) {
      console.error("❌ Lỗi kết nối API:", error);
    }
  }, [rideId]);

  const [countdownDisplay, setCountdownDisplay] = useState(null);
  useEffect(() => {
    if (countdownDisplay === 0) {
      completeRide();
    }
  }, [countdownDisplay, completeRide]);

  const countdownRef = useRef(null);

  useEffect(() => {
    if (driver && duration) {
      setCountdownDisplay(Math.floor(duration));
    }
  }, [driver, duration]);
  
  useEffect(() => {
    if (driver && countdownDisplay > 0) {
      const timer = setInterval(() => {
        setCountdownDisplay((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
  
      return () => clearInterval(timer);
    }
  }, [driver, countdownDisplay]);
  useEffect(() => {
    if (countdownDisplay === 0) {
      console.log("✅ Chuyến đi đã hoàn thành!");
      setRideId(null);
    }
  }, [countdownDisplay]);

  useEffect(() => {
    if (driverToPickupDuration && driverToPickupCountdown === null) {
        setDriverToPickupCountdown(Math.floor(driverToPickupDuration));
    }
  }, [driverToPickupDuration]);

  useEffect(() => {
    if (driverToPickupCountdown > 0) {
        const timer = setInterval(() => {
            setDriverToPickupCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer); // Stop the timer
                    setDriverToPickupCountdown(null); // Reset countdown
                    setShowMainRoute(true); // Show main route
                    if (duration) {
                        setCountdownDisplay(Math.floor(duration)); // Start trip countdown
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer); // Cleanup timer on unmount or dependency change
    }
  }, [driverToPickupCountdown, duration]);

  useEffect(() => {
    if (driverToPickupCountdown === 30) {
        alert("🚖 Tài xế đã đến điểm đón!");
        setShowDriverInfo(false); // Ẩn thông tin tài xế
        setShowPickupInfo(false); // Ẩn thông tin đón khách
        setShowMainRoute(true); // Hiển thị lại thông tin tuyến đường chính

        if (distance && duration && fare) {
            setCountdownDisplay(Math.floor(duration));
        } else {
            console.warn("Thông tin chuyến đi không đầy đủ:", { distance, duration, fare });
        }
        setDriverToPickupCountdown(null);
    }
  }, [driverToPickupCountdown, distance, duration, fare]);

  const handleRouteInfo = ({ distance, duration }, isDriverRoute = false) => {
    if (isDriverRoute) {
        setDriverToPickupDistance(distance);
        const averageSpeed = 30; // km/h - tốc độ trung bình trong thành phố
        const distanceInKm = distance / 1000;
        const estimatedDuration = (distanceInKm / averageSpeed) * 3600; // Chuyển đổi sang giây

        // Chỉ đặt driverToPickupCountdown nếu chưa được đặt
        if (driverToPickupCountdown === null) {
            setDriverToPickupDuration(estimatedDuration);
            setDriverToPickupCountdown(Math.floor(estimatedDuration));
        }
        setShowMainRoute(false);
    } else {
        setDistance(distance);
        setDuration(duration);
        const { baseFare, pricePerKm } = VEHICLE_TYPES[vehicleType];
        const estimatedFare = baseFare + (distance / 1000) * pricePerKm;
        setFare(Math.round(estimatedFare));
    }
  };

  useEffect(() => {
    if (driver && driver.current_location) {
      setDriverLocation(driver.current_location);
      setShowMainRoute(false);
    }
  }, [driver]);

  return (
    <div className="ride-request-form">
      <form onSubmit={handleSubmit}>
        <input
          value={pickup}
          onChange={(e) => {
            setPickup(e.target.value);
            debouncedFetch(e.target.value, "pickup");
          }}
          placeholder="Điểm đón"
          disabled={!!driver}
        />
        {pickupSuggestions.length > 0 && !driver && (
          <ul className="suggestions">
            {pickupSuggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => {
                  setPickup(s.display_name);
                  setSelectedPickup(s);
                  setPickupSuggestions([]);
                }}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}

        <input
          value={dropoff}
          onChange={(e) => {
            setDropoff(e.target.value);
            debouncedFetch(e.target.value, "dropoff");
          }}
          placeholder="Điểm đến"
          disabled={!!driver}
        />
        {dropoffSuggestions.length > 0 && !driver && (
          <ul className="suggestions">
            {dropoffSuggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => {
                  setDropoff(s.display_name);
                  setSelectedDropoff(s);
                  setDropoffSuggestions([]);
                }}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}

        <div className="form-group" style={{ marginTop: '10px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Loại xe:</label>
          <div className="vehicle-types" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            {Object.entries(VEHICLE_TYPES).map(([type, info]) => (
              <button
                key={type}
                type="button"
                onClick={() => setVehicleType(type)}
                disabled={!!driver}
                style={{
                  flex: 1,
                  padding: '10px',
                  border: `2px solid ${vehicleType === type ? '#4CAF50' : '#ddd'}`,
                  borderRadius: '5px',
                  background: vehicleType === type ? '#e8f5e9' : 'white',
                  cursor: driver ? 'not-allowed' : 'pointer',
                  opacity: driver ? 0.6 : 1,
                }}
              >
                <div>{info.icon}</div>
                <div>{info.name}</div>
                <div style={{ fontSize: '0.8em', color: '#666' }}>
                  Giá từ: {info.baseFare.toLocaleString()}đ
                </div>
              </button>
            ))}
          </div>
        </div>

        <select 
          value={paymentMethod} 
          onChange={(e) => setPaymentMethod(e.target.value)}
          disabled={!!driver}
          style={{ marginTop: '10px', width: '100%', padding: '8px' }}
        >
          <option value="cash">Tiền mặt</option>
          <option value="card">Thẻ</option>
        </select>

        <div className="button-group" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button 
            type="submit" 
            disabled={isSubmitting || !!driver}
            style={{ 
              flex: 1,
              opacity: (isSubmitting || !!driver) ? 0.6 : 1 
            }}
          >
            {isSubmitting ? "🔍 Đang tìm tài xế..." : `${VEHICLE_TYPES[vehicleType].icon} Đặt xe`}
          </button>

          {driver && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              style={{ 
                flex: 1,
                backgroundColor: '#dc3545',
                color: 'white',
                opacity: isCancelling ? 0.6 : 1
              }}
            >
              {isCancelling ? "Đang hủy..." : "❌ Hủy chuyến"}
            </button>
          )}
        </div>
      </form>

      {showDriverInfo && driver && (
        <div className="driver-info" style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <h3>Thông tin tài xế</h3>
          <p>🚕 Tài xế: {driver.name}</p>
          <p>📱 Số điện thoại: {driver.phone}</p>
          <p>🚗 Phương tiện: {driver.vehicle_info || driver.vehicle}</p>
          <p>{VEHICLE_TYPES[vehicleType].icon} Loại xe: {VEHICLE_TYPES[vehicleType].name}</p>
          
          {driverToPickupDistance && (
            <div style={{ 
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#e3f2fd',
              borderRadius: '5px',
              borderLeft: '4px solid #2196F3'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1976d2' }}>Thông tin đón khách</h4>
              <p>📍 Khoảng cách đến điểm đón: {(driverToPickupDistance / 1000).toFixed(2)} km</p>
              <p>🚗 Tốc độ trung bình: 30 km/h</p>
              <p>⏱️ Ước tính thời gian: {Math.ceil(driverToPickupDuration / 60)} phút</p>
              {driverToPickupCountdown > 0 && (
                <p style={{ 
                  fontWeight: 'bold',
                  color: '#2196F3',
                  fontSize: '1.1em',
                  marginTop: '5px'
                }}>
                  ⏳ Tài xế sẽ đến trong: {Math.floor(driverToPickupCountdown / 60)} phút {driverToPickupCountdown % 60} giây
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {showMainRoute && distance && (
        <div className="ride-route-info" style={{
          backgroundColor: '#f5f5f5',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <h3>Thông tin chuyến đi</h3>
          <p>📏 Khoảng cách: {(distance / 1000).toFixed(2)} km</p>
          <p>⏱️ Thời gian dự kiến: {Math.ceil(duration / 60)} phút</p>
          <p>💸 Giá: {fare?.toLocaleString()} VND</p>
          <p>{VEHICLE_TYPES[vehicleType].icon} Loại xe: {VEHICLE_TYPES[vehicleType].name}</p>
          
          {driver && countdownDisplay > 0 && driverToPickupCountdown <=1 && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#e8f5e9',
              borderRadius: '5px',
              borderLeft: '4px solid #4CAF50'
            }}>
              <p style={{ 
                fontWeight: 'bold',
                color: '#4CAF50',
                fontSize: '1.1em',
                margin: '0'
                
              }}>
                ⏳ Thời gian đến nơi: {Math.floor(countdownDisplay / 60)} phút {countdownDisplay % 60} giây
              </p>
            </div>
          )}
          
          {countdownDisplay === 0 && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#e8f5e9',
              borderRadius: '5px',
              borderLeft: '4px solid #4CAF50'
            }}>
              <p style={{ 
                fontWeight: 'bold',
                color: '#4CAF50',
                fontSize: '1.1em',
                margin: '0'
              }}>
                ✅ Chuyến đi đã hoàn thành!
              </p>
            </div>
          )}
        </div>
      )}

      <RideMap
        selectedPickup={selectedPickup}
        selectedDropoff={selectedDropoff}
        driverLocation={driverLocation}
        onRouteInfo={handleRouteInfo}
        showMainRoute={showMainRoute}
      />
    </div>
  );
};

export default RideRequestForm;
