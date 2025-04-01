import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const Routing = ({ pickup, dropoff, onRouteInfo, routeColor = "#4CAF50" }) => {
  const map = useMap();
  const routingRef = useRef(null);
  const isCleanedUpRef = useRef(false);

  // Hàm an toàn để xóa routing control
  const safeRemoveControl = () => {
    try {
      if (routingRef.current && map && !isCleanedUpRef.current) {
        if (map.hasLayer(routingRef.current)) {
          routingRef.current.remove();
        }
        if (routingRef.current._container) {
          routingRef.current._container.remove();
        }
        routingRef.current = null;
      }
    } catch (error) {
      console.warn("Lỗi khi xóa routing control:", error);
    }
  };

  useEffect(() => {
    isCleanedUpRef.current = false;

    if (!map) {
      console.error("Map không được khởi tạo");
      return;
    }

    if (!pickup || !dropoff) {
      console.warn("Thiếu thông tin điểm đón hoặc điểm đến");
      return;
    }

    if (!pickup.lat || !pickup.lon || !dropoff.lat || !dropoff.lon) {
      console.error("Tọa độ không hợp lệ:", { pickup, dropoff });
      return;
    }

    // Xóa route cũ một cách an toàn
    safeRemoveControl();

    let isMounted = true;

    try {
      const control = L.Routing.control({
        waypoints: [
          L.latLng(parseFloat(pickup.lat), parseFloat(pickup.lon)),
          L.latLng(parseFloat(dropoff.lat), parseFloat(dropoff.lon))
        ],
        router: new L.Routing.OSRMv1({
          serviceUrl: "https://routing.openstreetmap.de/routed-car/route/v1",
          timeout: 30 * 1000, // 30 giây timeout
          geometryOnly: false,
        }),
        routeWhileDragging: false,
        show: false,
        showAlternatives: false,
        addWaypoints: false,
        createMarker: () => null,
        lineOptions: {
          styles: [{ color: routeColor, weight: 4 }],
        },
        fitSelectedRoutes: false,
      });

      // Đăng ký các event handler
      control.on("routesfound", (e) => {
        if (!isMounted || isCleanedUpRef.current) return;
        try {
          const route = e.routes[0];
          if (route?.summary) {
            onRouteInfo({
              distance: route.summary.totalDistance,
              duration: route.summary.totalTime,
            });
          } else {
            console.warn("Không tìm thấy thông tin route");
          }
        } catch (error) {
          console.error("Lỗi khi xử lý thông tin route:", error);
        }
      });

      control.on("routingerror", (err) => {
        if (!isMounted || isCleanedUpRef.current) return;
        const errorMessage = err?.error?.message || err?.message || "Lỗi không xác định";
        console.error("Lỗi routing:", errorMessage);
        
        // Thử lại với service dự phòng nếu cần
        if (errorMessage.includes("Too Many Requests") || errorMessage.includes("timeout")) {
          console.log("Đang thử lại với service dự phòng...");
          // Thêm logic xử lý service dự phòng ở đây nếu cần
        }
      });

      // Thêm control vào map
      if (map && !isCleanedUpRef.current) {
        control.addTo(map);
        routingRef.current = control;
      }
    } catch (error) {
      console.error("Lỗi khi tạo routing control:", error);
    }

    // Cleanup function
    return () => {
      isMounted = false;
      isCleanedUpRef.current = true;
      safeRemoveControl();
    };
  }, [pickup, dropoff, map, onRouteInfo, routeColor]);

  return null;
};

export default Routing;
