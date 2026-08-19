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
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// ==========================================
// COMPONENT 1: MÀN HÌNH ĐĂNG NHẬP
// ==========================================
const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Giả lập logic đăng nhập (Sau này sẽ gọi API POST /api/auth/login)
    if (username === 'admin' && password === '123456') {
      onLogin(username);
    } else {
      setError('Sai tài khoản hoặc mật khẩu! (Dùng admin / 123456 để test)');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-200">
        <div className="text-center mb-6">
          <i className="fa-solid fa-shield-halved text-5xl text-blue-600 mb-3"></i>
          <h2 className="text-3xl font-bold text-gray-800">Smart PC Case</h2>
          <p className="text-sm text-gray-500 mt-1">Hệ thống giám sát bảo mật</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="p-3 bg-red-100 text-red-600 text-sm rounded-md">{error}</div>}
          <div>
            <label className="block text-sm font-semibold text-gray-700">Tài khoản</label>
            <input 
              type="text" 
              className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition" 
              placeholder="Nhập 'admin'"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Mật khẩu</label>
            <input 
              type="password" 
              className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition" 
              placeholder="Nhập '123456'"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Đăng Nhập
          </button>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENT 2: MÀN HÌNH DASHBOARD CHÍNH
// ==========================================
const Dashboard = ({ onLogout }) => {
  // State quản lý thiết bị
  const [devices] = useState([
    { id: '24:0A:C4:5E:2B:11', name: '💻 PC Gaming Phòng Ngủ' },
    { id: 'AA:BB:CC:DD:EE:FF', name: '🖥️ Máy trạm Công ty' }
  ]);
  const [selectedMac, setSelectedMac] = useState(devices[0].id);

  // State thông số môi trường
  const [currentTemp, setCurrentTemp] = useState(35.5);
  const [currentHum, setCurrentHum] = useState(60.0);

  // State điều khiển thiết bị
  const [isFanOn, setIsFanOn] = useState(false);
  const [isBuzzerOn, setIsBuzzerOn] = useState(false);

  // Cấu hình Base URL của Backend Node.js
  const API_BASE_URL = 'http://localhost:5000/api';

  // Hàm gọi API Backend để điều khiển Quạt
  const toggleFan = async () => {
    const action = isFanOn ? 'OFF' : 'ON';
    try {
      // Gọi API POST tới Backend của bạn
      await axios.post(`${API_BASE_URL}/control/fan`, { mac: selectedMac, action: action });
      setIsFanOn(!isFanOn); // Cập nhật UI nếu gọi API thành công
      // alert(`Đã gửi lệnh ${action} cho Quạt!`); // Bỏ comment khi ráp backend thật
    } catch (error) {
      console.error("Lỗi điều khiển quạt:", error);
      setIsFanOn(!isFanOn); // Tạm thời vẫn đổi trạng thái UI để Demo nếu Backend chưa chạy
    }
  };

  // Hàm gọi API Backend để điều khiển Còi
  const toggleBuzzer = async () => {
    const action = isBuzzerOn ? 'OFF' : 'ON';
    try {
      await axios.post(`${API_BASE_URL}/control/buzzer`, { mac: selectedMac, action: action });
      setIsBuzzerOn(!isBuzzerOn);
    } catch (error) {
      console.error("Lỗi điều khiển còi:", error);
      setIsBuzzerOn(!isBuzzerOn); // Tạm thời cho phép UI thay đổi để Demo
    }
  };

  // Dữ liệu giả lập cho biểu đồ Chart.js
  const chartData = {
    labels: ['10:00', '10:10', '10:20', '10:30', '10:40', '10:50', '11:00'],
    datasets: [
      {
        label: 'Nhiệt độ (°C)',
        data: [32, 33.5, 34, 38.5, 37, 36.5, 35.5],
        borderColor: 'rgb(239, 68, 68)', // Red-500
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        tension: 0.4, // Tạo đường cong mềm mại
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false, suggestedMin: 25, suggestedMax: 50 } }
  };

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
            
            {/* Dropdown chọn thiết bị */}
            <div className="relative flex-grow">
              <select 
                className="w-full appearance-none bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block py-2.5 pl-4 pr-10 font-bold cursor-pointer transition hover:bg-blue-100"
                value={selectedMac}
                onChange={(e) => setSelectedMac(e.target.value)}
              >
                {devices.map(dev => (
                  <option key={dev.id} value={dev.id}>{dev.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-blue-800">
                <i className="fa-solid fa-chevron-down text-sm"></i>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 font-medium">
              <i className="fa-solid fa-user-circle text-lg align-middle mr-1"></i> Admin
            </span>
            <button onClick={onLogout} className="text-sm text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg font-semibold transition">
              <i className="fa-solid fa-right-from-bracket mr-1"></i> Đăng xuất
            </button>
          </div>
        </nav>

        {/* MAIN CONTENT GRID */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-gray-50">
          
          {/* CỘT TRÁI: THÔNG SỐ & ĐIỀU KHIỂN */}
          <div className="space-y-6">
            
            {/* Info Panel */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
              <h3 className="text-gray-500 text-xs font-bold mb-4 uppercase tracking-wider">Thông số môi trường</h3>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-red-100 p-4 rounded-full text-red-500">
                    <i className="fa-solid fa-temperature-three-quarters text-2xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Nhiệt độ (DHT22)</p>
                    <p className="text-3xl font-black text-gray-800">{currentTemp} <span className="text-lg text-gray-500 font-bold">°C</span></p>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 p-4 rounded-full text-blue-500">
                    <i className="fa-solid fa-droplet text-2xl"></i>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Độ ẩm (DHT22)</p>
                    <p className="text-3xl font-black text-gray-800">{currentHum} <span className="text-lg text-gray-500 font-bold">%</span></p>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Panel */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500">
              <h3 className="text-gray-500 text-xs font-bold mb-4 uppercase tracking-wider">Điều khiển thủ công</h3>
              <div className="space-y-4">
                
                {/* Nút Quạt */}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid fa-fan text-xl ${isFanOn ? 'text-green-500 animate-spin' : 'text-gray-400'}`}></i>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Quạt thông gió</p>
                      <p className={`text-xs font-semibold ${isFanOn ? 'text-green-600' : 'text-gray-500'}`}>
                        {isFanOn ? 'Đang bật (Relay ON)' : 'Đang tắt (Relay OFF)'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleFan}
                    className={`px-5 py-2 rounded-lg text-sm font-bold shadow transition text-white ${isFanOn ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                  >
                    {isFanOn ? 'TẮT QUẠT' : 'BẬT QUẠT'}
                  </button>
                </div>

                {/* Nút Còi */}
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <i className={`fa-solid fa-bullhorn text-xl ${isBuzzerOn ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}></i>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Còi báo động</p>
                      <p className={`text-xs font-semibold ${isBuzzerOn ? 'text-red-600' : 'text-gray-500'}`}>
                        {isBuzzerOn ? 'Đang báo động!' : 'Đang tắt'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleBuzzer}
                    className={`px-5 py-2 rounded-lg text-sm font-bold shadow transition text-white ${isBuzzerOn ? 'bg-gray-600 hover:bg-gray-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {isBuzzerOn ? 'TẮT CÒI' : 'BẬT HÚ'}
                  </button>
                </div>

              </div>
            </div>

          </div>

          {/* CỘT PHẢI: BIỂU ĐỒ & CẢNH BÁO */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart Panel */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-gray-500 text-xs font-bold mb-4 uppercase tracking-wider">Biểu đồ Nhiệt độ theo thời gian</h3>
              <div className="w-full h-64">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Alerts Table Panel */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">Nhật ký sự kiện khẩn cấp</h3>
                <button className="text-xs text-blue-600 hover:text-blue-800 font-semibold bg-blue-50 px-3 py-1.5 rounded transition">
                  <i className="fa-solid fa-rotate-right mr-1"></i> Làm mới
                </button>
              </div>
              
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Thời gian</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Loại</th>
                      <th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Mô tả chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="bg-red-50 hover:bg-red-100 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">10:45:00 - Hôm nay</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 inline-flex text-xs font-bold rounded-md bg-red-200 text-red-800">CHÁY NỔ</span>
                      </td>
                      <td className="px-4 py-3 text-red-700 font-bold">MQ-2: Phát hiện khói bất thường!</td>
                    </tr>
                    <tr className="bg-yellow-50 hover:bg-yellow-100 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">08:30:15 - Hôm nay</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 inline-flex text-xs font-bold rounded-md bg-yellow-200 text-yellow-800">XÂM NHẬP</span>
                      </td>
                      <td className="px-4 py-3 text-yellow-700 font-bold">HC-SR04: Vỏ kính case bị mở nắp!</td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">22:10:00 - Hôm qua</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2.5 py-1 inline-flex text-xs font-bold rounded-md bg-yellow-100 text-yellow-800">XÂM NHẬP</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium">HC-SR04: Vỏ kính case bị mở nắp!</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// COMPONENT GỐC: APP
// ==========================================
export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const handleLogin = (username) => {
    setCurrentUser(username);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Điều hướng dựa vào state đăng nhập
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