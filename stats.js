// ===== 統計・グラフ =====
// stats.js

let chartInstances = {};

function renderStats() {
  // 既存チャートを破棄
  Object.values(chartInstances).forEach(c => {
    if (c) c.destroy();
  });
  chartInstances = {};

  renderHarvestByYearChart();
  renderHarvestByCropChart();
  renderWorkTimeChart();
  renderCropSummary();
}

// ===== 年別収穫量グラフ =====
function renderHarvestByYearChart() {
  const canvas = document.getElementById('harvestByYearChart');
  if (!canvas) return;

  if (state.harvests.length === 0) {
    canvas.parentElement.innerHTML += '<p class="empty-state">収穫記録がまだありません</p>';
    return;
  }

  // 年別・作物別に集計（kgに統一）
  const years = [...new Set(state.harvests.map(h => h.year || new Date(h.date).getFullYear()))].sort();
  const cropKeys = [...new Set(state.harvests.map(h => h.cropId))];

  // 各作物の年別収穫量
  const datasets = [];
  const colors = [
    '#4caf50', '#ff9800', '#2196f3', '#e91e63', '#9c27b0',
    '#00bcd4', '#ff5722', '#795548', '#607d8b', '#8bc34a'
  ];

  const processedCrops = new Set();

  cropKeys.forEach((cropId, idx) => {
    const crop = state.crops.find(c => c.id === cropId);
    if (!crop) return;

    const guide = CROP_GUIDES[crop.guideKey] || {};
    const label = `${guide.icon || '🌱'} ${crop.name}`;

    const data = years.map(y => {
      const yearHarvests = state.harvests.filter(h =>
        h.cropId === cropId && (h.year || new Date(h.date).getFullYear()) === y
      );
      return yearHarvests.reduce((sum, h) => {
        // kgに変換
        let qty = h.quantity;
        if (h.unit === 'g') qty /= 1000;
        else if (h.unit === '本' || h.unit === '個' || h.unit === '袋' || h.unit === '束') {
          qty = qty * 0.3; // 大まかに0.3kg/本として換算
        }
        return sum + qty;
      }, 0);
    });

    datasets.push({
      label,
      data,
      backgroundColor: colors[idx % colors.length] + 'cc',
      borderColor: colors[idx % colors.length],
      borderWidth: 2,
      borderRadius: 6
    });
  });

  if (datasets.length === 0) {
    canvas.style.display = 'none';
    return;
  }

  chartInstances.harvestByYear = new Chart(canvas, {
    type: 'bar',
    data: { labels: years.map(y => y + '年'), datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}kg相当`
          }
        }
      },
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          title: { display: true, text: '収穫量 (kg相当)', font: { size: 11 } }
        }
      }
    }
  });
}

// ===== 作物別収穫量グラフ =====
function renderHarvestByCropChart() {
  const canvas = document.getElementById('harvestByCropChart');
  if (!canvas) return;

  if (state.harvests.length === 0) return;

  // 作物別に集計
  const cropData = {};
  state.harvests.forEach(h => {
    const crop = state.crops.find(c => c.id === h.cropId);
    if (!crop) return;
    const guide = CROP_GUIDES[crop.guideKey] || {};
    const label = `${guide.icon || '🌱'} ${crop.name}`;

    let qty = h.quantity;
    if (h.unit === 'g') qty /= 1000;
    else if (['本', '個', '袋', '束'].includes(h.unit)) qty = qty * 0.3;

    cropData[label] = (cropData[label] || 0) + qty;
  });

  const labels = Object.keys(cropData);
  const data = Object.values(cropData);

  if (labels.length === 0) return;

  const colors = [
    '#4caf50cc', '#ff9800cc', '#2196f3cc', '#e91e63cc', '#9c27b0cc',
    '#00bcd4cc', '#ff5722cc', '#795548cc', '#607d8bcc', '#8bc34acc'
  ];

  chartInstances.harvestByCrop = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.label}: ${ctx.raw.toFixed(1)}kg相当`
          }
        }
      }
    }
  });
}

// ===== 月別作業時間グラフ =====
function renderWorkTimeChart() {
  const canvas = document.getElementById('workTimeChart');
  if (!canvas) return;

  if (state.workLogs.length === 0) {
    canvas.parentElement.innerHTML += '<p class="empty-state">作業記録がまだありません</p>';
    return;
  }

  // 年別・月別に集計
  const years = [...new Set(state.workLogs.map(l => new Date(l.date).getFullYear()))].sort();
  const currentYear = new Date().getFullYear();

  // 直近2年分を表示
  const displayYears = years.slice(-2);

  const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  const yearColors = ['#4caf50', '#ff9800', '#2196f3', '#e91e63'];

  const datasets = displayYears.map((year, idx) => {
    const data = Array(12).fill(0);
    state.workLogs.forEach(log => {
      const d = new Date(log.date);
      if (d.getFullYear() === year) {
        const m = d.getMonth();
        const duration = parseInt(log.duration) || 30; // 記録なしは30分として計算
        data[m] += duration;
      }
    });
    // 分→時間に変換
    const hoursData = data.map(m => Math.round(m / 60 * 10) / 10);

    return {
      label: year + '年',
      data: hoursData,
      borderColor: yearColors[idx % yearColors.length],
      backgroundColor: yearColors[idx % yearColors.length] + '33',
      tension: 0.3,
      fill: true,
      pointRadius: 4,
      pointHoverRadius: 6
    };
  });

  chartInstances.workTime = new Chart(canvas, {
    type: 'line',
    data: { labels: monthLabels, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw}時間`
          }
        }
      },
      scales: {
        y: {
          title: { display: true, text: '作業時間 (時間)', font: { size: 11 } },
          min: 0
        }
      }
    }
  });
}

// ===== 作物サマリー =====
function renderCropSummary() {
  const container = document.getElementById('crop-summary');
  if (!container) return;

  if (state.crops.length === 0) {
    container.innerHTML = '<p class="empty-state">作物を登録するとサマリーが表示されます</p>';
    return;
  }

  // 作物別に集計
  const summaries = [];
  const cropGroups = {};

  state.crops.forEach(crop => {
    const key = crop.guideKey || crop.name;
    if (!cropGroups[key]) {
      cropGroups[key] = { crops: [], name: crop.name, guideKey: crop.guideKey };
    }
    cropGroups[key].crops.push(crop);
  });

  Object.entries(cropGroups).forEach(([key, group]) => {
    const guide = CROP_GUIDES[group.guideKey] || {};
    const allHarvests = state.harvests.filter(h =>
      group.crops.some(c => c.id === h.cropId)
    );

    const totalQty = allHarvests.reduce((sum, h) => {
      let qty = h.quantity;
      if (h.unit === 'g') qty /= 1000;
      return sum + qty;
    }, 0);

    const years = [...new Set(group.crops.map(c => c.year).filter(Boolean))].sort();
    const firstYear = years[0];

    // 年別収穫量で最高年を計算
    let bestYear = null;
    let bestQty = 0;
    const yearGroups = {};
    allHarvests.forEach(h => {
      const y = h.year || new Date(h.date).getFullYear();
      if (!yearGroups[y]) yearGroups[y] = 0;
      let qty = h.quantity;
      if (h.unit === 'g') qty /= 1000;
      yearGroups[y] += qty;
    });
    Object.entries(yearGroups).forEach(([y, qty]) => {
      if (qty > bestQty) { bestQty = qty; bestYear = y; }
    });

    // 総作業回数
    const workCount = state.workLogs.filter(l =>
      group.crops.some(c => c.id === l.cropId)
    ).length;

    summaries.push({
      name: group.name,
      icon: guide.icon || '🌱',
      firstYear,
      totalQty: totalQty.toFixed(1),
      bestYear,
      bestQty: bestQty.toFixed(1),
      workCount,
      harvestUnit: allHarvests[0]?.unit || 'kg',
      yearCount: years.length
    });
  });

  if (summaries.length === 0) {
    container.innerHTML = '<p class="empty-state">データがまだありません</p>';
    return;
  }

  container.innerHTML = `<div class="crop-summary-grid">
    ${summaries.map(s => `
      <div class="summary-card">
        <div class="summary-icon">${s.icon}</div>
        <div class="summary-name">${s.name}</div>
        <div class="summary-stat">
          ${s.firstYear ? `📅 初めて育てた: <strong>${s.firstYear}年</strong><br>` : ''}
          ${s.yearCount > 1 ? `🗓️ 栽培年数: <strong>${s.yearCount}年</strong><br>` : ''}
          ${parseFloat(s.totalQty) > 0 ? `📦 累計収穫: <strong>${s.totalQty}${s.harvestUnit}</strong><br>` : ''}
          ${s.bestYear ? `🏆 最高収穫: <strong>${s.bestYear}年 (${s.bestQty}${s.harvestUnit})</strong><br>` : ''}
          📝 作業記録: <strong>${s.workCount}回</strong>
        </div>
      </div>
    `).join('')}
  </div>`;
}
