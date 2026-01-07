// ==========================================
// 1. 基本設定（ここを自分のURLに書き換える）
// ==========================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyxAspX9Pd6s8vUUA_6s1fXDetYR76yRDKCucSu6CdBYyp76N5CItLFN7bZ9s7VXFpvUw/exec";

// ==========================================
// 2. データの読み込み処理
// ==========================================
async function loadMeals() {
    const mealList = document.getElementById('mealList');
    mealList.innerHTML = '<p class="loading">データを読み込み中...</p>';

    try {
        const response = await fetch(SCRIPT_URL);
        const meals = await response.json();
        displayMeals(meals);
    } catch (error) {
        console.error('Error:', error);
        mealList.innerHTML = '<p class="error">読み込みに失敗しました。URLを確認してください。</p>';
    }
}

// ==========================================
// 3. 画面への表示処理
// ==========================================
function displayMeals(meals) {
    const mealList = document.getElementById('mealList');
    mealList.innerHTML = '';

    if (meals.length === 0) {
        mealList.innerHTML = '<p class="no-data">データがありません</p>';
        return;
    }

    meals.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'meal-card';
        card.innerHTML = `
            <h3>${meal.name}</h3>
            <p><strong>メイン:</strong> ${meal.ingredient}</p>
            ${meal.memo ? `<p class="memo">${meal.memo}</p>` : ''}
            <span class="category-tag">${meal.category}</span>
        `;
        mealList.innerHTML += card.innerHTML; // シンプルに表示
    });
}

// ページを開いた時に実行
window.onload = loadMeals;