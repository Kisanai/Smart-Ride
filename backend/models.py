import random

class Customer:
    def __init__(self, id, name,phone, email,  password):
        self.id = id
        self.name = name        
        self.phone = phone
        self.email = email
        self.password = password

class Driver:
    def __init__(self, id, name, vehicle_info, phone, email,  password):
        self.id = id
        self.name = name
        self.phone = phone
        self.email = email
        self.password = password
        self.vehicle_info = vehicle_info
        self.available = True

class RideRequest:
    def __init__(self, id, pickup, dropoff, driver_id=None):
        self.id = id
        self.pickup = pickup
        self.dropoff = dropoff
        self.fare = random.randint(20, 50)
        self.status = "Pending"
        self.driver_id = driver_id
class RideMatchingService:
    @staticmethod
    def find_available_driver(drivers):
        for driver in drivers:
            if driver.get("available", False):
                return driver
        return None
class Payment:
    @staticmethod
    def process(amount, method="credit_card"):
        return {
            "status": "success",
            "message": f"Thanh toán {amount}$ bằng {method} thành công."
        }
