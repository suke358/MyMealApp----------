// ==========================================
// 1. 基本設定（最新のURLに差し替え済み）
// ==========================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzS6EsnM7soDU7xW2yhtsy8xohEPfYLzWAExVGAikC5k5EH3YIdt3bXaD8tcrn5JiY7-Q/exec";

// ==========================================
// 2. グローバル変数
// ==========================================
let selectedCategory = '';
let selectedGenre = '';
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

    // ジャンルボタンのイベントリスナー
    document.querySelectorAll('.genre-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedGenre = this.dataset.genre;
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
// ==========================================
// 4. データの読み込み処理
// ==========================================
function loadMeals() {
    const mealList = document.getElementById('mealsList');
    if (!mealList) return;

    // localStorage から読み込み
    allMeals = JSON.parse(localStorage.getItem('meals')) || [];
    displayMeals(allMeals);
}

// ==========================================
// 5. 画面への表示処理
// ==========================================
function displayMeals(meals) {
    const mealList = document.getElementById('mealsList');
    if (!mealList) return;
    mealList.innerHTML = '';

    if (!meals || meals.length === 0) {
        mealList.innerHTML = '<p class="no-data">データがありません</p>';
        return;
    }

    meals.forEach((meal, index) => {
        const item = document.createElement('div');
        item.className = 'meal-item';
        
        // カテゴリーの絞り込み用に属性をセット
        const category = meal.カテゴリー || meal.category || 'その他';
        item.setAttribute('data-category', category);

        // お気に入りや日付の表示判定
        const favoriteIcon = (meal.お気に入り === 'はい' || meal.favorite) ? '⭐' : '';
        const lastAteValue = meal['最後に食べた日'] || meal.lastAte;
        const lastAteText = lastAteValue ? `<small>最後に食べた日: ${lastAteValue}</small>` : '';
        
        // 料理名などのキー名がズレていても表示されるように調整
        const name = meal.料理名 || meal.name || '名前なし';
        const ingredient = meal.メイン食材 || meal.mainIngredient || '-';
        const memo = meal.メモ || meal.memo || '';
        const genre = meal.ジャンル || meal.genre || '';
        const genreClass = genre === '和食' ? 'japanese' : genre === '洋食' ? 'western' : genre === '中華' ? 'chinese' : 'other';

        item.innerHTML = `
            ${genre ? `<span class="genre-tag ${genreClass}">${genre}</span>` : ''}
            <div class="meal-header" style="display:flex; justify-content:space-between; align-items:center;">
                <h4 class="meal-name" style="margin:0;">${name} ${favoriteIcon}</h4>
                <button class="delete-btn" onclick="deleteMeal(${index})" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">🗑️</button>
            </div>
            <div class="meal-details">
                <p class="main-ingredient"><strong>メイン食材:</strong> ${ingredient}</p>
                ${memo ? `<p class="memo">${memo}</p>` : ''}
                ${lastAteText ? `<p class="last-ate">${lastAteText}</p>` : ''}
            </div>
            <span class="category-tag">${category}</span>
        `;
        mealList.appendChild(item);
    });
}

// 新しく追加：個別削除を実行する関数
function deleteMeal(index) {
    if (confirm("このメニューを削除してもよろしいですか？")) {
        // 全データ（allMeals）から1つ削除
        allMeals.splice(index, 1);
        // 保存し直し
        localStorage.setItem('meals', JSON.stringify(allMeals));
        // 再表示
        displayMeals(allMeals);
    }
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
            (meal.メモ && meal.メモ.toLowerCase().includes(searchTerm)) ||
            (meal.ジャンル && meal.ジャンル.toLowerCase().includes(searchTerm));

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
// 8. 保存処理
// ==========================================
function saveMeal() {
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

    if (!selectedGenre) {
        alert("ジャンルを選択してください！");
        return;
    }

    const data = {
        "料理名": name,
        "メイン食材": mainIngredient,
        "カテゴリー": selectedCategory,
        "ジャンル": selectedGenre,
        "メモ": memo,
        "最後に食べた日": lastAte,
        "お気に入り": favorite ? "はい" : "いいえ"
    };

    allMeals.push(data);
    localStorage.setItem('meals', JSON.stringify(allMeals));

    alert("保存しました！");

    // フォームをリセット
    document.getElementById('mealName').value = '';
    document.getElementById('mainIngredient').value = '';
    document.getElementById('memo').value = '';
    document.getElementById('lastAte').value = '';
    document.getElementById('favorite').checked = false;
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
    selectedCategory = '';
    document.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
    selectedGenre = '';
    
    // リスト更新
    loadMeals();
}

// ==========================================
// 9. 全削除処理
// ==========================================
function clearAllMeals() {
    if (!confirm('本当に全てのデータを削除しますか？')) return;

    localStorage.removeItem('meals');
    allMeals = [];
    loadMeals();
}

// ==========================================
// 10. 削除処理
// ==========================================
function deleteMeal(index) {
    if (!confirm('このおかずを削除しますか？')) return;

    allMeals.splice(index, 1);
    localStorage.setItem('meals', JSON.stringify(allMeals));
    loadMeals();
}