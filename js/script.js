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
    let editingIndex = null;
    let editingId = null; // 編集対象のSupabase ID
    let allMeals = [];

    // ==========================================
    // 初期化処理
    // ==========================================
    // 保存ボタンのイベントリスナー
    const saveBtn = document.getElementById('saveButton');
    if (!saveBtn) {
        console.error('❌ 保存ボタン（id="saveButton"）が見つかりません');
    } else {
        console.log('✅ 保存ボタンが見つかりました:', saveBtn);
        // スマホの「タップ」とPCの「クリック」両方で反応するようにします
        saveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔵 保存ボタンがクリックされました');
            saveMeal();
        });
        console.log('✅ 保存ボタンのイベントリスナーが設定されました');
    }

    // 検索機能
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            console.log('🔍 検索入力が変更されました:', e.target.value);
            filterMeals();
        });
        console.log('✅ 検索入力欄のイベントリスナーが設定されました');
    } else {
        console.error('❌ 検索入力欄（id="searchInput"）が見つかりません');
    }

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
        const items = document.querySelectorAll('.meal-item');
        items.forEach(item => {
            const itemCategory = item.getAttribute('data-category'); 
            item.style.display = (category === 'all' || itemCategory === category) ? 'block' : 'none';
        });
    }

    // おすすめボタン
    const suggestBtn = document.getElementById('suggestBtn');
    if (suggestBtn) {
        suggestBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🎲 おすすめボタンがクリックされました');
            suggestMeal();
        });
    } else {
        console.error('❌ おすすめボタン（id="suggestBtn"）が見つかりません');
    }

    // 編集・削除ボタンのイベント委譲（動的に生成されるボタンに対応）
    const mealList = document.getElementById('mealsList');
    if (mealList) {
        mealList.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('edit-btn')) {
                // 画面のスクロールを完全に防ぐ
                e.preventDefault();
                e.stopPropagation();
                
                const index = parseInt(target.getAttribute('data-index'));
                const mealId = target.getAttribute('data-id');
                console.log(`✏️ 編集ボタンがクリックされました`);
                console.log(`✏️ 配列インデックス: ${index}`);
                console.log(`✏️ データID: ${mealId} (型: ${typeof mealId})`);
                
                // 編集処理を実行
                editMeal(index);
                
                // 追加のスクロール防止（念のため）
                return false;
            } else if (target.classList.contains('delete-btn')) {
                e.preventDefault();
                e.stopPropagation();
                // Supabaseのidを取得（data-id属性から）
                const mealId = target.getAttribute('data-id');
                const index = parseInt(target.getAttribute('data-index'));
                
                console.log(`🗑️ 削除ボタンがクリックされました`);
                console.log(`🗑️ 送信しようとしているID: ${mealId} (型: ${typeof mealId})`);
                console.log(`🗑️ 配列インデックス: ${index}`);
                
                if (!mealId) {
                    console.error('❌ 削除ボタンにIDが設定されていません');
                    alert('削除するデータのIDが見つかりません');
                    return;
                }
                
                deleteMeal(mealId, index);
            }
        });
        console.log('✅ 編集・削除ボタンのイベント委譲が設定されました');
    } else {
        console.error('❌ mealsList要素が見つかりません');
    }

    // ==========================================
    // 4. データ取得の開始（ここが重要！）
    // ==========================================
    fetchMeals();

    // ==========================================
    // 内部関数（この中に入れます）
    // ==========================================

    // 日付フォーマット関数: DBから取得した日付を「2024/01/10 12:30」形式に変換
    function formatDateTime(dateString) {
        if (!dateString) return '';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            
            return `${year}/${month}/${day} ${hours}:${minutes}`;
        } catch (e) {
            console.error('❌ 日付フォーマットエラー:', e);
            return '';
        }
    }

    async function fetchMeals() {
        try {
            console.log('🔄 データベースからデータを取得中...');
            // すべての列を取得（id列、created_at列、updated_at列、last_eaten_at列を含む）
            // last_eaten_atで最新順にソート
            const { data, error } = await supabaseClient
                .from('meals')
                .select('*')
                .order('last_eaten_at', { ascending: false }); // last_eaten_atで降順ソート（最新が上）
            
            if (error) {
                console.error('❌ Supabaseからのデータ取得エラー:', error);
                throw error;
            }

            console.log(`📊 取得したデータ件数: ${data ? data.length : 0}件`);

            // updated_atとcreated_atが取得できているか確認（デバッグ用）
            const itemsWithoutUpdatedAt = data ? data.filter(item => !item.updated_at) : [];
            const itemsWithoutCreatedAt = data ? data.filter(item => !item.created_at) : [];
            if (itemsWithoutUpdatedAt.length > 0) {
                console.warn(`⚠️ updated_atが取得できていないデータが${itemsWithoutUpdatedAt.length}件あります`);
            }
            if (itemsWithoutCreatedAt.length > 0) {
                console.warn(`⚠️ created_atが取得できていないデータが${itemsWithoutCreatedAt.length}件あります`);
            }

            // Supabaseのデータをアプリ用形式に変換
            allMeals = data.map((item, idx) => {
                // IDが確実に取得できているか確認
                if (!item.id) {
                    console.error(`❌ データ[${idx}]にIDが存在しません:`, item);
                }
                
                // created_atが取得できているか確認（デバッグ用）
                if (!item.created_at) {
                    console.warn(`⚠️ データ[${idx}]にcreated_atが存在しません:`, item);
                }
                
                try {
                    // もしnameがJSON形式なら展開、そうでなければそのまま
                    const parsedData = { 
                        id: item.id, 
                        created_at: item.created_at || null, // created_atを保持（nullの場合はnull）
                        updated_at: item.updated_at || null, // updated_atを保持（nullの場合はnull）
                        last_eaten_at: item.last_eaten_at || null, // last_eaten_atを保持（nullの場合はnull）
                        ...JSON.parse(item.name) 
                    };
                    
                    // 表示用の日付を決定: last_eaten_atを優先、なければupdated_at、それもなければcreated_atを使用
                    const dateToDisplay = parsedData.last_eaten_at || parsedData.updated_at || parsedData.created_at;
                    const dateType = parsedData.last_eaten_at ? 'last_eaten_at' : (parsedData.updated_at ? 'updated_at' : 'created_at');
                    
                    // 日付を日本形式に変換（toLocaleDateString('ja-JP')を使用）
                    if (dateToDisplay) {
                        try {
                            parsedData.formattedDate = new Date(dateToDisplay).toLocaleDateString('ja-JP');
                            parsedData.displayDateType = dateType; // 表示に使用した日付の種類を記録
                            if (idx < 3) {
                                console.log(`📅 データ[${idx}] 日付変換 (${dateType}): ${dateToDisplay} → ${parsedData.formattedDate}`);
                            }
                        } catch (e) {
                            console.error(`❌ 日付変換エラー [${idx}]:`, e);
                            parsedData.formattedDate = '';
                            parsedData.displayDateType = null;
                        }
                    } else {
                        parsedData.formattedDate = '';
                        parsedData.displayDateType = null;
                        console.warn(`⚠️ データ[${idx}]にlast_eaten_atもupdated_atもcreated_atも存在しません。ID: ${parsedData.id}, 料理名: ${parsedData.料理名 || parsedData.name || 'なし'}`);
                    }
                    
                    // デバッグログ（最初の3件のみ）
                    if (idx < 3) {
                        console.log(`📝 データ[${idx}]: ID=${parsedData.id}, 日付=${parsedData.formattedDate || 'なし'}, 料理名=${parsedData.料理名 || parsedData.name || 'なし'}`);
                    }
                    return parsedData;
                } catch (e) {
                    console.error(`❌ データ[${idx}]のパースエラー:`, e);
                    const fallbackData = { 
                        id: item.id, 
                        created_at: item.created_at || null,
                        updated_at: item.updated_at || null,
                        last_eaten_at: item.last_eaten_at || null,
                        name: item.name, 
                        category: item.category 
                    };
                    
                    // last_eaten_at、updated_at、created_atが取得できているか確認（デバッグ用）
                    if (!fallbackData.last_eaten_at && !fallbackData.updated_at && !fallbackData.created_at) {
                        console.warn(`⚠️ データ[${idx}]（フォールバック）にlast_eaten_atもupdated_atもcreated_atも存在しません。ID: ${fallbackData.id}`);
                    }
                    
                    // 表示用の日付を決定: last_eaten_atを優先、なければupdated_at、それもなければcreated_atを使用
                    const dateToDisplay = fallbackData.last_eaten_at || fallbackData.updated_at || fallbackData.created_at;
                    const dateType = fallbackData.last_eaten_at ? 'last_eaten_at' : (fallbackData.updated_at ? 'updated_at' : 'created_at');
                    
                    // 日付を日本形式に変換（toLocaleDateString('ja-JP')を使用）
                    if (dateToDisplay) {
                        try {
                            fallbackData.formattedDate = new Date(dateToDisplay).toLocaleDateString('ja-JP');
                            fallbackData.displayDateType = dateType; // 表示に使用した日付の種類を記録
                            if (idx < 3) {
                                console.log(`📅 データ[${idx}] 日付変換（フォールバック）(${dateType}): ${dateToDisplay} → ${fallbackData.formattedDate}`);
                            }
                        } catch (e) {
                            console.error(`❌ 日付変換エラー [${idx}]（フォールバック）:`, e);
                            fallbackData.formattedDate = '';
                            fallbackData.displayDateType = null;
                        }
                    } else {
                        fallbackData.formattedDate = '';
                        fallbackData.displayDateType = null;
                        console.warn(`⚠️ データ[${idx}]（フォールバック）にlast_eaten_atもupdated_atもcreated_atも存在しません`);
                    }
                    
                    // デバッグログ（最初の3件のみ）
                    if (idx < 3) {
                        console.log(`📝 データ[${idx}]: ID=${fallbackData.id}, 日付=${fallbackData.formattedDate || 'なし'}, name=${fallbackData.name || 'なし'}`);
                    }
                    return fallbackData;
                }
            });

            // すべてのデータのIDを確認
            const idsWithoutId = allMeals.filter(meal => !meal.id);
            if (idsWithoutId.length > 0) {
                console.error(`❌ IDが存在しないデータが${idsWithoutId.length}件あります`);
            }
            
            // すべてのデータのlast_eaten_at、updated_at、created_atを確認（デバッグ用）
            const mealsWithoutDate = allMeals.filter(meal => !meal.last_eaten_at && !meal.updated_at && !meal.created_at);
            if (mealsWithoutDate.length > 0) {
                console.warn(`⚠️ last_eaten_atもupdated_atもcreated_atも存在しないデータが${mealsWithoutDate.length}件あります`);
                console.warn('⚠️ 日付が存在しないデータのID:', mealsWithoutDate.map(m => m.id));
            }

            // 並べ替え: last_eaten_atを優先、なければupdated_at、それもなければcreated_atで降順（最新が上）
            // Supabaseで既に並べ替え済みだが、念のためクライアント側でもソート
            console.log('🔄 last_eaten_at優先で降順にソート中（最新が上）...');
            allMeals.sort((a, b) => {
                // 比較用の日付を取得: last_eaten_atを優先、なければupdated_at、それもなければcreated_at
                const dateA = a.last_eaten_at || a.updated_at || a.created_at;
                const dateB = b.last_eaten_at || b.updated_at || b.created_at;
                
                // 両方ともnullの場合は順序を変えない
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1; // dateAがnullの場合は後ろに
                if (!dateB) return -1; // dateBがnullの場合は後ろに
                
                const dateObjA = new Date(dateA);
                const dateObjB = new Date(dateB);
                
                // 降順（新しい順）：dateObjB - dateObjA
                return dateObjB - dateObjA;
            });
            
            console.log('✅ ソート完了: 最新のデータが一番上に配置されました');

            // 画面に表示
            displayMeals(allMeals);
            console.log('✅ データの読み込みに成功しました（最新順に並べ替え済み）');
        } catch (error) {
            console.error('❌ 読み込み失敗:', error.message);
            console.error('❌ エラー詳細:', JSON.stringify(error, null, 2));
        }
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
            
            // 料理名の取得
            const name = meal.料理名 || meal.name || '名前なし';
            
            // 日付の取得とフォーマット（YYYY/MM/DD形式に変換）
            let formattedDate = '';
            const dateToDisplay = meal.last_eaten_at;
            
            if (dateToDisplay) {
                try {
                    const date = new Date(dateToDisplay);
                    // YYYY/MM/DD形式に変換
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    formattedDate = `${year}/${month}/${day}`;
                } catch (e) {
                    console.error(`❌ 日付変換エラー [${index}]:`, e);
                    formattedDate = '';
                }
            }
            
            // 日付表示用のテキストを生成（YYYY/MM/DD形式）
            const dateDisplayText = formattedDate || '';
            
            item.innerHTML = `
                <div class="meal-card-content">
                    <span class="meal-name">${name}</span>
                    ${dateDisplayText ? `<span class="meal-date">${dateDisplayText}</span>` : ''}
                </div>
            `;
            mealList.appendChild(item);
        });
    }

    // 新しく追加：編集を実行する関数
    function editMeal(index) {
        console.log(`📝 editMeal関数が呼び出されました (index: ${index})`);
        if (index < 0 || index >= allMeals.length) {
            console.error(`❌ 無効なインデックス: ${index} (allMeals.length: ${allMeals.length})`);
            alert('編集するデータが見つかりません');
            return;
        }
        const meal = allMeals[index];
        console.log('📝 編集対象のデータ:', meal);
        
        // IDの確認（Supabaseの主キー）
        const mealId = meal.id;
        if (!mealId) {
            console.error('❌ 編集対象のデータにIDが存在しません:', meal);
            alert('編集するデータにIDが見つかりません');
            return;
        }
        console.log(`📝 編集対象のID: ${mealId} (型: ${typeof mealId})`);
        
        // フォームに値をセット（料理名のみ）
        document.getElementById('mealName').value = meal.料理名 || meal.name || '';
        
        // 編集モードに設定
        editingIndex = index;
        editingId = mealId; // SupabaseのIDを保存（これが重要！）
        console.log(`📝 editingIdを設定しました: ${editingId} (型: ${typeof editingId})`);
        
        // 保存ボタンのテキストを「更新」に変更
        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            saveButton.textContent = '更新';
            console.log('✅ 保存ボタンを「更新」に変更しました');
        } else {
            console.error('❌ 保存ボタンが見つかりません');
        }
        
        // 画面のスクロールを完全に防ぐ
        // event.preventDefault()は既にイベントリスナーで実行されているが、
        // 念のためここでも確認
        
        console.log('✅ 編集モードに移行しました');
        console.log(`✅ 現在のeditingId: ${editingId}`);
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
        console.log('saveMeal関数が実行されました');
        console.log(`📝 現在のeditingId: ${editingId} (型: ${typeof editingId})`);
        console.log(`📝 editingIdが空か: ${editingId === null || editingId === undefined || editingId === ''}`);
        
        // フォームからデータを取得（料理名のみ）
        const mealName = document.getElementById('mealName').value.trim();
        
        // バリデーション
        if (!mealName) {
            alert('料理名を入力してください');
            return;
        }
        
        // データオブジェクトを構築（日時は自動記録されるため、手動入力は不要）
        const data = {
            料理名: mealName
        };
        
        // --- 保存処理のロジック：新規保存と上書き更新を完全に切り分け ---
        try {
            // editingIdが空でない場合は上書き更新、空の場合は新規保存
            if (editingId !== null && editingId !== undefined && editingId !== '') {
                // ==========================================
                // 上書き更新処理
                // ==========================================
                console.log(`📝 ID: ${editingId} の上書き更新を実行します`);
                console.log(`📝 更新対象ID: ${editingId} (型: ${typeof editingId})`);
                console.log('📝 更新データ:', data);
                
                // IDの型を確認し、数値型に統一（Supabaseの主キーは通常数値型）
                let idToUpdate = editingId;
                if (typeof editingId === 'string' && !isNaN(editingId)) {
                    idToUpdate = parseInt(editingId, 10);
                    console.log(`🔄 IDを数値型に変換: "${editingId}" → ${idToUpdate}`);
                }
                
                // 自動記録: 保存ボタンを押した瞬間の日時を取得（ISO形式）
                const now = new Date();
                const updatedAt = now.toISOString();
                const lastEatenAt = now.toISOString(); // 最後に食べた日時を自動記録
                console.log('📅 更新日時を自動記録:', updatedAt);
                console.log('📅 最後に食べた日時を自動記録:', lastEatenAt);
                
                // supabase.from('meals').update(...).eq('id', editingId) を実行
                const { data: updateResult, error } = await supabaseClient
                    .from('meals')
                    .update({ 
                        name: JSON.stringify(data),
                        updated_at: updatedAt, // 更新日時を自動記録
                        last_eaten_at: lastEatenAt // 最後に食べた日時を自動記録
                    })
                    .eq('id', idToUpdate) // 正しいターゲット指定：今編集しているデータだけを書き換え
                    .select(); // 更新されたデータを返す
                
                if (error) {
                    console.error('❌ データベース更新エラー:', error);
                    console.error('❌ エラーメッセージ:', error.message);
                    console.error('❌ エラー詳細:', JSON.stringify(error, null, 2));
                    throw error;
                }
                
                // 更新結果の確認
                if (updateResult && updateResult.length > 0) {
                    console.log(`✅ DB更新成功: ${updateResult.length}件のデータが更新されました`);
                    console.log('✅ 更新されたデータ:', updateResult);
                    console.log('✅ ID:', idToUpdate, 'の上書き更新が完了しました');
                } else {
                    console.warn('⚠️ 更新されたデータが0件です。IDが正しくない可能性があります。');
                    console.warn('⚠️ 更新対象ID:', idToUpdate, '(型:', typeof idToUpdate, ')');
                    throw new Error('データの更新に失敗しました: データが見つかりませんでした');
                }
                
                alert("修正しました！");
                
                // 上書き保存成功後、editingIdを必ずnullに戻す
                editingId = null;
                console.log('✅ 上書き更新完了後、editingIdをnullにリセットしました');
                
            } else {
                // ==========================================
                // 新規保存処理
                // ==========================================
                console.log('📝 新規保存を実行します');
                console.log('📝 editingIdが空のため、新規保存として処理します');
                
                // 自動記録: 保存ボタンを押した瞬間の日時を取得（ISO形式）
                const now = new Date();
                const createdAt = now.toISOString();
                const updatedAt = now.toISOString(); // 新規保存時もupdated_atを設定
                const lastEatenAt = now.toISOString(); // 最後に食べた日時を自動記録
                console.log('📅 保存日時を自動記録:', createdAt);
                console.log('📅 更新日時を自動記録:', updatedAt);
                console.log('📅 最後に食べた日時を自動記録:', lastEatenAt);
                
                // supabase.from('meals').insert を実行（updateではない）
                // created_at、updated_at、last_eaten_atを自動でDBに送る
                const { data: insertData, error } = await supabaseClient
                    .from('meals')
                    .insert({ 
                        name: JSON.stringify(data),
                        created_at: createdAt,
                        updated_at: updatedAt, // 新規保存時もupdated_atを設定
                        last_eaten_at: lastEatenAt // 最後に食べた日時を自動記録
                    })
                    .select();
                
                if (error) {
                    console.error('❌ データベース保存エラー:', error);
                    console.error('❌ エラーメッセージ:', error.message);
                    console.error('❌ エラー詳細:', JSON.stringify(error, null, 2));
                    throw error;
                }
                
                if (insertData && insertData.length > 0) {
                    console.log(`✅ DB保存成功（新規）: ${insertData.length}件のデータが保存されました`);
                    console.log('✅ 保存されたデータ:', insertData);
                    console.log('✅ 新規保存が完了しました');
                } else {
                    console.warn('⚠️ 保存されたデータが0件です');
                    throw new Error('データの保存に失敗しました');
                }
                
                alert("保存しました！");
            }

            // 保存・更新成功後にデータを再取得して表示を更新（これが一番確実です）
            console.log('🔄 データを再取得して画面を更新します...');
            await fetchMeals(); 

            // フォームのリセット（入力欄を空にし、ボタンを「保存」に戻す）
            // 注意: editingIdは上書き更新の場合は既にnullにリセット済み
            resetForm();
            
            // 念のため、editingIdが確実にnullになっているか確認
            if (editingId !== null) {
                console.warn('⚠️ editingIdがリセットされていません。強制的にnullに設定します。');
                editingId = null;
            }
            console.log('✅ 保存処理が完了しました。editingId:', editingId); 

        } catch (err) {
            console.error('❌ エラー発生:', err.message);
            alert('エラーが発生しました: ' + err.message);
        }
    }

    // フォームリセットを関数にまとめるとスッキリします
    function resetForm() {
        // フォームの値をクリア（料理名のみ）
        document.getElementById('mealName').value = '';
        
        // 編集モードをリセット（重要！）
        editingIndex = null;
        editingId = null; // editingIdを空に戻す（これが重要！）
        console.log('✅ editingIdをリセットしました（nullに設定）');
        
        // 保存ボタンのテキストを「保存」に戻す
        const saveButton = document.getElementById('saveButton');
        if (saveButton) {
            saveButton.textContent = '保存';
            console.log('✅ 保存ボタンを「保存」に戻しました');
        } else {
            console.error('❌ 保存ボタンが見つかりません');
        }
    }
    
    // ==========================================
    // 削除処理
    // ==========================================
    async function deleteMeal(mealId, index = null) {
        console.log(`🗑️ deleteMeal関数が呼び出されました`);
        console.log(`🗑️ 削除対象ID: ${mealId} (型: ${typeof mealId})`);
        if (index !== null) {
            console.log(`🗑️ 配列インデックス: ${index}`);
        }
        
        // IDのバリデーション
        if (!mealId) {
            console.error('❌ IDが指定されていません');
            alert('削除するデータのIDが見つかりません');
            return;
        }
        
        // IDの型を確認し、数値型に統一（Supabaseの主キーは通常数値型）
        // 文字列として渡された場合は数値に変換を試みる
        let idToDelete = mealId;
        if (typeof mealId === 'string' && !isNaN(mealId)) {
            idToDelete = parseInt(mealId, 10);
            console.log(`🔄 IDを数値型に変換: "${mealId}" → ${idToDelete}`);
        } else if (typeof mealId === 'string' && mealId.includes('.')) {
            idToDelete = parseFloat(mealId);
            console.log(`🔄 IDを浮動小数点数型に変換: "${mealId}" → ${idToDelete}`);
        }
        
        console.log(`🗑️ 最終的な削除対象ID: ${idToDelete} (型: ${typeof idToDelete})`);
        
        // 削除対象のデータを確認（デバッグ用）
        const mealToDelete = allMeals.find(meal => {
            // IDの型が異なる可能性があるため、両方の型で比較
            return meal.id === idToDelete || 
                   meal.id === mealId || 
                   String(meal.id) === String(mealId) ||
                   Number(meal.id) === Number(idToDelete);
        });
        
        if (mealToDelete) {
            console.log('🗑️ 削除対象のデータが見つかりました:', mealToDelete);
        } else {
            console.warn('⚠️ allMeals配列内で該当データが見つかりませんでした（データベースから直接削除を試みます）');
        }
        
        // 確認ダイアログ
        if (!confirm('このおかずを削除しますか？')) {
            console.log('🗑️ 削除がキャンセルされました');
            return;
        }

        try {
            // Supabaseからデータを削除
            // IDを正確に指定して削除（Supabaseの削除ポリシーに対応）
            console.log(`🗑️ データベースから削除を開始します`);
            console.log(`🗑️ 削除対象ID: ${idToDelete} (型: ${typeof idToDelete})`);
            console.log(`🗑️ 元のID: ${mealId} (型: ${typeof mealId})`);
            
            // SupabaseのID列を確実に指定して削除
            // まず数値型で試す（Supabaseの主キーは通常数値型）
            let deleteResult = await supabaseClient
                .from('meals')
                .delete()
                .eq('id', idToDelete)
                .select(); // 削除されたデータを返す
            
            let { data, error } = deleteResult;
            
            // 数値型で失敗した場合、元のID（文字列型）で再試行
            if (error || !data || data.length === 0) {
                console.log(`🔄 数値型での削除が失敗したため、元のID型で再試行します...`);
                deleteResult = await supabaseClient
                    .from('meals')
                    .delete()
                    .eq('id', mealId)
                    .select();
                ({ data, error } = deleteResult);
            }
            
            // エラーチェック（削除ポリシーによるエラーも含む）
            if (error) {
                console.error('❌ データベース削除エラーが発生しました');
                console.error('❌ エラーメッセージ:', error.message);
                console.error('❌ エラーコード:', error.code);
                console.error('❌ エラー詳細:', JSON.stringify(error, null, 2));
                console.error('❌ 削除対象ID:', idToDelete, '(型:', typeof idToDelete, ')');
                console.error('❌ 元のID:', mealId, '(型:', typeof mealId, ')');
                
                // ユーザーにエラーを通知
                alert('削除に失敗しました: ' + error.message);
                return;
            }

            // 削除結果の確認（削除ポリシーが有効な場合、削除が許可されていない場合はdataが空になる）
            if (data && data.length > 0) {
                console.log(`✅ DB削除成功: ${data.length}件のデータが削除されました`);
                console.log('✅ 削除されたデータ:', data);
                
                // データベースの削除が成功したことを確認してから、画面を更新
                console.log('🔄 削除成功を確認しました。データを再取得して画面を更新します...');
                await fetchMeals();
                
                console.log('✅ 削除処理が完了しました');
                alert('削除しました！');
            } else {
                // 削除されたデータが0件の場合（削除ポリシーで拒否された可能性）
                console.warn('⚠️ 削除されたデータが0件です');
                console.warn('⚠️ 削除ポリシーで拒否された可能性があります');
                console.warn('⚠️ 試行した削除対象ID:', idToDelete, '(型:', typeof idToDelete, ')');
                console.warn('⚠️ 元のID:', mealId, '(型:', typeof mealId, ')');
                
                // エラーがない場合でも、データが削除されていない場合はエラーとして扱う
                if (!error) {
                    console.error('❌ エラーは発生しませんでしたが、データが削除されませんでした');
                    console.error('❌ 削除ポリシーの設定を確認してください');
                }
                
                alert('削除に失敗しました: データが見つかりませんでした。削除ポリシーを確認してください。');
                return;
            }
            
        } catch (err) {
            console.error('❌ 削除処理中に予期しないエラーが発生しました');
            console.error('❌ エラーメッセージ:', err.message);
            console.error('❌ エラースタック:', err.stack);
            console.error('❌ エラー詳細:', JSON.stringify(err, null, 2));
            console.error('❌ 削除対象ID:', idToDelete, '(型:', typeof idToDelete, ')');
            console.error('❌ 元のID:', mealId, '(型:', typeof mealId, ')');
            
            alert('削除中にエラーが発生しました: ' + err.message);
        }
    }

    // HTMLのoninput属性から呼び出される関数をグローバルスコープに公開
    // （検索入力欄のoninput属性で使用）
    window.filterMeals = filterMeals;
    
    console.log('✅ すべてのイベントリスナーが設定されました');
});
