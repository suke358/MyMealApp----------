// 設定
const API_URL = 'https://script.google.com/macros/s/AKfycbyTqlvUn6xbUJAwUO_piVGiUHyNtii6Pp3UgCoT06dZuBqqypqktz10RF0ZXJodZ-l_/exec';
const FETCH_TIMEOUT = 5000; // 5秒

// サンプルデータ（読み込み失敗時のフォールバック用）
const SAMPLE_MEALS = [
    {
        id: 'sample-1',
        createdAt: new Date().toISOString(),
        category: '牛',
        name: 'ハンバーグ',
        mainIngredient: '牛肉',
        memo: '牛肉、玉ねぎ、パン粉、卵、牛乳',
        favorite: true,
        lastAte: ''
    },
    {
        id: 'sample-2',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        category: '牛',
        name: 'ステーキ',
        mainIngredient: '牛肉',
        memo: '牛肉、にんにく、バター、塩コショウ',
        favorite: false,
        lastAte: ''
    },
    {
        id: 'sample-3',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        category: '牛',
        name: '牛丼',
        mainIngredient: '牛肉',
        memo: '牛肉、玉ねぎ、ご飯、醤油、みりん',
        favorite: true,
        lastAte: ''
    },
    {
        id: 'sample-4',
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        category: '豚',
        name: 'とんかつ',
        mainIngredient: '豚ロース',
        memo: '豚ロース、パン粉、卵、小麦粉、キャベツ',
        favorite: true,
        lastAte: ''
    },
    {
        id: 'sample-5',
        createdAt: new Date(Date.now() - 345600000).toISOString(),
        category: '豚',
        name: '生姜焼き',
        mainIngredient: '豚肉',
        memo: '豚肉、生姜、醤油、みりん、キャベツ',
        favorite: false,
        lastAte: ''
    },
    {
        id: 'sample-6',
        createdAt: new Date(Date.now() - 432000000).toISOString(),
        category: '豚',
        name: '角煮',
        mainIngredient: '豚バラ',
        memo: '豚バラ、醤油、酒、砂糖、にんにく',
        favorite: false,
        lastAte: ''
    },
    {
        id: 'sample-7',
        createdAt: new Date(Date.now() - 518400000).toISOString(),
        category: '鶏',
        name: '唐揚げ',
        mainIngredient: '鶏もも肉',
        memo: '鶏もも肉、醤油、にんにく、生姜、片栗粉',
        favorite: true,
        lastAte: ''
    },
    {
        id: 'sample-8',
        createdAt: new Date(Date.now() - 604800000).toISOString(),
        category: '鶏',
        name: '親子丼',
        mainIngredient: '鶏むね肉',
        memo: '鶏むね肉、卵、玉ねぎ、ご飯、醤油、みりん',
        favorite: true,
        lastAte: ''
    },
    {
        id: 'sample-9',
        createdAt: new Date(Date.now() - 691200000).toISOString(),
        category: '鶏',
        name: 'チキンカレー',
        mainIngredient: '鶏もも肉',
        memo: '鶏もも肉、玉ねぎ、にんじん、じゃがいも、カレールー',
        favorite: false,
        lastAte: ''
    }
];

// データ管理（初期値としてサンプルデータを設定）
let meals = [...SAMPLE_MEALS];
let editingIndex = -1;
let searchKeyword = '';
let filterCategory = 'all'; // all, 肉, 魚, 野菜, その他
let isLoading = false;
let useSampleData = true; // サンプルデータ使用フラグ（初期状態はtrue）

// カテゴリーボタンの処理
let selectedCategory = '';
const categoryButtons = document.querySelectorAll('.category-btn');
categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        categoryButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedCategory = btn.dataset.category;
    });
});

// 保存ボタンの処理
const saveBtn = document.getElementById('saveBtn');
const mealNameInput = document.getElementById('mealName');
const mainIngredientInput = document.getElementById('mainIngredient');
const memoInput = document.getElementById('memo');
const lastAteInput = document.getElementById('lastAte');
const favoriteInput = document.getElementById('favorite');
const searchInput = document.getElementById('searchInput');
const filterChips = document.querySelectorAll('#filterChips .filter-chip');
const suggestBtn = document.getElementById('suggestBtn');
const suggestionArea = document.getElementById('suggestionArea');
const toastEl = document.createElement('div');
toastEl.id = 'toast';
toastEl.className = 'toast';
document.body.appendChild(toastEl);

saveBtn.addEventListener('click', async () => {
    const mealName = mealNameInput.value.trim();
    const mainIngredient = mainIngredientInput.value.trim();
    const memo = memoInput.value.trim();
    const lastAte = lastAteInput.value;
    const favorite = favoriteInput.checked;

    if (!selectedCategory) {
        alert('カテゴリーを選択してください');
        return;
    }

    if (!mealName) {
        alert('食事名を入力してください');
        return;
    }

    const now = new Date();
    const meal = {
        id: editingIndex >= 0 && meals[editingIndex]?.id ? meals[editingIndex].id : `id-${Date.now()}`,
        createdAt: editingIndex >= 0 && meals[editingIndex]?.createdAt ? meals[editingIndex].createdAt : now.toISOString(),
        category: selectedCategory,
        name: mealName,
        mainIngredient: mainIngredient,
        memo: memo,
        favorite: favorite,
        lastAte: lastAte || '',
    };

    try {
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';
        
        // サンプルデータ使用中はローカルに追加のみ
        if (useSampleData) {
            if (editingIndex >= 0) {
                meals[editingIndex] = meal;
            } else {
                meals.unshift(meal);
            }
            showToast('ローカルに保存しました（サンプルデータモード）');
            renderMeals();
        } else {
            // スプレッドシートに保存を試みる
            try {
                await saveMealToSheet(meal);
                showToast('スプレッドシートに保存しました！');
                await fetchMealsFromSheet(); // 最新を再取得
            } catch (saveError) {
                console.error('保存エラー:', saveError);
                // 保存失敗時もローカルに追加
                if (editingIndex >= 0) {
                    meals[editingIndex] = meal;
                } else {
                    meals.unshift(meal);
                }
                showToast('ローカルに保存しました（スプレッドシートへの保存に失敗）');
                renderMeals();
            }
        }
    } catch (e) {
        console.error('予期しないエラー:', e);
        alert('保存に失敗しました。時間をおいて再度お試しください。');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = editingIndex >= 0 ? '更新' : '保存';
    }

    resetForm();
});

// フォームをリセット
function resetForm() {
    mealNameInput.value = '';
    mainIngredientInput.value = '';
    memoInput.value = '';
    lastAteInput.value = '';
    favoriteInput.checked = false;
    selectedCategory = '';
    categoryButtons.forEach(b => b.classList.remove('active'));
    editingIndex = -1;
    saveBtn.textContent = '保存';
}

// 現在の検索・絞り込み条件に合う配列を取得
function getFilteredMeals() {
    return meals.filter(meal => {
        // カテゴリーフィルター
        if (filterCategory !== 'all') {
            const highLevel = getHighLevelCategory(meal.category);
            if (highLevel !== filterCategory) return false;
        }

        // キーワード検索（料理名・食材）
        if (searchKeyword) {
            const kw = searchKeyword.toLowerCase();
            const target = (meal.name + ' ' + (meal.mainIngredient || '') + ' ' + (meal.memo || '')).toLowerCase();
            if (!target.includes(kw)) return false;
        }

        return true;
    });
}

// 食事リストを表示（レストランメニュー風）
function renderMeals() {
    const mealsList = document.getElementById('mealsList');
    
    if (isLoading) {
        mealsList.innerHTML = '<div class="loading-state">読み込み中...</div>';
        return;
    }

    if (meals.length === 0) {
        mealsList.innerHTML = '<div class="empty-state">まだおかずが登録されていません。<br>上のフォームから、いつもの定番や作ってみたい料理を登録しましょう。</div>';
        suggestionArea.innerHTML = '';
        return;
    }

    const filtered = getFilteredMeals();

    if (filtered.length === 0) {
        mealsList.innerHTML = '<div class="no-result-hint">条件に合うおかずがありません。<br>検索ワードやカテゴリーを少しゆるめてみてください。</div>';
        suggestionArea.innerHTML = '';
        return;
    }

    // カテゴリーごとにまとめる（表示は 牛・豚・鶏 をまとめて「肉」セクションに）
    const sections = {
        '肉': [],
        '魚': [],
        '野菜': [],
        'その他': []
    };

    filtered.forEach(meal => {
        const high = getHighLevelCategory(meal.category);
        sections[high].push(meal);
    });

    const sectionOrder = ['肉', '魚', '野菜', 'その他'];
    const labels = {
        '肉': 'MEAT',
        '魚': 'FISH',
        '野菜': 'VEGETABLES',
        'その他': 'OTHERS'
    };

    let html = '';

    sectionOrder.forEach(highCat => {
        const items = sections[highCat];
        if (items.length === 0) return;

        html += `
            <div class="menu-section">
                <div class="menu-section-title">
                    ${highCat}のおかず
                    <span>${labels[highCat]} • ${items.length} items</span>
                </div>
                <div class="meal-grid">
        `;

        // itemsは filtered の要素なので元indexを探す
        items.forEach(meal => {
            const originalIndex = meals.indexOf(meal);
            const categoryClass = getCategoryClass(meal.category);
            html += `
                <div class="meal-item ${categoryClass}">
                    <div class="meal-header">
                        <div>
                            <span class="meal-category ${categoryClass}">${meal.category}</span>
                            ${meal.favorite ? '<span class="favorite-chip">★ お気に入り</span>' : ''}
                        </div>
                    </div>
                    <div class="meal-name">${escapeHtml(meal.name)}</div>
                    ${meal.mainIngredient ? `<div class="meal-ingredients"><strong>メイン食材:</strong> ${escapeHtml(meal.mainIngredient)}</div>` : ''}
                    ${meal.memo ? `<div class="meal-ingredients">${escapeHtml(meal.memo)}</div>` : ''}
                    <div class="date-info">
                        登録: ${formatDate(meal.createdAt)}${meal.lastAte ? ` ／ 最後に食べた日: ${formatDate(meal.lastAte)}` : ''}
                    </div>
                    <div class="meal-actions">
                        <button class="edit-btn" data-index="${originalIndex}">編集</button>
                        <button class="delete-btn" data-index="${originalIndex}">削除</button>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    mealsList.innerHTML = html;

    // 編集・削除ボタンのイベントを設定
    mealsList.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = Number(btn.dataset.index);
            editMeal(index);
        });
    });

    mealsList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const index = Number(btn.dataset.index);
            deleteMeal(index);
        });
    });
}

// カテゴリーからクラス名を取得
function getCategoryClass(category) {
    const categoryMap = {
        '牛': 'beef',
        '豚': 'pork',
        '鶏': 'chicken',
        '魚': 'fish',
        '野菜': 'vegetable',
        'その他': 'other'
    };
    return categoryMap[category] || 'other';
}

// 肉・魚・野菜・その他 の大分類を返す
function getHighLevelCategory(category) {
    if (category === '魚') return '魚';
    if (category === '野菜') return '野菜';
    if (category === 'その他') return 'その他';
    // 牛・豚・鶏 などはすべて「肉」
    return '肉';
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 日付表示用
function formatDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

// トースト表示
function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 2400);
}

// 編集機能
window.editMeal = function(index) {
    const meal = meals[index];
    selectedCategory = meal.category;
    mealNameInput.value = meal.name;
    mainIngredientInput.value = meal.mainIngredient || '';
    memoInput.value = meal.memo || '';
    lastAteInput.value = meal.lastAte ? meal.lastAte.split('T')[0] || meal.lastAte : '';
    favoriteInput.checked = !!meal.favorite;
    
    // カテゴリーボタンを選択状態にする
    categoryButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === selectedCategory) {
            btn.classList.add('active');
        }
    });

    editingIndex = index;
    saveBtn.textContent = '更新';
    
    // フォームまでスクロール
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// 削除機能
window.deleteMeal = function(index) {
    if (confirm('このおかずを削除しますか？')) {
        const target = meals[index];
        meals.splice(index, 1);
        // サンプルデータ使用中でない場合のみスプレッドシートに削除を送信
        if (!useSampleData) {
            try {
                fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'delete', id: target?.id })
                }).catch(() => {});
            } catch (_) {}
        }
        renderMeals();
        resetForm();
    }
};

// 全削除機能
document.getElementById('clearBtn').addEventListener('click', () => {
    if (meals.length === 0) {
        alert('削除するおかずがありません');
        return;
    }
    if (confirm('すべてのおかずを削除しますか？この操作は取り消せません。')) {
        meals = [];
        // サンプルデータ使用中でない場合のみスプレッドシートに削除を送信
        if (!useSampleData) {
            try {
                fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'clear' })
                }).catch(() => {});
            } catch (_) {}
        }
        editingIndex = -1;
        resetForm();
        saveBtn.textContent = '保存';
        renderMeals();
    }
});

// 検索イベント
searchInput.addEventListener('input', () => {
    searchKeyword = searchInput.value.trim();
    renderMeals();
});

// カテゴリーフィルターチップ
filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterCategory = chip.dataset.filter;
        renderMeals();
    });
});

// 今日のおかず提案ボタン
suggestBtn.addEventListener('click', () => {
    const candidates = getFilteredMeals();
    if (candidates.length === 0) {
        alert('条件に合うおかずがありません。まずはメニューを登録してみましょう。');
        return;
    }
    const randomMeal = candidates[Math.floor(Math.random() * candidates.length)];
    const categoryClass = getCategoryClass(randomMeal.category);
    const high = getHighLevelCategory(randomMeal.category);

    suggestionArea.innerHTML = `
        <div class="suggestion-card">
            <div class="suggestion-label">TODAY'S RECOMMEND</div>
            <div class="suggestion-name">${escapeHtml(randomMeal.name)}</div>
            <div class="suggestion-category ${categoryClass}">${high}・${randomMeal.category}</div>
                ${randomMeal.mainIngredient ? `<div class="suggestion-ingredients"><strong>メイン食材:</strong> ${escapeHtml(randomMeal.mainIngredient)}</div>` : ''}
                ${randomMeal.memo ? `<div class="suggestion-ingredients">${escapeHtml(randomMeal.memo)}</div>` : ''}
        </div>
    `;
});

// タイムアウト付きfetch
function fetchWithTimeout(url, timeout = FETCH_TIMEOUT) {
    return Promise.race([
        fetch(url),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('タイムアウト')), timeout)
        )
    ]);
}

// スプレッドシートから取得
async function fetchMealsFromSheet() {
    isLoading = true;
    renderMeals(); // 読み込み中を表示
    
    try {
        const startTime = Date.now();
        const res = await fetchWithTimeout(API_URL, FETCH_TIMEOUT);
        
        // レスポンスチェック
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        const elapsedTime = Date.now() - startTime;
        
        // 5秒以上かかった場合はサンプルデータを使用
        if (elapsedTime >= FETCH_TIMEOUT) {
            throw new Error('読み込みがタイムアウトしました');
        }
        
        const rows = Array.isArray(data) ? data : (data.data || []);
        
        // データが空の場合はサンプルデータを維持
        if (rows.length === 0) {
            console.log('スプレッドシートにデータがありません。サンプルデータを継続使用します。');
            // mealsは既にサンプルデータなので変更不要
            useSampleData = true;
        } else {
            // スプレッドシートのデータで更新
            meals = rows.map(row => normalizeMeal(row)).filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            useSampleData = false;
        }
        
    } catch (e) {
        // エラー時もalert()を出さず、静かにサンプルデータを使用
        console.log('スプレッドシートからの読み込みに失敗しました。サンプルデータを表示します:', e.message);
        // mealsは既にサンプルデータなので変更不要
        useSampleData = true;
        // トーストも出さない（ユーザーにエラーを意識させない）
    } finally {
        isLoading = false;
        renderMeals();
    }
}

// スプレッドシートへ保存
async function saveMealToSheet(meal) {
    const payload = { action: 'upsert', ...meal };
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save');
    return res.json().catch(() => ({}));
}

// シートの行データを内部形式に整形
function normalizeMeal(row) {
    if (!row) return null;
    // 行が配列形式の場合: [A,B,C,D,E,F,G,H]
    if (Array.isArray(row)) {
        return {
            id: row[0] || `id-${Date.now()}`,
            createdAt: row[1] || '',
            category: row[2] || '',
            name: row[3] || '',
            mainIngredient: row[4] || '',
            memo: row[5] || '',
            favorite: row[6] === true || row[6] === 'TRUE' || row[6] === 'true' || row[6] === '1',
            lastAte: row[7] || ''
        };
    }
    // オブジェクト形式の場合
    return {
        id: row.id || row.ID || `id-${Date.now()}`,
        createdAt: row.createdAt || row['登録日時'] || '',
        category: row.category || row['カテゴリー'] || '',
        name: row.name || row['料理名'] || '',
        mainIngredient: row.mainIngredient || row['メイン食材'] || '',
        memo: row.memo || row['メモ'] || '',
        favorite: row.favorite === true || row.favorite === 'TRUE' || row.favorite === 'true' || row.favorite === '1' || row['お気に入り'] === 'TRUE' || row['お気に入り'] === true,
        lastAte: row.lastAte || row['最後に食べた日'] || ''
    };
}

// ページ読み込み時に初期表示とデータ読み込み
// DOMContentLoadedを待ってから実行（より安全）
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        renderMeals(); // まずサンプルデータを表示
        fetchMealsFromSheet(); // その後スプレッドシートから取得を試みる
    });
} else {
    // DOMが既に読み込まれている場合
    renderMeals(); // まずサンプルデータを表示
    fetchMealsFromSheet(); // その後スプレッドシートから取得を試みる
}
