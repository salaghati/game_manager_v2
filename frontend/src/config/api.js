// API Configuration
const API_CONFIG = {
  // Railway Production URL (từ screenshot của bạn)
  PRODUCTION: 'https://gamemanagerv2-production.up.railway.app',
  
  // Local Development URL  
  DEVELOPMENT: 'http://localhost:3002',
  
  // Tự động chọn URL dựa trên environment
  get BASE_URL() {
    // Nếu đang chạy trên production (domain railway.app) thì dùng production API
    // Nếu đang chạy local (localhost) thì dùng production API để test
    if (window.location.hostname.includes('railway.app')) {
      return this.PRODUCTION;
    }
    // Local development - vẫn dùng Railway API để test
    return this.PRODUCTION;
  }
};

export default API_CONFIG; 