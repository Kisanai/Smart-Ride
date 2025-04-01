import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

const RideMap = ({ selectedPickup, selectedDropoff, driverLocation, onRouteInfo, showMainRoute }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routingControlRef = useRef(null);
  const markersRef = useRef({});
  const previousPositionsRef = useRef({});

  // Khởi tạo map một lần duy nhất
  useEffect(() => {
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([21.0285, 105.8542], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        if (routingControlRef.current) {
          mapInstanceRef.current.removeControl(routingControlRef.current);
          routingControlRef.current = null;
        }
        Object.values(markersRef.current).forEach(marker => {
          if (marker) marker.remove();
        });
        markersRef.current = {};
        previousPositionsRef.current = {};
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Tạo các icon một lần duy nhất
  const icons = useMemo(() => ({
    pickup: L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM0Q0FGNTAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjMiLz48L3N2Zz4=',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    }),
    dropoff: L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNGRjU3MjIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjEgMTBjMCA3LTkgMTMtOSAxM3MtOS02LTktMTNhOSA5IDAgMCAxIDE4IDB6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIvPjwvc3ZnPg==',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    }),
    driver: L.icon({
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMxOTc2RDIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cmVjdCB4PSIyIiB5PSIyIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHJ4PSIyIiByeT0iMiIvPjxwYXRoIGQ9Ik0xNiAxMmE0IDQgMCAwIDEtOCAwIi8+PC9zdmc+',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })
  }), []);

  // Kiểm tra xem vị trí có thay đổi không
  const hasPositionChanged = (oldPos, newPos) => {
    if (!oldPos && !newPos) return false;
    if (!oldPos || !newPos) return true;
    return oldPos.lat !== newPos.lat || 
           (oldPos.lon !== newPos.lon && oldPos.lng !== newPos.lng);
  };

  // Cập nhật markers chỉ khi có thay đổi vị trí
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const bounds = [];
    let needsUpdate = false;

    // Kiểm tra và cập nhật marker
    const updateMarkerIfNeeded = (position, type) => {
      if (hasPositionChanged(previousPositionsRef.current[type], position)) {
        needsUpdate = true;
        
        // Xóa marker cũ nếu không còn vị trí mới
        if (!position) {
          if (markersRef.current[type]) {
            markersRef.current[type].remove();
            markersRef.current[type] = null;
          }
          previousPositionsRef.current[type] = null;
          return;
        }

        // Cập nhật hoặc tạo marker mới
        const latLng = [position.lat, position.lon || position.lng];
        bounds.push(latLng);

        if (markersRef.current[type]) {
          markersRef.current[type].setLatLng(latLng);
        } else {
          markersRef.current[type] = L.marker(latLng, {
            icon: icons[type]
          }).addTo(map);
        }

        previousPositionsRef.current[type] = position;
      } else if (position) {
        bounds.push([position.lat, position.lon || position.lng]);
      }
    };

    // Kiểm tra từng marker
    updateMarkerIfNeeded(selectedPickup, 'pickup');
    updateMarkerIfNeeded(selectedDropoff, 'dropoff');
    updateMarkerIfNeeded(driverLocation, 'driver');

    // Chỉ cập nhật route và bounds khi có thay đổi vị trí
    if (needsUpdate || showMainRoute !== routingControlRef.current?.options?.showMainRoute) {
      // Xóa route hiện tại
      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }

      // Tạo route mới
      if ((showMainRoute && selectedPickup && selectedDropoff) || 
          (!showMainRoute && driverLocation && selectedPickup)) {
        const start = showMainRoute ? selectedPickup : driverLocation;
        const end = showMainRoute ? selectedDropoff : selectedPickup;

        routingControlRef.current = L.Routing.control({
          waypoints: [
            L.latLng(start.lat, start.lon || start.lng),
            L.latLng(end.lat, end.lon || end.lng)
          ],
          routeWhileDragging: false,
          addWaypoints: false,
          draggableWaypoints: false,
          fitSelectedRoutes: false,
          show: false,
          lineOptions: {
            styles: [{
              color: showMainRoute ? '#4CAF50' : '#FFA000',
              weight: 6,
              opacity: 0.8
            }]
          },
          createMarker: () => null
        }).addTo(map);

        routingControlRef.current.options.showMainRoute = showMainRoute;

        routingControlRef.current.on('routesfound', (e) => {
          const route = e.routes[0];
          if (route && onRouteInfo) {
            onRouteInfo({
              distance: route.summary.totalDistance,
              duration: route.summary.totalTime
            }, !showMainRoute);
          }
        });
      }

      // Cập nhật bounds
      if (bounds.length > 0) {
        const padding = Math.min(window.innerWidth, window.innerHeight) * 0.2;
        map.fitBounds(bounds, {
          padding: [padding, padding],
          maxZoom: 15
        });
      }
    }
  }, [selectedPickup, selectedDropoff, driverLocation, showMainRoute, onRouteInfo, icons]);

  return <div ref={mapRef} style={{ height: "400px", width: "100%", marginTop: "20px" }} />;
};

export default RideMap;
