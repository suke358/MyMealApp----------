document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // Supabase 設定
    // ==========================================
    const supabaseUrl = 'https://jkgpemdagmysnnvucnym.supabase.co';
    const supabaseKey = 'sb_publishable_WTEMEoxDW1IH0V40osFPJQ_DN9D_vFt';
    const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

    // ==========================================
    // グローバル変数
    // ==========================================
    let selectedCategory = '';
    let selectedGenre = '';
    let editingIndex = null;
    let allMeals = [];

    // ==========================================
    // 初期化処理
    // ==========================================
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

    // おすすめボタン
    document.getElementById('suggestBtn').addEventListener('click', suggestMeal);

    // データ取得
    fetchMeals();

    // ==========================================
// データ取得
    // ==========================================
    async function fetchMeals() {
        const { data, error } = await supabaseClient.from('meals').select('*');
        
        if (error) {
            alert('データの読み込みに失敗しました: ' + error.message);
            return;
        }

        // データの変換（もしSupabaseにそのまま保存しているならシンプルになります）
        allMeals = data.map(item => {
            // もしnameカラムにJSON文字列が入っている場合はそのまま、
            // そうでない場合は項目の組み合わせを作ります
            try {
                return { id: item.id, ...JSON.parse(item.name) };
            } catch (e) {
                return { id: item.id, name: item.name }; // JSONじゃない場合
            }
        });

        displayMeals(allMeals);

        // ✅ ここをコメントアウト（// をつける）すれば、立ち上げ時のアラートが消えます！
        // alert('データを読み込みました！'); 
    }
    
    // ==========================================
    // 画面への表示処理
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
    // 検索・フィルター処理
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
                (activeFilter === '牛' && meal.カテゴリー === '牛') ||
                (activeFilter === '豚' && meal.カテゴリー === '豚') ||
                (activeFilter === '鶏' && meal.カテゴリー === '鶏') ||
                (activeFilter === '魚' && meal.カテゴリー === '海鮮') ||
                (activeFilter === '野菜' && meal.カテゴリー === '野菜') ||
                (activeFilter === 'その他' && meal.カテゴリー === 'その他');

            return matchesSearch && matchesFilter;
        });

        displayMeals(filteredMeals);
    }

    // ==========================================
    // おすすめ機能
    // ==========================================
    function suggestMeal() {
        const activeFilter = document.querySelector('.filter-chip.active').dataset.filter;
        let candidates = allMeals;

        if (activeFilter !== 'all') {
            candidates = allMeals.filter(meal => {
                return (activeFilter === '牛' && meal.カテゴリー === '牛') ||
                       (activeFilter === '豚' && meal.カテゴリー === '豚') ||
                       (activeFilter === '鶏' && meal.カテゴリー === '鶏') ||
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
    // 保存処理
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
            const { error } = await supabaseClient.from('meals').update({ name: JSON.stringify(data) }).eq('id', allMeals[editingIndex].id);
            if (error) {
                alert('更新に失敗しました: ' + error.message);
                return;
            }
            allMeals[editingIndex] = { id: allMeals[editingIndex].id, ...data };
            alert("修正しました！");
        } else {
            const { data: insertData, error } = await supabaseClient.from('meals').insert({ name: JSON.stringify(data) }).select();
            if (error) {
                alert('保存に失敗しました: ' + error.message);
                return;
            }
            allMeals.push({ id: insertData[0].id, ...data });
            alert("保存しました！");
        }

        displayMeals(allMeals);

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
    }

    // ==========================================
    // 削除処理
    // ==========================================
    async function deleteMeal(index) {
        if (!confirm('このおかずを削除しますか？')) return;

        const { error } = await supabaseClient.from('meals').delete().eq('id', allMeals[index].id);
        if (error) {
            alert('削除に失敗しました: ' + error.message);
            return;
        }

        allMeals.splice(index, 1);
        displayMeals(allMeals);
        alert('削除しました！');
    }
});
