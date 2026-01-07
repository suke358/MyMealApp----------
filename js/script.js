// ==========================================
// 1. 基本設定（最新のURLに差し替え済み）
// ==========================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzS6EsnM7soDU7xW2yhtsy8xohEPfYLzWAExVGAikC5k5EH3YIdt3bXaD8tcrn5JiY7-Q/exec";

// ==========================================
// 2. グローバル変数
// ==========================================
let selectedCategory = '';
let allMeals = [];

// ==========================================
// 3. 初期化処理
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    // カテゴリーボタンのイベントリスナー
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedCategory = this.dataset.category;
        });
    });

    // 保存ボタンのイベントリスナー
    document.getElementById('saveBtn').addEventListener('click', saveMeal);

    // 検索機能
    document.getElementById('searchInput').addEventListener('input', filterMeals);

// フィルターボタン（チップ）をクリックした時の処理
document.querySelectorAll('.filter-chip').forEach(button => {
    button.addEventListener('click', () => {
        // アクティブな色の切り替え
        document.querySelectorAll('.filter-chip').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        const filterValue = button.getAttribute('data-filter');
        filterList(filterValue); // リストを絞り込む関数を呼ぶ
    });
});

function filterList(category) {
    const items = document.querySelectorAll('.meal-item'); // 各おかずの要素
    items.forEach(item => {
        // 各アイテムが持っているカテゴリーデータを確認
        const itemCategory = item.getAttribute('data-category'); 
        
        if (category === 'all' || itemCategory === category) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}
    // 全削除ボタン
    document.getElementById('clearBtn').addEventListener('click', clearAllMeals);

    // おすすめボタン
    document.getElementById('suggestBtn').addEventListener('click', suggestMeal);

    // データ読み込み
    loadMeals();
});

// ==========================================
// 4. データの読み込み処理
// ==========================================
async function loadMeals() {
    const mealList = document.getElementById('mealsList');
    if (!mealList) return;

    mealList.innerHTML = '<p class="loading">データを読み込み中...</p>';

    try {
        const response = await fetch(SCRIPT_URL);
        const meals = await response.json();
        allMeals = meals || [];
        displayMeals(allMeals);
    } catch (error) {
        console.error('Error:', error);
        mealList.innerHTML = '<p class="error">読み込みに失敗しました。</p>';
    }
}

// ==========================================
// 5. 画面への表示処理
// ==========================================
function displayMeals(meals) {
    const mealList = document.getElementById('mealsList');
    mealList.innerHTML = '';

    if (!meals || meals.length === 0) {
        mealList.innerHTML = '<p class="no-data">データがありません</p>';
        return;
    }

    meals.forEach(meal => {
        const item = document.createElement('div');
        item.className = 'meal-item';
        item.setAttribute('data-category', meal.カテゴリー || 'その他');
        const favoriteIcon = meal.お気に入り === 'はい' ? '⭐' : '';
        const lastAteText = meal['最後に食べた日'] ? `<small>最後に食べた日: ${meal['最後に食べた日']}</small>` : '';
        item.innerHTML = `
            <div class="meal-header">
                <h4 class="meal-name">${meal.料理名 || '名前なし'}</h4>
                <span class="favorite-icon">${favoriteIcon}</span>
            </div>
            <div class="meal-details">
                <p class="main-ingredient"><strong>メイン食材:</strong> ${meal.メイン食材 || '-'}</p>
                ${meal.メモ ? `<p class="memo">${meal.メモ}</p>` : ''}
                ${lastAteText ? `<p class="last-ate">${lastAteText}</p>` : ''}
            </div>
            <span class="category-tag">${meal.カテゴリー || '未分類'}</span>
        `;
        mealList.appendChild(item);
    });
}

// ==========================================
// 6. 検索・フィルター処理
// ==========================================
function filterMeals() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const activeFilter = document.querySelector('.filter-chip.active').dataset.filter;

    let filteredMeals = allMeals.filter(meal => {
        const matchesSearch = !searchTerm ||
            (meal.料理名 && meal.料理名.toLowerCase().includes(searchTerm)) ||
            (meal.メイン食材 && meal.メイン食材.toLowerCase().includes(searchTerm)) ||
            (meal.メモ && meal.メモ.toLowerCase().includes(searchTerm));

        const matchesFilter = activeFilter === 'all' ||
            (activeFilter === '肉' && ['牛', '豚', '鶏'].includes(meal.カテゴリー)) ||
            (activeFilter === '魚' && meal.カテゴリー === '魚') ||
            (activeFilter === '野菜' && meal.カテゴリー === '野菜') ||
            (activeFilter === 'その他' && meal.カテゴリー === 'その他');

        return matchesSearch && matchesFilter;
    });

    displayMeals(filteredMeals);
}

// ==========================================
// 7. おすすめ機能
// ==========================================
function suggestMeal() {
    const activeFilter = document.querySelector('.filter-chip.active').dataset.filter;
    let candidates = allMeals;

    if (activeFilter !== 'all') {
        candidates = allMeals.filter(meal => {
            return (activeFilter === '肉' && ['牛', '豚', '鶏'].includes(meal.カテゴリー)) ||
                   (activeFilter === '魚' && meal.カテゴリー === '魚') ||
                   (activeFilter === '野菜' && meal.カテゴリー === '野菜') ||
                   (activeFilter === 'その他' && meal.カテゴリー === 'その他');
        });
    }

    if (candidates.length === 0) {
        document.getElementById('suggestionArea').innerHTML = '<p>該当するおかずがありません。</p>';
        return;
    }

    const randomMeal = candidates[Math.floor(Math.random() * candidates.length)];
    document.getElementById('suggestionArea').innerHTML = `
        <div class="suggestion-result">
            <h4>🎲 今日のおすすめ: ${randomMeal.料理名}</h4>
            <p><strong>メイン食材:</strong> ${randomMeal.メイン食材 || '-'}</p>
            ${randomMeal.メモ ? `<p><strong>メモ:</strong> ${randomMeal.メモ}</p>` : ''}
        </div>
    `;
}

// ==========================================
// 8. スプレッドシートへの保存処理（最新のfetch仕様に修正）
// ==========================================
async function saveMeal() {
    const name = document.getElementById('mealName').value.trim();
    const mainIngredient = document.getElementById('mainIngredient').value.trim();
    const memo = document.getElementById('memo').value.trim();
    const lastAte = document.getElementById('lastAte').value;
    const favorite = document.getElementById('favorite').checked;

    if (!name) {
        alert("食事名を入力してください！");
        return;
    }

    if (!selectedCategory) {
        alert("カテゴリーを選択してください！");
        return;
    }

    const data = {
        "料理名": name,
        "メイン食材": mainIngredient,
        "カテゴリー": selectedCategory,
        "メモ": memo,
        "最後に食べた日": lastAte,
        "お気に入り": favorite ? "はい" : "いいえ"
    };

    try {
        // --- ここから差し替え ---//
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // これがセキュリティエラーを防ぐ重要ポイント！
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        // no-corsモードは「成功したか」がブラウザで判定できないため、
        // 実行されたら「保存しました」とみなして進むのが一番スムーズです
        alert("送信しました！スプレッドシートを確認してください");

        // フォームをリセット
        document.getElementById('mealName').value = '';
        document.getElementById('mainIngredient').value = '';
        document.getElementById('memo').value = '';
        document.getElementById('lastAte').value = '';
        document.getElementById('favorite').checked = false;
        document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
        selectedCategory = '';
        
        // リスト更新（エラーが出る場合は一旦コメントアウトしてもOK）
        if (typeof loadMeals === 'function') loadMeals(); 
        // --- ここまで差し替え ---

    } catch (error) {
                console.error('Save error:', error);
        alert("保存に失敗しました。");
    }
}

// ==========================================
// 9. 全削除処理
// ==========================================
async function clearAllMeals() {
    if (!confirm('本当に全てのデータを削除しますか？')) return;

    try {
        const response = await fetch(SCRIPT_URL + '?action=clear', {
            method: 'POST'
        });

        if (response.ok) {
            alert('全てのデータを削除しました。');
            loadMeals();
        } else {
            alert('削除に失敗しました。');
        }
    } catch (error) {
        console.error('Clear error:', error);
        alert('削除に失敗しました。');
    }
}