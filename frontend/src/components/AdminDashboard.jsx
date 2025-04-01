import React, { useState, useEffect } from 'react';
import { Table, Badge, Alert, Pagination, Card, Nav, Button } from 'react-bootstrap';
import { toast } from 'react-hot-toast';

const AdminDashboard = () => {
  const [activeRides, setActiveRides] = useState([]);
  const [rideHistory, setRideHistory] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('active-rides');
  const recordsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [activeRidesRes, historyRes, driversRes] = await Promise.all([
        fetch('/api/admin/rides/active'),
        fetch('/api/admin/rides/history'),
        fetch('/api/admin/drivers')
      ]);

      const [activeRidesData, historyData, driversData] = await Promise.all([
        activeRidesRes.json(),
        historyRes.json(),
        driversRes.json()
      ]);

      setActiveRides(Array.isArray(activeRidesData) ? activeRidesData : []);
      setRideHistory(Array.isArray(historyData) ? historyData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
    } catch (error) {
      console.error('Chi tiết lỗi:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      'pending': 'warning',
      'accepted': 'info',
      'in_progress': 'primary',
      'completed': 'success',
      'cancelled': 'danger'
    };
    const statusText = {
      'pending': 'Đang chờ',
      'accepted': 'Đã nhận',
      'in_progress': 'Đang chạy',
      'completed': 'Hoàn thành', 
      'cancelled': 'Đã hủy'
    };
    return <Badge bg={statusColors[status] || 'secondary'}>{statusText[status] || status}</Badge>;
  };

  // Tính toán phân trang
  const getCurrentData = (data) => {
    const indexOfLastRecord = currentPage * recordsPerPage;
    const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
    return data.slice(indexOfFirstRecord, indexOfLastRecord);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPagination = (totalRecords) => {
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    if (totalPages <= 1) return null;

    return (
      <div className="d-flex justify-content-center mt-3">
        <Pagination>
          <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
          <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
          
          {[...Array(totalPages)].map((_, index) => (
            <Pagination.Item
              key={index + 1}
              active={index + 1 === currentPage}
              onClick={() => handlePageChange(index + 1)}
            >
              {index + 1}
            </Pagination.Item>
          ))}
          
          <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
          <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
        </Pagination>
      </div>
    );
  };

  // Reset trang khi chuyển tab
  const handleTabSelect = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Thêm hàm để thay đổi trạng thái tài xế
  const handleStatusChange = async (driverId, currentStatus) => {
    try {
        console.log('Đang thay đổi trạng thái cho tài xế:', driverId);
        console.log('Trạng thái hiện tại:', currentStatus);
        
        const newStatus = currentStatus === 'busy' ? 'available' : 'busy';
        console.log('Trạng thái mới:', newStatus);
        
        const response = await fetch(`/api/admin/drivers/${driverId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: newStatus,
                available: newStatus === 'available'
            })
        });

        console.log('Response status:', response.status);
        const responseData = await response.json();
        console.log('Response data:', responseData);

        if (response.ok) {
            await fetchData(); // Đợi fetchData hoàn thành
            toast.success(`Đã thay đổi trạng thái tài xế thành ${newStatus === 'available' ? 'rảnh' : 'bận'}`);
        } else {
            toast.error(`Không thể thay đổi trạng thái tài xế: ${responseData.error || 'Lỗi không xác định'}`);
        }
    } catch (error) {
        console.error('Error changing driver status:', error);
        toast.error('Có lỗi xảy ra khi thay đổi trạng thái tài xế');
    }
  };

  // Thêm hàm xử lý hoàn thành chuyến
  const handleCompleteRide = async (rideId) => {
    try {
      console.log('Đang hoàn thành chuyến đi:', rideId);
      
      const response = await fetch(`/api/ride/complete/${rideId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        await fetchData(); // Cập nhật lại dữ liệu
        toast.success('Đã hoàn thành chuyến đi thành công');
      } else {
        toast.error(`Không thể hoàn thành chuyến đi: ${responseData.error || 'Lỗi không xác định'}`);
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      toast.error('Có lỗi xảy ra khi hoàn thành chuyến đi');
    }
  };

  // Thêm hàm format thời gian
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('vi-VN');
  };

  // Thêm hàm format địa chỉ
  const formatAddress = (location) => {
    if (!location) return '-';
    if (typeof location === 'string') return location;
    return location.address || `${location.lat}, ${location.lng}` || '-';
  };

  return (
    <div className="container">
      <Card className="admin-card">
        <Card.Header>
          <h4 className="mb-0">Bảng điều khiển quản trị</h4>
        </Card.Header>
        
        <Card.Body className="p-0">
          <Nav variant="tabs" activeKey={activeTab} onSelect={handleTabSelect} className="admin-nav-tabs">
            <Nav.Item>
              <Nav.Link eventKey="active-rides">
                <i className="fas fa-car-side me-2"></i>Chuyến đi hiện tại
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="ride-history">
                <i className="fas fa-history me-2"></i>Lịch sử chuyến đi
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="drivers">
                <i className="fas fa-users me-2"></i>Quản lý tài xế
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {loading ? (
            <div className="admin-loading">
              <i className="fas fa-spinner fa-spin me-2"></i>Đang tải dữ liệu...
            </div>
          ) : error ? (
            <Alert variant="danger" className="admin-alert">{error}</Alert>
          ) : (
            <div className="p-3">
              {/* Tab Chuyến đi hiện tại */}
              {activeTab === 'active-rides' && (
                <>
                  {activeRides.length === 0 ? (
                    <Alert variant="info" className="admin-alert">Không có chuyến đi nào đang hoạt động</Alert>
                  ) : (
                    <>
                      <Table striped bordered hover responsive className="admin-table">
                        <thead>
                          <tr>
                            <th>#ID</th>
                            <th>Khách hàng</th>
                            <th>Tài xế</th>
                            <th>Điểm đón</th>
                            <th>Điểm đến</th>
                            <th>Trạng thái</th>
                            <th>Thời gian</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCurrentData(activeRides).map(ride => (
                            <tr key={ride.id}>
                              <td>#{ride.id}</td>
                              <td>
                                <div>{ride.customer_name || '-'}</div>
                                <small className="text-muted">{ride.customer_phone || ''}</small>
                              </td>
                              <td>
                                <div>{ride.driver_name || '-'}</div>
                                <small className="text-muted">{ride.vehicle_type || ''}</small>
                              </td>
                              <td>{formatAddress(ride.pickup)}</td>
                              <td>{formatAddress(ride.dropoff)}</td>
                              <td>{getStatusBadge(ride.status)}</td>
                              <td>{formatDateTime(ride.created_at)}</td>
                              <td>
                                <Button
                                  size="sm"
                                  variant="success"
                                  disabled={ride.status === 'completed' || ride.status === 'cancelled'}
                                  onClick={() => handleCompleteRide(ride.id)}
                                  title={ride.status === 'completed' || ride.status === 'cancelled' ? 'Chuyến đi đã kết thúc' : ''}
                                >
                                  <i className="fas fa-check me-1"></i> Hoàn thành
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      <div className="admin-pagination">
                        {renderPagination(activeRides.length)}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Tab Lịch sử chuyến đi */}
              {activeTab === 'ride-history' && (
                <>
                  {rideHistory.length === 0 ? (
                    <Alert variant="info" className="admin-alert">Chưa có lịch sử chuyến đi nào</Alert>
                  ) : (
                    <>
                      <Table striped bordered hover responsive className="admin-table">
                        <thead>
                          <tr>
                            <th>#ID</th>
                            <th>Khách hàng</th>
                            <th>Tài xế</th>
                            <th>Điểm đón</th>
                            <th>Điểm đến</th>
                            <th>Trạng thái</th>
                            <th>Giá tiền</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCurrentData(rideHistory).map(ride => (
                            <tr key={ride.id}>
                              <td>#{ride.id}</td>
                              <td>
                                <div>{ride.customer_name || '-'}</div>
                                <small className="text-muted">{ride.customer_phone || ''}</small>
                              </td>
                              <td>
                                <div>{ride.driver_name || '-'}</div>
                                <small className="text-muted">{ride.vehicle_type || ''}</small>
                              </td>
                              <td>{formatAddress(ride.pickup)}</td>
                              <td>{formatAddress(ride.dropoff)}</td>
                              <td>{getStatusBadge(ride.status)}</td>
                              <td>
                                {ride.estimated_price ? `${ride.estimated_price.toLocaleString('vi-VN')}đ` : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      <div className="admin-pagination">
                        {renderPagination(rideHistory.length)}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Tab Quản lý tài xế */}
              {activeTab === 'drivers' && (
                <>
                  {drivers.length === 0 ? (
                    <Alert variant="info" className="admin-alert">Chưa có tài xế nào trong hệ thống</Alert>
                  ) : (
                    <>
                      <Table striped bordered hover responsive className="admin-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Tên tài xế</th>
                            <th>Số điện thoại</th>
                            <th>Loại xe</th>
                            <th>Biển số</th>
                            <th>Đánh giá</th>
                            <th>Tổng chuyến</th>
                            <th>Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getCurrentData(drivers).map(driver => (
                            <tr key={driver.id}>
                              <td>#{driver.id}</td>
                              <td>{driver.name}</td>
                              <td>{driver.phone}</td>
                              <td>
                                <span className="vehicle-icon">
                                  {driver.vehicle_type === 'bike' && <i className="fas fa-motorcycle"></i>}
                                  {driver.vehicle_type === 'car' && <i className="fas fa-car"></i>}
                                  {driver.vehicle_type === 'van' && <i className="fas fa-shuttle-van"></i>}
                                  {driver.vehicle_type}
                                </span>
                              </td>
                              <td>{driver.vehicle_number}</td>
                              <td>
                                <span className="rating-cell">
                                  {driver.rating?.toFixed(1) || '0.0'}
                                  <i className="fas fa-star"></i>
                                </span>
                              </td>
                              <td>{driver.total_rides || 0}</td>
                              <td>
                                <div className="d-flex align-items-center">
                                    <span className={`admin-badge bg-${driver.status === 'available' ? 'success' : 'warning'} me-2`}>
                                        {driver.status === 'available' ? 'Rảnh' : 'Bận'}
                                    </span>
                                    <button 
                                        className={`btn btn-sm btn-${driver.status === 'available' ? 'warning' : 'success'}`}
                                        onClick={() => handleStatusChange(driver.id, driver.status)}
                                    >
                                        <i className="fas fa-exchange-alt me-1"></i>
                                        {driver.status === 'available' ? 'Đặt bận' : 'Đặt rảnh'}
                                    </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                      <div className="admin-pagination">
                        {renderPagination(drivers.length)}
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminDashboard; 