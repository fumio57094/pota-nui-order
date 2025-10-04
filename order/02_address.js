/**
 * このファイルは、顧客情報入力ページ（02_address.html）で読み込まれることを想定しています。
 * sessionStorageに保存された注文情報を読み込み、ページに表示したり、
 * 次の処理に利用したりします。
 */

// 送料データを格納する配列と、送料計算済みかを追跡するフラグ
let shippingFeeData = [];
let isShippingFeeCalculated = false;

document.addEventListener('DOMContentLoaded', () => {
  loadShippingFeeData(); // 最初に送料データを読み込む
  const totalPrice = sessionStorage.getItem('totalPrice');
  const totalSize = sessionStorage.getItem('totalSize');
  const commentText = sessionStorage.getItem('commentText');
  const ordersJSON = sessionStorage.getItem('orders');
  const shippingMethodFromSession = sessionStorage.getItem('shippingMethod');

  // 'orders'はJSON文字列として保存されているため、JavaScriptオブジェクトにパースする
  const orders = ordersJSON ? JSON.parse(ordersJSON) : [];

  // 取得したデータがnullやundefinedでないかチェック
  if (totalPrice !== null && totalSize !== null && orders.length > 0) {
    // 注文金額を初期表示
    document.getElementById('orderTotal').textContent = `¥${Number(totalPrice).toLocaleString()}`;

    // 配送方法を表示
    const shippingMethodDisplay = document.getElementById('shippingMethodDisplay');
    if (shippingMethodDisplay) {
      shippingMethodDisplay.textContent = shippingMethodFromSession || '（未選択）';
    }

    // 取得したデータを使ってページの内容を更新するなどの処理をここに追加します。
    // 例として、コンソールに取得した情報を出力します。
    console.log('--- 注文情報 ---');
    console.log('合計金額:', `¥${Number(totalPrice).toLocaleString()}`);
    console.log('合計サイズ:', totalSize);
    console.log('注文内容:', orders);
    console.log('コメント:', commentText);

  } else {
    // 注文情報がsessionStorageにない場合の処理
    console.error('注文情報がセッションストレージに見つかりません。');
    alert('注文情報が見つかりませんでした。お手数ですが、もう一度商品を選択してください。');
    // 注文ページにリダイレクトする
    window.location.href = 'index.html';
  }

  // 「送料を確認する」ボタンのイベントリスナーを追加
  const calcButton = document.getElementById('calculateShippingFeeButton');
  if (calcButton) {
    calcButton.addEventListener('click', calculateShippingFee);
  }

  // フォームのsubmitイベントを処理
  const customerForm = document.getElementById('customerForm');
  if (customerForm) {
    customerForm.addEventListener('submit', (event) => {
      // フォームのデフォルトの送信動作を一旦キャンセル
      event.preventDefault();

      // 送料が確認されていない場合はアラートを表示して中断
      if (!isShippingFeeCalculated) {
        alert('「送料を確認する」ボタンを押して、送料を確定してください。');
        return;
      }

      // メールアドレスのバリデーションを実行
      if (!validateEmail()) {
        // バリデーションに失敗した場合は、ここで処理を中断
        return;
      }

      const shippingMethod = sessionStorage.getItem('shippingMethod');
      if (!shippingMethod) {
        alert('配送方法が設定されていません。お手数ですが、商品選択画面からやり直してください。');
        return;
      }

      // ページ遷移直前に最新の状態で送料を再計算・保存
      if (!calculateShippingFee()) {
        // calculateShippingFeeがバリデーション等で失敗した場合は遷移しない
        return;
      }

      // バリデーションが成功した場合の処理
      // 入力された顧客情報をオブジェクトとしてまとめる
      const customerInfo = {
        name: document.getElementById('name').value,
        zipcode: document.getElementById('zipcode').value,
        address1: document.getElementById('address1').value,
        address2: document.getElementById('address2').value,
        address3: document.getElementById('address3').value,
        email: document.getElementById('email').value,
        tel: document.getElementById('tel').value,
        shippingMethod: shippingMethod, // 選択された配送方法を追加
      };

      // 顧客情報をJSON文字列に変換してsessionStorageに保存
      sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo));

      // すべての処理が完了したら、フォームをプログラム的に送信して次のページへ遷移
      customerForm.submit();
    });
  }

  // フォームの入力が変更されたら、送料計算済みフラグと表示をリセット
  const formInputs = document.querySelectorAll('#customerForm input, #customerForm select');
  formInputs.forEach(input => {
    input.addEventListener('change', () => {
      isShippingFeeCalculated = false;
      document.getElementById('shippingFee').textContent = '¥0';
      document.getElementById('grandTotal').textContent = '¥0';
    });
  });
});

/**
 * メールアドレスの形式を検証する関数
 * @returns {boolean} - 有効な場合はtrue、無効な場合はfalse
 */
function validateEmail() {
  const emailInput = document.getElementById('email');
  const email = emailInput.value;

  // 全角文字が含まれているかチェック
  if (/[^\x01-\x7E]/.test(email)) {
    alert('メールアドレスに全角文字は使用できません。');
    emailInput.focus();
    return false;
  }

  // @が含まれているか、などの基本的な形式チェック
  const emailRegex = /^[a-zA-Z0-9_+-]+(\.[a-zA-Z0-9_+-]+)*@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/;
  if (email.length > 0 && !emailRegex.test(email)) {
    alert('有効なメールアドレスの形式ではありません。（例: example@example.com）');
    emailInput.focus();
    return false;
  }

  // バリデーション成功
  return true;
}

/**
 * shipfee.csvを読み込み、グローバル変数に格納する
 */
async function loadShippingFeeData() {
  try {
    const response = await fetch('files/shipfee.csv');
    if (!response.ok) {
      throw new Error(`shipfee.csvの読み込みに失敗しました: ${response.statusText}`);
    }
    const csvText = await response.text();
    // BOMを削除
    const cleanedCsvText = csvText.startsWith('\uFEFF') ? csvText.substring(1) : csvText;
    shippingFeeData = parseShipFeeCSV(cleanedCsvText);
  } catch (error) {
    console.error('送料データの読み込み中にエラーが発生しました:', error);
    alert('送料データの読み込みに失敗しました。ページを再読み込みしてください。');
  }
}

/**
 * 送料CSVをパースする
 * @param {string} csvText
 * @returns {Array<Object>}
 */
function parseShipFeeCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines.shift().split(',');
  return lines.filter(line => line.trim() !== '').map(line => {
    const values = line.split(',');
    const feeEntry = {};
    headers.forEach((header, index) => {
      feeEntry[header.trim()] = values[index] ? values[index].trim() : '';
    });
    return feeEntry;
  });
}

/**
 * 送料を計算して表示する関数
 * @returns {boolean} - 計算と保存が成功した場合はtrue、失敗した場合はfalse
 */
function calculateShippingFee() {
  const form = document.getElementById('customerForm');
  // 必須項目が入力されているかチェック
  if (!form.checkValidity()) {
    alert('お名前、住所、メールアドレスなど、必須項目をすべて入力してください。');
    const firstInvalid = form.querySelector(':invalid');
    if (firstInvalid) {
      firstInvalid.focus();
    }
    return false;
  }

  const shippingMethod = sessionStorage.getItem('shippingMethod');
  const address1 = document.getElementById('address1').value;

  // 住所1から都道府県を抽出
  const prefectureRegex = /(東京都|北海道|京都府|大阪府|.{2,3}県)/;
  const prefectureMatch = address1.match(prefectureRegex);
  const prefecture = prefectureMatch ? prefectureMatch[0] : null;

  let shippingFee = 0;
  
  // まず、全国一律料金の配送方法をCSVから探す (prefectureが'全国一律'のもの)
  let feeEntry = shippingFeeData.find(entry =>
    entry.method === shippingMethod && entry.prefecture === '全国一律'
  );

  // 全国一律で見つからない場合、都道府県別の料金を探す
  if (!feeEntry) {
    // 都道府県別の料金を探す場合、都道府県の入力は必須
    if (!prefecture) {
      alert('住所から都道府県を特定できませんでした。住所1（都道府県・市区町村）を正しく入力してください。');
      document.getElementById('address1').focus();
      return false;
    }
    feeEntry = shippingFeeData.find(entry =>
      entry.method === shippingMethod && entry.prefecture === prefecture
    );
  }

  if (feeEntry && feeEntry.shipfee) {
    shippingFee = parseInt(feeEntry.shipfee, 10);
  } else {
    // 全国一律でも都道府県別でも見つからなかった場合
    alert('選択された配送方法と都道府県に対応する送料が見つかりませんでした。入力内容を確認してください。');
    return false;
  }

  const orderTotal = Number(sessionStorage.getItem('totalPrice') || 0);
  const grandTotal = orderTotal + shippingFee;

  // 表示を更新
  document.getElementById('orderTotal').textContent = `¥${orderTotal.toLocaleString()}`;
  document.getElementById('shippingFee').textContent = `¥${shippingFee.toLocaleString()}`;
  document.getElementById('grandTotal').textContent = `¥${grandTotal.toLocaleString()}`;

  // sessionStorageに保存
  sessionStorage.setItem('shippingFee', shippingFee);
  sessionStorage.setItem('grandTotal', grandTotal);

  // --- 注文番号を生成 ---
  // 注文番号がまだ生成されていない場合のみ、新しい番号を生成する
  if (!sessionStorage.getItem('orderId')) {
    const generateOrderId = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      // 重複確率をさらに下げるためのランダムな文字列
      const randomPart = Math.random().toString(36).slice(-5).toUpperCase();
      return `${year}${month}${day}-${hours}${minutes}${seconds}-${randomPart}`;
    };
    sessionStorage.setItem('orderId', generateOrderId());
  }

  // 計算済みフラグを立てる
  isShippingFeeCalculated = true;
  return true;
}