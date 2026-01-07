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