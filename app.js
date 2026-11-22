/* ==========================================================================
   BẾP XANH - APPLICATION LOGIC & DATA STORE (app.js)
   Đầy đủ 5 chức năng cốt lõi:
   1. Đặt hàng trước & Thu thập dữ liệu (Customer View - Khóa đơn trước 2-3h)
   2. Quản lý thực đơn & Cập nhật hình ảnh món ăn (Admin View - Upload/Link/Mẫu)
   3. Thiết lập định mức món ăn - BOM (Admin View - Nguyên liệu & Phút/suất)
   4. Dự báo nhu cầu & Tính toán vật tư tự động + Lịch nấu JIT (Admin View)
   5. Quản lý điểm giao & Gộp đơn vận chuyển tại cổng trường ĐH (Admin View)
   ========================================================================== */

const STORAGE_KEY = 'bep_xanh_app_state_v1';

// Thư viện ảnh món ăn mẫu (Bao gồm SVG minh họa món ăn sắc nét & Unsplash URLs)
const PRESET_IMAGES = [
  {
    id: 'preset-ga-nuong',
    label: 'Cơm Gà Nướng Sả',
    url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'preset-bo-tieu',
    label: 'Cơm Bò Sốt Tiêu Đen',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'preset-ca-hoi',
    label: 'Cá Hồi Áp Chảo',
    url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'preset-suon-nuong',
    label: 'Sườn Non Nướng Mật Ong',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'preset-uc-ga',
    label: 'Salad Ức Gà Eat Clean',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'preset-heo-quay',
    label: 'Cơm Thịt Xá Xíu',
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80'
  }
];

// Các ca ăn và quy định khóa đơn trước 2.5 tiếng (150 phút)
const MEAL_SHIFTS = [
  {
    id: 'LUNCH_1130',
    name: 'Ca Trưa (Giao 11:30 - 12:00)',
    shortName: 'Ca Trưa 11:30',
    deliveryHour: 11,
    deliveryMinute: 30,
    cutoffHour: 9,
    cutoffMinute: 0,
    cutoffLabel: '09:00 sáng (Trước giờ ăn 2.5 tiếng)'
  },
  {
    id: 'DINNER_1800',
    name: 'Ca Tối (Giao 18:00 - 18:30)',
    shortName: 'Ca Tối 18:00',
    deliveryHour: 18,
    deliveryMinute: 0,
    cutoffHour: 15,
    cutoffMinute: 30,
    cutoffLabel: '15:30 chiều (Trước giờ ăn 2.5 tiếng)'
  }
];

// Danh sách điểm tập kết cố định tại các trường Đại học Hà Nội
const PICKUP_HUBS = [
  {
    id: 'HUB_BK_TDN',
    name: 'Cổng Trần Đại Nghĩa - ĐH Bách Khoa HN',
    university: 'ĐH Bách Khoa Hà Nội',
    spotNote: 'Bốt bảo vệ cổng Trần Đại Nghĩa (cạnh cây ATM)',
    shipperName: 'Nguyễn Văn Hùng (Xe thùng giữ nhiệt #01)'
  },
  {
    id: 'HUB_BK_GP',
    name: 'Cổng Parabol Giải Phóng - ĐH Bách Khoa HN',
    university: 'ĐH Bách Khoa Hà Nội',
    spotNote: 'Sảnh bên phải cổng Parabol Giải Phóng',
    shipperName: 'Trần Quốc Tuấn (Xe thùng giữ nhiệt #02)'
  },
  {
    id: 'HUB_KTQD_A1',
    name: 'Sảnh Tòa A1 - ĐH Kinh Tế Quốc Dân (NEU)',
    university: 'ĐH Kinh Tế Quốc Dân',
    spotNote: 'Bàn nhận đồ Bếp Xanh đối diện sảnh A1',
    shipperName: 'Lê Minh Đức (Xe thùng giữ nhiệt #03)'
  },
  {
    id: 'HUB_XD_KTX',
    name: 'Ký túc xá ĐH Xây Dựng (Phố Trần Đại Nghĩa)',
    university: 'ĐH Xây Dựng Hà Nội',
    spotNote: 'Cổng chính KTX Xây Dựng',
    shipperName: 'Phạm Hoàng Nam (Xe thùng giữ nhiệt #04)'
  },
  {
    id: 'HUB_QG_XT',
    name: 'Cổng chính ĐH Quốc Gia HN (144 Xuân Thủy)',
    university: 'ĐH Quốc Gia Hà Nội',
    spotNote: 'Khu vực nhà chờ xe buýt cổng Xuân Thủy',
    shipperName: 'Vũ Đình Khoa (Xe thùng giữ nhiệt #05)'
  }
];

// Dữ liệu mặc định ban đầu
const INITIAL_STATE = {
  simulatedTime: '08:15', // Giờ giả lập mặc định để khách đặt được cả Ca Trưa & Ca Tối
  selectedShiftId: 'LUNCH_1130',
  selectedHubId: 'HUB_BK_TDN',
  selectedCategory: 'ALL',
  adminActiveTab: 'TAB_MENU',
  adminFilterShiftId: 'LUNCH_1130',
  editingDishId: null,
  bomSelectedDishId: 'DISH_01',
  hubBatchStatuses: {
    'LUNCH_1130__HUB_BK_TDN': 'Đang gom đơn chuẩn bị nấu',
    'LUNCH_1130__HUB_BK_GP': 'Đang gom đơn chuẩn bị nấu',
    'LUNCH_1130__HUB_KTQD_A1': 'Đang gom đơn chuẩn bị nấu',
    'LUNCH_1130__HUB_XD_KTX': 'Đang gom đơn chuẩn bị nấu'
  },
  dishes: [
    {
      id: 'DISH_01',
      name: 'Cơm Đùi Gà Nướng Sả Mật Ong',
      category: 'Cơm Đầy Đặn',
      price: 42000,
      calories: '620 kcal',
      prepMinutesPerPortion: 2.5,
      available: true,
      description: 'Đùi gà góc tư ướp sả tươi & mật ong rừng nướng vàng da, ăn kèm cơm gạo tám ST25, bông cải xanh luộc và canh rong biển.',
      image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=800&q=80',
      bom: [
        { id: 'b1', name: 'Thịt đùi gà tươi', amount: 180, unit: 'gram' },
        { id: 'b2', name: 'Gạo tám thơm ST25', amount: 130, unit: 'gram' },
        { id: 'b3', name: 'Bông cải xanh & cà rốt', amount: 90, unit: 'gram' },
        { id: 'b4', name: 'Sốt ướp sả mật ong', amount: 25, unit: 'ml' }
      ]
    },
    {
      id: 'DISH_02',
      name: 'Cơm Bò Lúc Lắc Sốt Tiêu Đen',
      category: 'Cơm Đầy Đặn',
      price: 48000,
      calories: '650 kcal',
      prepMinutesPerPortion: 3.0,
      available: true,
      description: 'Thăn bò Úc thái vuông áp chảo lửa lớn cùng ớt chuông Đà Lạt, hành tây và sốt tiêu đen Phú Quốc đậm vị.',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      bom: [
        { id: 'b5', name: 'Thăn bò Úc tươi', amount: 150, unit: 'gram' },
        { id: 'b6', name: 'Gạo tám thơm ST25', amount: 130, unit: 'gram' },
        { id: 'b7', name: 'Ớt chuông & hành tây', amount: 85, unit: 'gram' },
        { id: 'b8', name: 'Sốt tiêu đen đặc biệt', amount: 30, unit: 'ml' }
      ]
    },
    {
      id: 'DISH_03',
      name: 'Cơm Cá Hồi Áp Chảo Sốt Chanh Leo',
      category: 'Healthy & Eat Clean',
      price: 55000,
      calories: '540 kcal',
      prepMinutesPerPortion: 3.5,
      available: true,
      description: 'Cá hồi Nauy phi lê áp chảo giòn da, rưới sốt chanh leo thanh mát, dùng kèm cơm gạo lứt tím than và đậu cô ve.',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=80',
      bom: [
        { id: 'b9', name: 'Cá hồi Nauy phi lê', amount: 140, unit: 'gram' },
        { id: 'b10', name: 'Gạo lứt tím than', amount: 120, unit: 'gram' },
        { id: 'b11', name: 'Bông cải xanh & cà rốt', amount: 100, unit: 'gram' },
        { id: 'b12', name: 'Sốt chanh leo tươi', amount: 25, unit: 'ml' }
      ]
    },
    {
      id: 'DISH_04',
      name: 'Cơm Sườn Non Nướng BBQ Hàn Quốc',
      category: 'Cơm Đầy Đặn',
      price: 45000,
      calories: '680 kcal',
      prepMinutesPerPortion: 2.8,
      available: true,
      description: 'Sườn non heo chọn lọc nướng sốt BBQ Hàn Quốc mềm mọng, kèm kim chi cải thảo nhà làm và trứng ốp la.',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
      bom: [
        { id: 'b13', name: 'Sườn non heo tươi', amount: 170, unit: 'gram' },
        { id: 'b14', name: 'Gạo tám thơm ST25', amount: 130, unit: 'gram' },
        { id: 'b15', name: 'Trứng gà ta', amount: 1, unit: 'quả' },
        { id: 'b16', name: 'Kim chi & rau củ luộc', amount: 80, unit: 'gram' }
      ]
    },
    {
      id: 'DISH_05',
      name: 'Bowl Ức Gà Áp Chảo & Gạo Lứt',
      category: 'Healthy & Eat Clean',
      price: 40000,
      calories: '460 kcal',
      prepMinutesPerPortion: 2.0,
      available: true,
      description: 'Suất ăn giàu đạm ít béo cho sinh viên & giảng viên giữ dáng: ức gà thảo mộc mềm ngọt, ngô ngọt, trứng luộc lòng đào.',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
      bom: [
        { id: 'b17', name: 'Ức gà phi lê tươi', amount: 160, unit: 'gram' },
        { id: 'b18', name: 'Gạo lứt tím than', amount: 110, unit: 'gram' },
        { id: 'b19', name: 'Trứng gà ta', amount: 1, unit: 'quả' },
        { id: 'b20', name: 'Xà lách & ngô ngọt', amount: 100, unit: 'gram' }
      ]
    }
  ],
  orders: [
    {
      id: 'BX-1024',
      customerName: 'Nguyễn Minh Hoàng (SV K67 CNTT)',
      customerPhone: '0984123456',
      shiftId: 'LUNCH_1130',
      hubId: 'HUB_BK_TDN',
      createdAt: '07:45 - Hôm nay',
      paymentMethod: 'Chuyển khoản QR',
      items: [
        { dishId: 'DISH_01', quantity: 2, price: 42000 },
        { dishId: 'DISH_05', quantity: 1, price: 40000 }
      ]
    },
    {
      id: 'BX-1025',
      customerName: 'ThS. Lê Thu Trang (Giảng viên Viện KT)',
      customerPhone: '0912345678',
      shiftId: 'LUNCH_1130',
      hubId: 'HUB_BK_TDN',
      createdAt: '08:00 - Hôm nay',
      paymentMethod: 'Chuyển khoản QR',
      items: [
        { dishId: 'DISH_03', quantity: 2, price: 55000 },
        { dishId: 'DISH_02', quantity: 1, price: 48000 }
      ]
    },
    {
      id: 'BX-1026',
      customerName: 'Trần Quốc Bảo (SV K68 Cơ Khí)',
      customerPhone: '0977889900',
      shiftId: 'LUNCH_1130',
      hubId: 'HUB_BK_GP',
      createdAt: '08:05 - Hôm nay',
      paymentMethod: 'Tiền mặt khi nhận',
      items: [
        { dishId: 'DISH_04', quantity: 3, price: 45000 }
      ]
    },
    {
      id: 'BX-1027',
      customerName: 'Phạm Hương Giang (CLB Sinh Viên NEU)',
      customerPhone: '0933445566',
      shiftId: 'LUNCH_1130',
      hubId: 'HUB_KTQD_A1',
      createdAt: '08:10 - Hôm nay',
      paymentMethod: 'Chuyển khoản QR',
      items: [
        { dishId: 'DISH_01', quantity: 4, price: 42000 },
        { dishId: 'DISH_02', quantity: 2, price: 48000 }
      ]
    },
    {
      id: 'BX-1028',
      customerName: 'Đỗ Tuấn Kiệt (Phòng 402 KTX Xây Dựng)',
      customerPhone: '0966112233',
      shiftId: 'LUNCH_1130',
      hubId: 'HUB_XD_KTX',
      createdAt: '08:12 - Hôm nay',
      paymentMethod: 'Tiền mặt khi nhận',
      items: [
        { dishId: 'DISH_01', quantity: 2, price: 42000 },
        { dishId: 'DISH_04', quantity: 1, price: 45000 }
      ]
    },
    {
      id: 'BX-1029',
      customerName: 'Vũ Ngọc Anh (SV ĐH Quốc Gia)',
      customerPhone: '0904556677',
      shiftId: 'DINNER_1800',
      hubId: 'HUB_QG_XT',
      createdAt: '08:14 - Hôm nay',
      paymentMethod: 'Chuyển khoản QR',
      items: [
        { dishId: 'DISH_03', quantity: 2, price: 55000 },
        { dishId: 'DISH_05', quantity: 2, price: 40000 }
      ]
    }
  ]
};

// State hiện tại và Giỏ hàng
let state = loadState();
let cart = [
  { dishId: 'DISH_01', quantity: 1 }
];

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...INITIAL_STATE, ...parsed };
    }
  } catch (e) {
    console.warn('Không thể đọc localStorage, dùng dữ liệu mặc định:', e);
  }
  return JSON.parse(JSON.stringify(INITIAL_STATE));
}

function saveState(skipCloudPush = false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Không thể lưu localStorage:', e);
  }
  if (!skipCloudPush && state.cloudApiUrl) {
    pushStateToCloud();
  }
}

async function pushStateToCloud() {
  if (!state.cloudApiUrl) return;
  try {
    await fetch(state.cloudApiUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        data: {
          dishes: state.dishes,
          orders: state.orders,
          hubBatchStatuses: state.hubBatchStatuses
        }
      })
    });
  } catch (err) {
    console.warn('Không thể đẩy dữ liệu lên Cloud API:', err);
  }
}

async function syncFromCloudNow(silent = false) {
  if (!state.cloudApiUrl) {
    if (!silent) showToast('Vui lòng dán link Google Sheets Web App URL vào ô Kết nối Cloud trước!');
    return;
  }
  try {
    const res = await fetch(state.cloudApiUrl);
    const json = await res.json();
    if (json && json.status === 'OK' && json.data) {
      if (Array.isArray(json.data.dishes)) state.dishes = json.data.dishes;
      if (Array.isArray(json.data.orders)) state.orders = json.data.orders;
      if (json.data.hubBatchStatuses) state.hubBatchStatuses = json.data.hubBatchStatuses;
      saveState(true);
      renderCustomerView();
      renderAdminDashboard();
      if (!silent) showToast('Đã đồng bộ dữ liệu mới nhất từ Google Sheets Cloud!');
    } else if (json && json.status === 'EMPTY') {
      await pushStateToCloud();
      if (!silent) showToast('Đã khởi tạo dữ liệu mẫu của Bếp Xanh lên Google Sheets thành công!');
    }
  } catch (err) {
    if (!silent) showToast('Không thể kết nối Cloud URL. Hãy kiểm tra lại quyền "Bất kỳ ai (Anyone)" trên Apps Script.');
  }
}

function saveCloudApiUrl() {
  const input = document.getElementById('cloud-api-url-input');
  const badge = document.getElementById('cloud-sync-badge');
  if (!input) return;
  const url = input.value.trim();
  state.cloudApiUrl = url;
  saveState(true);
  updateCloudBadgeUI();
  if (url) {
    showToast('Đã lưu link Cloud Database! Đang đồng bộ dữ liệu...');
    syncFromCloudNow();
  } else {
    showToast('Đã tắt kết nối Cloud, chuyển về chế độ lưu trên trình duyệt (Local).');
  }
}

function updateCloudBadgeUI() {
  const input = document.getElementById('cloud-api-url-input');
  const badge = document.getElementById('cloud-sync-badge');
  if (input) input.value = state.cloudApiUrl || '';
  if (badge) {
    if (state.cloudApiUrl) {
      badge.className = 'badge badge-green';
      badge.textContent = '🟢 Đã kết nối Google Sheets Cloud';
    } else {
      badge.className = 'badge badge-orange';
      badge.textContent = 'Chế độ Local Demo';
    }
  }
}

function formatVND(amount) {
  return Number(amount || 0).toLocaleString('vi-VN') + 'đ';
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeStr(totalMinutes) {
  const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getShiftById(shiftId) {
  return MEAL_SHIFTS.find(s => s.id === shiftId) || MEAL_SHIFTS[0];
}

function getHubById(hubId) {
  return PICKUP_HUBS.find(h => h.id === hubId) || PICKUP_HUBS[0];
}

function getDishById(dishId) {
  return state.dishes.find(d => d.id === dishId);
}

// Kiểm tra ca ăn còn mở đặt trước hay đã khóa (trước giờ giao 2.5 tiếng)
function checkShiftPreorderStatus(shiftId) {
  const shift = getShiftById(shiftId);
  const currentMins = timeToMinutes(state.simulatedTime);
  const cutoffMins = shift.cutoffHour * 60 + shift.cutoffMinute;
  const deliveryMins = shift.deliveryHour * 60 + shift.deliveryMinute;
  const remainingMins = cutoffMins - currentMins;

  if (remainingMins > 0) {
    const hrs = Math.floor(remainingMins / 60);
    const mins = remainingMins % 60;
    return {
      isOpen: true,
      remainingText: `Còn ${hrs > 0 ? hrs + ' giờ ' : ''}${mins} phút nữa chốt đơn`,
      statusBadge: 'Đang mở đặt trước',
      detailText: `Khóa đơn lúc ${String(shift.cutoffHour).padStart(2, '0')}:${String(shift.cutoffMinute).padStart(2, '0')} để bếp nấu Just-in-Time và giao lúc ${String(shift.deliveryHour).padStart(2, '0')}:${String(shift.deliveryMinute).padStart(2, '0')}.`
    };
  } else {
    return {
      isOpen: false,
      remainingText: `Đã khóa sổ lúc ${String(shift.cutoffHour).padStart(2, '0')}:${String(shift.cutoffMinute).padStart(2, '0')}`,
      statusBadge: 'Đã chốt đơn (Đang nấu JIT)',
      detailText: `Đã qua giờ chốt đơn (trước giờ ăn 2.5 tiếng). Vui lòng chọn Ca Tối hoặc đổi giờ giả lập trên thanh menu để thử nghiệm.`
    };
  }
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.innerHTML = `<span>✅</span> <span>${message}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 3200);
}

/* ==========================================================================
   CHUYỂN ĐỔI PHÂN HỆ (CUSTOMER VIEW <-> ADMIN VIEW)
   ========================================================================== */
function switchAppMode(mode) {
  const customerView = document.getElementById('view-customer');
  const adminView = document.getElementById('view-admin');
  const btnCustomer = document.getElementById('mode-btn-customer');
  const btnAdmin = document.getElementById('mode-btn-admin');

  if (mode === 'ADMIN') {
    customerView.classList.add('hidden');
    adminView.classList.remove('hidden');
    btnCustomer.classList.remove('active');
    btnAdmin.classList.add('active-admin');
    renderAdminDashboard();
  } else {
    adminView.classList.add('hidden');
    customerView.classList.remove('hidden');
    btnAdmin.classList.remove('active-admin');
    btnCustomer.classList.add('active');
    renderCustomerView();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   RENDER CUSTOMER VIEW (ĐẶT HÀNG TRƯỚC & LỊCH SỬ ĐƠN)
   ========================================================================== */
function renderCustomerView() {
  renderCutoffControlCard();
  renderCategoryTabs();
  renderMenuGrid();
  renderCartSidebar();
  renderCustomerOrderHistory();
}

function renderCutoffControlCard() {
  const shiftSelect = document.getElementById('customer-shift-select');
  const hubSelect = document.getElementById('customer-hub-select');

  shiftSelect.innerHTML = MEAL_SHIFTS.map(s =>
    `<option value="${s.id}" ${s.id === state.selectedShiftId ? 'selected' : ''}>${s.name} — Chốt ${String(s.cutoffHour).padStart(2, '0')}:${String(s.cutoffMinute).padStart(2, '0')}</option>`
  ).join('');

  hubSelect.innerHTML = PICKUP_HUBS.map(h =>
    `<option value="${h.id}" ${h.id === state.selectedHubId ? 'selected' : ''}>📍 ${h.name}</option>`
  ).join('');

  const status = checkShiftPreorderStatus(state.selectedShiftId);
  const badgeEl = document.getElementById('cutoff-status-badge');
  const countdownEl = document.getElementById('cutoff-countdown-text');
  const detailEl = document.getElementById('cutoff-detail-note');
  const hubNoteEl = document.getElementById('selected-hub-spot-note');

  if (status.isOpen) {
    badgeEl.className = 'badge badge-green';
    badgeEl.textContent = '🟢 ' + status.statusBadge;
  } else {
    badgeEl.className = 'badge badge-danger';
    badgeEl.textContent = '🔒 ' + status.statusBadge;
  }

  countdownEl.textContent = status.remainingText;
  detailEl.textContent = status.detailText;

  const hub = getHubById(state.selectedHubId);
  hubNoteEl.textContent = `Điểm hẹn nhận đồ: ${hub.spotNote} • Shipper phụ trách: ${hub.shipperName}`;
}

function renderCategoryTabs() {
  const categories = ['ALL', ...new Set(state.dishes.map(d => d.category))];
  const wrap = document.getElementById('customer-category-tabs');
  wrap.innerHTML = categories.map(cat => {
    const label = cat === 'ALL' ? 'Tất cả thực đơn hôm nay' : cat;
    const isActive = state.selectedCategory === cat;
    return `<button class="cat-tab ${isActive ? 'active' : ''}" onclick="selectCategory('${cat}')">${label}</button>`;
  }).join('');
}

function selectCategory(category) {
  state.selectedCategory = category;
  renderCategoryTabs();
  renderMenuGrid();
}

function renderMenuGrid() {
  const grid = document.getElementById('customer-menu-grid');
  const filtered = state.dishes.filter(d =>
    state.selectedCategory === 'ALL' || d.category === state.selectedCategory
  );

  const shiftStatus = checkShiftPreorderStatus(state.selectedShiftId);

  grid.innerHTML = filtered.map(dish => {
    const canOrder = dish.available && shiftStatus.isOpen;
    const bomSummary = (dish.bom || []).slice(0, 2).map(b => `${b.name} (${b.amount}${b.unit})`).join(', ');
    return `
      <article class="dish-card ${!dish.available ? 'sold-out' : ''}">
        <div class="dish-img-wrap">
          <img src="${dish.image}" alt="${dish.name}" class="dish-img" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'" />
          <div class="dish-badges-top">
            <span class="badge badge-green">${dish.category}</span>
            <span class="badge ${dish.available ? 'badge-orange' : 'badge-danger'}">
              ${dish.available ? '🔥 Nấu JIT ' + dish.prepMinutesPerPortion + 'p/suất' : 'Tạm hết hôm nay'}
            </span>
          </div>
        </div>
        <div class="dish-body">
          <h3 class="dish-title">${dish.name}</h3>
          <p class="dish-desc">${dish.description}</p>
          <div class="dish-meta-row">
            <span>🥗 Định lượng: ${bomSummary || 'Chuẩn Bếp Xanh'}</span>
            <span>⚡ ${dish.calories || '580 kcal'}</span>
          </div>
          <div class="dish-footer">
            <span class="dish-price">${formatVND(dish.price)}</span>
            <button
              class="btn ${canOrder ? 'btn-primary' : 'btn-outline'} btn-sm"
              onclick="addToCart('${dish.id}')"
              ${!canOrder ? 'disabled' : ''}
            >
              ${!dish.available ? 'Tạm ngưng' : (!shiftStatus.isOpen ? 'Đã khóa ca' : '+ Đặt trước')}
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function addToCart(dishId) {
  const dish = getDishById(dishId);
  if (!dish || !dish.available) return;

  const shiftStatus = checkShiftPreorderStatus(state.selectedShiftId);
  if (!shiftStatus.isOpen) {
    showToast('Ca ăn này đã khóa đơn trước giờ ăn 2.5 tiếng! Hãy chọn ca khác.');
    return;
  }

  const existing = cart.find(item => item.dishId === dishId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ dishId, quantity: 1 });
  }
  renderCartSidebar();
  showToast(`Đã thêm "${dish.name}" vào đơn đặt trước`);
}

function updateCartQty(dishId, delta) {
  const idx = cart.findIndex(i => i.dishId === dishId);
  if (idx === -1) return;
  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) {
    cart.splice(idx, 1);
  }
  renderCartSidebar();
}

function renderCartSidebar() {
  const listEl = document.getElementById('cart-items-container');
  const countBadge = document.getElementById('nav-cart-count');
  const totalPortionsEl = document.getElementById('cart-total-portions');
  const totalPriceEl = document.getElementById('cart-total-price');
  const shiftLabelEl = document.getElementById('cart-summary-shift');
  const hubLabelEl = document.getElementById('cart-summary-hub');
  const submitBtn = document.getElementById('btn-submit-preorder');

  // Lọc bỏ món đã bị xóa
  cart = cart.filter(item => Boolean(getDishById(item.dishId)));

  const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
  countBadge.textContent = totalQty;

  const shift = getShiftById(state.selectedShiftId);
  const hub = getHubById(state.selectedHubId);
  const shiftStatus = checkShiftPreorderStatus(state.selectedShiftId);

  shiftLabelEl.textContent = shift.shortName;
  hubLabelEl.textContent = hub.name;

  if (cart.length === 0) {
    listEl.innerHTML = `<div style="text-align:center; padding: 1.25rem 0.5rem; color: var(--text-muted); font-size: 0.84rem;">Chưa có suất ăn nào trong giỏ. Hãy chọn món bên trái để đặt trước!</div>`;
    totalPortionsEl.textContent = '0 suất (Miễn phí ship gộp điểm)';
    totalPriceEl.textContent = '0đ';
    submitBtn.disabled = true;
    return;
  }

  let totalAmount = 0;
  listEl.innerHTML = cart.map(item => {
    const dish = getDishById(item.dishId);
    const sub = dish.price * item.quantity;
    totalAmount += sub;
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <div class="cart-item-name">${dish.name}</div>
          <div class="cart-item-price">${formatVND(dish.price)} x ${item.quantity} = ${formatVND(sub)}</div>
        </div>
        <div class="qty-controls">
          <button class="qty-btn" onclick="updateCartQty('${dish.id}', -1)">−</button>
          <span style="font-size:0.82rem; font-weight:700; min-width:18px; text-align:center;">${item.quantity}</span>
          <button class="qty-btn" onclick="updateCartQty('${dish.id}', 1)">+</button>
        </div>
      </div>
    `;
  }).join('');

  totalPortionsEl.textContent = `${totalQty} suất (Freeship điểm tập kết)`;
  totalPriceEl.textContent = formatVND(totalAmount);
  submitBtn.disabled = !shiftStatus.isOpen;
  submitBtn.textContent = shiftStatus.isOpen
    ? `Chốt Đơn Đặt Trước (${formatVND(totalAmount)})`
    : 'Đã Khóa Đơn Ca Này (Quá Giờ Chốt)';
}

function submitCustomerPreorder(event) {
  event.preventDefault();
  const shiftStatus = checkShiftPreorderStatus(state.selectedShiftId);
  if (!shiftStatus.isOpen) {
    showToast('Ca ăn đã khóa đơn trước 2.5 tiếng. Vui lòng chọn Ca Tối hoặc đổi giờ giả lập!');
    return;
  }
  if (cart.length === 0) {
    showToast('Vui lòng chọn ít nhất 1 suất ăn!');
    return;
  }

  const nameInput = document.getElementById('cust-name-input');
  const phoneInput = document.getElementById('cust-phone-input');
  const paymentInput = document.getElementById('cust-payment-input');

  const customerName = nameInput.value.trim() || 'Sinh viên ĐH Bách Khoa';
  const customerPhone = phoneInput.value.trim() || '0988776655';
  const paymentMethod = paymentInput.value;

  const newOrder = {
    id: 'BX-' + Math.floor(1030 + Math.random() * 8900),
    customerName,
    customerPhone,
    shiftId: state.selectedShiftId,
    hubId: state.selectedHubId,
    createdAt: `${state.simulatedTime} - Hôm nay`,
    paymentMethod,
    items: cart.map(item => {
      const dish = getDishById(item.dishId);
      return {
        dishId: item.dishId,
        quantity: item.quantity,
        price: dish ? dish.price : 0
      };
    })
  };

  state.orders.unshift(newOrder);
  // Đồng bộ ca lọc bên Admin với ca khách vừa đặt để Admin thấy ngay kết quả
  state.adminFilterShiftId = state.selectedShiftId;
  saveState();

  cart = [];
  renderCustomerView();
  showToast(`Đặt trước thành công mã đơn ${newOrder.id}! Dữ liệu đã chuyển vào Bếp JIT.`);
}

function renderCustomerOrderHistory() {
  const tbody = document.getElementById('customer-history-tbody');
  const countEl = document.getElementById('customer-history-count');
  countEl.textContent = `${state.orders.length} đơn đã ghi nhận`;

  tbody.innerHTML = state.orders.map(order => {
    const shift = getShiftById(order.shiftId);
    const hub = getHubById(order.hubId);
    const itemsDesc = order.items.map(i => {
      const d = getDishById(i.dishId);
      return `${d ? d.name : 'Món ăn'} (x${i.quantity})`;
    }).join(', ');
    const total = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return `
      <tr>
        <td><strong>${order.id}</strong><br/><span style="font-size:0.74rem; color:var(--text-muted);">${order.createdAt}</span></td>
        <td><strong>${order.customerName}</strong><br/><span style="font-size:0.76rem; color:var(--text-secondary);">📞 ${order.customerPhone}</span></td>
        <td><span class="badge badge-green">${shift.shortName}</span></td>
        <td><strong>${hub.name}</strong><br/><span style="font-size:0.74rem; color:var(--text-muted);">${hub.spotNote}</span></td>
        <td>${itemsDesc}</td>
        <td><strong style="color:var(--orange-600);">${formatVND(total)}</strong><br/><span style="font-size:0.72rem; color:var(--text-muted);">${order.paymentMethod}</span></td>
      </tr>
    `;
  }).join('');
}

/* ==========================================================================
   ADMIN VIEW: ĐIỀU HƯỚNG TABS & KPI TỔNG QUAN
   ========================================================================== */
function switchAdminTab(tabId) {
  state.adminActiveTab = tabId;
  saveState();
  renderAdminDashboard();
}

function renderAdminDashboard() {
  // Cập nhật trạng thái nút Tab
  const tabIds = ['TAB_MENU', 'TAB_BOM', 'TAB_JIT', 'TAB_HUB'];
  tabIds.forEach(id => {
    const btn = document.getElementById('btn-' + id);
    const pane = document.getElementById('pane-' + id);
    if (btn && pane) {
      if (state.adminActiveTab === id) {
        btn.classList.add('active');
        pane.classList.remove('hidden');
      } else {
        btn.classList.remove('active');
        pane.classList.add('hidden');
      }
    }
  });

  renderAdminKPIs();
  renderAdminMenuTab();
  renderAdminBomTab();
  renderAdminJitTab();
  renderAdminHubTab();
}

function renderAdminKPIs() {
  const shiftOrders = state.orders.filter(o => o.shiftId === state.adminFilterShiftId);
  let totalPortions = 0;
  let totalRevenue = 0;
  const activeHubs = new Set();

  shiftOrders.forEach(o => {
    activeHubs.add(o.hubId);
    o.items.forEach(i => {
      totalPortions += i.quantity;
      totalRevenue += i.quantity * i.price;
    });
  });

  document.getElementById('kpi-total-orders').textContent = `${shiftOrders.length} đơn`;
  document.getElementById('kpi-total-portions').textContent = `${totalPortions} suất`;
  document.getElementById('kpi-total-revenue').textContent = formatVND(totalRevenue);
  document.getElementById('kpi-active-hubs').textContent = `${activeHubs.size} / ${PICKUP_HUBS.length} cổng trường`;
}

/* ==========================================================================
   ADMIN TAB 1: QUẢN LÝ THỰC ĐƠN & CẬP NHẬT HÌNH ẢNH MÓN ĂN
   ========================================================================== */
function renderAdminMenuTab() {
  const tbody = document.getElementById('admin-menu-tbody');
  tbody.innerHTML = state.dishes.map(dish => `
    <tr>
      <td>
        <img src="${dish.image}" alt="${dish.name}" style="width:68px; height:50px; object-fit:cover; border-radius:8px; border:1px solid var(--border-color);" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'" />
      </td>
      <td>
        <strong>${dish.name}</strong>
        <div style="font-size:0.75rem; color:var(--text-secondary); max-width:300px;">${dish.description}</div>
      </td>
      <td><span class="badge badge-green">${dish.category}</span></td>
      <td><strong style="color:var(--orange-600);">${formatVND(dish.price)}</strong></td>
      <td>
        <button class="badge ${dish.available ? 'badge-green' : 'badge-danger'}" style="border:none; cursor:pointer;" onclick="toggleDishAvailability('${dish.id}')">
          ${dish.available ? '🟢 Đang mở bán' : '🔴 Tạm ngưng'}
        </button>
      </td>
      <td>
        <div style="display:flex; gap:0.4rem;">
          <button class="btn btn-outline btn-sm" onclick="startEditDish('${dish.id}')">✏️ Sửa & Đổi ảnh</button>
          <button class="btn btn-outline btn-sm" onclick="openBomForDish('${dish.id}')">⚖️ Định mức BOM</button>
        </div>
      </td>
    </tr>
  `).join('');

  renderPresetThumbnails();
}

function renderPresetThumbnails() {
  const container = document.getElementById('admin-preset-thumbs');
  if (!container) return;
  const currentUrl = document.getElementById('dish-image-url-input').value;
  container.innerHTML = PRESET_IMAGES.map(p => `
    <button type="button" class="preset-thumb-btn ${currentUrl === p.url ? 'selected' : ''}" title="${p.label}" onclick="selectPresetImage('${p.url}')">
      <img src="${p.url}" alt="${p.label}" />
    </button>
  `).join('');
}

function selectPresetImage(url) {
  const input = document.getElementById('dish-image-url-input');
  const preview = document.getElementById('dish-image-preview');
  input.value = url;
  preview.src = url;
  renderPresetThumbnails();
}

function handleImageUrlInput(url) {
  const preview = document.getElementById('dish-image-preview');
  if (url && url.trim()) {
    preview.src = url.trim();
  }
  renderPresetThumbnails();
}

function handleLocalImageUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    document.getElementById('dish-image-url-input').value = dataUrl;
    document.getElementById('dish-image-preview').src = dataUrl;
    showToast('Đã tải ảnh từ máy lên! Nhấn Lưu món ăn để đồng bộ ngay.');
  };
  reader.readAsDataURL(file);
}

function startEditDish(dishId) {
  const dish = getDishById(dishId);
  if (!dish) return;
  state.editingDishId = dish.id;
  document.getElementById('dish-form-title').textContent = `Cập nhật món: ${dish.name}`;
  document.getElementById('dish-name-input').value = dish.name;
  document.getElementById('dish-category-input').value = dish.category;
  document.getElementById('dish-price-input').value = dish.price;
  document.getElementById('dish-calories-input').value = dish.calories || '600 kcal';
  document.getElementById('dish-desc-input').value = dish.description;
  document.getElementById('dish-available-input').checked = dish.available;
  document.getElementById('dish-image-url-input').value = dish.image;
  document.getElementById('dish-image-preview').src = dish.image;
  renderPresetThumbnails();
}

function resetDishForm() {
  state.editingDishId = null;
  document.getElementById('dish-form-title').textContent = 'Thêm món ăn mới vào thực đơn';
  document.getElementById('dish-name-input').value = '';
  document.getElementById('dish-category-input').value = 'Cơm Đầy Đặn';
  document.getElementById('dish-price-input').value = 45000;
  document.getElementById('dish-calories-input').value = '610 kcal';
  document.getElementById('dish-desc-input').value = '';
  document.getElementById('dish-available-input').checked = true;
  const defaultImg = PRESET_IMAGES[0].url;
  document.getElementById('dish-image-url-input').value = defaultImg;
  document.getElementById('dish-image-preview').src = defaultImg;
  renderPresetThumbnails();
}

function saveDishForm(event) {
  event.preventDefault();
  const name = document.getElementById('dish-name-input').value.trim();
  const category = document.getElementById('dish-category-input').value.trim() || 'Cơm Đầy Đặn';
  const price = Number(document.getElementById('dish-price-input').value) || 40000;
  const calories = document.getElementById('dish-calories-input').value.trim() || '600 kcal';
  const description = document.getElementById('dish-desc-input').value.trim();
  const available = document.getElementById('dish-available-input').checked;
  const image = document.getElementById('dish-image-url-input').value.trim() || PRESET_IMAGES[0].url;

  if (!name) {
    showToast('Vui lòng nhập tên món ăn!');
    return;
  }

  if (state.editingDishId) {
    const existing = getDishById(state.editingDishId);
    if (existing) {
      existing.name = name;
      existing.category = category;
      existing.price = price;
      existing.calories = calories;
      existing.description = description;
      existing.available = available;
      existing.image = image;
    }
    showToast(`Đã cập nhật món "${name}" & đồng bộ ngay ra giao diện khách hàng!`);
  } else {
    const newId = 'DISH_' + Date.now().toString().slice(-4);
    state.dishes.push({
      id: newId,
      name,
      category,
      price,
      calories,
      prepMinutesPerPortion: 2.5,
      available,
      description,
      image,
      bom: [
        { id: 'b_' + Date.now(), name: 'Gạo tám thơm ST25', amount: 130, unit: 'gram' },
        { id: 'b_' + (Date.now() + 1), name: 'Thịt / Nguyên liệu chính', amount: 160, unit: 'gram' },
        { id: 'b_' + (Date.now() + 2), name: 'Bông cải xanh & cà rốt', amount: 90, unit: 'gram' }
      ]
    });
    state.bomSelectedDishId = newId;
    showToast(`Đã thêm món mới "${name}" vào thực đơn Bếp Xanh!`);
  }

  saveState();
  resetDishForm();
  renderAdminDashboard();
}

function toggleDishAvailability(dishId) {
  const dish = getDishById(dishId);
  if (!dish) return;
  dish.available = !dish.available;
  saveState();
  renderAdminDashboard();
  showToast(`Đã chuyển "${dish.name}" sang trạng thái: ${dish.available ? 'Đang mở bán' : 'Tạm ngưng'}`);
}

/* ==========================================================================
   ADMIN TAB 2: THIẾT LẬP ĐỊNH MỨC MÓN ĂN - BOM (BILL OF MATERIALS)
   ========================================================================== */
function openBomForDish(dishId) {
  state.bomSelectedDishId = dishId;
  switchAdminTab('TAB_BOM');
}

function renderAdminBomTab() {
  const selectEl = document.getElementById('bom-dish-select');
  if (!selectEl) return;

  if (!getDishById(state.bomSelectedDishId) && state.dishes.length > 0) {
    state.bomSelectedDishId = state.dishes[0].id;
  }

  selectEl.innerHTML = state.dishes.map(d =>
    `<option value="${d.id}" ${d.id === state.bomSelectedDishId ? 'selected' : ''}>${d.name} (${formatVND(d.price)})</option>`
  ).join('');

  const dish = getDishById(state.bomSelectedDishId);
  if (!dish) return;

  document.getElementById('bom-prep-time-input').value = dish.prepMinutesPerPortion;
  document.getElementById('bom-current-dish-title').textContent = dish.name;

  const tbody = document.getElementById('bom-ingredients-tbody');
  tbody.innerHTML = (dish.bom || []).map(item => `
    <tr>
      <td><strong>${item.name}</strong></td>
      <td>
        <input
          type="number"
          min="0.1"
          step="any"
          class="form-control"
          style="max-width:110px; padding:0.35rem 0.5rem;"
          value="${item.amount}"
          onchange="updateBomIngredientAmount('${dish.id}', '${item.id}', this.value)"
        />
      </td>
      <td><span class="badge badge-green">${item.unit} / 1 suất</span></td>
      <td>
        <button class="btn btn-outline btn-sm" onclick="removeBomIngredient('${dish.id}', '${item.id}')">🗑️ Xóa</button>
      </td>
    </tr>
  `).join('');
}

function handleBomDishChange(dishId) {
  state.bomSelectedDishId = dishId;
  saveState();
  renderAdminBomTab();
}

function saveDishPrepTime() {
  const dish = getDishById(state.bomSelectedDishId);
  if (!dish) return;
  const val = parseFloat(document.getElementById('bom-prep-time-input').value);
  if (val > 0) {
    dish.prepMinutesPerPortion = val;
    saveState();
    renderAdminDashboard();
    showToast(`Đã cập nhật định mức thời gian chế biến "${dish.name}": ${val} phút/suất`);
  }
}

function updateBomIngredientAmount(dishId, bomItemId, newVal) {
  const dish = getDishById(dishId);
  if (!dish) return;
  const item = (dish.bom || []).find(b => b.id === bomItemId);
  if (item) {
    item.amount = parseFloat(newVal) || 0;
    saveState();
    renderAdminJitTab();
    showToast(`Đã cập nhật định lượng "${item.name}" thành ${item.amount} ${item.unit}/suất`);
  }
}

function addBomIngredient(event) {
  event.preventDefault();
  const dish = getDishById(state.bomSelectedDishId);
  if (!dish) return;

  const nameEl = document.getElementById('new-bom-name');
  const amountEl = document.getElementById('new-bom-amount');
  const unitEl = document.getElementById('new-bom-unit');

  const name = nameEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const unit = unitEl.value;

  if (!name || !(amount > 0)) {
    showToast('Vui lòng nhập tên nguyên liệu và định lượng hợp lệ!');
    return;
  }

  dish.bom = dish.bom || [];
  dish.bom.push({
    id: 'bom_' + Date.now(),
    name,
    amount,
    unit
  });

  nameEl.value = '';
  amountEl.value = '';
  saveState();
  renderAdminDashboard();
  showToast(`Đã thêm nguyên liệu "${name}" vào BOM món ${dish.name}`);
}

function removeBomIngredient(dishId, bomItemId) {
  const dish = getDishById(dishId);
  if (!dish) return;
  dish.bom = (dish.bom || []).filter(b => b.id !== bomItemId);
  saveState();
  renderAdminDashboard();
  showToast('Đã xóa nguyên liệu khỏi công thức BOM');
}

/* ==========================================================================
   ADMIN TAB 3: DỰ BÁO NHU CẦU & TÍNH TOÁN VẬT TƯ TỰ ĐỘNG + LỊCH NẤU JIT
   ========================================================================== */
function handleAdminShiftFilterChange(shiftId) {
  state.adminFilterShiftId = shiftId;
  saveState();
  renderAdminDashboard();
}

function renderAdminJitTab() {
  const shiftSelects = document.querySelectorAll('.admin-shift-filter-select');
  shiftSelects.forEach(sel => {
    sel.innerHTML = MEAL_SHIFTS.map(s =>
      `<option value="${s.id}" ${s.id === state.adminFilterShiftId ? 'selected' : ''}>${s.name}</option>`
    ).join('');
  });

  const shift = getShiftById(state.adminFilterShiftId);
  const shiftOrders = state.orders.filter(o => o.shiftId === state.adminFilterShiftId);

  // 1. Tổng hợp số lượng từng món trong ca ăn
  const dishCountMap = {};
  shiftOrders.forEach(order => {
    order.items.forEach(item => {
      dishCountMap[item.dishId] = (dishCountMap[item.dishId] || 0) + item.quantity;
    });
  });

  // 2. Nhân với bảng định mức BOM để ra tổng nguyên vật liệu cần mua
  const materialTotals = {};
  const dishSummaryRows = [];

  Object.keys(dishCountMap).forEach(dishId => {
    const qty = dishCountMap[dishId];
    const dish = getDishById(dishId);
    if (!dish || qty <= 0) return;

    // Tính thời gian chế biến theo nguyên lý bếp song song (chia 2 line bếp + 15p chuẩn bị mẻ)
    const batchCookMinutes = Math.ceil((qty * dish.prepMinutesPerPortion) / 1.5 + 12);
    dishSummaryRows.push({
      dish,
      qty,
      batchCookMinutes
    });

    (dish.bom || []).forEach(bomItem => {
      const key = `${bomItem.name.toLowerCase()}__${bomItem.unit}`;
      if (!materialTotals[key]) {
        materialTotals[key] = {
          name: bomItem.name,
          unit: bomItem.unit,
          totalAmount: 0,
          usedInDishes: []
        };
      }
      const needed = qty * bomItem.amount;
      materialTotals[key].totalAmount += needed;
      materialTotals[key].usedInDishes.push(`${dish.name} (${qty} suất × ${bomItem.amount}${bomItem.unit})`);
    });
  });

  // Render bảng tổng hợp món & Lịch trình Just-in-Time
  const jitContainer = document.getElementById('admin-jit-schedule-container');
  const deliveryTotalMins = shift.deliveryHour * 60 + shift.deliveryMinute;
  // Xuất bếp trước giờ giao 25 phút để vận chuyển ra các cổng trường ĐH
  const dispatchMins = deliveryTotalMins - 25;

  if (dishSummaryRows.length === 0) {
    jitContainer.innerHTML = `<div style="padding:1rem; color:var(--text-muted);">Chưa có đơn đặt trước nào trong ca này.</div>`;
  } else {
    jitContainer.innerHTML = dishSummaryRows.map(row => {
      const startCookMins = dispatchMins - row.batchCookMinutes;
      const startPrepMins = startCookMins - 20;
      return `
        <div class="jit-card">
          <div>
            <div style="font-weight:800; font-size:0.96rem; color:var(--green-900);">
              🍱 ${row.dish.name} — <span style="color:var(--orange-600);">${row.qty} suất đã chốt</span>
            </div>
            <div style="font-size:0.77rem; color:var(--text-secondary); margin-top:0.2rem;">
              Định mức chuẩn: ${row.dish.prepMinutesPerPortion} phút/suất • Tổng thời gian nấu mẻ JIT: ~${row.batchCookMinutes} phút
            </div>
          </div>
          <div class="jit-time-steps">
            <div class="jit-step-pill">
              <span style="color:var(--text-muted);">Sơ chế:</span> <strong>${minutesToTimeStr(startPrepMins)}</strong>
            </div>
            <span>→</span>
            <div class="jit-step-pill" style="border-color:var(--orange-500); background:var(--orange-50);">
              <span style="color:var(--orange-700);">🔥 Bắt đầu nấu JIT:</span> <strong style="color:var(--orange-600);">${minutesToTimeStr(startCookMins)}</strong>
            </div>
            <span>→</span>
            <div class="jit-step-pill" style="border-color:var(--green-600); background:var(--green-50);">
              <span style="color:var(--green-800);">📦 Đóng hộp xuất bếp:</span> <strong style="color:var(--green-700);">${minutesToTimeStr(dispatchMins)}</strong>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Render Phiếu dự trù nguyên vật liệu cần mua
  const mrpTbody = document.getElementById('admin-mrp-tbody');
  const materialsList = Object.values(materialTotals);

  if (materialsList.length === 0) {
    mrpTbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">Chưa phát sinh nhu cầu nguyên vật liệu cho ca này.</td></tr>`;
  } else {
    mrpTbody.innerHTML = materialsList.map((mat, idx) => {
      let displayQty = `${mat.totalAmount.toLocaleString('vi-VN')} ${mat.unit}`;
      if (mat.unit === 'gram' && mat.totalAmount >= 1000) {
        displayQty = `${(mat.totalAmount / 1000).toFixed(2)} kg (${mat.totalAmount.toLocaleString('vi-VN')} g)`;
      } else if (mat.unit === 'ml' && mat.totalAmount >= 1000) {
        displayQty = `${(mat.totalAmount / 1000).toFixed(2)} lít (${mat.totalAmount.toLocaleString('vi-VN')} ml)`;
      }

      return `
        <tr>
          <td><strong>#${idx + 1}</strong></td>
          <td><strong>${mat.name}</strong></td>
          <td><span class="badge badge-orange" style="font-size:0.84rem;">${displayQty}</span></td>
          <td style="font-size:0.78rem; color:var(--text-secondary);">${mat.usedInDishes.join(' + ')}</td>
        </tr>
      `;
    }).join('');
  }
}

/* ==========================================================================
   ADMIN TAB 4: QUẢN LÝ ĐIỂM GIAO & GỘP ĐƠN VẬN CHUYỂN TẠI TRƯỜNG ĐH
   ========================================================================== */
function renderAdminHubTab() {
  const shiftOrders = state.orders.filter(o => o.shiftId === state.adminFilterShiftId);
  const totalShiftOrders = shiftOrders.length || 1;
  const hubContainer = document.getElementById('admin-hub-density-grid');

  hubContainer.innerHTML = PICKUP_HUBS.map(hub => {
    const ordersAtHub = shiftOrders.filter(o => o.hubId === hub.id);
    const orderCount = ordersAtHub.length;
    let portionCount = 0;
    let hubRevenue = 0;

    ordersAtHub.forEach(o => {
      o.items.forEach(i => {
        portionCount += i.quantity;
        hubRevenue += i.quantity * i.price;
      });
    });

    const densityPct = shiftOrders.length > 0 ? Math.round((orderCount / totalShiftOrders) * 100) : 0;
    const statusKey = `${state.adminFilterShiftId}__${hub.id}`;
    const currentBatchStatus = state.hubBatchStatuses[statusKey] || 'Đang gom đơn chuẩn bị nấu';

    const ordersListHtml = ordersAtHub.length === 0
      ? `<div style="font-size:0.78rem; color:var(--text-muted); padding:0.5rem 0;">Chưa có đơn tại điểm tập kết này trong ca đã chọn.</div>`
      : ordersAtHub.map(o => {
          const dishText = o.items.map(i => {
            const d = getDishById(i.dishId);
            return `${d ? d.name : 'Món'} x${i.quantity}`;
          }).join(', ');
          return `
            <div style="padding:0.5rem 0; border-bottom:1px dashed var(--border-color); font-size:0.78rem;">
              <div style="display:flex; justify-content:space-between; font-weight:700;">
                <span>${o.id} • ${o.customerName}</span>
                <span style="color:var(--green-700);">📞 ${o.customerPhone}</span>
              </div>
              <div style="color:var(--text-secondary); margin-top:2px;">${dishText}</div>
            </div>
          `;
        }).join('');

    return `
      <div class="hub-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem;">
          <div>
            <span class="badge badge-green" style="margin-bottom:0.35rem;">🏫 ${hub.university}</span>
            <h4 style="font-size:0.98rem; font-weight:800; color:var(--text-main);">${hub.name}</h4>
          </div>
          <span class="badge badge-orange">${densityPct}% mật độ ca</span>
        </div>

        <div style="font-size:0.76rem; color:var(--text-secondary); margin-top:0.3rem;">
          📍 Điểm trả hàng: ${hub.spotNote}<br/>
          🛵 Điều phối: <strong>${hub.shipperName}</strong>
        </div>

        <div class="density-bar-bg">
          <div class="density-bar-fill" style="width: ${Math.max(densityPct, orderCount > 0 ? 12 : 0)}%;"></div>
        </div>

        <div style="display:flex; justify-content:space-between; font-size:0.82rem; font-weight:700; margin-bottom:0.75rem; background:var(--bg-subtle); padding:0.5rem 0.7rem; border-radius:var(--radius-sm);">
          <span>📦 Gộp: ${orderCount} đơn (${portionCount} suất)</span>
          <span style="color:var(--orange-600);">Tổng: ${formatVND(hubRevenue)}</span>
        </div>

        <div style="margin-bottom:0.75rem;">
          <div style="font-size:0.75rem; font-weight:700; color:var(--text-secondary); margin-bottom:0.25rem;">Danh sách sinh viên/giảng viên nhận tại điểm tập kết:</div>
          <div style="max-height:150px; overflow-y:auto;">
            ${ordersListHtml}
          </div>
        </div>

        <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem; padding-top:0.5rem; border-top:1px solid var(--border-color);">
          <span class="badge badge-info">${currentBatchStatus}</span>
          <button class="btn btn-outline btn-sm" onclick="cycleHubBatchStatus('${hub.id}')">🔄 Chuyển trạng thái chuyến</button>
        </div>
      </div>
    `;
  }).join('');
}

function cycleHubBatchStatus(hubId) {
  const statuses = [
    'Đang gom đơn chuẩn bị nấu',
    'Bếp đang đóng thùng giữ nhiệt',
    'Shipper đang giao tới cổng trường',
    'Đã trả hết đơn tại điểm tập kết'
  ];
  const key = `${state.adminFilterShiftId}__${hubId}`;
  const current = state.hubBatchStatuses[key] || statuses[0];
  const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
  state.hubBatchStatuses[key] = statuses[nextIdx];
  saveState();
  renderAdminHubTab();
  showToast(`Đã cập nhật trạng thái chuyến giao: ${statuses[nextIdx]}`);
}

/* ==========================================================================
   KHỞI TẠO SỰ KIỆN KHI TRANG TẢI XONG
   ========================================================================== */
function handleSimulatedTimeChange(newTime) {
  state.simulatedTime = newTime;
  saveState();
  renderCustomerView();
  showToast(`Đã chuyển đồng hồ hệ thống sang ${newTime} để kiểm thử khóa đơn Pre-order!`);
}

function handleCustomerShiftChange(newShiftId) {
  state.selectedShiftId = newShiftId;
  saveState();
  renderCustomerView();
}

function handleCustomerHubChange(newHubId) {
  state.selectedHubId = newHubId;
  saveState();
  renderCustomerView();
}

function resetDemoData() {
  localStorage.removeItem(STORAGE_KEY);
  state = JSON.parse(JSON.stringify(INITIAL_STATE));
  cart = [{ dishId: 'DISH_01', quantity: 1 }];
  document.getElementById('sim-clock-select').value = state.simulatedTime;
  renderCustomerView();
  renderAdminDashboard();
  showToast('Đã khôi phục dữ liệu mẫu gốc của Bếp Xanh!');
}

window.addEventListener('DOMContentLoaded', () => {
  const clockSelect = document.getElementById('sim-clock-select');
  if (clockSelect) {
    clockSelect.value = state.simulatedTime;
  }
  updateCloudBadgeUI();
  resetDishForm();
  renderCustomerView();
  renderAdminDashboard();
  if (state.cloudApiUrl) {
    syncFromCloudNow(true);
  }
});
