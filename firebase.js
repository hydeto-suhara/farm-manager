// ===== Firebase Firestore 連携 =====
// firebase.js

let _db = null;
let _familyCode = null;
let _unsubscribers = [];
let _app = null;

// Firebase アプリを一度だけ初期化（認証・Firestore で共用）
function ensureFirebaseApp(config) {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK が読み込まれていません');
    return null;
  }
  if (_app) return _app;
  try {
    _app = firebase.initializeApp(config);
  } catch (e) {
    if (e.code === 'app/duplicate-app') {
      _app = firebase.app();
    } else {
      console.error('Firebase 初期化エラー:', e);
      return null;
    }
  }
  return _app;
}

// ===== Google ログイン =====
// 認証の監視を開始（ログイン状態が変わるたびにコールバックを呼ぶ）
function initAuth(config, onSignedIn, onSignedOut) {
  const app = ensureFirebaseApp(config);
  if (!app) return;
  const auth = firebase.auth();
  // リダイレクト方式でログインした場合の戻り値を処理（エラーは無視）
  auth.getRedirectResult().catch(e => console.warn('リダイレクト結果エラー:', e));
  auth.onAuthStateChanged(user => {
    if (user) {
      onSignedIn(user);
    } else {
      onSignedOut();
    }
  });
}

// Google でログイン（PCはポップアップ、スマホ等はリダイレクトに自動切替）
async function signInWithGoogle() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await firebase.auth().signInWithPopup(provider);
  } catch (e) {
    if (
      e.code === 'auth/popup-blocked' ||
      e.code === 'auth/cancelled-popup-request' ||
      e.code === 'auth/popup-closed-by-user' ||
      e.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await firebase.auth().signInWithRedirect(provider);
    } else {
      throw e;
    }
  }
}

// ログアウト
function signOutUser() {
  if (typeof firebase === 'undefined' || !firebase.auth) return Promise.resolve();
  return firebase.auth().signOut();
}

// Firestore 接続を解除（ログアウト時にクラウドから切り離す）
function teardownFirestore() {
  stopRealtimeSync();
  _db = null;
  _familyCode = null;
  updateSyncStatus(false);
}

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

    const app = ensureFirebaseApp(config);
    if (!app) {
      updateSyncStatus(false);
      return false;
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
