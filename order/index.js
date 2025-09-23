// 商品データを格納するオブジェクト（価格計算時に使用）
const productsData = {};
// 合計金額が計算されたかを追跡するフラグ
let isTotalCalculated = false;

// DOMの読み込みが完了したら、商品リストの読み込みを開始
document.addEventListener('DOMContentLoaded', async () => {
  // ページ初期化時に商品データと送料データを並行して読み込む
  await loadProducts()
  .catch(error => {
    console.error('ページの初期化中にエラーが発生しました:', error);
    const container = document.getElementById('productContainer');
    if (container) {
      container.textContent = 'ページの読み込みに失敗しました。お手数ですが、ページを再読み込みしてください。';
    }
  });

  // フォームのsubmitイベントを捕捉し、送信前に最終処理を行う
  const orderForm = document.getElementById('orderForm');
  if (orderForm) {
    orderForm.addEventListener('submit', (event) => {
      event.preventDefault(); // フォームの送信を一旦キャンセル

      // 現在選択されている配送方法を一時的に保持
      const shippingMethodSelect = document.getElementById('shippingMethod');
      const previouslySelectedMethod = shippingMethodSelect.value;

      // 合計金額が確認されていない場合は、フォーム送信を中止
      if (!isTotalCalculated) {
        alert('「合計金額を確認する」ボタンを押して、金額を確認してください。');
        return;
      }

      // ページ遷移の直前に、最新の状態で合計計算とセッションストレージへの保存を実行
      // 数量変更後に確認ボタンを押さずに注文ボタンを押した場合にも対応するため、ここで再度計算する
      if (!calculateTotal()) { // バリデーション等で失敗した場合は中断
        return;
      }

      // calculateTotal()でプルダウンが再生成された後、以前の選択値を復元する
      // これにより、数量変更後に「合計確認」を押さずに注文した場合でも選択が維持される
      shippingMethodSelect.value = previouslySelectedMethod;

      // 合計金額が0円（=何も選択されていない）の場合、フォーム送信を中止してアラートを表示
      const totalPrice = sessionStorage.getItem('totalPrice');
      if (!totalPrice || Number(totalPrice) === 0) {
        alert('商品が選択されていません。');
        return;
      }

      // 配送方法が選択されているかチェック
      const selectedMethod = shippingMethodSelect.value;

      if (!selectedMethod) {
        alert('配送方法を選択してください。');
        shippingMethodSelect.focus();
        return;
      }

      // 選択された配送方法をsessionStorageに保存
      sessionStorage.setItem('shippingMethod', selectedMethod);

      // 配送方法に応じて遷移先を決定
      let nextPage = '';
      if (selectedMethod.includes('郵便局')) {
        nextPage = '02_address2.html';
      } else if (selectedMethod.includes('匿名')) {
        nextPage = '02_address3.html';
      } else {
        // 上記以外はすべて自宅配送とみなす
        nextPage = '02_address.html';
      }

      // フォームのaction属性と、確認画面からの「戻る」ボタン用の情報を設定
      orderForm.action = nextPage;

      // フォームをプログラム的に送信
      orderForm.submit();
    });
  }
});

/**
 * CSVファイルを読み込み、商品を動的にページに表示します。
 */
async function loadProducts() {
  const container = document.getElementById('productContainer');
  try {
    // CSVファイルを取得
    const response = await fetch('files/products.csv');
    if (!response.ok) {
      throw new Error(`CSVファイルの読み込みに失敗しました: ${response.statusText}`);
    }
    const csvText = await response.text();

    // CSVをパースして商品データ配列を取得
    const allProducts = parseProductCSV(csvText);

    // statusが'on'の商品のみに絞り込む
    const products = allProducts.filter(p => p.status === 'on');
 
    // 各商品にサイズ情報を追加
    products.forEach(p => {
        const parts = p.productcd.split('_');
        // "_"で区切った3番目の部分をサイズとして数値で格納。なければ0。
        p.size = parts.length > 2 ? (parseInt(parts[2], 10) || 0) : 0;
    });

    // 商品データをIDで簡単にアクセスできるように`productsData`オブジェクトに格納
    products.forEach(p => {
        productsData[p.productcd] = p;
    });

    // 商品をグループごとに分類
    const productsByGroup = groupProducts(products);

    // グループごとにHTMLを生成してコンテナに追加
    for (const groupName in productsByGroup) {
      const groupSection = document.createElement('section');
      
      const groupTitle = document.createElement('h2');
      groupTitle.textContent = groupName;
      groupTitle.className = 'group-title'; // スタイルとイベント処理用のクラスを追加
      groupSection.appendChild(groupTitle);

      // このグループの商品を格納するコンテナを作成
      const productListContainer = document.createElement('div');
      productListContainer.className = 'product-list';

      productsByGroup[groupName].forEach(product => {
        const productDiv = document.createElement('div');
        productDiv.className = 'product'; // スタイル付けのためにクラスを追加

        const label = document.createElement('label');
        label.setAttribute('for', `qty_${product.productcd}`);
        label.textContent = `${product.p_fullname}（¥${product.price}）`;

        const select = document.createElement('select');
        select.id = `qty_${product.productcd}`;
        select.name = `qty_${product.productcd}`;
        select.className = 'quantity';

        // 数量が変更されたら、合計金額の確認が済んでいない状態に戻す
        select.addEventListener('change', () => {
          isTotalCalculated = false;
          // 視覚的に再計算が必要なことを示すため、表示をリセット
          document.getElementById('totalPrice').textContent = '¥0';
          document.getElementById('totalSize').textContent = '0';
        });
        
        // 数量の選択肢（0から2まで）を生成
        for (let i = 0; i <= 2; i++) {
          const option = document.createElement('option');
          option.value = i;
          option.textContent = i === 0 ? '------' : i;
          select.appendChild(option);
        }
        
        productDiv.appendChild(label);

        // CSVにdescription列があり、内容が存在する場合に説明文を表示
        if (product.description && product.description.trim() !== '') {
          const descriptionP = document.createElement('p');
          descriptionP.className = 'product-description'; // スタイル付け用のクラス
          descriptionP.textContent = product.description;
          productDiv.appendChild(descriptionP);
        }

        productDiv.appendChild(select);
        productListContainer.appendChild(productDiv); // 商品をグループのコンテナに追加
      });

      groupSection.appendChild(productListContainer); // 商品コンテナをセクションに追加
      container.appendChild(groupSection);

      // グループタイトルにクリックイベントを追加して、リストの表示/非表示を切り替える
      groupTitle.addEventListener('click', () => {
        groupTitle.classList.toggle('is-open');
        productListContainer.classList.toggle('is-open');
      });
    }
  } catch (error) {
    console.error('商品データの処理中にエラーが発生しました:', error);
    container.textContent = '商品の読み込みに失敗しました。ページを再読み込みしてください。';
  }
}

/**
 * 商品CSV形式のテキストをパースし、オブジェクトの配列に変換します。
 * @param {string} csvText - CSV形式のテキストデータ
 * @returns {Array<Object>} 商品オブジェクトの配列
 */
function parseProductCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines.shift().split(',').map(h => h.trim());

  // Regex to correctly split CSV rows, handling quoted fields with commas.
  const regex = /(".*?"|[^",\r\n]+)(?=\s*,|\s*$)/g;

  return lines.filter(line => line.trim() !== '').map(line => {
    const values = line.match(regex) || [];
    const product = {};

    headers.forEach((header, index) => {
      if (index < values.length) {
        let value = values[index].trim();

        // Remove quotes from the start and end of the value.
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        
        // For the 'price' column, remove commas and then parse as an integer.
        if (header === 'price') {
          const priceString = value.replace(/,/g, '');
          product[header] = parseInt(priceString, 10) || 0; // Default to 0 if parsing fails.
        } else {
          product[header] = value;
        }
      } else {
        product[header] = ''; // Handle rows with fewer columns than headers.
      }
    });
    return product;
  });
}

/**
 * 商品の配列をグループ名で分類します。
 * @param {Array<Object>} products - 商品オブジェクトの配列
 * @returns {Object} グループ名をキー、商品配列を値とするオブジェクト
 */
function groupProducts(products) {
  return products.reduce((acc, product) => {
    const group = product.group || 'その他';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(product);
    return acc;
  }, {});
}

/**
 * 選択された商品の合計金額を計算し、表示します。
 * @returns {boolean} バリデーションに成功した場合はtrue、失敗した場合はfalse
 */
function calculateTotal() {
    let totalPrice = 0;
    let totalSize = 0;
    const orders = []; // 注文内容を格納する配列
    const quantitySelects = document.querySelectorAll('.quantity');

    // 骨格と基本セットの数量をカウントするための変数を初期化
    let qtyLStyleSkeleton = 0; // Lサイズ骨格
    let qtyLStyleBaseSet = 0;  // L立ちスタイル基本セット
    let qtySStyleSkeleton = 0; // Sサイズ骨格
    let qtySStyleBaseSet = 0;  // Sサイズ基本セット



    quantitySelects.forEach(select => {
        const quantity = parseInt(select.value, 10);
        if (quantity > 0) {
            // selectのname属性 (qty_a1) から商品ID (a1) を抽出
            const productCd = select.name.replace('qty_', '');
            const product = productsData[productCd];
            if (product && product.price) {
                totalPrice += product.price * quantity;
                totalSize += product.size * quantity;

                // 注文情報を配列に追加
                orders.push({
                    productcd: product.productcd,
                    p_fullname: product.p_fullname,
                    quantity: quantity
                });

                // Lサイズ：骨格と基本セットの数量をそれぞれカウント
                if (product.productcd === '101_LO_0000_01') {
                    qtyLStyleSkeleton += quantity;
                }
                if (product.productcd.includes('101_LB')) {
                    qtyLStyleBaseSet += quantity;
                }

                // Sサイズ：骨格と基本セットの数量をそれぞれカウント
                if (product.productcd === '301_SO_0000_01') {
                    qtySStyleSkeleton += quantity;
                }
                if (product.productcd.includes('301_SB')) {
                    qtySStyleBaseSet += quantity;
                }
            }
        }
    });

    // バリデーション：骨格の数量が基本セットの数量を超えている場合はエラーを表示して処理を中断
    if (qtyLStyleSkeleton > qtyLStyleBaseSet) {
        alert('「骨格_Lサイズ用」の数量が「L立ちスタイル基本セット」の数量を超えています。');
        return false; // これ以降の処理を中断
    }
    if (qtySStyleSkeleton > qtySStyleBaseSet) {
        alert('「骨格_Sサイズ用」の数量が「Sサイズ基本セット」の数量を超えています。');
        return false; // これ以降の処理を中断
    }

    const totalPriceElement = document.getElementById('totalPrice');
    totalPriceElement.textContent = `¥${totalPrice.toLocaleString()}`;

    const totalSizeElement = document.getElementById('totalSize');
    if (totalSizeElement) {
      totalSizeElement.textContent = totalSize.toLocaleString();
    }

    // コメント欄の内容を取得
    const commentText = document.querySelector('textarea[name="comment"]').value;

    // 計算結果と注文内容をセッションストレージに保存し、別画面で使えるようにする
    sessionStorage.setItem('totalPrice', totalPrice);
    sessionStorage.setItem('totalSize', totalSize);
    sessionStorage.setItem('commentText', commentText); // コメントを保存
    // 配列はJSON文字列に変換して保存
    sessionStorage.setItem('orders', JSON.stringify(orders));

    // 計算が完了したことを示すフラグを立てる
    isTotalCalculated = true;

    // 合計サイズに基づいて配送方法の選択肢を生成・表示
    populateShippingOptions(totalSize, orders);

    return true; // 成功
}

/**
 * 注文内容に基づいて配送方法の選択肢をプルダウンに設定します。
 * (shipping_option_utf8bom.ps1 のロジックをJavaScriptに移植)
 * @param {number} totalSize - 注文の合計サイズ
 * @param {Array<Object>} orders - 注文内容の配列
 */
function populateShippingOptions(totalSize, orders) {
  const shippingMethodSelect = document.getElementById('shippingMethod');
  const shippingContainer = document.getElementById('shippingMethodContainer');

  // 既存の選択肢をクリア（「選択してください」は残す）
  while (shippingMethodSelect.options.length > 1) {
    shippingMethodSelect.remove(1);
  }

  let shipOption = [];

  // 注文内容を分析
  const b_orders = orders.filter(o => o.productcd.includes('B'));
  const sb_orders = orders.filter(o => o.productcd.includes('SB'));
  const lb_orders = orders.filter(o => o.productcd.includes('LB'));
  const lb101_orders = orders.filter(o => o.productcd.includes('101_LB'));

  // 1. 着せ替え、アイテムのみ（基本セットなし）
  if (b_orders.length === 0) {
    if (totalSize <= 360) {
      shipOption = [
        "レターパックライト",
        "クロネコ宅急便コンパクトの匿名配送"
      ];
    } else { // totalSize > 360
      shipOption = [
        "レターパックプラス",
        "クロネコ宅急便コンパクトの匿名配送"
      ];
    }
  }
  // 2. S基本 + その他（L基本なし）
  else if (sb_orders.length > 0 && lb_orders.length === 0) {
    if (totalSize <= 720) {
      shipOption = [
        "レターパックプラス",
        "クロネコ宅急便コンパクトの匿名配送"
      ];
    } else if (totalSize > 720 && totalSize <= 1160) {
      shipOption = [
        "レターパックプラス",
        "クロネコ宅急便の匿名配送（60サイズ）"
      ];
    }
  }
  // 3. L基本が含まれている
  else if (lb_orders.length > 0) {
    // 3-1. L基本立位のみ + その他
    if (lb101_orders.length > 0 && totalSize <= 1160) {
      shipOption = [
        "レターパックプラス",
        "ゆうパックで郵便局受け取り(60サイズ)",
        "ゆうパック(60サイズ)",
        "クロネコ宅急便の匿名配送(60サイズ)"
      ];
    }
    // 3-2. L基本立位and/or座位 + その他
    else if (totalSize <= 2799) {
      shipOption = [
        "ゆうパックで郵便局受け取り(60サイズ)",
        "ゆうパック(60サイズ)",
        "クロネコ宅急便の匿名配送(60サイズ)"
      ];
    } else { // totalSize > 2799
      shipOption = [
        "ゆうパックで郵便局受け取り(80サイズ)",
        "ゆうパック(80サイズ)",
        "クロネコ宅急便の匿名配送(80サイズ)"
      ];
    }
  }

  // プルダウンメニューに選択肢を追加
  if (shipOption.length > 0) {
    shipOption.forEach(optionText => {
      const option = document.createElement('option');
      option.value = optionText;
      option.textContent = optionText;
      shippingMethodSelect.appendChild(option);
    });
  }

  // 配送方法セクションを表示
  shippingContainer.style.display = 'block';
}