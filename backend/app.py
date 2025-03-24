from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import load_data, save_data, generate_id
from models import Customer, Driver, RideRequest, RideMatchingService, Payment
import os
import requests

app = Flask(__name__)
CORS(app)

DATA_DIR = "data"
def path(file): return os.path.join(DATA_DIR, file)

@app.route("/api/register/customer", methods=["POST"])
def register_customer():
    data = request.json
    customers = load_data(path("customers.json"))
    for customer in customers:
        if (customer.get("email") == data["email"]):
            return jsonify({"message": " Email đã tồn tại!"}), 400
        if (customer.get("phone") == data["phone"] ):
            return jsonify({"message": " Số điện thoại đã tồn tại!"}), 400
    id = generate_id("customer_id")
    customer = Customer(id, data["name"], data["phone"], data["email"],  data["password"])
    customers = load_data(path("customers.json"))
    customers.append(customer.__dict__)
    save_data(path("customers.json"), customers)
    return jsonify({"message": "Đăng ký thành công", "id": customer.id})

@app.route("/api/register/driver", methods=["POST"])
def register_driver():
    data = request.json
    id = generate_id("driver_id")
    driver = Driver(id, data["name"], data["vehicle_info"], data["phone"], data["email"],  data["password"])
    drivers = load_data(path("drivers.json"))
    drivers.append(driver.__dict__)
    save_data(path("drivers.json"), drivers)
    return jsonify({"message": "Đăng ký tài xế thành công", "id": driver.id})

@app.route("/api/ride/request", methods=["POST"])
def request_ride():
    data = request.json
    ride_id = generate_id("ride_id")
    pickup = data["pickup"]
    dropoff = data["dropoff"]

    drivers = load_data(path("drivers.json"))
    available_driver = RideMatchingService.find_available_driver(drivers)

    driver_id = None
    if available_driver:
        driver_id = available_driver["id"]
        available_driver["available"] = False
        save_data(path("drivers.json"), drivers)

    ride = RideRequest(ride_id, pickup, dropoff, driver_id)
    rides = load_data(path("rides.json"))
    rides.append(ride.__dict__)
    save_data(path("rides.json"), rides)

    return jsonify({
        "ride_id": ride.id,
        "fare": ride.fare,
        "status": ride.status,
        "driver_id": ride.driver_id
    })

@app.route("/api/payment", methods=["POST"])
def process_payment():
    data = request.json
    amount = data.get("amount")
    method = data.get("method", "credit_card")
    result = Payment.process(amount, method)
    return jsonify(result)

@app.route("/api/ride/history/<customer_id>", methods=["GET"])
def ride_history(customer_id):
    rides = load_data(path("rides.json"))
    history = [r for r in rides if r["customer_id"] == int(customer_id)]
    return jsonify(history)

@app.route("/api/driver/location/<driver_id>", methods=["GET"])
def get_driver_location(driver_id):
    driver_id = str(driver_id)

    driver_locations = {
        "1": {"lat": 10.7798, "lng": 106.6992},  # Hồ Con Rùa
        "2": {"lat": 10.762622, "lng": 106.660172},  # Bến Thành
        "3": {"lat": 10.8206, "lng": 106.6602},  # Gò Vấp
        # Thêm nữa nếu cần
    }
    location = driver_locations.get(driver_id, {"lat": 10.76, "lng": 106.68})  # fallback default

    return jsonify({
        "driver_id": driver_id,
        "lat": location["lat"],
        "lng": location["lng"]
    })
@app.route("/api/login/customer", methods=["POST"])
def login_customer():
    data = request.json
    identifier = data.get("identifier")
    password = data.get("password")

    customers = load_data(path("customers.json"))

    for customer in customers:
        if (customer["email"] == identifier or customer["phone"] == identifier) and customer["password"] == password:
            return jsonify({
                "message": "Đăng nhập thành công",
                "id": customer["id"]
            })

    return jsonify({"message": "Sai thông tin đăng nhập"}), 401
@app.route('/api/location-suggestions')
def location_suggestions():
    query = request.args.get('q')
    if not query:
        return jsonify([])

    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": query,
                "format": "json",
                "addressdetails": 1,
                "limit": 5,
                "countrycodes": "vn"
            },
            headers={"User-Agent": "SmartRideApp/1.0"}
        )
        response.raise_for_status()
        return jsonify(response.json())
    except Exception as e:
        print(f"Error fetching location suggestions: {e}")
        return jsonify({"error": "Failed to fetch location suggestions"}), 500

if __name__ == "__main__":
    os.makedirs(DATA_DIR, exist_ok=True)
    app.run(host="localhost", port=5000, debug=True)