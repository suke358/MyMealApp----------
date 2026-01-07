// ==========================================
// 1. 基本設定（最新のURLに差し替え済み）
// ==========================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzS6EsnM7soDU7xW2yhtsy8xohEPfYLzWAExVGAikC5k5EH3YIdt3bXaD8tcrn5JiY7-Q/exec";

// ==========================================
// 2. グローバル変数
// ==========================================
let selectedCategory = '';
let selectedGenre = '';
let editingIndex = null;
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

    // エクスポート・インポート
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importFile').addEventListener('change', importData);
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
    
    // 初期データがない場合のみ追加
    if (allMeals.length === 0) {
        initDefaultMeals();
    }
    
    displayMeals(allMeals);
}

// ==========================================
// 初期データの設定
// ==========================================
function initDefaultMeals() {
    const defaultMeals = [
        // 和食 (8個)
        {"料理名": "生姜焼き", "メイン食材": "豚肉", "カテゴリー": "豚", "ジャンル": "和食", "メモ": "玉ねぎと一緒に炒める", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "鮭の塩焼き", "メイン食材": "鮭", "カテゴリー": "海鮮", "ジャンル": "和食", "メモ": "皮がパリッとなるように焼く", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "肉じゃが", "メイン食材": "牛肉", "カテゴリー": "牛", "ジャンル": "和食", "メモ": "じゃがいもと玉ねぎを入れる", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "味噌汁", "メイン食材": "豆腐", "カテゴリー": "野菜", "ジャンル": "和食", "メモ": "わかめを加えると良い", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "鶏の照り焼き", "メイン食材": "鶏むね肉", "カテゴリー": "鶏", "ジャンル": "和食", "メモ": "醤油とみりんで味付け", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "豚汁", "メイン食材": "豚肉", "カテゴリー": "豚", "ジャンル": "和食", "メモ": "ごぼうと人参を入れる", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "納豆ご飯", "メイン食材": "納豆", "カテゴリー": "その他", "ジャンル": "和食", "メモ": "薬味をたっぷり", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "野菜炒め", "メイン食材": "キャベツ", "カテゴリー": "野菜", "ジャンル": "和食", "メモ": "にんじんとピーマンも", "最後に食べた日": "", "お気に入り": "はい"},
        
        // 洋食 (7個)
        {"料理名": "ハンバーグ", "メイン食材": "牛肉", "カテゴリー": "牛", "ジャンル": "洋食", "メモ": "玉ねぎをみじん切りに", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "魚のムニエル", "メイン食材": "白身魚", "カテゴリー": "海鮮", "ジャンル": "洋食", "メモ": "バターで焼く", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "オムライス", "メイン食材": "鶏肉", "カテゴリー": "鶏", "ジャンル": "洋食", "メモ": "ケチャップライスを包む", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "ビーフシチュー", "メイン食材": "牛肉", "カテゴリー": "牛", "ジャンル": "洋食", "メモ": "赤ワインで煮込む", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "ポークチャップ", "メイン食材": "豚肉", "カテゴリー": "豚", "ジャンル": "洋食", "メモ": "パン粉を付けて揚げる", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "野菜グラタン", "メイン食材": "ブロッコリ", "カテゴリー": "野菜", "ジャンル": "洋食", "メモ": "チーズをたっぷり", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "スパゲッティボロネーゼ", "メイン食材": "牛肉", "カテゴリー": "牛", "ジャンル": "洋食", "メモ": "トマトソース", "最後に食べた日": "", "お気に入り": "はい"},
        
        // 中華 (8個)
        {"料理名": "回鍋肉", "メイン食材": "豚肉", "カテゴリー": "豚", "ジャンル": "中華", "メモ": "キャベツと一緒に炒める", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "チンジャオロース", "メイン食材": "豚肉", "カテゴリー": "豚", "ジャンル": "中華", "メモ": "ピーマンと玉ねぎ", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "八宝菜", "メイン食材": "野菜ミックス", "カテゴリー": "野菜", "ジャンル": "中華", "メモ": "色々な野菜を入れる", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "酢豚", "メイン食材": "豚肉", "カテゴリー": "豚", "ジャンル": "中華", "メモ": "甘酢あん", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "魚香茄子", "メイン食材": "茄子", "カテゴリー": "野菜", "ジャンル": "中華", "メモ": "ひき肉を入れる", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "春巻き", "メイン食材": "野菜", "カテゴリー": "野菜", "ジャンル": "中華", "メモ": "皮に包んで揚げる", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "担々麺", "メイン食材": "豚肉", "カテゴリー": "豚", "ジャンル": "中華", "メモ": "胡麻ペースト", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "エビチリ", "メイン食材": "エビ", "カテゴリー": "海鮮", "ジャンル": "中華", "メモ": "唐辛子で辛く", "最後に食べた日": "", "お気に入り": "いいえ"},
        
        // その他 (7個)
        {"料理名": "うどん", "メイン食材": "うどん", "カテゴリー": "その他", "ジャンル": "麺類", "メモ": "出汁で煮る", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "パスタ", "メイン食材": "パスタ", "カテゴリー": "その他", "ジャンル": "麺類", "メモ": "オリーブオイルとニンニク", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "カレー", "メイン食材": "鶏肉", "カテゴリー": "鶏", "ジャンル": "その他", "メモ": "スパイスを効かせる", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "サンドイッチ", "メイン食材": "ハム", "カテゴリー": "豚", "ジャンル": "その他", "メモ": "野菜を挟む", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "サラダ", "メイン食材": "レタス", "カテゴリー": "野菜", "ジャンル": "その他", "メモ": "ドレッシングをかける", "最後に食べた日": "", "お気に入り": "はい"},
        {"料理名": "オートミール", "メイン食材": "オートミール", "カテゴリー": "その他", "ジャンル": "麺類", "メモ": "牛乳で煮る", "最後に食べた日": "", "お気に入り": "いいえ"},
        {"料理名": "焼きそば", "メイン食材": "豚肉", "カテゴリー": "豚", "ジャンル": "麺類", "メモ": "ソースで味付け", "最後に食べた日": "", "お気に入り": "はい"}
    ];
    
    allMeals.push(...defaultMeals);
    localStorage.setItem('meals', JSON.stringify(allMeals));
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
        const category = (meal.カテゴリー === '魚' ? '海鮮' : meal.カテゴリー) || meal.category || 'その他';
        item.setAttribute('data-category', category);

        // お気に入りや日付の表示判定
        const favoriteIcon = (meal.お気に入り === 'はい' || meal.favorite) ? '⭐' : '';
        const lastAteValue = meal['最後に食べた日'] || meal.lastAte;
        const lastAteText = lastAteValue ? `<small>最後に食べた日: ${lastAteValue}</small>` : '';
        
        // 料理名などのキー名がズレていても表示されるように調整
        const name = meal.料理名 || meal.name || '名前なし';
        const ingredient = meal.メイン食材 || meal.mainIngredient || '-';
        const memo = meal.メモ || meal.memo || '';
        const genre = (meal.ジャンル === 'その他' ? '麺類' : meal.ジャンル) || meal.genre || '';
        const genreClass = genre === '和食' ? 'japanese' : genre === '洋食' ? 'western' : genre === '中華' ? 'chinese' : genre === '麺類' ? 'noodle' : 'other';

        item.innerHTML = `
            <div class="tag-container">
                ${genre ? `<span class="genre-tag ${genreClass}">${genre}</span>` : ''}
                <span class="category-tag">${category}</span>
            </div>
            <div class="meal-header" style="display:flex; justify-content:space-between; align-items:center;">
                <h4 class="meal-name" style="margin:0;">${name} ${favoriteIcon}</h4>
                <div>
                    <button class="edit-btn" onclick="editMeal(${index})" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">✏️</button>
                    <button class="delete-btn" onclick="deleteMeal(${index})" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">🗑️</button>
                </div>
            </div>
            <div class="meal-details">
                <p class="main-ingredient"><strong>メイン食材:</strong> ${ingredient}</p>
                ${memo ? `<p class="memo">${memo}</p>` : ''}
                ${lastAteText ? `<p class="last-ate">${lastAteText}</p>` : ''}
            </div>
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

// 新しく追加：編集を実行する関数
function editMeal(index) {
    const meal = allMeals[index];
    
    // フォームに値をセット
    document.getElementById('mealName').value = meal.料理名 || '';
    document.getElementById('mainIngredient').value = meal.メイン食材 || '';
    
    // カテゴリーボタンの選択状態をリセットし、該当するものをアクティブに
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === meal.カテゴリー) {
            btn.classList.add('active');
        }
    });
    selectedCategory = meal.カテゴリー || '';
    
    // ジャンルボタンの選択状態をリセットし、該当するものをアクティブに
    document.querySelectorAll('.genre-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.genre === meal.ジャンル) {
            btn.classList.add('active');
        }
    });
    selectedGenre = meal.ジャンル || '';
    
    document.getElementById('memo').value = meal.メモ || '';
    document.getElementById('lastAte').value = meal['最後に食べた日'] || '';
    document.getElementById('favorite').checked = meal.お気に入り === 'はい';
    
    // 編集モードに設定
    editingIndex = index;
    
    // 画面の最上部までスクロール
    window.scrollTo(0, 0);
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
            (activeFilter === '魚' && meal.カテゴリー === '海鮮') ||
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
                   (activeFilter === '魚' && meal.カテゴリー === '海鮮') ||
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

    // 新規登録の場合のみ重複チェック
    if (editingIndex === null) {
        const normalizedName = name.toLowerCase().trim();
        const isDuplicate = allMeals.some(meal => meal.料理名 && meal.料理名.toLowerCase().trim() === normalizedName);
        if (isDuplicate) {
            const confirmAdd = confirm(`『${name}』はすでに登録されています。このまま追加しますか？`);
            if (!confirmAdd) return;
        }
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

    if (editingIndex !== null) {
        allMeals[editingIndex] = data;
    } else {
        allMeals.push(data);
    }
    localStorage.setItem('meals', JSON.stringify(allMeals));

    alert(editingIndex !== null ? "修正しました！" : "保存しました！");

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
    editingIndex = null;
    
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

// ==========================================
// 11. データエクスポート
// ==========================================
function exportData() {
    const dataStr = JSON.stringify(allMeals, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'meals.json';
    a.click();
    URL.revokeObjectURL(url);
}

// ==========================================
// 12. データインポート
// ==========================================
function importData(event) {
    alert("ボタンは押されました。ファイル読み込みを開始します。");
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        if (!content || content.trim() === '') {
            alert('ファイルが空です。');
            return;
        }
        try {
            const importedMeals = JSON.parse(content);
            if (confirm('現在のデータを上書きしますか？')) {
                allMeals = importedMeals;
                localStorage.setItem('allMeals', JSON.stringify(allMeals));
                alert("同期に成功しました！");
                location.reload();
            }
        } catch (error) {
            alert('ファイルの形式がJSONではありません。エラー: ' + error.message);
        }
    };
    reader.onerror = function() {
        alert('ファイルの読み込みに失敗しました。ファイルが正しく選択されているか確認してください。');
    };
    reader.readAsText(file);
}