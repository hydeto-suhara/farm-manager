// ===== AI相談チャット =====
// ai.js

let aiMessages = [];
let uploadedPhotoData = null;
let isAiLoading = false;

// ===== 写真アップロード =====
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  // ファイルサイズ確認（5MB制限）
  if (file.size > 5 * 1024 * 1024) {
    showToast('⚠️ 写真のサイズが大きすぎます（5MB以下にしてください）');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedPhotoData = e.target.result;
    document.getElementById('photo-preview').innerHTML = `
      <img src="${e.target.result}" alt="アップロード写真" style="width:60px;height:60px;object-fit:cover;border-radius:8px;border:2px solid #74c69d;">
      <button class="remove-photo" onclick="removeUploadedPhoto()">×</button>
    `;
  };
  reader.readAsDataURL(file);
}

function removeUploadedPhoto() {
  uploadedPhotoData = null;
  document.getElementById('photo-preview').innerHTML = '';
  document.getElementById('ai-photo').value = '';
}

// ===== メッセージ送信 =====
async function sendAIMessage() {
  if (isAiLoading) return;

  const input = document.getElementById('ai-input');
  const userText = input.value.trim();

  if (!userText && !uploadedPhotoData) {
    showToast('⚠️ 質問を入力するか写真を選択してください');
    return;
  }

  const apiKey = state.settings.apiKey;
  if (!apiKey) {
    showToast('⚠️ 設定からClaude API Keyを入力してください');
    openSettings();
    return;
  }

  // ユーザーメッセージを追加
  const userMsg = {
    role: 'user',
    content: userText || '（写真を送りました）',
    photo: uploadedPhotoData,
    timestamp: new Date()
  };
  aiMessages.push(userMsg);
  renderAiMessages();

  // 入力クリア
  input.value = '';
  const sentPhoto = uploadedPhotoData;
  uploadedPhotoData = null;
  document.getElementById('photo-preview').innerHTML = '';
  document.getElementById('ai-photo').value = '';

  // ローディング表示
  isAiLoading = true;
  addThinkingMessage();

  try {
    const response = await callClaudeAPI(userText, sentPhoto, apiKey);
    removeThinkingMessage();
    aiMessages.push({ role: 'assistant', content: response, timestamp: new Date() });
    renderAiMessages();
  } catch (err) {
    removeThinkingMessage();
    let errorMsg = '⚠️ エラーが発生しました。';
    if (err.message.includes('401')) errorMsg = '⚠️ API Keyが正しくありません。設定を確認してください。';
    else if (err.message.includes('429')) errorMsg = '⚠️ リクエスト数が多すぎます。しばらく待ってから再試行してください。';
    else if (err.message.includes('network') || err.message.includes('fetch')) {
      errorMsg = '⚠️ ネットワークエラーです。インターネット接続を確認してください。';
    }
    aiMessages.push({ role: 'assistant', content: errorMsg, timestamp: new Date(), isError: true });
    renderAiMessages();
    showToast(errorMsg, 5000);
  } finally {
    isAiLoading = false;
  }
}

// ===== Claude API呼び出し =====
async function callClaudeAPI(userText, photoData, apiKey) {
  // システムプロンプト: 農業アシスタント
  const systemPrompt = buildSystemPrompt();

  // APIに送るメッセージ構築
  const messages = buildApiMessages(userText, photoData);

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

function buildSystemPrompt() {
  const location = state.settings.location || '松本市';
  const today = new Date();
  const month = today.getMonth() + 1;
  const crops = state.crops.filter(c => c.status !== 'done').map(c => c.name).join('、');

  return `あなたは${location}の農業をサポートするAIアシスタントです。
初心者が田んぼや家庭菜園を始めたばかりです。

現在の情報:
- 場所: ${location}（長野県。寒冷地）
- 今月: ${month}月
- 現在育てている作物: ${crops || '（未登録）'}

回答のルール:
1. 初心者にも分かりやすい言葉で、具体的に説明する
2. 長野県の気候（寒冷地、標高が高い）を考慮した回答をする
3. 写真が送られた場合は、写真の状態を詳しく観察して診断する
4. 問題や病害虫の場合は、まず手軽にできる対処法を提案する
5. 農薬を使う前に、できる限り自然な方法を先に提案する
6. 回答は400文字以内にまとめ、要点を箇条書きにする
7. 必要なら「次のステップ」として1〜2つのアクションを提案する
8. 絵文字を適度に使って読みやすくする`;
}

function buildApiMessages(userText, photoData) {
  // 過去のメッセージ（最新5件まで）
  const historyMessages = aiMessages.slice(-10).map(m => {
    if (m.role === 'user') {
      const content = [];
      if (m.photo) {
        const base64Data = m.photo.split(',')[1];
        const mimeType = m.photo.split(';')[0].split(':')[1];
        content.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } });
      }
      if (m.content && m.content !== '（写真を送りました）') {
        content.push({ type: 'text', text: m.content });
      }
      return { role: 'user', content: content.length === 1 ? content[0] : content };
    } else {
      return { role: 'assistant', content: m.content };
    }
  });

  // 現在のメッセージを構築（最後のユーザーメッセージは既にhistoryに入っているので省く）
  // 現在のメッセージを追加
  const currentContent = [];
  if (photoData) {
    const base64Data = photoData.split(',')[1];
    const mimeType = photoData.split(';')[0].split(':')[1];
    currentContent.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } });
  }
  if (userText) {
    currentContent.push({ type: 'text', text: userText });
  }

  // 最後のメッセージを現在のものに更新
  if (historyMessages.length > 0) {
    const last = historyMessages[historyMessages.length - 1];
    if (last.role === 'user') {
      // 現在のフォトデータで更新
      if (photoData) {
        last.content = currentContent.length === 1 ? currentContent[0] : currentContent;
      }
    }
  }

  return historyMessages.length > 0 ? historyMessages : [
    { role: 'user', content: currentContent.length === 1 ? currentContent[0] : (currentContent.length > 0 ? currentContent : [{ type: 'text', text: userText || '農業について教えてください' }]) }
  ];
}

// ===== UI描画 =====
function renderAiMessages() {
  const container = document.getElementById('ai-messages');
  if (!container) return;

  if (aiMessages.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px;color:#666;">
        <div style="font-size:3rem;margin-bottom:12px;">🌾</div>
        <div style="font-weight:600;margin-bottom:8px;">農業AIアシスタント</div>
        <div style="font-size:0.85rem;line-height:1.8;color:#888;">
          農作業について何でも質問してください。<br>
          写真を送ると病害虫や生育状態を診断できます。<br><br>
          <strong>例:</strong><br>
          「トマトの葉が黄色くなってきました」<br>
          「今月やることを教えてください」<br>
          「水やりの頻度はどのくらい？」
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = aiMessages.map(msg => {
    const isUser = msg.role === 'user';
    const time = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '';

    let content = '';
    if (msg.photo) {
      content += `<img src="${msg.photo}" alt="送信写真">`;
    }
    if (msg.content && msg.content !== '（写真を送りました）') {
      content += `<div>${formatAiText(msg.content)}</div>`;
    } else if (!msg.photo) {
      content += `<div>${formatAiText(msg.content)}</div>`;
    }

    return `
      <div class="ai-message ${isUser ? 'user' : 'assistant'}">
        <div class="ai-avatar">${isUser ? '👤' : '🤖'}</div>
        <div>
          <div class="ai-bubble ${msg.isError ? 'error' : ''}">${content}</div>
          <div style="font-size:0.7rem;color:#999;margin-top:2px;${isUser ? 'text-align:right' : ''}">${time}</div>
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

function formatAiText(text) {
  if (!text) return '';
  // 改行を<br>に変換、マークダウン風の強調を変換
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function addThinkingMessage() {
  const container = document.getElementById('ai-messages');
  if (!container) return;

  const thinking = document.createElement('div');
  thinking.className = 'ai-message assistant';
  thinking.id = 'thinking-message';
  thinking.innerHTML = `
    <div class="ai-avatar">🤖</div>
    <div class="ai-bubble"><span class="thinking">考えています</span></div>
  `;
  container.appendChild(thinking);
  container.scrollTop = container.scrollHeight;
}

function removeThinkingMessage() {
  const thinking = document.getElementById('thinking-message');
  if (thinking) thinking.remove();
}

// ===== キーボードショートカット =====
document.addEventListener('DOMContentLoaded', () => {
  const aiInput = document.getElementById('ai-input');
  if (aiInput) {
    aiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sendAIMessage();
      }
    });

    // プレースホルダーをCtrl+Enterの説明に
    aiInput.placeholder = '農作業について質問してください...\n（Ctrl+Enter で送信）';
  }

  // 初期表示
  renderAiMessages();
});
