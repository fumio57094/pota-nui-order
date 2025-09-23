/**
 * このファイルは、匿名配送選択時の顧客情報入力ページ（02_address3.html）で読み込まれます。
 * 住所入力が不要なため、処理を簡略化しています。
 */

// 送料データを格納する配列
let shippingFeeData = [];
let isShippingFeeCalculated = false;

document.addEventListener('DOMContentLoaded', async () => {
  // 最初に送料データを非同期で読み込み、完了を待つ
  await loadShippingFeeData();

  const totalPrice = sessionStorage.getItem('totalPrice');
  const totalSize = sessionStorage.getItem('totalSize');
  const commentText = sessionStorage.getItem('commentText');
  const ordersJSON = sessionStorage.getItem('orders');
  const shippingMethodFromSession = sessionStorage.getItem('shippingMethod');

  const orders = ordersJSON ? JSON.parse(ordersJSON) : [];

  if (totalPrice !== null && totalSize !== null && orders.length > 0) {
    document.getElementById('orderTotal').textContent = `¥${Number(totalPrice).toLocaleString()}`;

    const shippingMethodDisplay = document.getElementById('shippingMethodDisplay');
    if (shippingMethodDisplay) {
      shippingMethodDisplay.textContent = shippingMethodFromSession || '（未選択）';
    }

    // // ページロード時に送料を自動計算して表示 -> ボタンクリックでの計算に変更
    // calculateShippingFee();

    console.log('--- 注文情報（匿名配送） ---');
    console.log('合計金額:', `¥${Number(totalPrice).toLocaleString()}`);
    console.log('注文内容:', orders);
    console.log('配送方法:', shippingMethodFromSession);

  } else {
    console.error('注文情報がセッションストレージに見つかりません。');
    alert('注文情報が見つかりませんでした。お手数ですが、もう一度商品を選択してください。');
    window.location.href = 'index.html';
  }

  // 「送料を確認する」ボタンのイベントリスナーを追加
  const calcButton = document.getElementById('calculateShippingFeeButton');
  if (calcButton) {
    calcButton.addEventListener('click', calculateShippingFee);
  }

  const customerForm = document.getElementById('customerForm');
  if (customerForm) {
    customerForm.addEventListener('submit', (event) => {
      event.preventDefault();

      // 送料が確認されていない場合はアラートを表示して中断
      if (!isShippingFeeCalculated) {
        alert('「送料を確認する」ボタンを押して、送料を確定してください。');
        return;
      }

      if (!validateEmail()) {
        return;
      }

      const shippingMethod = sessionStorage.getItem('shippingMethod');
      if (!shippingMethod) {
        alert('配送方法が設定されていません。お手数ですが、商品選択画面からやり直してください。');
        return;
      }

      // ページ遷移直前に最新の状態で送料を再計算・保存
      if (!calculateShippingFee()) {
        return;
      }

      // 匿名配送用の顧客情報オブジェクトを作成
      const customerInfo = {
        name: document.getElementById('name').value, // ニックネーム
        zipcode: '',
        address1: document.getElementById('prefecture').value, // 都道府県
        address2: '（匿名配送）',
        address3: '',
        email: document.getElementById('email').value,
        tel: '', // 電話番号は空
        shippingMethod: shippingMethod,
      };

      sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo));
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

  if (/[^\x01-\x7E]/.test(email)) {
    alert('メールアドレスに全角文字は使用できません。');
    emailInput.focus();
    return false;
  }

  const emailRegex = /^[a-zA-Z0-9_+-]+(\.[a-zA-Z0-9_+-]+)*@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/;
  if (email.length > 0 && !emailRegex.test(email)) {
    alert('有効なメールアドレスの形式ではありません。（例: example@example.com）');
    emailInput.focus();
    return false;
  }

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
 * 匿名配送の送料を計算して表示する関数（都道府県ベース）
 * @returns {boolean} - 計算と保存が成功した場合はtrue、失敗した場合はfalse
 */
function calculateShippingFee() {
  const form = document.getElementById('customerForm');
  // 必須項目が入力されているかチェック
  if (!form.checkValidity()) {
    alert('ニックネーム、お住まいの都道府県、メールアドレスをすべて入力してください。');
    const firstInvalid = form.querySelector(':invalid');
    if (firstInvalid) {
      firstInvalid.focus();
    }
    return false;
  }

  const shippingMethod = sessionStorage.getItem('shippingMethod');
  const prefecture = document.getElementById('prefecture').value;

  let shippingFee = 0;
  
  // 配送方法と都道府県で送料を検索
  let feeEntry = shippingFeeData.find(entry =>
    entry.method === shippingMethod && entry.prefecture === prefecture
  );

  // 都道府県別の料金が見つからない場合、全国一律の料金を探す（レターパックなどに対応するため）
  if (!feeEntry) {
    feeEntry = shippingFeeData.find(entry =>
      entry.method === shippingMethod && entry.prefecture === '全国一律'
    );
  }

  if (feeEntry && feeEntry.shipfee) {
    shippingFee = parseInt(feeEntry.shipfee, 10);
  } else {
    // それでも見つからない場合
    alert('選択された配送方法と都道府県に対応する送料が見つかりませんでした。');
    return false;
  }

  const orderTotal = Number(sessionStorage.getItem('totalPrice') || 0);
  const grandTotal = orderTotal + shippingFee;

  // 表示を更新
  document.getElementById('shippingFee').textContent = `¥${shippingFee.toLocaleString()}`;
  document.getElementById('grandTotal').textContent = `¥${grandTotal.toLocaleString()}`;

  sessionStorage.setItem('shippingFee', shippingFee);
  sessionStorage.setItem('grandTotal', grandTotal);

  // 計算済みフラグを立てる
  isShippingFeeCalculated = true;
  return true;
}