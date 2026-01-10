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
    let selectedGenre = '';
    let selectedCategory = '';
    let editingIndex = null;
    let editingId = null; // 編集対象のSupabase ID
    let allMeals = [];

    // ==========================================
    // 初期化処理
    // ==========================================
    // ボタンの参照をまとめて保持（ID/クラスのズレ防止）
    const genreOptions = document.querySelectorAll('.genre-btn');
    const categoryOptions = document.querySelectorAll('.category-btn');

    if (!genreOptions || genreOptions.length === 0) {
        console.error('❌ ジャンルボタン（.genre-btn）が見つかりません');
    } else {
        // ジャンルボタンのイベントリスナー
        genreOptions.forEach(btn => {
            btn.addEventListener('click', function() {
                genreOptions.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedGenre = this.dataset.genre;
                console.log('✅ ジャンルを選択しました:', selectedGenre);
            });
        });
    }

    if (!categoryOptions || categoryOptions.length === 0) {
        console.error('❌ カテゴリーボタン（.category-btn）が見つかりません');
    } else {
        // カテゴリーボタンのイベントリスナー
        categoryOptions.forEach(btn => {
            btn.addEventListener('click', function() {
                categoryOptions.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                selectedCategory = this.dataset.category;
                console.log('✅ カテゴリーを選択しました:', selectedCategory);
            });
        });
    }

    // 保存ボタンのイベントリスナー
    const saveBtn = document.getElementById('saveButton');
    if (!saveBtn) {
        console.error('❌ 保存ボタン（id="saveButton"）が見つかりません');
    } else {
        console.log('✅ 保存ボタンが見つかりました:', saveBtn);
        // スマホの「タップ」とPCの「クリック」両方で反応するようにします
        // 複数のイベントタイプに対応（確実にイベントが発火するように）
        ['click', 'touchstart'].forEach(eventType => {
            saveBtn.addEventListener(eventType, (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`🔵 保存ボタンが${eventType}されました`);
                saveMeal();
            }, { passive: false });
        });
        console.log('✅ 保存ボタンのイベントリスナーが設定されました（click, touchstart）');
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
        // 複数のイベントタイプに対応（確実にイベントが発火するように）
        ['click', 'touchstart'].forEach(eventType => {
            mealList.addEventListener(eventType, (e) => {
                const target = e.target;
                // 親要素もチェック（ボタン内のアイコンがクリックされた場合）
                const editBtn = target.closest('.edit-btn');
                const deleteBtn = target.closest('.delete-btn');
                
                if (editBtn) {
                    // 画面のスクロールを完全に防ぐ
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const index = parseInt(editBtn.getAttribute('data-index'));
                    const mealId = editBtn.getAttribute('data-id');
                    console.log(`✏️ 編集ボタンが${eventType}されました`);
                    console.log(`✏️ 配列インデックス: ${index}`);
                    console.log(`✏️ データID: ${mealId} (型: ${typeof mealId})`);
                    
                    // 編集処理を実行
                    editMeal(index);
                    
                    // 追加のスクロール防止（念のため）
                    return false;
                } else if (deleteBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    // Supabaseのidを取得（data-id属性から）
                    const mealId = deleteBtn.getAttribute('data-id');
                    const index = parseInt(deleteBtn.getAttribute('data-index'));
                    
                    console.log(`🗑️ 削除ボタンが${eventType}されました`);
                    console.log(`🗑️ 送信しようとしているID: ${mealId} (型: ${typeof mealId})`);
                    console.log(`🗑️ 配列インデックス: ${index}`);
                    
                    if (!mealId) {
                        console.error('❌ 削除ボタンにIDが設定されていません');
                        alert('削除するデータのIDが見つかりません');
                        return;
                    }
                    
                    deleteMeal(mealId, index);
                }
            }, { passive: false });
        });
        console.log('✅ 編集・削除ボタンのイベント委譲が設定されました（click, touchstart）');
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
            // Safari互換性: padStartが使えない場合に備えて手動でパディング
            let month = String(date.getMonth() + 1);
            let day = String(date.getDate());
            let hours = String(date.getHours());
            let minutes = String(date.getMinutes());
            
            // padStartの代替実装（古いSafari対応）
            if (String.prototype.padStart) {
                month = month.padStart(2, '0');
                day = day.padStart(2, '0');
                hours = hours.padStart(2, '0');
                minutes = minutes.padStart(2, '0');
            } else {
                // padStartが使えない場合の代替処理
                if (month.length < 2) month = '0' + month;
                if (day.length < 2) day = '0' + day;
                if (hours.length < 2) hours = '0' + hours;
                if (minutes.length < 2) minutes = '0' + minutes;
            }
            
            return `${year}/${month}/${day} ${hours}:${minutes}`;
        } catch (e) {
            console.error('❌ 日付フォーマットエラー:', e);
            return '';
        }
    }

    async function fetchMeals() {
        // バージョン情報ログ（Safariキャッシュ対策用）
        console.log('📌 プログラム実行中: 2025-01-27 15:30版 (Safari同期テスト)');
        console.log('🔄 fetchMeals関数が呼び出されました');
        try {
            console.log('🔄 データベースからデータを取得中...');
            // name列のみを取得（Supabaseのテーブルにはname列しかない）
            const { data, error } = await supabaseClient
                .from('meals')
                .select('id, name, created_at, updated_at')
                .order('updated_at', { ascending: false }); // updated_atで降順ソート（最新が上）
            
            console.log('🔄 Supabaseクエリ実行完了');
            
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
            // 全体をtry-catchで囲み、1つでもデータの解析に失敗しても他のデータの表示を止めない
            allMeals = [];
            if (data && Array.isArray(data)) {
                data.forEach((item, idx) => {
                    try {
                        // IDが確実に取得できているか確認
                        if (!item.id) {
                            console.error(`❌ データ[${idx}]にIDが存在しません:`, item);
                        }
                        
                        // created_atが取得できているか確認（デバッグ用）
                        if (!item.created_at) {
                            console.warn(`⚠️ データ[${idx}]にcreated_atが存在しません:`, item);
                        }
                        
                        console.log(`🔄 データ[${idx}]のパース処理開始: ID=${item.id}`);
                        console.log(`📝 name列の内容:`, item.name);
                        console.log(`📝 name列の型:`, typeof item.name);
                        
                        // name列を救済ロジックで処理（古いテキスト形式と新しいJSON形式の両方に対応）
                        // item.nameが{で始まっていればJSON.parse、そうでなければそのまま「料理名」として表示
                        let nameData = {};
                        if (item.name) {
                            try {
                                if (typeof item.name === 'string' && item.name.trim() !== '') {
                                    const trimmedName = item.name.trim();
                                    
                                    // {で始まっていればJSON形式として解析
                                    if (trimmedName.startsWith('{')) {
                                        try {
                                            nameData = JSON.parse(trimmedName);
                                            console.log(`✅ データ[${idx}]のJSONパース成功（JSON形式として認識）`);
                                        } catch (jsonError) {
                                            console.error(`❌ データ[${idx}]のJSONパースエラー（{で始まるがJSONとして解析失敗）:`, jsonError);
                                            // JSONパースに失敗した場合、そのまま「料理名」として扱う
                                            nameData = {
                                                料理名: trimmedName
                                            };
                                            console.log(`✅ データ[${idx}]をテキスト形式の料理名として扱いました: "${trimmedName}"`);
                                        }
                                    } else {
                                        // {で始まらなければ、そのまま「料理名」として扱う（古いテキスト形式）
                                        nameData = {
                                            料理名: trimmedName
                                        };
                                        console.log(`✅ データ[${idx}]をテキスト形式の料理名として扱いました: "${trimmedName}"`);
                                    }
                                } else {
                                    console.warn(`⚠️ データ[${idx}]のnameが空文字列または無効です`);
                                    nameData = {};
                                }
                            } catch (parseError) {
                                console.error(`❌ データ[${idx}]のパース処理でエラー:`, parseError);
                                console.error(`❌ name列の内容:`, item.name);
                                // パースに失敗しても、そのまま「料理名」として扱う（画面が真っ白にならないように）
                                if (typeof item.name === 'string' && item.name.trim() !== '') {
                                    nameData = {
                                        料理名: item.name.trim()
                                    };
                                    console.log(`✅ データ[${idx}]をエラー発生時のフォールバックとして料理名として扱いました: "${item.name.trim()}"`);
                                } else {
                                    nameData = {};
                                }
                            }
                        } else {
                            console.warn(`⚠️ データ[${idx}]にname列が存在しません`);
                            nameData = {};
                        }
                        
                        // パースしたデータを統合
                        const parsedData = { 
                            id: item.id, 
                            created_at: item.created_at || null,
                            updated_at: item.updated_at || null,
                            ...nameData
                        };
                        
                        // 「最後に食べた日」を取得（name列のJSONオブジェクト内から）
                        const lastEatenDate = parsedData['最後に食べた日'] || null;
                        
                        // 表示用の日付を決定: 「最後に食べた日」を優先、なければupdated_at、それもなければcreated_atを使用
                        const dateToDisplay = lastEatenDate || parsedData.updated_at || parsedData.created_at;
                        const dateType = lastEatenDate ? '最後に食べた日' : (parsedData.updated_at ? 'updated_at' : 'created_at');
                        
                        // 日付を日本形式に変換（YYYY/MM/DD形式）
                        if (dateToDisplay) {
                            try {
                                // 「最後に食べた日」はYYYY-MM-DD形式なので、そのまま使用
                                if (lastEatenDate) {
                                    const [year, month, day] = lastEatenDate.split('-');
                                    parsedData.formattedDate = `${year}/${month}/${day}`;
                                } else {
                                    // updated_atやcreated_atはISO形式なので、Dateオブジェクトに変換
                                    parsedData.formattedDate = new Date(dateToDisplay).toLocaleDateString('ja-JP');
                                }
                                parsedData.displayDateType = dateType;
                                parsedData.last_eaten_at = lastEatenDate; // 表示用に保持
                                
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
                            console.warn(`⚠️ データ[${idx}]に「最後に食べた日」もupdated_atもcreated_atも存在しません。ID: ${parsedData.id}, 料理名: ${parsedData.料理名 || parsedData.name || 'なし'}`);
                        }
                        
                        // デバッグログ（最初の3件のみ）
                        if (idx < 3) {
                            console.log(`📝 データ[${idx}]: ID=${parsedData.id}, 日付=${parsedData.formattedDate || 'なし'}, 料理名=${parsedData.料理名 || parsedData.name || 'なし'}`);
                        }
                        // パース成功したデータを配列に追加
                        allMeals.push(parsedData);
                    } catch (e) {
                        // 1つのデータの解析に失敗しても、他のデータの表示を止めない
                        console.error(`❌ データ[${idx}]のパースエラー:`, e);
                        console.error(`❌ エラー詳細:`, e.message);
                        console.error(`❌ name列の内容:`, item.name);
                        
                        // フォールバック: name列を救済ロジックで再処理
                        let fallbackNameData = {};
                        if (item.name) {
                            try {
                                if (typeof item.name === 'string' && item.name.trim() !== '') {
                                    const trimmedName = item.name.trim();
                                    
                                    // {で始まっていればJSON形式として解析
                                    if (trimmedName.startsWith('{')) {
                                        try {
                                            fallbackNameData = JSON.parse(trimmedName);
                                            console.log(`✅ データ[${idx}]のフォールバックJSONパース成功（JSON形式として認識）`);
                                        } catch (jsonError2) {
                                            console.error(`❌ データ[${idx}]のフォールバックJSONパースエラー:`, jsonError2);
                                            // JSONパースに失敗した場合、そのまま「料理名」として扱う
                                            fallbackNameData = {
                                                料理名: trimmedName
                                            };
                                            console.log(`✅ データ[${idx}]をフォールバックでテキスト形式の料理名として扱いました: "${trimmedName}"`);
                                        }
                                    } else {
                                        // {で始まらなければ、そのまま「料理名」として扱う（古いテキスト形式）
                                        fallbackNameData = {
                                            料理名: trimmedName
                                        };
                                        console.log(`✅ データ[${idx}]をフォールバックでテキスト形式の料理名として扱いました: "${trimmedName}"`);
                                    }
                                }
                            } catch (parseError2) {
                                console.error(`❌ データ[${idx}]のフォールバックパース処理も失敗:`, parseError2);
                                // 最後の手段として、そのまま「料理名」として扱う
                                if (typeof item.name === 'string' && item.name.trim() !== '') {
                                    fallbackNameData = {
                                        料理名: item.name.trim()
                                    };
                                    console.log(`✅ データ[${idx}]を最終フォールバックとして料理名として扱いました: "${item.name.trim()}"`);
                                } else {
                                    fallbackNameData = {};
                                }
                            }
                        }
                        
                        // フォールバックデータを作成（最低限の情報で表示できるようにする）
                        const fallbackData = { 
                            id: item.id || idx, 
                            created_at: item.created_at || null,
                            updated_at: item.updated_at || null,
                            ...fallbackNameData
                        };
                        
                        // 「最後に食べた日」を取得（name列のJSONオブジェクト内から）
                        const fallbackLastEatenDate = fallbackData['最後に食べた日'] || null;
                        
                        // 表示用の日付を決定: 「最後に食べた日」を優先、なければupdated_at、それもなければcreated_atを使用
                        const dateToDisplay = fallbackLastEatenDate || fallbackData.updated_at || fallbackData.created_at;
                        
                        // 日付を日本形式に変換（YYYY/MM/DD形式）
                        if (dateToDisplay) {
                            try {
                                // 「最後に食べた日」はYYYY-MM-DD形式なので、そのまま使用
                                if (fallbackLastEatenDate) {
                                    const [year, month, day] = fallbackLastEatenDate.split('-');
                                    fallbackData.formattedDate = `${year}/${month}/${day}`;
                                } else {
                                    // updated_atやcreated_atはISO形式なので、Dateオブジェクトに変換
                                    fallbackData.formattedDate = new Date(dateToDisplay).toLocaleDateString('ja-JP');
                                }
                            } catch (dateError) {
                                console.error(`❌ 日付変換エラー [${idx}]（フォールバック）:`, dateError);
                                fallbackData.formattedDate = '';
                            }
                        } else {
                            fallbackData.formattedDate = '';
                        }
                        
                        // フォールバックデータも配列に追加（エラーがあっても表示を止めない）
                        allMeals.push(fallbackData);
                        console.log(`✅ データ[${idx}]をフォールバックデータとして追加しました`);
                    }
                });
            } else {
                console.warn('⚠️ 取得したデータが配列ではありません');
            }

            // すべてのデータのIDを確認
            const idsWithoutId = allMeals.filter(meal => !meal.id);
            if (idsWithoutId.length > 0) {
                console.error(`❌ IDが存在しないデータが${idsWithoutId.length}件あります`);
            }
            
            // すべてのデータの「最後に食べた日」、updated_at、created_atを確認（デバッグ用）
            const mealsWithoutDate = allMeals.filter(meal => !meal['最後に食べた日'] && !meal.last_eaten_at && !meal.updated_at && !meal.created_at);
            if (mealsWithoutDate.length > 0) {
                console.warn(`⚠️ 「最後に食べた日」もupdated_atもcreated_atも存在しないデータが${mealsWithoutDate.length}件あります`);
                console.warn('⚠️ 日付が存在しないデータのID:', mealsWithoutDate.map(m => m.id));
            }

            // 並べ替え: 「最後に食べた日」を優先、なければupdated_at、それもなければcreated_atで降順（最新が上）
            // Supabaseで既に並べ替え済みだが、念のためクライアント側でもソート
            console.log('🔄 「最後に食べた日」優先で降順にソート中（最新が上）...');
            allMeals.sort((a, b) => {
                // 比較用の日付を取得: 「最後に食べた日」を優先、なければupdated_at、それもなければcreated_at
                const dateA = a['最後に食べた日'] || a.last_eaten_at || a.updated_at || a.created_at;
                const dateB = b['最後に食べた日'] || b.last_eaten_at || b.updated_at || b.created_at;
                
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

            // 画面に表示（データが1件以上ある場合のみ確認ログを出力）
            if (allMeals && allMeals.length > 0) {
                console.log("データ表示処理を開始します: " + allMeals.length + "件");
                displayMeals(allMeals);
                console.log('✅ データの読み込みに成功しました（最新順に並べ替え済み）');
            } else {
                console.warn('⚠️ allMeals配列が空です。データが取得できていない可能性があります。');
                displayMeals([]);
            }
        } catch (error) {
            console.error('❌ 読み込み失敗:', error.message);
            console.error('❌ エラー詳細:', JSON.stringify(error, null, 2));
        }
    }

    // ==========================================
    // 画面への表示処理
    // ==========================================
    function displayMeals(meals) {
        console.log('📋 displayMeals関数が呼び出されました');
        console.log(`📋 表示するデータ件数: ${meals ? meals.length : 0}`);
        const mealList = document.getElementById('mealsList');
        if (!mealList) {
            console.error('❌ mealsList要素が見つかりません');
            return;
        }
        mealList.innerHTML = '';

        if (!meals || meals.length === 0) {
            console.log('📋 表示するデータがありません');
            mealList.innerHTML = '<p class="no-data">データがありません</p>';
            return;
        }

        meals.forEach((meal, index) => {
            const item = document.createElement('div');
            item.className = 'meal-item';
            
            // データの取得
            const name = meal.料理名 || meal.name || meal.meal_name || '名前なし';
            const genre = meal.ジャンル || meal.genre || '';
            const category = meal.カテゴリー || meal.category || '';
            const mainIngredient = meal.メイン食材 || meal.main_ingredient || '';
            const memo = meal.メモ || meal.memo || '';
            
            // data-category属性を設定（フィルター機能用）
            if (category) {
                item.setAttribute('data-category', category);
            }
            
            // ジャンルとカテゴリーのタグを生成
            let genreTag = '';
            if (genre) {
                const genreEmoji = genre === '和食' ? '🍱' : genre === '洋食' ? '🍝' : genre === '中華' ? '🥟' : genre === '麺類' ? '🍜' : '';
                genreTag = `<span class="genre-tag">${genreEmoji} ${genre}</span>`;
            }
            
            let categoryTag = '';
            if (category) {
                const categoryEmoji = category === '牛' ? '🐄' : category === '豚' ? '🐷' : category === '鶏' ? '🐔' : category === '海鮮' ? '🐟' : category === '野菜' ? '🥬' : category === 'その他' ? '🍽️' : '';
                categoryTag = `<span class="category-tag">${categoryEmoji} ${category}</span>`;
            }
            
            // 日付の取得とフォーマット（YYYY/MM/DD形式に変換）
            // 「最後に食べた日」を優先、なければformattedDateを使用
            let dateDisplayText = '';
            const lastEatenDate = meal['最後に食べた日'] || meal.last_eaten_at;
            
            if (lastEatenDate) {
                try {
                    // 「最後に食べた日」はYYYY-MM-DD形式なので、そのまま変換
                    if (typeof lastEatenDate === 'string' && lastEatenDate.includes('-')) {
                        const [year, month, day] = lastEatenDate.split('-');
                        dateDisplayText = `${year}/${month}/${day}`;
                    } else {
                        // ISO形式の場合はDateオブジェクトに変換
                        try {
                            const date = new Date(lastEatenDate);
                            const year = date.getFullYear();
                            // Safari互換性: padStartが使えない場合に備えて手動でパディング
                            let month = String(date.getMonth() + 1);
                            let day = String(date.getDate());
                            
                            // padStartの代替実装（古いSafari対応）
                            if (String.prototype.padStart) {
                                month = month.padStart(2, '0');
                                day = day.padStart(2, '0');
                            } else {
                                // padStartが使えない場合の代替処理
                                if (month.length < 2) month = '0' + month;
                                if (day.length < 2) day = '0' + day;
                            }
                            
                            dateDisplayText = `${year}/${month}/${day}`;
                        } catch (dateError) {
                            console.error(`❌ 日付オブジェクト変換エラー [${index}]:`, dateError);
                            dateDisplayText = '';
                        }
                    }
                } catch (e) {
                    console.error(`❌ 日付変換エラー [${index}]:`, e);
                    dateDisplayText = '';
                }
            } else if (meal.formattedDate) {
                // formattedDateが既に設定されている場合はそれを使用
                dateDisplayText = meal.formattedDate;
            }
            
            item.innerHTML = `
                <div class="tag-container">
                    ${genreTag}
                    ${categoryTag}
                </div>
                <div class="meal-card-content">
                    <div class="meal-header">
                        <span class="meal-name">${name}</span>
                        ${dateDisplayText ? `<span class="meal-date">${dateDisplayText}</span>` : ''}
                    </div>
                    ${mainIngredient ? `<p class="main-ingredient"><strong>メイン食材:</strong> ${mainIngredient}</p>` : ''}
                    ${memo ? `<p class="memo">${memo}</p>` : ''}
                </div>
                <div class="meal-actions">
                    <button class="edit-btn" data-index="${index}" data-id="${meal.id}" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">✏️</button>
                    <button class="delete-btn" data-index="${index}" data-id="${meal.id}" style="background:none; border:none; cursor:pointer; font-size:1.2rem;">🗑️</button>
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
        
        // フォームに値をセット
        document.getElementById('mealName').value = meal.料理名 || meal.name || meal.meal_name || '';
        document.getElementById('mainIngredient').value = meal.メイン食材 || meal.main_ingredient || '';
        document.getElementById('memo').value = meal.メモ || meal.memo || '';
        
        // ジャンルボタンの選択状態をリセットし、該当するものをアクティブに
        const genre = meal.ジャンル || meal.genre || '';
        genreOptions.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.genre === genre) {
                btn.classList.add('active');
            }
        });
        selectedGenre = genre;
        
        // カテゴリーボタンの選択状態をリセットし、該当するものをアクティブに
        const category = meal.カテゴリー || meal.category || '';
        categoryOptions.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === category) {
                btn.classList.add('active');
            }
        });
        selectedCategory = category;
        
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
        console.log('🔍 filterMeals関数が呼び出されました');
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) {
            console.error('❌ 検索入力欄が見つかりません');
            return;
        }
        const searchTerm = searchInput.value.toLowerCase();
        const activeFilterChip = document.querySelector('.filter-chip.active');
        if (!activeFilterChip) {
            console.error('❌ アクティブなフィルターチップが見つかりません');
            return;
        }
        const activeFilter = activeFilterChip.dataset.filter;
        console.log(`🔍 検索語: "${searchTerm}", フィルター: "${activeFilter}"`);

        let filteredMeals = allMeals.filter(meal => {
            const matchesSearch = !searchTerm ||
                (meal.料理名 && meal.料理名.toLowerCase().includes(searchTerm)) ||
                (meal.メイン食材 && meal.メイン食材.toLowerCase().includes(searchTerm)) ||
                (meal.メモ && meal.メモ.toLowerCase().includes(searchTerm)) ||
                (meal.ジャンル && meal.ジャンル.toLowerCase().includes(searchTerm));

            const mealCategory = meal.カテゴリー || meal.category || '';
            const matchesFilter = activeFilter === 'all' ||
                (activeFilter === '牛' && mealCategory === '牛') ||
                (activeFilter === '豚' && mealCategory === '豚') ||
                (activeFilter === '鶏' && mealCategory === '鶏') ||
                (activeFilter === '海鮮' && mealCategory === '海鮮') ||
                (activeFilter === '野菜' && mealCategory === '野菜') ||
                (activeFilter === 'その他' && mealCategory === 'その他');

            return matchesSearch && matchesFilter;
        });

        displayMeals(filteredMeals);
    }

    // ==========================================
    // おすすめ機能
    // ==========================================
    function suggestMeal() {
        console.log('🎲 suggestMeal関数が呼び出されました');
        const activeFilterChip = document.querySelector('.filter-chip.active');
        if (!activeFilterChip) {
            console.error('❌ アクティブなフィルターチップが見つかりません');
            return;
        }
        const activeFilter = activeFilterChip.dataset.filter;
        console.log(`🎲 フィルター: "${activeFilter}"`);
        let candidates = allMeals;

        if (activeFilter !== 'all') {
            candidates = allMeals.filter(meal => {
                const mealCategory = meal.カテゴリー || meal.category || '';
                return (activeFilter === '牛' && mealCategory === '牛') ||
                       (activeFilter === '豚' && mealCategory === '豚') ||
                       (activeFilter === '鶏' && mealCategory === '鶏') ||
                       (activeFilter === '海鮮' && mealCategory === '海鮮') ||
                       (activeFilter === '野菜' && mealCategory === '野菜') ||
                       (activeFilter === 'その他' && mealCategory === 'その他');
            });
        }

        if (candidates.length === 0) {
            document.getElementById('suggestionArea').innerHTML = '<p>該当するおかずがありません。</p>';
            return;
        }

        const randomMeal = candidates[Math.floor(Math.random() * candidates.length)];
        const mealName = randomMeal.料理名 || randomMeal.name || randomMeal.meal_name || '名前なし';
        const mainIngredient = randomMeal.メイン食材 || randomMeal.main_ingredient || '-';
        const memo = randomMeal.メモ || randomMeal.memo || '';
        
        document.getElementById('suggestionArea').innerHTML = `
            <div class="suggestion-result">
                <h4>🎲 今日のおすすめ: ${mealName}</h4>
                <p><strong>メイン食材:</strong> ${mainIngredient}</p>
                ${memo ? `<p><strong>メモ:</strong> ${memo}</p>` : ''}
            </div>
        `;
    }

    // ==========================================
    // 保存処理
    // ==========================================
    async function saveMeal() {
        console.log('💾 保存処理開始');
        
        // 保存処理開始時にアラートを表示
        alert("保存処理を開始します");
        
        try {
            console.log(`📝 現在のeditingId: ${editingId} (型: ${typeof editingId})`);
            console.log(`📝 editingIdが空か: ${editingId === null || editingId === undefined || editingId === ''}`);
            
            // フォームからデータを取得
            const mealName = document.getElementById('mealName').value.trim();
            const mainIngredient = document.getElementById('mainIngredient').value.trim();
            const memo = document.getElementById('memo').value.trim();
            
            // バリデーション
            if (!mealName) {
                alert('料理名を入力してください');
                return;
            }
            
            // 自動記録: 保存ボタンを押した瞬間の日時を取得（ISO形式）
            const now = new Date();
            const lastEatenAtISO = now.toISOString(); // 最後に食べた日時を自動記録
            const lastEatenAtDate = lastEatenAtISO.split('T')[0]; // YYYY-MM-DD形式に変換
            
            // データオブジェクトを構築（name列に保存する全データ）
            // 全ての入力（ジャンル、カテゴリー、料理名、材料、メモ）を1つのオブジェクトにまとめる
            const data = {
                料理名: mealName,
                メイン食材: mainIngredient || '',
                カテゴリー: selectedCategory || '',
                ジャンル: selectedGenre || '',
                メモ: memo || '',
                最後に食べた日: lastEatenAtDate
            };
            
            console.log('📝 保存するデータ:', data);
            const jsonString = JSON.stringify(data);
            console.log('📝 JSON文字列化:', jsonString);
            
            // 必ずJSON.stringifyしてname列に保存する（確実にJSON形式で保存）
            if (!jsonString || jsonString === '{}') {
                console.error('❌ JSON文字列化に失敗しました');
                throw new Error('データの保存に失敗しました: JSON形式への変換に失敗しました');
            }
            
            // --- 保存処理のロジック：新規保存と上書き更新を完全に切り分け ---
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
                
                // supabase.from('meals').update(...).eq('id', editingId) を実行
                // name列のみに全データをJSON文字列として保存（必ずJSON.stringifyで保存）
                const { data: updateResult, error } = await supabaseClient
                    .from('meals')
                    .update({ 
                        name: jsonString // JSON.stringify済みの文字列を使用
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
                
                // 上書き保存成功後、editingIdを必ずnullに戻す
                editingId = null;
                console.log('✅ 上書き更新完了後、editingIdをnullにリセットしました');
                
            } else {
                // ==========================================
                // 新規保存処理
                // ==========================================
                console.log('📝 新規保存を実行します');
                console.log('📝 editingIdが空のため、新規保存として処理します');
                
                // supabase.from('meals').insert を実行（updateではない）
                // name列のみに全データをJSON文字列として保存（必ずJSON.stringifyで保存）
                const { data: insertData, error } = await supabaseClient
                    .from('meals')
                    .insert({ 
                        name: jsonString // JSON.stringify済みの文字列を使用
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
            }
            
            // 保存完了時にアラートを表示
            alert("海鮮を保存しました");
            
            // 保存・更新成功後は必ずlocation.reload()を実行して画面を強制更新
            console.log('🔄 画面を強制更新します...');
            window.location.reload(); 

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
            console.error('❌ 保存処理中にエラー:', err);
            alert('エラーが発生しました: ' + err.message);
        }
    }

    // フォームリセットを関数にまとめるとスッキリします
    function resetForm() {
        console.log('🔄 resetForm関数が呼び出されました');
        // フォームの値をクリア
        const mealNameInput = document.getElementById('mealName');
        const mainIngredientInput = document.getElementById('mainIngredient');
        const memoInput = document.getElementById('memo');
        
        if (mealNameInput) mealNameInput.value = '';
        if (mainIngredientInput) mainIngredientInput.value = '';
        if (memoInput) memoInput.value = '';
        
        // ジャンルとカテゴリーの選択をリセット
        if (genreOptions && genreOptions.length > 0) {
            genreOptions.forEach(b => b.classList.remove('active'));
        }
        selectedGenre = '';
        if (categoryOptions && categoryOptions.length > 0) {
            categoryOptions.forEach(b => b.classList.remove('active'));
        }
        selectedCategory = '';
        
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
