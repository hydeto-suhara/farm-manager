// ===== Firebase Firestore 連携 =====
// firebase.js

let _db = null;
let _familyCode = null;
let _unsubscribers = [];

// Firestore が使える状態かチェック
function isFirestoreReady() {
  return _db !== null && _familyCode !== null;
}

// 同期ステータス表示更新
function updateSyncStatus(connected) {
  const indicator = document.getElementById('sync-indicator');
  if (!indicator) return;
  if (connected) {
    indicator.textContent = '🟢 クラウド同期中';
    indicator.style.color = '#2d6a4f';
  } else {
    indicator.textContent = '🔴 ローカル保存';
    indicator.style.color = '#999';
  }
}

// Firestore コレクションのパスを返す
function _colPath(collectionName) {
  return _db.collection('families').doc(_familyCode).collection(collectionName);
}

// Firebase 初期化
function initFirestore(config, familyCode) {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK が読み込まれていません');
    updateSyncStatus(false);
    return false;
  }
  try {
    stopRealtimeSync();
    _db = null;
    _familyCode = null;

    let app;
    try {
      app = firebase.initializeApp(config);
    } catch (e) {
      if (e.code === 'app/duplicate-app') {
        app = firebase.app();
      } else {
        throw e;
      }
    }

    _db = firebase.firestore(app);
    _familyCode = familyCode;
    updateSyncStatus(true);
    return true;
  } catch (e) {
    console.error('Firestore 初期化エラー:', e);
    updateSyncStatus(false);
    return false;
  }
}

// 全コレクションを一括読み込み
async function loadAllFromFirestore() {
  if (!isFirestoreReady()) return null;
  try {
    const [fieldsSnap, cropsSnap, workLogsSnap, harvestsSnap] = await Promise.all([
      _colPath('fields').get(),
      _colPath('crops').get(),
      _colPath('workLogs').get(),
      _colPath('harvests').get()
    ]);
    return {
      fields:    fieldsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      crops:     cropsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      workLogs:  workLogsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      harvests:  harvestsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    };
  } catch (e) {
    console.error('Firestore 読み込みエラー:', e);
    return null;
  }
}

// 1ドキュメント保存（id フィールドはドキュメントIDとして使用）
async function saveDocToFirestore(collectionName, id, data) {
  if (!isFirestoreReady()) return false;
  try {
    const { id: _id, ...docData } = data;
    await _colPath(collectionName).doc(id).set(docData, { merge: true });
    return true;
  } catch (e) {
    console.error('Firestore 保存エラー:', e);
    return false;
  }
}

// 1ドキュメント削除
async function deleteDocFromFirestore(collectionName, id) {
  if (!isFirestoreReady()) return false;
  try {
    await _colPath(collectionName).doc(id).delete();
    return true;
  } catch (e) {
    console.error('Firestore 削除エラー:', e);
    return false;
  }
}

// リアルタイム同期開始（家族の更新を即反映）
function startRealtimeSync(callback) {
  if (!isFirestoreReady()) return;
  stopRealtimeSync();

  ['fields', 'crops', 'workLogs', 'harvests'].forEach(col => {
    const unsub = _colPath(col).onSnapshot(
      snapshot => {
        callback(col, snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      err => console.error('リアルタイム同期エラー:', col, err)
    );
    _unsubscribers.push(unsub);
  });
}

// リアルタイム同期停止
function stopRealtimeSync() {
  _unsubscribers.forEach(fn => fn());
  _unsubscribers = [];
}
