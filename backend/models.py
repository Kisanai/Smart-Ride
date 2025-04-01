import random
from math import radians, sin, cos, sqrt, atan2

class Customer:
    def __init__(self, id, name, phone, email, password):
        self.id = id
        self.name = name        
        self.phone = phone
        self.email = email
        self.password = password

class Driver:
    def __init__(self, id, name, vehicle_info, phone, email, password):
        self.id = id
        self.name = name
        self.phone = phone
        self.email = email
        self.password = password
        self.vehicle_info = vehicle_info
        self.status = "available"

class RideRequest:
    def __init__(self, id, pickup, dropoff, vehicle_type, estimated_price=None, estimated_distance=None, estimated_duration=None):
        self.id = id
        self.pickup = pickup
        self.dropoff = dropoff
        self.vehicle_type = vehicle_type
        self.estimated_price = estimated_price
        self.estimated_distance = estimated_distance
        self.estimated_duration = estimated_duration
        self.status = "pending"
        self.driver_id = None
        self.fare = estimated_price

class RideMatchingService:
    @staticmethod
    def find_closest_driver(drivers, pickup_location, vehicle_type=None):
        closest_driver = None
        min_distance = float('inf')

        try:
            pickup_lat = float(pickup_location.get("lat", 0))
            pickup_lng = float(pickup_location.get("lng", 0))

            print(f"Looking for drivers near ({pickup_lat}, {pickup_lng})")

            # Lọc trước các tài xế hợp lệ
            available_drivers = [
                d for d in drivers
                if d.get("status") == "available" and 
                (not vehicle_type or d.get("vehicle_type") == vehicle_type)
            ]

            for driver in available_drivers:
                driver_location = driver.get("current_location", driver.get("location", {}))

                if not driver_location or not isinstance(driver_location, dict):
                    print(f"- No valid location data for driver {driver.get('id')}")
                    continue

                try:
                    driver_lat = float(driver_location.get("lat", 0))
                    driver_lng = float(driver_location.get("lng", driver_location.get("lon", 0)))

                    distance = RideMatchingService.calculate_distance(
                        driver_lat, driver_lng, pickup_lat, pickup_lng
                    )

                    if distance < min_distance:
                        min_distance = distance
                        closest_driver = driver

                except (ValueError, TypeError) as e:
                    print(f"- Error calculating distance for driver {driver.get('id')}: {e}")
                    continue

            if closest_driver:
                print(f"Found closest driver: {closest_driver.get('id')} at distance: {min_distance:.2f} km")
            else:
                print("No available drivers found")

            return closest_driver

        except Exception as e:
            print(f"Error in find_closest_driver: {e}")
            return None


    @staticmethod
    def calculate_distance(lat1, lon1, lat2, lon2):
        """
        Tính khoảng cách giữa hai điểm dựa trên tọa độ
        Sử dụng công thức Haversine
        """
        R = 6371  # Bán kính trái đất (km)
        
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance = R * c
        
        return distance

class Payment:
    @staticmethod
    def process(amount, method="credit_card"):
        return {
            "success": True,
            "message": f"Thanh toán {amount}$ bằng {method} thành công."
        }
