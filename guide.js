// 農業知識データ（長野県池田町基準・寒冷地仕様）
// guide.js

const CROP_GUIDES = {
  rice: {
    name: '米（コシヒカリ等）',
    icon: '🌾',
    type: 'rice',
    schedule: [
      { month: 4, week: 1, task: '種もみ準備', icon: '🌱', detail: '種もみを選別・消毒・浸種する。塩水選で良い種もみを選ぶ。池田町は寒いため松本より1〜2週間遅めの開始が目安。', color: '#a8d08d' },
      { month: 4, week: 2, task: '種まき（育苗）', icon: '🌱', detail: '育苗箱に種まき。温度管理が大切（30℃前後）。池田町は朝晩が冷えるため保温に注意。', color: '#a8d08d' },
      { month: 5, week: 1, task: '田起こし', icon: '🚜', detail: 'トラクターや鍬で田んぼの土を起こす。冬期湛水後の田んぼは土が柔らかくなっているため作業しやすい。', color: '#c8a87d' },
      { month: 5, week: 4, task: '代かき', icon: '🌾', detail: '水を張って土をならす。田植えの1〜2週間前に行う。雑草の種を埋め込む効果も。', color: '#7ec8e3' },
      { month: 6, week: 1, task: '田植え', icon: '🪴', detail: '池田町では6月上旬が田植えの目安。苗が20〜25cmになったら田植え。霜のリスクがなくなってから行う。', color: '#4caf50' },
      { month: 6, week: 2, task: '活着確認', icon: '👀', detail: '田植え後1〜2週間で苗が根付いているか確認。水管理が重要。朝晩の冷え込みに注意。', color: '#81c784' },
      { month: 7, week: 2, task: '中干し', icon: '🌊', detail: '1〜2週間田から水を抜いて根を鍛える。土が割れる程度まで乾かす。', color: '#ffb74d' },
      { month: 7, week: 4, task: '出穂前管理', icon: '💊', detail: '穂肥（穂が出る前の追肥）を施す。イモチ病などの病害虫にも注意。寒冷地は出穂が早まる場合がある。', color: '#9c27b0' },
      { month: 8, week: 2, task: '出穂期', icon: '🌾', detail: '穂が出始めたら水管理をしっかりする。池田町は夏でも朝晩冷えるため、冷害に注意。', color: '#ffd54f' },
      { month: 9, week: 3, task: '落水', icon: '🌊', detail: '稲刈りの1〜2週間前に水を落とす。機械作業がしやすくなる。', color: '#90a4ae' },
      { month: 9, week: 4, task: '稲刈り', icon: '📦', detail: '穂が黄金色に染まり、90%が黄変したら稲刈り。池田町では9月下旬〜10月上旬が目安。初霜前に完了させる。', color: '#ff9800' },
      { month: 10, week: 1, task: '乾燥・脱穀', icon: '📦', detail: '刈り取った稲を乾燥させ、脱穀する。水分15%以下に乾燥させる。', color: '#ff9800' },
      { month: 11, week: 1, task: '❄️ 冬期湛水開始', icon: '❄️', detail: '稲刈り後の田んぼに水を張る（3〜5cm程度）。雑草の発生を抑え、カモなどの渡り鳥が来て害虫・草の種を食べてくれる。生物多様性の向上と土づくりに効果的。池田町の冬は積雪があるため水位管理に注意。', color: '#90caf9' },
      { month: 12, week: 2, task: '❄️ 冬期湛水 水位確認', icon: '❄️', detail: '水位が下がっていないか確認（目標：3〜5cm）。凍結・漏水に注意。積雪で水位が増えた場合は排水調整も。カモなどの鳥の観察も楽しみの一つ。', color: '#90caf9' },
      { month: 1, week: 2, task: '❄️ 冬期湛水 水位確認', icon: '❄️', detail: '厳冬期の水位確認・補水。池田町は積雪が多く凍結も激しいため、水路の確認も忘れずに。渡り鳥の飛来状況を記録しておくと翌年の参考になる。', color: '#90caf9' },
      { month: 2, week: 2, task: '❄️ 冬期湛水 水位確認', icon: '❄️', detail: '春に向けて水位を確認。融雪水が大量に流れ込む場合は水位調整が必要。3月の田起こしに向けて落水の準備を始める。', color: '#90caf9' },
      { month: 3, week: 2, task: '冬期湛水終了・落水', icon: '🌾', detail: '田起こしの2〜3週間前に水を落とす。冬期湛水後の土は軟らかく生物が豊富。この土の状態が翌年の米の品質に活きる。', color: '#c8a87d' },
    ]
  },
  tomato: {
    name: 'トマト',
    icon: '🍅',
    type: 'vegetable',
    schedule: [
      { month: 3, week: 2, task: '種まき（育苗）', icon: '🌱', detail: '育苗トレイに種まき。発芽温度は25〜30℃。室内やハウスで育苗。池田町は寒いため室内管理を徹底する。', color: '#a8d08d' },
      { month: 4, week: 2, task: '本葉2〜3枚で鉢上げ', icon: '🌱', detail: '本葉が出たら9cmポットに鉢上げ。徒長に注意し日光をしっかり当てる。', color: '#a8d08d' },
      { month: 5, week: 4, task: '定植', icon: '🪴', detail: '池田町は霜が5月下旬まである年もあるため、定植は5月末〜6月上旬が安全。支柱を立てる。霜予報が出たら不織布で覆う。', color: '#4caf50' },
      { month: 6, week: 1, task: '芽かき', icon: '✂️', detail: '脇芽は小さいうちに摘み取る。一本仕立てで育てると実が大きくなる。', color: '#ff7043' },
      { month: 6, week: 2, task: '誘引・施肥', icon: '💊', detail: '伸びた茎を支柱に誘引する。第1果が野球ボール大になったら追肥。', color: '#9c27b0' },
      { month: 6, week: 3, task: '草取り・水やり', icon: '🌿', detail: '乾燥に注意。雨が少ない日は水やり。', color: '#43a047' },
      { month: 7, week: 1, task: '収穫開始', icon: '📦', detail: '赤く色づいたものから順に収穫。熟しすぎる前に収穫する。', color: '#ff9800' },
      { month: 7, week: 2, task: '芽かき・整枝継続', icon: '✂️', detail: '引き続き脇芽を取り続ける。夏の病気（うどんこ病等）に注意。', color: '#ff7043' },
      { month: 8, week: 1, task: '収穫最盛期', icon: '📦', detail: '最も多く収穫できる時期。毎日収穫して樹を疲れさせない。', color: '#ff9800' },
      { month: 9, week: 1, task: '末期管理', icon: '✂️', detail: '池田町は9月中旬以降に霜が降りることもある。残った実を早めに収穫し、終わったら片付ける。', color: '#90a4ae' },
    ]
  },
  cucumber: {
    name: 'きゅうり',
    icon: '🥒',
    type: 'vegetable',
    schedule: [
      { month: 4, week: 2, task: '種まき（育苗）', icon: '🌱', detail: '育苗ポットに種まき。発芽温度25〜30℃。室内管理で育苗。', color: '#a8d08d' },
      { month: 5, week: 4, task: '定植', icon: '🪴', detail: '本葉3〜4枚になったら定植。池田町では5月末〜6月上旬が霜の心配がなくなる目安。支柱やネットを張る。', color: '#4caf50' },
      { month: 6, week: 1, task: '誘引・整枝', icon: '✂️', detail: '親づるをネットに誘引。子づるの整理（下から5節まで切る）。', color: '#ff7043' },
      { month: 6, week: 3, task: '収穫開始', icon: '📦', detail: '種まきから約50日で収穫開始。20〜25cmが採り頃。', color: '#ff9800' },
      { month: 7, week: 1, task: '収穫最盛期', icon: '📦', detail: '毎日収穫。うどんこ病・べと病に注意。', color: '#ff9800' },
      { month: 8, week: 1, task: '衰退期', icon: '✂️', detail: '高温と病害で衰えやすい。側枝を整理して風通しを良くする。', color: '#90a4ae' },
      { month: 8, week: 3, task: '片付け', icon: '🌿', detail: '収穫が終わったらつるを片付け、土を耕す。', color: '#90a4ae' },
    ]
  },
  eggplant: {
    name: 'ナス',
    icon: '🍆',
    type: 'vegetable',
    schedule: [
      { month: 3, week: 1, task: '種まき（育苗）', icon: '🌱', detail: '育苗トレイに種まき。発芽に時間がかかる（10〜14日）。高温管理（28〜30℃）。池田町は室内育苗を徹底する。', color: '#a8d08d' },
      { month: 5, week: 4, task: '定植', icon: '🪴', detail: '本葉7〜8枚になったら定植。池田町では5月末〜6月上旬が安全。霜が心配な場合は行灯がけで保温。', color: '#4caf50' },
      { month: 6, week: 1, task: '整枝（3本仕立て）', icon: '✂️', detail: '第一花の直下の脇芽2本を残して3本仕立て。それ以外の脇芽は摘む。', color: '#ff7043' },
      { month: 6, week: 2, task: '第一花の人工授粉', icon: '🌱', detail: '第一花は確実に結実させる。花が咲いたら軽く揺らして授粉を助ける。', color: '#81c784' },
      { month: 6, week: 4, task: '収穫開始', icon: '📦', detail: '15〜18cmで収穫。採り遅れると株が疲れる。', color: '#ff9800' },
      { month: 7, week: 3, task: '更新剪定', icon: '✂️', detail: '夏の疲れた株に更新剪定。枝を1/2程度に切り戻し追肥して秋ナスに備える。', color: '#ff7043' },
      { month: 8, week: 2, task: '秋ナス収穫', icon: '📦', detail: '更新剪定後、秋に再び収穫できる。秋ナスは皮が柔らかくおいしい。', color: '#ff9800' },
      { month: 9, week: 3, task: '片付け', icon: '🌿', detail: '池田町では10月前後に初霜が来ることがある。霜が降りる前に片付け。', color: '#90a4ae' },
    ]
  },
  pepper: {
    name: 'ピーマン',
    icon: '🫑',
    type: 'vegetable',
    schedule: [
      { month: 3, week: 1, task: '種まき（育苗）', icon: '🌱', detail: '育苗トレイに種まき。ナスと同様に高温管理が必要。室内育苗。', color: '#a8d08d' },
      { month: 5, week: 4, task: '定植', icon: '🪴', detail: '本葉7〜8枚で定植。池田町では5月末〜6月上旬が安全。支柱を立てる。', color: '#4caf50' },
      { month: 6, week: 2, task: '整枝（3本仕立て）', icon: '✂️', detail: '主枝の下から出る脇芽を2本残して3本仕立て。風通し良く管理。', color: '#ff7043' },
      { month: 7, week: 1, task: '収穫開始', icon: '📦', detail: '5〜7cmになったら収穫。採り遅れると赤くなる（赤ピーマン）。', color: '#ff9800' },
      { month: 7, week: 2, task: '施肥・水やり', icon: '💊', detail: '2週間おきに追肥。乾燥に弱いのでしっかり水やり。', color: '#9c27b0' },
      { month: 8, week: 1, task: '収穫最盛期', icon: '📦', detail: '真夏は収穫量が増える。毎日確認して収穫。', color: '#ff9800' },
      { month: 9, week: 3, task: '片付け', icon: '🌿', detail: '池田町では霜が早い年もある。10月前に片付けを済ませる。', color: '#90a4ae' },
    ]
  },
  pumpkin: {
    name: 'カボチャ',
    icon: '🎃',
    type: 'vegetable',
    schedule: [
      { month: 4, week: 3, task: '種まき（育苗）', icon: '🌱', detail: '育苗ポットに種まき。点まきで2〜3粒まいて後で間引く。室内育苗。', color: '#a8d08d' },
      { month: 5, week: 4, task: '定植', icon: '🪴', detail: '本葉3〜4枚で定植。池田町では霜が5月下旬まであるため、定植は5月末〜6月上旬が安全。', color: '#4caf50' },
      { month: 6, week: 1, task: 'つる誘引', icon: '✂️', detail: '親づるを伸ばし、子づると孫づるを整理。広いスペースが必要。', color: '#ff7043' },
      { month: 6, week: 3, task: '人工授粉', icon: '🌱', detail: '雌花が咲いたら朝（10時まで）に雄花の花粉を雌花に付ける。', color: '#81c784' },
      { month: 8, week: 1, task: '収穫', icon: '📦', detail: '授粉から40〜45日で収穫。へたが枯れてコルク状になったら収穫適期。', color: '#ff9800' },
      { month: 8, week: 2, task: '追熟', icon: '📦', detail: '収穫後、風通しの良い場所で1〜2週間追熟させると甘みが増す。', color: '#ff9800' },
    ]
  },
  daikon: {
    name: '大根',
    icon: '🥕',
    type: 'vegetable',
    schedule: [
      { month: 8, week: 3, task: '種まき（秋まき）', icon: '🌱', detail: '直まき。1ヶ所に3〜4粒まいて後で間引く。池田町は秋の冷え込みが早いため早めに種まき。', color: '#a8d08d' },
      { month: 8, week: 4, task: '間引き（1回目）', icon: '✂️', detail: '双葉が出たら間引く。', color: '#ff7043' },
      { month: 9, week: 2, task: '間引き（2回目）・追肥', icon: '✂️', detail: '本葉5〜6枚で1本に間引き、追肥・土寄せ。', color: '#ff7043' },
      { month: 10, week: 1, task: '収穫', icon: '📦', detail: '肩が地面から3〜4cm出たら収穫適期。池田町では霜が来る前の10月上旬に収穫を始める。', color: '#ff9800' },
      { month: 10, week: 3, task: '収穫・保存', icon: '📦', detail: '霜が降りる前に収穫完了。土の中や涼しい場所で保存可能。', color: '#ff9800' },
      { month: 4, week: 2, task: '種まき（春まき）', icon: '🌱', detail: 'とう立ちしにくい品種（春大根）を選ぶ。池田町では4月中旬以降が目安。', color: '#a8d08d' },
      { month: 6, week: 1, task: '収穫（春まき）', icon: '📦', detail: '約55日で収穫可能。暑くなる前に収穫する。', color: '#ff9800' },
    ]
  },
  carrot: {
    name: 'ニンジン',
    icon: '🥕',
    type: 'vegetable',
    schedule: [
      { month: 7, week: 1, task: '種まき', icon: '🌱', detail: '発芽がむずかしい。種まき後は乾燥させないよう新聞紙などで覆う。', color: '#a8d08d' },
      { month: 7, week: 2, task: '発芽確認', icon: '👀', detail: '10〜14日で発芽。発芽が確認できたら覆いを取る。', color: '#81c784' },
      { month: 8, week: 1, task: '間引き（1回目）', icon: '✂️', detail: '本葉1〜2枚で2〜3cm間隔に間引く。', color: '#ff7043' },
      { month: 8, week: 3, task: '間引き（2回目）・追肥', icon: '✂️', detail: '本葉5〜6枚で10cm間隔に間引き、追肥。', color: '#ff7043' },
      { month: 10, week: 1, task: '収穫', icon: '📦', detail: '根元の直径が3cm以上になったら収穫適期。池田町では霜が来る前に収穫を始める。', color: '#ff9800' },
      { month: 10, week: 3, task: '収穫完了', icon: '📦', detail: '霜が降りる前に収穫。土の中でそのまま保存もできる。', color: '#ff9800' },
    ]
  },
  spinach: {
    name: 'ほうれん草',
    icon: '🥬',
    type: 'vegetable',
    schedule: [
      { month: 9, week: 1, task: '種まき（秋まき）', icon: '🌱', detail: '酸性土壌に弱い。石灰を施して土を中和してから種まき。条まき。池田町の秋は冷え込みが早いため早めに種まき。', color: '#a8d08d' },
      { month: 9, week: 2, task: '間引き', icon: '✂️', detail: '本葉2〜3枚で3〜4cm間隔に間引く。間引き菜も食べられる。', color: '#ff7043' },
      { month: 10, week: 2, task: '収穫', icon: '📦', detail: '草丈20〜25cmで収穫。根元からハサミで切る。霜にあたると甘みが増す。', color: '#ff9800' },
      { month: 4, week: 1, task: '種まき（春まき）', icon: '🌱', detail: 'とう立ちしにくい品種を選ぶ。池田町では4月上旬から種まき可能。', color: '#a8d08d' },
      { month: 5, week: 2, task: '収穫（春まき）', icon: '📦', detail: '暑くなる前に収穫を完了させる。', color: '#ff9800' },
    ]
  },
  lettuce: {
    name: 'レタス',
    icon: '🥗',
    type: 'vegetable',
    schedule: [
      { month: 3, week: 2, task: '種まき（育苗）', icon: '🌱', detail: 'セルトレイに種まき。種は光があると発芽しやすい（好光性種子）。室内育苗。', color: '#a8d08d' },
      { month: 4, week: 2, task: '定植', icon: '🪴', detail: '本葉3〜4枚で定植。株間30cm。深植えしない。池田町では霜の心配がある場合は不織布で覆う。', color: '#4caf50' },
      { month: 5, week: 3, task: '収穫', icon: '📦', detail: '結球型は外葉を持って押すと固い感触になったら収穫。', color: '#ff9800' },
      { month: 8, week: 2, task: '種まき（秋まき）', icon: '🌱', detail: '高温期は発芽が悪いため冷やした水に浸してから種まき。', color: '#a8d08d' },
      { month: 9, week: 1, task: '定植（秋まき）', icon: '🪴', detail: '本葉3〜4枚で定植。', color: '#4caf50' },
      { month: 10, week: 2, task: '収穫（秋まき）', icon: '📦', detail: '秋レタスは甘みがあっておいしい。霜が来る前に収穫を完了。', color: '#ff9800' },
    ]
  },
  onion: {
    name: 'タマネギ',
    icon: '🧅',
    type: 'vegetable',
    schedule: [
      { month: 9, week: 1, task: '種まき（育苗）', icon: '🌱', detail: 'セルトレイや育苗床に種まき。発芽まで7〜10日。池田町は秋の冷え込みが早いため、早めに種まき。', color: '#a8d08d' },
      { month: 10, week: 3, task: '定植', icon: '🪴', detail: '苗の太さが鉛筆程度になったら定植。株間10〜15cm。マルチ利用が便利。池田町は積雪があるためマルチ推奨。', color: '#4caf50' },
      { month: 3, week: 2, task: '追肥', icon: '💊', detail: '越冬後に追肥。球が太り始める前に施す。雪が解けたら早めに確認。', color: '#9c27b0' },
      { month: 6, week: 1, task: '収穫', icon: '📦', detail: '葉が2/3程度倒れたら収穫適期。晴れた日に引き抜く。', color: '#ff9800' },
      { month: 6, week: 2, task: '乾燥・保存', icon: '📦', detail: '風通しの良い場所で2〜3週間乾燥させてから保存。', color: '#ff9800' },
    ]
  },
  potato: {
    name: 'じゃがいも',
    icon: '🥔',
    type: 'vegetable',
    schedule: [
      { month: 4, week: 1, task: '種芋準備', icon: '🌱', detail: '種芋を切って切り口を乾かす。40〜60gに切り分ける。池田町は4月上旬でもまだ寒い。', color: '#a8d08d' },
      { month: 4, week: 2, task: '植え付け', icon: '🪴', detail: '池田町では4月中旬〜下旬が植え付けの目安。霜が降りても芽が少し出ている程度なら問題ない。株間30cm。', color: '#4caf50' },
      { month: 5, week: 2, task: '芽かき・土寄せ', icon: '✂️', detail: '芽が10〜15cmになったら2〜3本に芽かき。土を寄せる（イモが緑化するのを防ぐ）。遅霜に注意。', color: '#ff7043' },
      { month: 5, week: 4, task: '追肥・土寄せ2回目', icon: '💊', detail: '追肥して再度土寄せ。', color: '#9c27b0' },
      { month: 7, week: 1, task: '収穫', icon: '📦', detail: '葉が黄色くなったら収穫適期。晴れが続いた日に掘り起こす。', color: '#ff9800' },
      { month: 7, week: 2, task: '乾燥・保存', icon: '📦', detail: '掘り起こしたイモを数時間乾燥させてから涼しい場所に保存。', color: '#ff9800' },
    ]
  },
  sweet_potato: {
    name: 'さつまいも',
    icon: '🍠',
    type: 'vegetable',
    schedule: [
      { month: 5, week: 4, task: '苗の準備・定植', icon: '🪴', detail: '池田町では霜の心配がなくなる5月末〜6月上旬が定植の目安。市販の苗を購入。水平植えや斜め植えで。株間30cm。', color: '#4caf50' },
      { month: 6, week: 2, task: 'つる返し', icon: '🌿', detail: '伸びたつるを持ち上げて裏返す（つるに根が張るのを防ぐ）。', color: '#43a047' },
      { month: 9, week: 3, task: '試し掘り', icon: '📦', detail: '定植から120〜150日で収穫適期。池田町では初霜が来る前（9月下旬〜10月上旬）に収穫を完了させる。', color: '#ff9800' },
      { month: 10, week: 1, task: '収穫', icon: '📦', detail: '試し掘りで確認後、本格収穫。傷をつけないよう丁寧に掘る。霜前に必ず完了。', color: '#ff9800' },
      { month: 10, week: 2, task: '追熟', icon: '📦', detail: '収穫後2〜4週間の追熟でデンプンが糖に変わり甘みが増す。13〜15℃で保存。', color: '#ff9800' },
    ]
  },
  soba: {
    name: 'そば',
    icon: '🌿',
    type: 'vegetable',
    schedule: [
      { month: 6, week: 4, task: '種まき（夏そば）', icon: '🌱', detail: '池田町では夏そばは6月下旬〜7月上旬に種まき。直まきで条まきか散まき。発芽温度は15〜30℃。', color: '#a8d08d' },
      { month: 7, week: 3, task: '開花（夏そば）', icon: '🌸', detail: '白い花が一面に咲く。受粉は虫や風で行われる。乾燥・強風に注意。', color: '#f0f0f0' },
      { month: 8, week: 3, task: '収穫（夏そば）', icon: '📦', detail: '実の75〜80%が黒褐色になったら収穫。早めに刈り取って乾燥させる。実がこぼれやすいので朝露のある時間帯に刈り取る。', color: '#ff9800' },
      { month: 8, week: 1, task: '種まき（秋そば）', icon: '🌱', detail: '長野県では秋そばが主流。池田町では8月上旬に種まき。遅まきは霜にやられるリスクがあるので注意。', color: '#a8d08d' },
      { month: 9, week: 2, task: '開花（秋そば）', icon: '🌸', detail: '長野県の秋そばの開花期。一面に白い花が咲く。受粉期間中の雨や霜に注意。', color: '#f0f0f0' },
      { month: 10, week: 1, task: '収穫（秋そば）', icon: '📦', detail: '池田町では10月上〜中旬が収穫の目安。霜が降りる前に収穫完了。実がこぼれやすいので丁寧に刈り取る。乾燥後に脱穀。', color: '#ff9800' },
    ]
  }
};

// 作業タイプとアイコンの定義
const WORK_TYPES = {
  '水やり':     { icon: '💧', description: '植物への水やり' },
  '代かき':     { icon: '🌾', description: '田植え前に水を張って土をならす作業' },
  '種まき':     { icon: '🌱', description: '種をまく作業' },
  '定植':       { icon: '🪴', description: '育てた苗を畑や田んぼに植える作業' },
  '田起こし':   { icon: '🚜', description: 'トラクターや鍬で土を耕す作業' },
  '芽かき':     { icon: '✂️', description: '余分な芽や脇芽を取り除く作業' },
  '草取り':     { icon: '🌿', description: '雑草を取り除く作業' },
  '施肥':       { icon: '💊', description: '肥料を与える作業' },
  '中干し':     { icon: '🌊', description: '田んぼの水を一時的に抜いて根を鍛える作業' },
  '収穫':       { icon: '📦', description: '野菜・お米の収穫' },
  '間引き':     { icon: '✂️', description: '密集した苗を間引いて成長を促す' },
  '追肥':       { icon: '💊', description: '生育中に追加で肥料を与える' },
  '農薬散布':   { icon: '🧴', description: '病害虫対策の農薬散布' },
  '土寄せ':     { icon: '🚜', description: '株元に土を寄せる作業' },
  'マルチ張り': { icon: '🎨', description: 'マルチシートを張る作業' },
  '冬期湛水':   { icon: '❄️', description: '冬の間、田んぼに水を張る管理作業' },
  '水位確認':   { icon: '🔍', description: '冬期湛水中の水位確認・補水作業' },
  'その他':     { icon: '📋', description: 'その他の作業' }
};

// 月名
const MONTH_NAMES = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

// 今月の推奨タスクを取得
function getMonthlyTasks(month, cropGuideKeys) {
  const tasks = [];
  const today = new Date();
  const currentMonth = month || (today.getMonth() + 1);

  cropGuideKeys.forEach(key => {
    const guide = CROP_GUIDES[key];
    if (!guide) return;

    guide.schedule.forEach(item => {
      if (item.month === currentMonth) {
        tasks.push({
          crop: guide.name,
          icon: guide.icon,
          taskIcon: item.icon,
          task: item.task,
          detail: item.detail,
          week: item.week
        });
      }
    });
  });

  // 週順にソート
  tasks.sort((a, b) => a.week - b.week);
  return tasks;
}
