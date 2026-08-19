import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Đăng ký các thành phần của Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const API_BASE_URL = 'http://localhost:5000/api';

// ==========================================
// COMPONENT 1: MÀN HÌNH ĐĂNG NHẬP & ĐĂNG KÝ
// ==========================================
const LoginScreen = ({ onLogin }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isRegisterMode) {
        // GỌI API ĐĂNG KÝ
        const response = await axios.post(`${API_BASE_URL}/auth/register`, { username, password, email });
        
        if (response.status === 201) {
          setSuccessMsg('Đăng ký thành công! Vui lòng đăng nhập.');
          setIsRegisterMode(false); // Tự động chuyển form về chế độ Đăng nhập
          setPassword(''); // Xóa trắng ô password cho an toàn
        }
      } else {
        // GỌI API ĐĂNG NHẬP
        const response = await axios.post(`${API_BASE_URL}/auth/login`, { username, password });
        
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          onLogin(username);
        }
      }
    } catch (err) {
      // Bắt lỗi từ Backend (authController.js trả về key 'error')
      setError(err.response?.data?.error || err.response?.data?.message || 'Đã có lỗi xảy ra!');
      
      if (!isRegisterMode && username === 'admin' && password === '123456') {
        console.warn("Đang đăng nhập bằng tài khoản Backup");
        localStorage.setItem('token', 'fake-jwt-token');
        onLogin(username);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-6">
          <i className="fa-solid fa-shield-halved text-5xl text-blue-600 mb-3"></i>
          <h2 className="text-3xl font-bold text-gray-800">Smart PC Case</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isRegisterMode ? 'Đăng ký tài khoản mới' : 'Hệ thống giám sát bảo mật'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-3 bg-red-100 text-red-600 text-sm rounded-md border border-red-200"><i className="fa-solid fa-triangle-exclamation mr-1"></i> {error}</div>}
          {successMsg && <div className="p-3 bg-green-100 text-green-700 text-sm rounded-md border border-green-200"><i className="fa-solid fa-check mr-1"></i> {successMsg}</div>}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Tài khoản</label>
            <input 
              type="text" 
              className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Chỉ hiện ô Email khi ở chế độ Đăng ký */}
          {isRegisterMode && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu</label>
            <input 
              type="password" 
              className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full flex justify-center py-2.5 px-4 rounded-lg shadow-sm text-sm font-bold text-white transition ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : (isRegisterMode ? 'Đăng Ký' : 'Đăng Nhập')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            type="button" 
            onClick={() => {
              setIsRegisterMode(!isRegisterMode); // Đảo ngược trạng thái
              setError(''); // Xóa lỗi cũ nếu có
              setSuccessMsg(''); // Xóa thông báo cũ
            }} 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium transition"
          >
            {isRegisterMode ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký tại đây'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENT 2: MÀN HÌNH DASHBOARD (API THẬT)
// ==========================================
const Dashboard = ({ onLogout }) => {
  const [devices, setDevices] = useState([]);
  const [selectedMac, setSelectedMac] = useState('');

  // --- STATE MỚI CHO MODAL THÊM THIẾT BỊ ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMac, setNewMac] = useState('');
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // State lưu dữ liệu thật
  const [currentTemp, setCurrentTemp] = useState('--');
  const [currentHum, setCurrentHum] = useState('--');
  const [alertLogs, setAlertLogs] = useState([]);
  const [chartDataState, setChartDataState] = useState({ labels: [], temps: [] });

  // State trạng thái nút bấm
  const [isFanOn, setIsFanOn] = useState(false);
  const [isBuzzerOn, setIsBuzzerOn] = useState(false);

  // Cấu hình Header có kèm Token để gọi API
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  // --- HÀM MỚI: FETCH DANH SÁCH THIẾT BỊ TỪ DB ---
  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/devices`, getAuthHeaders());
      
      // SỬA LỖI 1: Lấy mảng devices từ trong object trả về
      const deviceList = response.data.devices;
      
      if (deviceList && deviceList.length > 0) {
        setDevices(deviceList);
        // Tự động chọn thiết bị đầu tiên trong danh sách nếu chưa chọn
        if (!selectedMac) {
          // SỬA LỖI 2: Dùng đúng tên cột device_id từ Backend
          setSelectedMac(deviceList[0].device_id); 
        }
      }
    } catch (error) {
      console.error("Lỗi khi kéo danh sách thiết bị:", error);
    }
  };

  // --- 1. HÀM FETCH DỮ LIỆU TỪ BACKEND ---
  const fetchData = async () => {
    // Nếu chưa có thiết bị nào được chọn thì không gọi API
    if (!selectedMac) return;

    try {
      // 1. Lấy dữ liệu cảm biến mới nhất (Metrics)
      const metricRes = await axios.get(`${API_BASE_URL}/metrics/${selectedMac}`, getAuthHeaders());
      
      // SỬA LỖI 1: Lấy mảng metrics từ trong object trả về
      const metricList = metricRes.data.metrics;
      
      if (metricList && metricList.length > 0) {
        // SỬA LỖI 4: Backend ĐÃ gọi hàm .reverse() (từ cũ đến mới)
        // Nên phần tử CUỐI CÙNG trong mảng mới là dữ liệu MỚI NHẤT
        const newestData = metricList[metricList.length - 1];
        
        setCurrentTemp(newestData.temperature);
        setCurrentHum(newestData.humidity);
        
        // Lấy tối đa 7 điểm dữ liệu cuối cùng (mới nhất) để vẽ Chart
        const recentData = metricList.slice(-7);
        setChartDataState({
          // SỬA LỖI 3: Dùng đúng tên cột recorded_at từ Backend
          labels: recentData.map(d => new Date(d.recorded_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})),
          temps: recentData.map(d => d.temperature)
        });
      }

      // 2. Lấy dữ liệu cảnh báo khẩn cấp (Alerts)
      const alertRes = await axios.get(`${API_BASE_URL}/metrics/${selectedMac}/alerts`, getAuthHeaders());
      
      // SỬA LỖI 1: Lấy mảng alerts từ trong object trả về
      if (alertRes.data && alertRes.data.alerts) {
        setAlertLogs(alertRes.data.alerts);
      }
    } catch (error) {
      console.error("Lỗi khi kéo dữ liệu:", error);
    }
  };

  // Kéo danh sách thiết bị 1 lần duy nhất khi vừa load Dashboard
  useEffect(() => {
    fetchDevices();
  }, []);

  // --- HÀM MỚI: XỬ LÝ SUBMIT THÊM THIẾT BỊ ---
  const handleAddDevice = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    setAddError('');

    try {
      // Gọi API POST /api/devices với body khớp 100% tên cột Backend
      await axios.post(`${API_BASE_URL}/devices`, {
        device_id: newMac,
        device_name: newName
      }, getAuthHeaders());
      
      // Nếu thành công: Đóng modal, xóa form
      setIsAddModalOpen(false);
      setNewMac('');
      setNewName('');
      
      // Kéo lại danh sách thiết bị từ DB để cập nhật Dropdown
      await fetchDevices();
      
      // Tự động chọn luôn thiết bị vừa thêm
      setSelectedMac(newMac);
      
      // Reset hiển thị thông số về mặc định để chờ data mới
      setCurrentTemp('--');
      setCurrentHum('--');
      setChartDataState({ labels: [], temps: [] });
      setAlertLogs([]);
    } catch (err) {
      setAddError(err.response?.data?.error || 'Có lỗi xảy ra khi thêm thiết bị');
    } finally {
      setIsAdding(false);
    }
  };

  // Tự động kéo dữ liệu mỗi 5 giây, chỉ chạy khi đã có selectedMac
  useEffect(() => {
    if (!selectedMac) {
      // Nếu không có thiết bị nào, reset sạch dữ liệu trên màn hình
      setCurrentTemp('--');
      setCurrentHum('--');
      setChartDataState({ labels: [], temps: [] });
      setAlertLogs([]);
      return;
    }
    
    fetchData(); // Gọi lần đầu
    const interval = setInterval(fetchData, 5000); // Polling mỗi 5s
    return () => clearInterval(interval);
  }, [selectedMac]);


  // --- 2. HÀM ĐIỀU KHIỂN THIẾT BỊ ---
  const toggleFan = async () => {
    const action = isFanOn ? 'OFF' : 'ON';
    try {
      await axios.post(`${API_BASE_URL}/control/fan`, { mac: selectedMac, action: action }, getAuthHeaders());
      setIsFanOn(!isFanOn); 
    } catch (error) {
      console.error("Lỗi điều khiển quạt:", error);
      alert("Không thể điều khiển quạt, vui lòng kiểm tra kết nối MQTT Backend.");
    }
  };

  const toggleBuzzer = async () => {
    const action = isBuzzerOn ? 'OFF' : 'ON';
    try {
      await axios.post(`${API_BASE_URL}/control/buzzer`, { mac: selectedMac, action: action }, getAuthHeaders());
      setIsBuzzerOn(!isBuzzerOn);
    } catch (error) {
      console.error("Lỗi điều khiển còi:", error);
      alert("Không thể điều khiển còi!");
    }
  };
  // --- CẤU HÌNH BIỂU ĐỒ ---
  // Đã gỡ bỏ dữ liệu Hardcode [35, 36, 37...]
  const chartData = {
    labels: chartDataState.labels,
    datasets: [
      {
        label: 'Nhiệt độ (°C)',
        data: chartDataState.temps,
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };
  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        
        {/* NAVBAR */}
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <i className="fa-solid fa-computer text-blue-600 text-3xl"></i>
              <span className="text-2xl font-bold text-gray-800 hidden sm:block">Smart PC</span>
            </div>
            
            <div className="relative flex-grow">
              <select 
                className="w-full appearance-none bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block py-2.5 pl-4 pr-10 font-bold cursor-pointer transition hover:bg-blue-100 outline-none"
                value={selectedMac}
                onChange={(e) => setSelectedMac(e.target.value)}
                disabled={devices.length === 0}
              >
                {devices.length > 0 ? (
                  devices.map(dev => (
                    <option key={dev.device_id} value={dev.device_id}>
                      {dev.device_name || 'Thiết bị không tên'}
                    </option>
                  ))
                ) : (
                  <option value="">Chưa có thiết bị nào</option>
                )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-800"><i className="fa-solid fa-chevron-down text-sm"></i></div>
            </div>

            {/* NÚT THÊM THIẾT BỊ */}
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition"
              title="Thêm thiết bị mới"
            >
              <i className="fa-solid fa-plus text-blue-600"></i> <span className="hidden sm:inline">Thêm</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-medium">
              <i className="fa-solid fa-circle-check text-green-500 mr-1 animate-pulse"></i> Online
            </span>
            <button onClick={onLogout} className="text-sm text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-semibold transition">
              <i className="fa-solid fa-right-from-bracket mr-1"></i> Đăng xuất
            </button>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50">
          
          {/* CỘT TRÁI */}
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500 relative">
              <h3 className="text-gray-500 text-xs font-bold mb-4 uppercase tracking-wider">Thông số môi trường</h3>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-4 rounded-full text-red-500"><i className="fa-solid fa-temperature-three-quarters text-2xl"></i></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Nhiệt độ</p>
                    <p className="text-3xl font-black text-gray-800">{currentTemp} <span className="text-lg text-gray-500 font-bold">°C</span></p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-4 rounded-full text-blue-500"><i className="fa-solid fa-droplet text-2xl"></i></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Độ ẩm</p>
                    <p className="text-3xl font-black text-gray-800">{currentHum} <span className="text-lg text-gray-500 font-bold">%</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500 relative">
              <h3 className="text-gray-500 text-xs font-bold mb-4 uppercase tracking-wider">Điều khiển thủ công</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid fa-fan text-xl ${isFanOn ? 'text-green-500 animate-spin' : 'text-gray-400'}`}></i>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Quạt thông gió</p>
                      <p className={`text-xs font-semibold ${isFanOn ? 'text-green-600' : 'text-gray-500'}`}>{isFanOn ? 'Đang bật' : 'Đang tắt'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleFan} 
                    disabled={!selectedMac}
                    className={`px-5 py-2 rounded-lg text-sm font-bold shadow transition text-white ${!selectedMac ? 'bg-gray-300 cursor-not-allowed' : (isFanOn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600')}`}
                  >
                    {isFanOn ? 'TẮT QUẠT' : 'BẬT QUẠT'}
                  </button>
                </div>

                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid fa-bullhorn text-xl ${isBuzzerOn ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}></i>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Còi báo động</p>
                      <p className={`text-xs font-semibold ${isBuzzerOn ? 'text-red-600' : 'text-gray-500'}`}>{isBuzzerOn ? 'Đang báo động!' : 'Đang tắt'}</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleBuzzer} 
                    disabled={!selectedMac}
                    className={`px-5 py-2 rounded-lg text-sm font-bold shadow transition text-white ${!selectedMac ? 'bg-gray-300 cursor-not-allowed' : (isBuzzerOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700')}`}
                  >
                    {isBuzzerOn ? 'TẮT CÒI' : 'BẬT HÚ'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative">
              <h3 className="text-gray-500 text-xs font-bold mb-4 uppercase tracking-wider">Biểu đồ Nhiệt độ theo thời gian</h3>
              
              {/* XỬ LÝ EMPTY STATE (HIỂN THỊ KHI CHƯA CÓ DATA) */}
              <div className="w-full h-64 rounded-lg bg-gray-50 border border-dashed border-gray-300 flex items-center justify-center">
                {devices.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <i className="fa-solid fa-microchip text-4xl mb-3 text-gray-300"></i>
                    <p className="font-semibold">Tài khoản chưa có thiết bị.</p>
                    <p className="text-sm">Vui lòng bấm nút "Thêm" ở góc trên để bắt đầu!</p>
                  </div>
                ) : chartDataState.labels.length === 0 ? (
                  <div className="text-center text-gray-500">
                    <i className="fa-solid fa-satellite-dish text-4xl mb-3 text-blue-300 animate-pulse"></i>
                    <p className="font-semibold">Đang chờ nhận dữ liệu...</p>
                    <p className="text-sm">Đảm bảo ESP32 đang được cấp nguồn và có kết nối WiFi.</p>
                  </div>
                ) : (
                  <Line data={chartData} options={chartOptions} />
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Nhật ký sự kiện khẩn cấp</h3>
                <button onClick={fetchData} className="text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-3 py-1.5 rounded transition">
                  <i className="fa-solid fa-rotate-right mr-1"></i> Làm mới
                </button>
              </div>
              
              <div className="overflow-x-auto rounded-lg border border-gray-200 h-48 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Thời gian</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Loại</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Mô tả chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {devices.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-4 py-12 text-center text-gray-500">
                          <i className="fa-solid fa-microchip text-3xl mb-2 text-gray-300"></i>
                          <p className="font-semibold">Tài khoản chưa có thiết bị.</p>
                        </td>
                      </tr>
                    ) : alertLogs.length > 0 ? alertLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">
                          {new Date(log.triggered_at || log.created_at).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-md ${log.alert_type?.includes('FIRE') || log.alert_type?.includes('TEMP') ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                            {log.alert_type || 'CẢNH BÁO'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-800 font-medium">{log.message}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" className="px-4 py-10 text-center text-gray-500">
                          <i className="fa-regular fa-circle-check text-4xl mb-3 text-green-400"></i>
                          <p className="font-semibold text-gray-700">Hệ thống an toàn</p>
                          <p className="text-sm mt-1">Chưa có sự kiện khẩn cấp nào được ghi nhận!</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL THÊM THIẾT BỊ (NỔI LÊN TRÊN CÙNG) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800"><i className="fa-solid fa-microchip text-blue-600 mr-2"></i>Thêm Case PC mới</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-red-500 transition">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleAddDevice} className="p-6 space-y-4">
              {addError && <div className="p-3 bg-red-100 text-red-600 text-sm rounded-md border border-red-200 font-medium">{addError}</div>}
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mã thiết bị (MAC Address) <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                  placeholder="VD: 24:0A:C4:5E:2B:11"
                  value={newMac}
                  onChange={(e) => setNewMac(e.target.value)}
                  required
                />
                {/* <p className="text-xs text-gray-500 mt-1">Lấy mã này trong code ESP32 hoặc log của MQTT.</p> */}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tên gợi nhớ <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className="block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                  placeholder="VD: PC Gaming Phòng Ngủ"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={isAdding}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold text-white shadow-sm transition ${isAdding ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {isAdding ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Lưu Thiết Bị'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// COMPONENT GỐC: APP
// ==========================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Kiểm tra token khi vừa mở web
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setCurrentUser('admin');
    }
  }, []);

  const handleLogin = (username) => {
    setCurrentUser(username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <>
      {!isAuthenticated ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </>
  );
}