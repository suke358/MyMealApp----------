function displayMeals(meals) {
    const mealList = document.getElementById('mealList');
    mealList.innerHTML = ''; // 読み込み中の文字を消す

    if (!meals || meals.length === 0) {
        mealList.innerHTML = '<p class="no-data">献立データが見つかりませんでした。</p>';
        return;
    }

    meals.forEach(meal => {
        // カードの枠を作る
        const card = document.createElement('div');
        card.className = 'meal-card';

        // 中身の文字を作る（スプレッドシートの1行目の項目名とピッタリ合わせています）
        card.innerHTML = `
            <h3>${meal.料理名 || '名前なし'}</h3>
            <div class="meal-details">
                <p><strong>メイン:</strong> ${meal.メイン食材 || '-'}</p>
                <p class="memo">${meal["メモ(コツ)"] || ''}</p>
            </div>
            <span class="category-tag">${meal.カテゴリー || '未分類'}</span>
        `;
        
        // 画面に追加する
        mealList.appendChild(card);
    });
}

// スマホからスプレッドシートへ保存する魔法のコード
async function saveMeal() {
    const name = document.getElementById('mealName').value;
    const ingredient = document.getElementById('mealIngredient').value;
    const category = document.getElementById('mealCategory').value;

    if (!name) {
        alert("料理名を入れてね！");
        return;
    }

    const data = {
        料理名: name,
        メイン食材: ingredient,
        カテゴリー: category
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        alert("スプレッドシートに保存したよ！");
        // 入力欄を空にする
        document.getElementById('mealName').value = '';
        document.getElementById('mealIngredient').value = '';
        loadMeals(); // 一覧を再読み込みして最新にする
    } catch (error) {
        console.error('Save error:', error);
        alert("保存に失敗しちゃった...");
    }
}

async function saveMeal() {
    const name = document.getElementById('mealName').value;
    const ingredient = document.getElementById('mealIngredient').value;
    const category = document.getElementById('mealCategory').value;

    if (!name) { alert("料理名を入れてね！"); return; }

    // GASのコードに合わせて「日本語の項目名」で送る
    const data = {
        "料理名": name,
        "メイン食材": ingredient,
        "カテゴリー": category,
        "メモ": "スマホから登録"
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        alert("スプレッドシートに保存したよ！");
        document.getElementById('mealName').value = '';
        loadMeals(); 
    } catch (error) {
        alert("保存に失敗しました。URLを確認してください。");
    }
}