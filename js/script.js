// ==========================================
// 1. 基本設定（最新のURLに差し替え済み）
// ==========================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxy6GcwtOIfHJFwDEVpi3Q-bahGQOZVYC2kR5JTgrlLNpEKUB_d2MIQjXcksGOJFjVIpg/exec";

// ==========================================
// 2. データの読み込み処理
// ==========================================
async function loadMeals() {
    const mealList = document.getElementById('mealList');
    if (!mealList) return;
    
    mealList.innerHTML = '<p class="loading">データを読み込み中...</p>';

    try {
        const response = await fetch(SCRIPT_URL);
        const meals = await response.json();
        displayMeals(meals);
    } catch (error) {
        console.error('Error:', error);
        mealList.innerHTML = '<p class="error">読み込みに失敗しました。</p>';
    }
}

// ==========================================
// 3. 画面への表示処理
// ==========================================
function displayMeals(meals) {
    const mealList = document.getElementById('mealList');
    mealList.innerHTML = '';

    if (!meals || meals.length === 0) {
        mealList.innerHTML = '<p class="no-data">データがありません</p>';
        return;
    }

    meals.forEach(meal => {
        const card = document.createElement('div');
        card.className = 'meal-card';
        card.innerHTML = `
            <h3>${meal.料理名 || '名前なし'}</h3>
            <p><strong>メイン:</strong> ${meal.メイン食材 || '-'}</p>
            ${meal["メモ(コツ)"] ? `<p class="memo">${meal["メモ(コツ)"]}</p>` : ''}
            <span class="category-tag">${meal.カテゴリー || '未分類'}</span>
        `;
        mealList.appendChild(card);
    });
}

// ==========================================
// 4. スプレッドシートへの保存処理
// ==========================================
async function saveMeal() {
    const name = document.getElementById('mealName').value;
    const ingredient = document.getElementById('mealIngredient').value;
    const category = document.getElementById('mealCategory').value;

    if (!name) { 
        alert("料理名を入れてね！"); 
        return; 
    }

    const data = {
        "料理名": name,
        "メイン食材": ingredient,
        "カテゴリー": category,
        "メモ": "スマホから登録"
    };

    try {
        // 保存中はボタンを連打できないように通知
        console.log("送信中...");
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // GASへのPOSTでエラーが出るのを防ぐおまじない
            body: JSON.stringify(data)
        });

        // no-corsモードの場合、成功・失敗の判定ができないため、送信したら成功とみなす
        alert("スプレッドシートに送信しました！");
        document.getElementById('mealName').value = '';
        document.getElementById('mealIngredient').value = '';
        setTimeout(loadMeals, 1000); // 1秒後にリストを更新
        
    } catch (error) {
        console.error('Save error:', error);
        alert("保存に失敗しました。");
    }
}

// ページを開いた時に実行
window.onload = loadMeals;