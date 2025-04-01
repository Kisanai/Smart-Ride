import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Table } from 'react-bootstrap';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DriverDashboard = () => {
  const [driverDetails, setDriverDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const driverId = localStorage.getItem('driver_id');
    if (!driverId) {
      navigate('/login/driver');
      return;
    }
    fetchDriverDetails(driverId);
  }, [navigate]);

  const fetchDriverDetails = async (driverId) => {
    try {
      const response = await fetch(`/api/driver/${driverId}/details`);
      if (!response.ok) {
        throw new Error('Không thể tải thông tin tài xế');
      }
      const data = await response.json();
      setDriverDetails(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="driver-dashboard loading">Đang tải...</div>;
  }

  if (!driverDetails) {
    return <div className="driver-dashboard text-center p-5">Không tìm thấy thông tin tài xế</div>;
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      completed: { text: 'Hoàn thành', variant: 'success' },
      cancelled: { text: 'Đã hủy', variant: 'danger' },
      ongoing: { text: 'Đang thực hiện', variant: 'warning' },
      pending: { text: 'Chờ nhận', variant: 'info' },
      accepted: { text: 'Đã nhận', variant: 'primary' },
      in_progress: { text: 'Đang đi', variant: 'warning' },
      available: { text: 'Sẵn sàng', variant: 'success' },
      unavailable: { text: 'Không sẵn sàng', variant: 'danger' },
      busy: { text: 'Đang bận', variant: 'warning' }
    };
    const statusInfo = statusMap[status?.toLowerCase()] || { text: status || 'Không xác định', variant: 'secondary' };
    return <span className={`status-badge status-${statusInfo.variant}`}>{statusInfo.text}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="driver-dashboard container py-4">
      {/* Thông tin tài xế */}
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-primary text-white">
          <i className="fas fa-user me-2"></i>
          Thông tin tài xế
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <p><strong>Tên:</strong> {driverDetails.driver.name}</p>
              <p><strong>Số điện thoại:</strong> {driverDetails.driver.phone}</p>
              <p><strong>Email:</strong> {driverDetails.driver.email}</p>
            </Col>
            <Col md={6}>
              <p><strong>Loại xe:</strong> {driverDetails.driver.vehicle_type}</p>
              <p><strong>Thông tin xe:</strong> {driverDetails.driver.vehicle_info}</p>
              <p>
                <strong>Trạng thái:</strong>{' '}
                {getStatusBadge(driverDetails.driver.status)}
              </p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Thống kê thu nhập */}
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-success text-white">
          <i className="fas fa-money-bill-wave me-2"></i>
          Thống kê thu nhập
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="stats-card">
              <h3>{formatCurrency(driverDetails.earnings.total)}</h3>
              <p>Tổng thu nhập</p>
            </Col>
            <Col md={4} className="stats-card">
              <h3>{driverDetails.earnings.ride_count}</h3>
              <p>Số chuyến hoàn thành</p>
            </Col>
            <Col md={4} className="stats-card">
              <h3>{driverDetails.driver.rating || 0}/5</h3>
              <p>Đánh giá trung bình</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Thống kê chuyến đi */}
      <Card className="mb-4">
        <Card.Header as="h5" className="bg-info text-white">
          <i className="fas fa-chart-bar me-2"></i>
          Thống kê chuyến đi
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4} className="stats-card">
              <h3>{driverDetails.ride_stats.completed}</h3>
              <p>Chuyến hoàn thành</p>
            </Col>
            <Col md={4} className="stats-card">
              <h3>{driverDetails.ride_stats.cancelled}</h3>
              <p>Chuyến đã hủy</p>
            </Col>
            <Col md={4} className="stats-card">
              <h3>{driverDetails.ride_stats.ongoing}</h3>
              <p>Chuyến đang thực hiện</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Lịch sử chuyến đi gần đây */}
      <Card>
        <Card.Header as="h5" className="bg-secondary text-white">
          <i className="fas fa-history me-2"></i>
          Lịch sử chuyến đi gần đây
        </Card.Header>
        <Card.Body>
          <Table responsive striped hover>
            <thead>
              <tr>
                <th>#ID</th>
                <th>Điểm đón</th>
                <th>Điểm đến</th>
                <th>Trạng thái</th>
                <th>Thu nhập</th>
              </tr>
            </thead>
            <tbody>
              {driverDetails.recent_rides.map((ride) => (
                <tr key={ride.id}>
                  <td>#{ride.id}</td>
                  <td>{ride.pickup}</td>
                  <td>{ride.dropoff}</td>
                  <td>{getStatusBadge(ride.status)}</td>
                  <td>{formatCurrency(ride.fare)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DriverDashboard; 