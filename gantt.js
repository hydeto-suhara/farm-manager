// ===== ガントチャート描画 =====
// gantt.js

function renderGantt() {
  const container = document.getElementById('gantt-container');
  if (!container) return;

  const yearEl = document.getElementById('ganttYear');
  const year = yearEl ? parseInt(yearEl.value) : new Date().getFullYear();
  const today = new Date();
  const todayMonth = today.getMonth() + 1;
  const todayWeek = Math.ceil(today.getDate() / 7);
  const isCurrentYear = today.getFullYear() === year;

  // 表示する作物（登録作物 + デモ用に全ガイド）
  let displayCrops = state.crops.filter(c => {
    const cropYear = c.year || year;
    return cropYear === year;
  });

  // 作物が登録されていない場合はガイドから代表的な作物を表示
  if (displayCrops.length === 0) {
    // デモ表示: ガイドから全作物
    const demoKeys = Object.keys(CROP_GUIDES);
    const rows = buildGanttRows(demoKeys.map(k => ({ guideKey: k, id: k, name: CROP_GUIDES[k].name, isDemo: true })),
      year, todayMonth, todayWeek, isCurrentYear);
    container.innerHTML = `
      <div style="padding:12px;background:#fff8e1;border-bottom:1px solid #ffe082;font-size:0.85rem;color:#e65100;">
        💡 作物を登録するとここに表示されます（現在はサンプル表示中）
      </div>
      ${rows}
    `;
    attachGanttTooltips();
    return;
  }

  container.innerHTML = buildGanttRows(displayCrops, year, todayMonth, todayWeek, isCurrentYear);
  attachGanttTooltips();
}

function buildGanttRows(crops, year, todayMonth, todayWeek, isCurrentYear) {
  // 作業実績をマップ化
  const logMap = {};
  state.workLogs.forEach(log => {
    const d = new Date(log.date);
    if (d.getFullYear() !== year) return;
    const m = d.getMonth() + 1;
    const w = Math.ceil(d.getDate() / 7);
    crops.forEach(crop => {
      if (crop.id === log.cropId || crop.isDemo) {
        const key = `${crop.id}_${m}_${w}`;
        if (!logMap[key]) logMap[key] = [];
        logMap[key].push(log);
      }
    });
  });

  // スケジュールマップ化
  const scheduleMap = {};
  crops.forEach(crop => {
    const guide = CROP_GUIDES[crop.guideKey];
    if (!guide) return;
    guide.schedule.forEach(s => {
      const key = `${crop.id}_${s.month}_${s.week}`;
      if (!scheduleMap[key]) scheduleMap[key] = [];
      scheduleMap[key].push(s);
    });
  });

  // テーブル構築
  let html = '<table class="gantt-table">';

  // ヘッダー行1: 月
  html += '<thead><tr class="gantt-header"><th class="crop-col">作物</th>';
  for (let m = 1; m <= 12; m++) {
    html += `<th colspan="4" class="month-header">${m}月</th>`;
  }
  html += '</tr>';

  // ヘッダー行2: 週
  html += '<tr class="gantt-header"><th class="crop-col"></th>';
  for (let m = 1; m <= 12; m++) {
    for (let w = 1; w <= 4; w++) {
      const isLastWeek = w === 4;
      html += `<th style="${isLastWeek ? 'border-right:2px solid rgba(255,255,255,0.3)' : ''}">${w}週</th>`;
    }
  }
  html += '</tr></thead><tbody>';

  // 各作物の行
  crops.forEach(crop => {
    const guide = CROP_GUIDES[crop.guideKey];
    if (!guide) return;

    html += `<tr class="gantt-row">`;
    html += `<td class="crop-name">${guide.icon} ${crop.name}${crop.isDemo ? '' : (crop.variety ? '<br><small style="color:#666;">' + crop.variety + '</small>' : '')}</td>`;

    for (let m = 1; m <= 12; m++) {
      for (let w = 1; w <= 4; w++) {
        const isLastWeek = w === 4;
        const scheduleKey = `${crop.id}_${m}_${w}`;
        const logKey = `${crop.id}_${m}_${w}`;
        const schedules = scheduleMap[scheduleKey] || [];
        const logs = logMap[logKey] || [];
        const isToday = isCurrentYear && m === todayMonth && w === todayWeek;
        const hasSchedule = schedules.length > 0;
        const hasLog = logs.length > 0;

        let classes = 'gantt-cell';
        if (hasSchedule) classes += ' has-schedule';
        if (isToday) classes += ' today-col';

        let cellContent = '';

        // スケジュールアイコン
        if (hasSchedule) {
          schedules.forEach(s => {
            cellContent += `<div class="schedule-block" data-tooltip="${s.task}: ${s.detail}" style="color:${hasLog ? '#1b5e20' : '#388e3c'}">
              <span style="font-size:${schedules.length > 1 ? '0.8rem' : '1rem'}">${s.icon}</span>
              ${schedules.length <= 2 ? `<span class="task-label">${s.task.substring(0, 3)}</span>` : ''}
            </div>`;
          });
        }

        // 実績アイコン
        if (hasLog) {
          const uniqueTypes = [...new Set(logs.map(l => l.workType))];
          uniqueTypes.slice(0, 2).forEach(wt => {
            const wtInfo = WORK_TYPES[wt] || { icon: '✅' };
            cellContent += `<span class="actual-mark" data-tooltip="実績: ${wt}" title="${wt}">✅</span>`;
          });
        }

        // 今日マーカー
        if (isToday && !hasSchedule) {
          cellContent += `<span class="today-marker">▼</span>`;
        }

        const borderStyle = isLastWeek ? 'border-right:2px solid #ccc;' : '';
        html += `<td class="${classes}" style="${borderStyle}" data-m="${m}" data-w="${w}">${cellContent || (isToday ? '<span class="today-marker">▼</span>' : '')}</td>`;
      }
    }

    html += '</tr>';
  });

  html += '</tbody></table>';

  // 凡例
  html = `
    <div class="gantt-controls">
      <select id="ganttYear" onchange="renderGantt()" class="year-select">
        ${getYearOptions()}
      </select>
      <span style="font-size:0.8rem;color:#666;">表示年を選択 | 今日: ${todayMonth}月${todayWeek}週目</span>
    </div>
    <div class="gantt-legend">
      <div class="legend-item"><span style="font-size:1rem">🌱</span> 推奨スケジュール</div>
      <div class="legend-item"><span style="font-size:0.8rem;background:#e8f5e9;padding:2px 6px;border-radius:4px;">緑背景</span> 推奨時期</div>
      <div class="legend-item"><span style="color:#e74c3c;">▼</span> 今日</div>
      <div class="legend-item"><span style="font-size:0.8rem;">✅</span> 実績あり</div>
    </div>
  ` + html;

  return html;
}

function getYearOptions() {
  const currentYear = new Date().getFullYear();
  const ganttYear = document.getElementById('ganttYear');
  const selectedYear = ganttYear ? parseInt(ganttYear.value) : currentYear;
  let opts = '';
  for (let y = currentYear - 1; y <= currentYear + 2; y++) {
    opts += `<option value="${y}" ${y === selectedYear ? 'selected' : ''}>${y}年</option>`;
  }
  return opts;
}

function attachGanttTooltips() {
  const tooltip = document.getElementById('gantt-tooltip') || createTooltip();

  document.querySelectorAll('[data-tooltip]').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      tooltip.textContent = e.currentTarget.dataset.tooltip;
      tooltip.style.display = 'block';
    });
    el.addEventListener('mousemove', (e) => {
      tooltip.style.left = (e.clientX + 12) + 'px';
      tooltip.style.top = (e.clientY - 30) + 'px';
    });
    el.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
    // タッチ対応
    el.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      tooltip.textContent = e.currentTarget.dataset.tooltip;
      tooltip.style.left = (touch.clientX + 12) + 'px';
      tooltip.style.top = (touch.clientY - 60) + 'px';
      tooltip.style.display = 'block';
      setTimeout(() => { tooltip.style.display = 'none'; }, 3000);
    });
  });
}

function createTooltip() {
  const t = document.createElement('div');
  t.id = 'gantt-tooltip';
  t.className = 'gantt-tooltip';
  t.style.display = 'none';
  document.body.appendChild(t);
  return t;
}
