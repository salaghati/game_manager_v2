// API Configuration
const API_CONFIG = {
  // Railway Production URL (từ screenshot của bạn)
  PRODUCTION: 'https://gamemanagerv2-production.up.railway.app',
  
  // Local Development URL  
  DEVELOPMENT: 'http://localhost:3002',
  
  // Tự động chọn URL dựa trên environment
  get BASE_URL() {
    // Nếu đang chạy trên localhost thì dùng Railway API
    // Nếu muốn test local API thì đổi thành DEVELOPMENT
    return this.PRODUCTION;
  }
};

export default API_CONFIG; 