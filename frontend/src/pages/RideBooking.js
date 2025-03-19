import React from "react";

export default function RideBooking() {
  return (
    <div>
      <h2>Book a Ride</h2>
      <form>
        <input type="text" placeholder="Pickup Location" required />
        <input type="text" placeholder="Dropoff Location" required />
        <select required>
          <option value="">Select Payment Method</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
        </select>
        <button type="submit">Request Ride</button>
      </form>
    </div>
  );
}
