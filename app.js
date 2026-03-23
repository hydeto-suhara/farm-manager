// ===== 農作業日誌 メインロジック =====
// app.js

// ===== 状態管理 =====
let state = {
  fields: [],
  crops: [],
  workLogs: [],
  harvests: [],
  settings: {
    apiKey: '',
    location: '松本市',
    familyCode: 'suhara-farm',
    firebaseApiKey: 'AIzaSyDfP8n6mzJbgNnRAQ-uJM8_W5xt5d3pLdo',
    firebaseProjectId: 'firm-control'
  }
};

// 編集中のID
let editingId = { field: null, crop: null, workLog: null, harvest: null };
// 作業ログの写真データ
let logPhotoData = null;

// ===== データ管理 =====
// Firebase デフォルト設定
const FIREBASE_DEFAULTS = {
  familyCode: 'suhara-farm',
  firebaseApiKey: 'AIzaSyDfP8n6mzJbgNnRAQ-uJM8_W5xt5d3pLdo',
  firebaseProjectId: 'firm-control'
};

function loadData() {
  try {
    const stored = localStorage.getItem('farmManagerData');
    if (stored) {
      const parsed = JSON.parse(stored);
      state = { ...state, ...parsed };
    }
    // Firebase設定が空の場合はデフォルト値を使用
    if (!state.settings.firebaseApiKey) state.settings.firebaseApiKey = FIREBASE_DEFAULTS.firebaseApiKey;
    if (!state.settings.firebaseProjectId) state.settings.firebaseProjectId = FIREBASE_DEFAULTS.firebaseProjectId;
    if (!state.settings.familyCode) state.settings.familyCode = FIREBASE_DEFAULTS.familyCode;
  } catch (e) {
    console.error('データ読み込みエラー:', e);
  }
}

function saveData() {
  try {
    localStorage.setItem('farmManagerData', JSON.stringify(state));
  } catch (e) {
    showToast('⚠️ データの保存に失敗しました（容量不足の可能性があります）');
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ===== Firebase 設定 =====
function buildFirebaseConfig(settings) {
  const projectId = settings.firebaseProjectId;
  return {
    apiKey: settings.firebaseApiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: `${projectId}.appspot.com`,
    messagingSenderId: '',
    appId: ''
  };
}

// Firebase 初期化（非同期・ノンブロッキング）
async function initFirebaseFromSettings() {
  const s = state.settings;
  if (!s.familyCode || !s.firebaseApiKey || !s.firebaseProjectId) {
    updateSyncStatus(false);
    return;
  }
  const config = buildFirebaseConfig(s);
  const ok = initFirestore(config, s.familyCode);
  if (!ok) return;

  const fbData = await loadAllFromFirestore();
  if (fbData) {
    state.fields   = fbData.fields;
    state.crops    = fbData.crops;
    state.workLogs = fbData.workLogs;
    state.harvests = fbData.harvests;
    saveData(); // ローカルキャッシュを更新
    renderDashboard();
    renderAll();
    renderWorkLogs();
    renderHarvests();
  }
  startRealtimeSync(onFirestoreUpdate);
}

// リアルタイム更新コールバック（デバウンス付き）
let _syncTimeout = null;
function onFirestoreUpdate(collection, docs) {
  state[collection] = docs;
  clearTimeout(_syncTimeout);
  _syncTimeout = setTimeout(() => {
    saveData();
    renderDashboard();
    renderAll();
    renderWorkLogs();
    renderHarvests();
  }, 200);
}

// ===== 写真圧縮（Firestoreの1MBドキュメント制限対応） =====
async function compressImage(base64, maxKB = 100) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const maxDim = 800;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else { width = Math.round(width * maxDim / height); height = maxDim; }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      let quality = 0.8;
      let result = canvas.toDataURL('image/jpeg', quality);
      while (result.length > maxKB * 1024 * 1.37 && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }
      resolve(result);
    };
    img.src = base64;
  });
}

// ===== タブナビゲーション =====
function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  const content = document.getElementById('tab-' + tabName);
  if (content) content.classList.add('active');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('onclick').includes("'" + tabName + "'")) {
      btn.classList.add('active');
    }
  });

  // タブ別の初期化
  if (tabName === 'dashboard') renderDashboard();
  if (tabName === 'gantt') renderGantt();
  if (tabName === 'worklog') renderWorkLogs();
  if (tabName === 'crops') renderAll();
  if (tabName === 'harvest') renderHarvests();
  if (tabName === 'stats') renderStats();
}

// ===== トースト通知 =====
function showToast(message, duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== モーダル管理 =====
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
  // 編集状態リセット
  const key = id.replace('-modal', '').replace('worklog', 'workLog');
  if (editingId[key]) editingId[key] = null;
}

// モーダル外クリックで閉じる
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('open');
  }
});

// ===== 設定 =====
function openSettings() {
  document.getElementById('api-key-input').value = state.settings.apiKey || '';
  document.getElementById('location-input').value = state.settings.location || '松本市';
  document.getElementById('family-code-input').value = state.settings.familyCode || '';
  document.getElementById('firebase-apikey-input').value = state.settings.firebaseApiKey || '';
  document.getElementById('firebase-projectid-input').value = state.settings.firebaseProjectId || '';
  openModal('settings-modal');
}

function saveSettings() {
  state.settings.apiKey = document.getElementById('api-key-input').value.trim();
  state.settings.location = document.getElementById('location-input').value.trim() || '松本市';
  state.settings.familyCode = document.getElementById('family-code-input').value.trim();
  state.settings.firebaseApiKey = document.getElementById('firebase-apikey-input').value.trim();
  state.settings.firebaseProjectId = document.getElementById('firebase-projectid-input').value.trim();
  saveData();
  closeModal('settings-modal');

  const s = state.settings;
  if (s.familyCode && s.firebaseApiKey && s.firebaseProjectId) {
    showToast('✅ 設定を保存しました・クラウド同期を開始します');
    initFirebaseFromSettings();
  } else {
    showToast('✅ 設定を保存しました');
    updateSyncStatus(false);
  }
}

// ===== 圃場管理 =====
function openFieldModal(id = null) {
  editingId.field = id;
  if (id) {
    const field = state.fields.find(f => f.id === id);
    if (field) {
      document.getElementById('field-name').value = field.name;
      document.getElementById('field-type').value = field.type;
      document.getElementById('field-area').value = field.area || '';
      document.querySelector('#field-modal .modal-content h2').textContent = '🌾 圃場を編集';
    }
  } else {
    document.getElementById('field-name').value = '';
    document.getElementById('field-type').value = 'rice';
    document.getElementById('field-area').value = '';
    document.querySelector('#field-modal .modal-content h2').textContent = '🌾 圃場追加';
  }
  openModal('field-modal');
}

function saveField() {
  const name = document.getElementById('field-name').value.trim();
  if (!name) { showToast('⚠️ 圃場名を入力してください'); return; }

  let savedItem;
  if (editingId.field) {
    savedItem = state.fields.find(f => f.id === editingId.field);
    if (savedItem) {
      savedItem.name = name;
      savedItem.type = document.getElementById('field-type').value;
      savedItem.area = document.getElementById('field-area').value;
    }
  } else {
    savedItem = {
      id: generateId(),
      name,
      type: document.getElementById('field-type').value,
      area: document.getElementById('field-area').value,
      createdAt: new Date().toISOString()
    };
    state.fields.push(savedItem);
  }

  saveData();
  if (savedItem && isFirestoreReady()) saveDocToFirestore('fields', savedItem.id, savedItem);
  closeModal('field-modal');
  renderAll();
  showToast('✅ 圃場を保存しました');
}

function deleteField(id) {
  if (!confirm('この圃場を削除しますか？（関連する作物データは残ります）')) return;
  state.fields = state.fields.filter(f => f.id !== id);
  saveData();
  if (isFirestoreReady()) deleteDocFromFirestore('fields', id);
  renderAll();
  showToast('🗑️ 圃場を削除しました');
}

function renderFields() {
  const container = document.getElementById('field-list');
  if (!container) return;

  if (state.fields.length === 0) {
    container.innerHTML = '<p class="empty-state">まだ圃場が登録されていません</p>';
    return;
  }

  const typeLabels = { rice: '🌾 田んぼ', vegetable: '🥬 畑', garden: '🌻 家庭菜園' };
  container.innerHTML = state.fields.map(f => `
    <span class="field-badge">
      ${typeLabels[f.type] || f.type} ${f.name}${f.area ? ' (' + f.area + '㎡)' : ''}
      <button onclick="openFieldModal('${f.id}')" style="background:none;border:none;cursor:pointer;padding:0 2px;">✏️</button>
      <button onclick="deleteField('${f.id}')" style="background:none;border:none;cursor:pointer;padding:0 2px;">🗑️</button>
    </span>
  `).join('');
  container.className = 'field-list';
}

// ===== 作物管理 =====
function openCropModal(id = null) {
  editingId.crop = id;
  populateCropSelects();

  if (id) {
    const crop = state.crops.find(c => c.id === id);
    if (crop) {
      document.getElementById('crop-field').value = crop.fieldId || '';
      document.getElementById('crop-guide').value = crop.guideKey || '';
      document.getElementById('crop-variety').value = crop.variety || '';
      document.getElementById('crop-sowing').value = crop.sowingDate || '';
      document.getElementById('crop-planting').value = crop.plantingDate || '';
      document.getElementById('crop-status').value = crop.status || 'growing';
      document.querySelector('#crop-modal .modal-content h2').textContent = '🌱 作物を編集';
    }
  } else {
    document.getElementById('crop-field').value = '';
    document.getElementById('crop-guide').value = '';
    document.getElementById('crop-variety').value = '';
    document.getElementById('crop-sowing').value = '';
    document.getElementById('crop-planting').value = '';
    document.getElementById('crop-status').value = 'growing';
    document.querySelector('#crop-modal .modal-content h2').textContent = '🌱 作物追加';
  }
  openModal('crop-modal');
}

function populateCropSelects() {
  const fieldSelect = document.getElementById('crop-field');
  if (fieldSelect) {
    fieldSelect.innerHTML = '<option value="">（圃場なし）</option>' +
      state.fields.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  }
}

function saveCrop() {
  const guideKey = document.getElementById('crop-guide').value;
  if (!guideKey) { showToast('⚠️ 作物の種類を選択してください'); return; }

  const guide = CROP_GUIDES[guideKey];
  const year = new Date().getFullYear();

  let savedItem;
  if (editingId.crop) {
    savedItem = state.crops.find(c => c.id === editingId.crop);
    if (savedItem) {
      savedItem.fieldId = document.getElementById('crop-field').value;
      savedItem.guideKey = guideKey;
      savedItem.name = guide.name;
      savedItem.variety = document.getElementById('crop-variety').value.trim();
      savedItem.sowingDate = document.getElementById('crop-sowing').value;
      savedItem.plantingDate = document.getElementById('crop-planting').value;
      savedItem.status = document.getElementById('crop-status').value;
    }
  } else {
    const sowingDate = document.getElementById('crop-sowing').value;
    const cropYear = sowingDate ? parseInt(sowingDate.split('-')[0]) : year;
    savedItem = {
      id: generateId(),
      fieldId: document.getElementById('crop-field').value,
      guideKey,
      name: guide.name,
      variety: document.getElementById('crop-variety').value.trim(),
      sowingDate: document.getElementById('crop-sowing').value,
      plantingDate: document.getElementById('crop-planting').value,
      status: document.getElementById('crop-status').value,
      year: cropYear,
      createdAt: new Date().toISOString()
    };
    state.crops.push(savedItem);
  }

  saveData();
  if (savedItem && isFirestoreReady()) saveDocToFirestore('crops', savedItem.id, savedItem);
  closeModal('crop-modal');
  renderAll();
  showToast('✅ 作物を保存しました');
}

function deleteCrop(id) {
  if (!confirm('この作物を削除しますか？')) return;
  state.crops = state.crops.filter(c => c.id !== id);
  saveData();
  if (isFirestoreReady()) deleteDocFromFirestore('crops', id);
  renderAll();
  showToast('🗑️ 作物を削除しました');
}

function renderCrops() {
  const container = document.getElementById('crop-list');
  if (!container) return;

  if (state.crops.length === 0) {
    container.innerHTML = '<p class="empty-state">まだ作物が登録されていません。「＋ 作物追加」から追加してください。</p>';
    return;
  }

  const statusLabel = {
    planning: '計画中', growing: '育成中', harvesting: '収穫中', done: '完了'
  };

  container.innerHTML = '<div class="crop-grid">' +
    state.crops.map(crop => {
      const guide = CROP_GUIDES[crop.guideKey] || {};
      const field = state.fields.find(f => f.id === crop.fieldId);
      return `
        <div class="crop-card">
          <div class="crop-card-header">
            <span class="crop-card-icon">${guide.icon || '🌱'}</span>
            <div>
              <div class="crop-card-name">${crop.name}${crop.variety ? ' (' + crop.variety + ')' : ''}</div>
              <div class="crop-card-variety">${crop.year || ''}年</div>
            </div>
          </div>
          ${field ? `<div class="crop-card-field">📍 ${field.name}</div>` : ''}
          <span class="crop-status-badge status-${crop.status}">${statusLabel[crop.status] || crop.status}</span>
          <div class="crop-dates">
            ${crop.sowingDate ? `🌱 種まき: ${formatDate(crop.sowingDate)}<br>` : ''}
            ${crop.plantingDate ? `🪴 定植: ${formatDate(crop.plantingDate)}<br>` : ''}
          </div>
          <div class="crop-actions">
            <button class="btn btn-sm" onclick="openCropModal('${crop.id}')">✏️ 編集</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCrop('${crop.id}')">🗑️</button>
          </div>
        </div>
      `;
    }).join('') + '</div>';
}

function renderAll() {
  renderFields();
  renderCrops();
  populateAllSelects();
}

// ===== 作業記録 =====
function openWorkLogModal(id = null) {
  editingId.workLog = id;
  populateAllSelects();
  logPhotoData = null;
  document.getElementById('log-photo-preview').innerHTML = '';

  const today = new Date().toISOString().split('T')[0];

  if (id) {
    const log = state.workLogs.find(l => l.id === id);
    if (log) {
      document.getElementById('log-date').value = log.date || today;
      document.getElementById('log-field').value = log.fieldId || '';
      document.getElementById('log-crop').value = log.cropId || '';
      document.getElementById('log-worktype').value = log.workType || '水やり';
      document.getElementById('log-weather').value = log.weather || '晴れ';
      document.getElementById('log-duration').value = log.duration || '';
      document.getElementById('log-notes').value = log.notes || '';
      if (log.photo) {
        logPhotoData = log.photo;
        document.getElementById('log-photo-preview').innerHTML =
          `<img src="${log.photo}" alt="作業写真">`;
      }
      document.querySelector('#worklog-modal .modal-content h2').textContent = '📝 作業記録を編集';
    }
  } else {
    document.getElementById('log-date').value = today;
    document.getElementById('log-field').value = '';
    document.getElementById('log-crop').value = '';
    document.getElementById('log-worktype').value = '水やり';
    document.getElementById('log-weather').value = '晴れ';
    document.getElementById('log-duration').value = '';
    document.getElementById('log-notes').value = '';
    document.querySelector('#worklog-modal .modal-content h2').textContent = '📝 作業記録';
  }
  openModal('worklog-modal');
}

function previewLogPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    // Firestoreを使う場合は100KB以下に圧縮
    const compressed = isFirestoreReady()
      ? await compressImage(e.target.result, 100)
      : e.target.result;
    logPhotoData = compressed;
    document.getElementById('log-photo-preview').innerHTML =
      `<img src="${compressed}" alt="プレビュー">`;
  };
  reader.readAsDataURL(file);
}

function saveWorkLog() {
  const date = document.getElementById('log-date').value;
  if (!date) { showToast('⚠️ 日付を入力してください'); return; }

  const data = {
    date,
    fieldId: document.getElementById('log-field').value,
    cropId: document.getElementById('log-crop').value,
    workType: document.getElementById('log-worktype').value,
    weather: document.getElementById('log-weather').value,
    duration: document.getElementById('log-duration').value,
    notes: document.getElementById('log-notes').value.trim(),
    photo: logPhotoData
  };

  let savedItem;
  if (editingId.workLog) {
    savedItem = state.workLogs.find(l => l.id === editingId.workLog);
    if (savedItem) Object.assign(savedItem, data);
  } else {
    savedItem = { id: generateId(), ...data, createdAt: new Date().toISOString() };
    state.workLogs.push(savedItem);
  }

  saveData();
  if (savedItem && isFirestoreReady()) saveDocToFirestore('workLogs', savedItem.id, savedItem);
  closeModal('worklog-modal');
  renderWorkLogs();
  renderDashboard();
  showToast('✅ 作業記録を保存しました');
}

function deleteWorkLog(id) {
  if (!confirm('この作業記録を削除しますか？')) return;
  state.workLogs = state.workLogs.filter(l => l.id !== id);
  saveData();
  if (isFirestoreReady()) deleteDocFromFirestore('workLogs', id);
  renderWorkLogs();
  showToast('🗑️ 削除しました');
}

function renderWorkLogs() {
  const container = document.getElementById('worklog-list');
  if (!container) return;

  const sorted = [...state.workLogs].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    container.innerHTML = '<div class="card"><p class="empty-state">作業記録がありません。「＋ 記録追加」から記録しましょう！</p></div>';
    return;
  }

  container.innerHTML = sorted.map(log => {
    const wt = WORK_TYPES[log.workType] || { icon: '📋' };
    const crop = state.crops.find(c => c.id === log.cropId);
    const field = state.fields.find(f => f.id === log.fieldId);
    const guide = crop ? CROP_GUIDES[crop.guideKey] : null;
    const weatherIcons = { '晴れ': '☀️', 'くもり': '⛅', '雨': '🌧️', '雪': '❄️' };

    return `
      <div class="worklog-card">
        <div class="worklog-icon">${wt.icon}</div>
        <div class="worklog-main">
          <div class="worklog-date">${formatDate(log.date)} ${weatherIcons[log.weather] || ''}</div>
          <div class="worklog-type">${log.workType}</div>
          <div class="worklog-meta">
            ${guide ? guide.icon + ' ' : ''}${crop ? crop.name : ''}
            ${field ? ' 📍' + field.name : ''}
            ${log.duration ? ' ⏱️' + log.duration + '分' : ''}
          </div>
          ${log.notes ? `<div class="worklog-notes">${escapeHtml(log.notes)}</div>` : ''}
          ${log.photo ? `<div class="worklog-photo"><img src="${log.photo}" alt="作業写真" onclick="showPhotoModal('${log.id}')"></div>` : ''}
        </div>
        <div class="worklog-actions">
          <button class="btn btn-sm" onclick="openWorkLogModal('${log.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteWorkLog('${log.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// ===== 収穫記録 =====
function openHarvestModal(id = null) {
  editingId.harvest = id;
  populateAllSelects();

  const today = new Date().toISOString().split('T')[0];

  if (id) {
    const h = state.harvests.find(h => h.id === id);
    if (h) {
      document.getElementById('harvest-date').value = h.date || today;
      document.getElementById('harvest-crop').value = h.cropId || '';
      document.getElementById('harvest-qty').value = h.quantity || '';
      document.getElementById('harvest-unit').value = h.unit || 'kg';
      document.getElementById('harvest-notes').value = h.notes || '';
      document.querySelector('#harvest-modal .modal-content h2').textContent = '📦 収穫記録を編集';
    }
  } else {
    document.getElementById('harvest-date').value = today;
    document.getElementById('harvest-crop').value = '';
    document.getElementById('harvest-qty').value = '';
    document.getElementById('harvest-unit').value = 'kg';
    document.getElementById('harvest-notes').value = '';
    document.querySelector('#harvest-modal .modal-content h2').textContent = '📦 収穫記録';
  }
  openModal('harvest-modal');
}

function saveHarvest() {
  const date = document.getElementById('harvest-date').value;
  const qty = document.getElementById('harvest-qty').value;
  if (!date) { showToast('⚠️ 日付を入力してください'); return; }
  if (!qty) { showToast('⚠️ 収穫量を入力してください'); return; }

  const year = parseInt(date.split('-')[0]);
  const data = {
    date,
    cropId: document.getElementById('harvest-crop').value,
    quantity: parseFloat(qty),
    unit: document.getElementById('harvest-unit').value,
    notes: document.getElementById('harvest-notes').value.trim(),
    year
  };

  let savedItem;
  if (editingId.harvest) {
    savedItem = state.harvests.find(h => h.id === editingId.harvest);
    if (savedItem) Object.assign(savedItem, data);
  } else {
    savedItem = { id: generateId(), ...data, createdAt: new Date().toISOString() };
    state.harvests.push(savedItem);
  }

  saveData();
  if (savedItem && isFirestoreReady()) saveDocToFirestore('harvests', savedItem.id, savedItem);
  closeModal('harvest-modal');
  renderHarvests();
  renderDashboard();
  showToast('✅ 収穫を記録しました');
}

function deleteHarvest(id) {
  if (!confirm('この収穫記録を削除しますか？')) return;
  state.harvests = state.harvests.filter(h => h.id !== id);
  saveData();
  if (isFirestoreReady()) deleteDocFromFirestore('harvests', id);
  renderHarvests();
  showToast('🗑️ 削除しました');
}

function renderHarvests() {
  const container = document.getElementById('harvest-list');
  if (!container) return;

  const sorted = [...state.harvests].sort((a, b) => b.date.localeCompare(a.date));

  if (sorted.length === 0) {
    container.innerHTML = '<div class="card"><p class="empty-state">収穫記録がありません。収穫したら記録しましょう！</p></div>';
    return;
  }

  container.innerHTML = sorted.map(h => {
    const crop = state.crops.find(c => c.id === h.cropId);
    const guide = crop ? CROP_GUIDES[crop.guideKey] : null;
    return `
      <div class="harvest-card">
        <div class="harvest-icon">${guide ? guide.icon : '📦'}</div>
        <div>
          <div class="harvest-meta">${formatDate(h.date)}</div>
          <div style="font-weight:700; font-size:0.9rem;">${crop ? crop.name : '（作物未設定）'}</div>
          <div class="harvest-qty">${h.quantity}<span class="harvest-unit">${h.unit}</span></div>
          ${h.notes ? `<div class="harvest-notes">${escapeHtml(h.notes)}</div>` : ''}
        </div>
        <div class="harvest-actions">
          <button class="btn btn-sm" onclick="openHarvestModal('${h.id}')">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteHarvest('${h.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// ===== ダッシュボード =====
function renderDashboard() {
  renderMonthlyTasks();
  renderRecentLogs();
  renderActiveCrops();
  renderRecentHarvests();
}

function renderMonthlyTasks() {
  const container = document.getElementById('monthly-tasks');
  if (!container) return;

  const today = new Date();
  const month = today.getMonth() + 1;
  const activeCropKeys = [...new Set(state.crops
    .filter(c => c.status !== 'done')
    .map(c => c.guideKey)
    .filter(Boolean))];

  // 全作物のスケジュールも表示（作物未登録でも初心者に役立てるため）
  const allKeys = activeCropKeys.length > 0 ? activeCropKeys : Object.keys(CROP_GUIDES);
  const tasks = getMonthlyTasks(month, allKeys);

  if (tasks.length === 0) {
    container.innerHTML = '<p class="empty-state">今月の推奨タスクはありません</p>';
    return;
  }

  const weekLabel = ['', '第1週', '第2週', '第3週', '第4週'];
  container.innerHTML = tasks.slice(0, 8).map(t => `
    <div class="task-item">
      <span class="task-icon">${t.taskIcon}</span>
      <div class="task-info">
        <div class="task-name">${t.task}</div>
        <div class="task-crop">${t.icon} ${t.crop} ${weekLabel[t.week] || ''}</div>
        <div class="task-detail">${t.detail}</div>
      </div>
    </div>
  `).join('');
}

function renderRecentLogs() {
  const container = document.getElementById('recent-logs');
  if (!container) return;

  const sorted = [...state.workLogs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<p class="empty-state">まだ作業記録がありません</p>';
    return;
  }

  const wtIcons = {};
  Object.entries(WORK_TYPES).forEach(([k, v]) => wtIcons[k] = v.icon);

  container.innerHTML = sorted.map(log => {
    const crop = state.crops.find(c => c.id === log.cropId);
    return `
      <div class="log-item">
        <span class="log-date">${formatDateShort(log.date)}</span>
        <div class="log-content">
          <div class="log-work">${wtIcons[log.workType] || '📋'} ${log.workType}</div>
          <div class="log-meta">${crop ? crop.name : ''}</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderActiveCrops() {
  const container = document.getElementById('active-crops');
  if (!container) return;

  const active = state.crops.filter(c => c.status !== 'done');

  if (active.length === 0) {
    container.innerHTML = '<p class="empty-state">育成中の作物がありません<br>「作物管理」から追加してください</p>';
    return;
  }

  const statusLabel = { planning: '計画中', growing: '育成中', harvesting: '収穫中' };
  container.innerHTML = active.slice(0, 6).map(crop => {
    const guide = CROP_GUIDES[crop.guideKey] || {};
    return `
      <div class="log-item">
        <span style="font-size:1.4rem">${guide.icon || '🌱'}</span>
        <div class="log-content">
          <div class="log-work">${crop.name}${crop.variety ? ' (' + crop.variety + ')' : ''}</div>
          <div class="log-meta">${statusLabel[crop.status] || crop.status} • ${crop.year || ''}年</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRecentHarvests() {
  const container = document.getElementById('recent-harvests');
  if (!container) return;

  const sorted = [...state.harvests].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  if (sorted.length === 0) {
    container.innerHTML = '<p class="empty-state">収穫記録がありません</p>';
    return;
  }

  container.innerHTML = sorted.map(h => {
    const crop = state.crops.find(c => c.id === h.cropId);
    const guide = crop ? CROP_GUIDES[crop.guideKey] : null;
    return `
      <div class="log-item">
        <span style="font-size:1.4rem">${guide ? guide.icon : '📦'}</span>
        <div class="log-content">
          <div class="log-work">${crop ? crop.name : '作物'} ${h.quantity}${h.unit}</div>
          <div class="log-meta">${formatDateShort(h.date)}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== セレクトボックスの更新 =====
function populateAllSelects() {
  // 圃場セレクト
  ['log-field'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = '<option value="">（圃場なし）</option>' +
        state.fields.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
    }
  });

  // 作物セレクト
  ['log-crop', 'harvest-crop'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = '<option value="">（作物なし）</option>' +
        state.crops.map(c => {
          const guide = CROP_GUIDES[c.guideKey] || {};
          return `<option value="${c.id}">${guide.icon || '🌱'} ${c.name}${c.variety ? ' (' + c.variety + ')' : ''} (${c.year || ''}年)</option>`;
        }).join('');
    }
  });

  // 圃場→作物の連動
  const logField = document.getElementById('log-field');
  const logCrop = document.getElementById('log-crop');
  if (logField && logCrop) {
    logField.onchange = () => {
      const fieldId = logField.value;
      const crops = fieldId ? state.crops.filter(c => c.fieldId === fieldId) : state.crops;
      logCrop.innerHTML = '<option value="">（作物なし）</option>' +
        crops.map(c => {
          const guide = CROP_GUIDES[c.guideKey] || {};
          return `<option value="${c.id}">${guide.icon || '🌱'} ${c.name}${c.variety ? ' (' + c.variety + ')' : ''}</option>`;
        }).join('');
    };
  }
}

// ===== バックアップ・復元 =====
function exportJSON() {
  const exportData = {
    ...state,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  };
  // APIキーは除外
  delete exportData.settings.apiKey;

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `farm_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('💾 バックアップファイルをダウンロードしました');
}

function importJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!confirm('現在のデータをバックアップファイルで上書きしますか？\n（現在のデータは消えます）')) {
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      const apiKey = state.settings.apiKey; // APIキーは保持
      state = {
        fields: imported.fields || [],
        crops: imported.crops || [],
        workLogs: imported.workLogs || [],
        harvests: imported.harvests || [],
        settings: { ...imported.settings, apiKey }
      };
      saveData();
      renderDashboard();
      showToast('✅ データを復元しました');
    } catch (err) {
      showToast('⚠️ ファイルの読み込みに失敗しました');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// ===== Obsidianエクスポート =====
function exportObsidian() {
  const year = new Date().getFullYear();
  let md = `# 農作業日誌 ${year}年\n\n`;
  md += `> エクスポート日時: ${new Date().toLocaleString('ja-JP')}\n\n`;

  // 作物まとめ
  md += `## 🌱 今年の作物\n\n`;
  const yearlyCrops = state.crops.filter(c => c.year === year || !c.year);
  if (yearlyCrops.length > 0) {
    yearlyCrops.forEach(crop => {
      const guide = CROP_GUIDES[crop.guideKey] || {};
      const field = state.fields.find(f => f.id === crop.fieldId);
      md += `### ${guide.icon || '🌱'} ${crop.name}${crop.variety ? ' (' + crop.variety + ')' : ''}\n`;
      if (field) md += `- 圃場: ${field.name}\n`;
      if (crop.sowingDate) md += `- 種まき: ${formatDate(crop.sowingDate)}\n`;
      if (crop.plantingDate) md += `- 定植: ${formatDate(crop.plantingDate)}\n`;
      md += `\n`;
    });
  } else {
    md += `（記録なし）\n\n`;
  }

  // 収穫まとめ
  md += `## 📦 収穫記録\n\n`;
  const yearlyHarvests = state.harvests.filter(h => h.year === year);
  if (yearlyHarvests.length > 0) {
    md += `| 日付 | 作物 | 収穫量 | メモ |\n|------|------|--------|------|\n`;
    yearlyHarvests.sort((a, b) => a.date.localeCompare(b.date)).forEach(h => {
      const crop = state.crops.find(c => c.id === h.cropId);
      md += `| ${h.date} | ${crop ? crop.name : '不明'} | ${h.quantity}${h.unit} | ${h.notes || ''} |\n`;
    });
  } else {
    md += `（記録なし）\n`;
  }
  md += '\n';

  // 作業記録（月別）
  md += `## 📝 作業記録\n\n`;
  for (let m = 1; m <= 12; m++) {
    const monthLogs = state.workLogs.filter(l => {
      const d = new Date(l.date);
      return d.getFullYear() === year && d.getMonth() + 1 === m;
    });
    if (monthLogs.length === 0) continue;

    md += `### ${m}月\n\n`;
    monthLogs.sort((a, b) => a.date.localeCompare(b.date)).forEach(log => {
      const crop = state.crops.find(c => c.id === log.cropId);
      const wt = WORK_TYPES[log.workType] || { icon: '📋' };
      md += `- **${log.date}** ${wt.icon} ${log.workType}`;
      if (crop) md += ` (${crop.name})`;
      if (log.notes) md += `\n  > ${log.notes}`;
      md += '\n';
    });
    md += '\n';
  }

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `農作業日誌_${year}年_${new Date().toISOString().split('T')[0]}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('📓 Obsidianファイルをダウンロードしました');
}

// ===== ユーティリティ =====
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

function showPhotoModal(logId) {
  const log = state.workLogs.find(l => l.id === logId);
  if (!log || !log.photo) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:2000;display:flex;align-items:center;justify-content:center;cursor:pointer;';
  overlay.innerHTML = `<img src="${log.photo}" style="max-width:90%;max-height:90vh;border-radius:12px;">`;
  overlay.onclick = () => overlay.remove();
  document.body.appendChild(overlay);
}

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', () => {
  loadData();         // localStorageから即時読み込み
  updateSyncStatus(false);
  renderDashboard();
  renderAll();

  // ガント年選択の初期設定
  const ganttYear = document.getElementById('ganttYear');
  if (ganttYear) {
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 1; y <= currentYear + 2; y++) {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y + '年';
      if (y === currentYear) opt.selected = true;
      ganttYear.appendChild(opt);
    }
  }

  // Firebase 初期化（非同期・ノンブロッキング）
  initFirebaseFromSettings();
});
