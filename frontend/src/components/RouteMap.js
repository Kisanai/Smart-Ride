import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

function RouteMap({ pickup, dropoff }) {
  const mapRef = useRef(null);
  const routingRef = useRef(null);

  useEffect(() => {
    if (!pickup || !dropoff) return;


    if (!mapRef.current) {
      mapRef.current = L.map("map").setView([10.762622, 106.660172], 13); 

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef.current);
    }


    const getCoords = async (address) => {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`
      );
      const data = await res.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
      throw new Error("Không tìm thấy địa điểm");
    };


    const drawRoute = async () => {
      try {
        const [start, end] = await Promise.all([
          getCoords(pickup),
          getCoords(dropoff),
        ]);

        // Nếu đã có tuyến cũ thì xóa
        if (routingRef.current && mapRef.current) {
          mapRef.current.removeControl(routingRef.current);
        }

        routingRef.current = L.Routing.control({
          waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
          routeWhileDragging: false,
        }).addTo(mapRef.current);
      } catch (err) {
        console.error("Lỗi tìm đường:", err);
      }
    };

    drawRoute();
  }, [pickup, dropoff]);

  return (
    <div>
      <h3>🗺️ Bản đồ tuyến đường</h3>
      <div id="map" style={{ height: "400px", width: "100%", marginTop: "10px" }}></div>
    </div>
  );
}

export default RouteMap;
