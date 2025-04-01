from flask import Flask, request, jsonify
from flask_cors import CORS
from utils import load_data, save_data, generate_id
from models import Customer, Driver, RideRequest, RideMatchingService, Payment
import os
import requests
import random
import json


app = Flask(__name__)
CORS(app)

# Thêm vào đầu file, sau các import
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')

@app.route("/api/register/customer", methods=["POST"])
def register_customer():
    data = request.json
    customers = load_data("customers.json")
    for customer in customers:
        if customer.get("email") == data["email"]:
            return jsonify({"message": "Email đã tồn tại!"}), 400
        if customer.get("phone") == data["phone"]:
            return jsonify({"message": "Số điện thoại đã tồn tại!"}), 400
    id = generate_id("customer_id")
    customer = Customer(id, data["name"], data["phone"], data["email"], data["password"])
    customers.append(customer.__dict__)
    save_data("customers.json", customers)
    return jsonify({"message": "Đăng ký thành công", "id": customer.id})

def random_location():
    return {
        "lat": round(random.uniform(10.75, 10.82), 6),
        "lng": round(random.uniform(106.65, 106.72), 6)
    }

@app.route("/api/register/driver", methods=["POST"])
def register_driver():
    data = request.json
    drivers_data = load_data("drivers.json")
    drivers = drivers_data.get("drivers", [])
    
    for driver in drivers:
        if driver.get("email") == data["email"]:
            return jsonify({"message": "Email đã tồn tại!"}), 400
        if driver.get("phone") == data["phone"]:
            return jsonify({"message": "Số điện thoại đã tồn tại!"}), 400

    id = generate_id("driver_id")
    location = random_location()

    driver = Driver(
        id=id,
        name=data["name"],
        vehicle_info=data["vehicle_info"],
        phone=data["phone"],
        email=data["email"],
        password=data["password"]
    )

    driver_dict = driver.__dict__
    driver_dict["location"] = location
    driver_dict["available"] = True
    driver_dict["vehicle_type"] = data.get("vehicle_type", "car")

    drivers.append(driver_dict)
    
    save_data("drivers.json", {"drivers": drivers})

    return jsonify({"message": "Đăng ký tài xế thành công", "id": driver.id})


@app.route("/api/ride/request", methods=["POST"])
def request_ride():
    try:
        data = request.json
        print("Received ride request data:", data)
        
        drivers_data = load_data("drivers.json")
        if not isinstance(drivers_data, dict) or "drivers" not in drivers_data:
            print("Invalid drivers data format")
            return jsonify({"message": "Lỗi hệ thống: Dữ liệu tài xế không hợp lệ"}), 500
            
        drivers = drivers_data["drivers"]
        print(f"Loaded {len(drivers)} drivers")
        
        id = generate_id("ride_id")
        ride_request = RideRequest(
            id=id,
            pickup=data["pickup"],
            dropoff=data["dropoff"],
            vehicle_type=data["vehicle_type"],
            estimated_price=data.get("estimated_price"),
            estimated_distance=data.get("estimated_distance"),
            estimated_duration=data.get("estimated_duration")
        )
        
        closest_driver = RideMatchingService.find_closest_driver(
            drivers=drivers,
            pickup_location=data["pickup"],
            vehicle_type=data["vehicle_type"]
        )
        
        if not closest_driver:
            print("No suitable driver found")
            return jsonify({"message": "Không tìm thấy tài xế phù hợp"}), 404
            
        print(f"Found driver: {closest_driver['id']}")
        
        for driver in drivers:
            if driver["id"] == closest_driver["id"]:
                driver["status"] = "busy"
                driver["available"] = False
                break
                
        save_data("drivers.json", {"drivers": drivers})
        
        ride_request_dict = ride_request.__dict__
        ride_request_dict["driver_id"] = closest_driver["id"]
        ride_request_dict["status"] = "ongoing"
        
        rides = load_data("rides.json")
        rides.append(ride_request_dict)
        save_data("rides.json", rides)
        
        return jsonify({
            "message": "Đặt xe thành công",
            "ride_id": ride_request.id,
            "driver": {
                "id": closest_driver["id"],
                "name": closest_driver["name"],
                "phone": closest_driver["phone"],
                "vehicle_info": closest_driver["vehicle_info"],
                "current_location": closest_driver["current_location"],
                "rating": closest_driver["rating"]
            }
        }), 200
        
    except Exception as e:
        print(f"Error in request_ride: {str(e)}")
        return jsonify({"message": f"Lỗi hệ thống: {str(e)}"}), 500


@app.route("/api/payment", methods=["POST"])
def process_payment():
    data = request.json
    amount = data.get("amount")
    method = data.get("method", "credit_card")
    result = Payment.process(amount, method)
    return jsonify(result)

@app.route("/api/ride/history/<customer_id>", methods=["GET"])
def ride_history(customer_id):
    rides = load_data("rides.json")
    history = [r for r in rides if r["customer_id"] == int(customer_id)]
    return jsonify(history)

@app.route("/api/ride/cancel/<int:ride_id>", methods=["POST"])
def cancel_ride(ride_id):
    try:
        rides = load_data("rides.json")
        drivers_data = load_data("drivers.json")
        
        if not isinstance(drivers_data, dict) or "drivers" not in drivers_data:
            return jsonify({"error": "Dữ liệu tài xế không hợp lệ"}), 500
            
        drivers = drivers_data["drivers"]
        
        ride = next((r for r in rides if r["id"] == ride_id), None)
        if not ride:
            return jsonify({"error": "Không tìm thấy chuyến đi!"}), 404
            
        ride["status"] = "cancelled"
        
        driver = next((d for d in drivers if d["id"] == ride["driver_id"]), None)
        if driver:
            driver["status"] = "available"
            driver["available"] = True
            print(f"✅ Tài xế {driver['id']} đã được giải phóng!")
        
        save_data("rides.json", rides)
        save_data("drivers.json", {"drivers": drivers})
        
        return jsonify({
            "message": "Đã hủy chuyến thành công!",
            "ride_id": ride_id
        })
        
    except Exception as e:
        print(f"Error in cancel_ride: {str(e)}")
        return jsonify({"error": f"Có lỗi xảy ra: {str(e)}"}), 500

@app.route("/api/ride/complete/<int:ride_id>", methods=["POST"])
def complete_ride(ride_id):
    try:
        rides = load_data("rides.json")
        drivers_data = load_data("drivers.json")
        
        if isinstance(drivers_data, dict) and "drivers" in drivers_data:
            drivers = drivers_data["drivers"]
        else:
            drivers = []

        ride_found = False
        updated_rides = []

        for ride in rides:
            if str(ride["id"]) == str(ride_id):  
                ride_found = True
                ride["status"] = "completed"
                
                updated_drivers = []
                for driver in drivers:
                    if str(driver["id"]) == str(ride["driver_id"]):
                        driver["available"] = True
                        driver["status"] = "available"
                        print(f"✅ Tài xế {driver['id']} đã sẵn sàng nhận chuyến mới!")
                    updated_drivers.append(driver)
                
                save_data("drivers.json", {"drivers": updated_drivers})
            
            updated_rides.append(ride)

        if not ride_found:
            return jsonify({"error": "Không tìm thấy chuyến đi!"}), 404

        save_data("rides.json", updated_rides)
        return jsonify({"message": "Chuyến đi đã hoàn thành!"})
        
    except Exception as e:
        print(f"Error in complete_ride: {e}")
        return jsonify({"error": f"Có lỗi xảy ra: {str(e)}"}), 500




@app.route("/api/login/customer", methods=["POST"])
def login_customer():
    data = request.json
    identifier = data.get("identifier")
    password = data.get("password")

    print(f"Login attempt: identifier={identifier}, password={password}")

    customers = load_data("customers.json")

    for customer in customers:
        if (customer["email"] == identifier or customer["phone"] == identifier) and customer["password"] == password:
            print(f"Login successful for customer ID: {customer['id']}")
            return jsonify({
                "message": "Đăng nhập thành công",
                "id": customer["id"]
            })

    print("Login failed: Invalid credentials")
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

@app.route("/api/ride/driver-location/<int:ride_id>", methods=["GET"])
def get_driver_location(ride_id):
    try:
        rides = load_data("rides.json")
        drivers_data = load_data("drivers.json")
        
        if not isinstance(drivers_data, dict) or "drivers" not in drivers_data:
            return jsonify({"error": "Dữ liệu tài xế không hợp lệ"}), 500
            
        drivers = drivers_data["drivers"]
        
        ride = next((r for r in rides if r["id"] == ride_id), None)
        if not ride:
            return jsonify({"error": "Không tìm thấy chuyến đi"}), 404
            
        driver = next((d for d in drivers if d["id"] == ride["driver_id"]), None)
        if not driver:
            return jsonify({"error": "Không tìm thấy tài xế"}), 404
            
        return jsonify({
            "current_location": driver.get("location")
        })
        
    except Exception as e:
        print(f"Error in get_driver_location: {e}")
        return jsonify({"error": f"Có lỗi xảy ra: {str(e)}"}), 500

# Admin endpoints
@app.route('/api/admin/rides/active', methods=['GET'])
def get_active_rides():
    try:
        rides = load_data('rides.json')
        drivers_data = load_data('drivers.json')
        customers = load_data('customers.json')
        
        drivers = drivers_data.get('drivers', [])
        
        # Lấy các chuyến đi đang hoạt động
        active_rides = []
        for ride in rides:
            if ride['status'] in ['pending', 'accepted', 'in_progress', 'ongoing']:
                # Thêm thông tin tài xế
                if 'driver_id' in ride:
                    driver = next((d for d in drivers if d['id'] == ride['driver_id']), None)
                    if driver:
                        ride['driver_name'] = driver['name']
                        ride['vehicle_type'] = driver['vehicle_type']
                
                # Thêm thông tin khách hàng
                if 'customer_id' in ride:
                    customer = next((c for c in customers if c['id'] == ride['customer_id']), None)
                    if customer:
                        ride['customer_name'] = customer['name']
                        ride['customer_phone'] = customer['phone']
                
                active_rides.append(ride)

        return jsonify(active_rides)
    except Exception as e:
        print(f"Error in get_active_rides: {str(e)}")
        return jsonify([])

@app.route('/api/admin/rides/history', methods=['GET'])
def get_ride_history():
    try:
        rides = load_data('rides.json')
        drivers_data = load_data('drivers.json')
        customers = load_data('customers.json')
        
        drivers = drivers_data.get('drivers', [])
        
        # Lấy các chuyến đi đã hoàn thành hoặc đã hủy
        completed_rides = []
        for ride in rides:
            if ride['status'] in ['completed', 'cancelled']:
                # Thêm thông tin tài xế
                if 'driver_id' in ride:
                    driver = next((d for d in drivers if d['id'] == ride['driver_id']), None)
                    if driver:
                        ride['driver_name'] = driver['name']
                        ride['vehicle_type'] = driver['vehicle_type']
                
                # Thêm thông tin khách hàng
                if 'customer_id' in ride:
                    customer = next((c for c in customers if c['id'] == ride['customer_id']), None)
                    if customer:
                        ride['customer_name'] = customer['name']
                        ride['customer_phone'] = customer['phone']
                
                completed_rides.append(ride)

        # Sắp xếp theo thời gian tạo, mới nhất lên đầu
        completed_rides.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return jsonify(completed_rides)
    except Exception as e:
        print(f"Error in get_ride_history: {str(e)}")
        return jsonify([])

@app.route('/api/admin/drivers', methods=['GET'])
def get_all_drivers():
    try:
        drivers_data = load_data('drivers.json')
        drivers = drivers_data.get('drivers', [])
        rides = load_data('rides.json')
        
        # Tính toán thống kê cho mỗi tài xế
        for driver in drivers:
            # Đếm tổng số chuyến đi
            driver['total_rides'] = len([r for r in rides if r.get('driver_id') == driver['id']])
            
            # Tính điểm đánh giá trung bình
            completed_rides = [r for r in rides if r.get('driver_id') == driver['id'] and r['status'] == 'completed']
            if completed_rides:
                total_rating = sum(r.get('rating', 0) for r in completed_rides if 'rating' in r)
                driver['rating'] = round(total_rating / len(completed_rides), 1)
            else:
                driver['rating'] = 0
        
        return jsonify(drivers)
    except Exception as e:
        print(f"Error in get_all_drivers: {str(e)}")
        return jsonify([])

@app.route('/api/admin/drivers/<driver_id>', methods=['PUT'])
def update_driver(driver_id):
    try:
        print(f"Nhận yêu cầu cập nhật cho tài xế {driver_id}")
        data = request.get_json()
        print("Dữ liệu nhận được:", data)
        
        drivers_data = load_data('drivers.json')
        if not isinstance(drivers_data, dict) or "drivers" not in drivers_data:
            print("Lỗi: Dữ liệu tài xế không hợp lệ")
            return jsonify({'error': 'Dữ liệu tài xế không hợp lệ'}), 500
            
        drivers = drivers_data.get('drivers', [])
        
        # Tìm và cập nhật thông tin tài xế
        driver_found = False
        for driver in drivers:
            if str(driver['id']) == str(driver_id):
                driver_found = True
                # Cập nhật các trường được cho phép
                allowed_fields = ['name', 'phone', 'vehicle_info', 'status', 'available']
                for field in allowed_fields:
                    if field in data:
                        driver[field] = data[field]
                print(f"Đã cập nhật tài xế {driver_id}:", driver)
                break
        
        if not driver_found:
            print(f"Không tìm thấy tài xế {driver_id}")
            return jsonify({'error': 'Không tìm thấy tài xế'}), 404
        
        # Lưu lại vào file
        save_data('drivers.json', {'drivers': drivers})
        print("Đã lưu dữ liệu thành công")
        
        return jsonify({'message': 'Cập nhật thành công', 'driver': driver})
        
    except Exception as e:
        print(f"Lỗi khi cập nhật tài xế: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route("/api/login/driver", methods=["POST"])
def login_driver():
    try:
        data = request.json
        identifier = data.get("identifier")  # Email hoặc số điện thoại
        password = data.get("password")

        print(f"Driver login attempt: identifier={identifier}, password={password}")

        drivers_data = load_data("drivers.json")
        if not isinstance(drivers_data, dict) or "drivers" not in drivers_data:
            return jsonify({"message": "Lỗi hệ thống: Dữ liệu tài xế không hợp lệ"}), 500
            
        drivers = drivers_data["drivers"]

        # Tìm tài xế theo email hoặc số điện thoại
        driver = next(
            (d for d in drivers if (d["email"] == identifier or d["phone"] == identifier) 
             and d["password"] == password),
            None
        )

        if driver:
            print(f"Login successful for driver ID: {driver['id']}")
            return jsonify({
                "message": "Đăng nhập thành công",
                "id": driver["id"],
                "name": driver["name"],
                "vehicle_type": driver["vehicle_type"],
                "vehicle_info": driver["vehicle_info"],
                "status": driver.get("status", "available"),
                "available": driver.get("available", True)
            })

        print("Login failed: Invalid credentials")
        return jsonify({"message": "Sai thông tin đăng nhập"}), 401

    except Exception as e:
        print(f"Error in login_driver: {str(e)}")
        return jsonify({"message": f"Lỗi hệ thống: {str(e)}"}), 500

@app.route("/api/driver/<int:driver_id>/details", methods=["GET"])
def get_driver_details(driver_id):
    try:
        # Lấy thông tin tài xế
        drivers_data = load_data("drivers.json")
        drivers = drivers_data.get("drivers", [])
        driver = next((d for d in drivers if d["id"] == driver_id), None)
        
        if not driver:
            return jsonify({"message": "Không tìm thấy tài xế"}), 404

        # Lấy lịch sử chuyến đi
        rides = load_data("rides.json")
        driver_rides = [ride for ride in rides if ride.get("driver_id") == driver_id]
        
        # Tính tổng thu nhập (70% giá chuyến đi)
        completed_rides = [ride for ride in driver_rides if ride["status"] == "completed"]
        total_earnings = sum(ride.get("fare", 0) * 0.7 for ride in completed_rides)
        
        # Thống kê theo trạng thái
        ride_stats = {
            "completed": len([r for r in driver_rides if r["status"] == "completed"]),
            "cancelled": len([r for r in driver_rides if r["status"] == "cancelled"]),
            "ongoing": len([r for r in driver_rides if r["status"] in ["pending", "accepted", "in_progress", "ongoing"]])
        }

        return jsonify({
            "driver": {
                "id": driver["id"],
                "name": driver["name"],
                "phone": driver["phone"],
                "email": driver["email"],
                "vehicle_type": driver["vehicle_type"],
                "vehicle_info": driver["vehicle_info"],
                "rating": driver["rating"],
                "total_rides": driver["total_rides"],
                "status": driver["status"],
                "available": driver["available"]
            },
            "earnings": {
                "total": round(total_earnings),
                "ride_count": len(completed_rides)
            },
            "ride_stats": ride_stats,
            "recent_rides": [
                {
                    "id": ride["id"],
                    "pickup": ride["pickup"]["address"],
                    "dropoff": ride["dropoff"]["address"],
                    "status": ride["status"],
                    "fare": round(ride["fare"] * 0.7) if ride["fare"] else 0,
                    "created_at": ride.get("created_at", ""),
                    "completed_at": ride.get("completed_at", "")
                }
                for ride in sorted(driver_rides, key=lambda x: x.get("created_at", ""), reverse=True)[:10]
            ]
        })

    except Exception as e:
        print(f"Error in get_driver_details: {str(e)}")
        return jsonify({"message": f"Lỗi hệ thống: {str(e)}"}), 500

if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    app.run(host="localhost", port=5000, debug=True)