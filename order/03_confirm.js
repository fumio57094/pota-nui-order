let isCopied = false; // 注文内容がコピーされたかを追跡するフラグ

document.addEventListener('DOMContentLoaded', () => {
  // --- ページ読み込み時のデータ表示処理 ---
  const ordersJSON = sessionStorage.getItem('orders');
  const commentText = sessionStorage.getItem('commentText');
  const customerInfoJSON = sessionStorage.getItem('customerInfo');
  const totalPrice = sessionStorage.getItem('totalPrice');
  const shippingFee = sessionStorage.getItem('shippingFee');
  const grandTotal = sessionStorage.getItem('grandTotal');
  const orderId = sessionStorage.getItem('orderId');

  // 必須情報が欠けている場合は、最初のページにリダイレクト
  if (!ordersJSON || !customerInfoJSON || !grandTotal || !orderId) {
    alert('注文情報が不完全です。お手数ですが、最初からやり直してください。');
    window.location.href = 'index.html';
    return;
  }

  const orders = JSON.parse(ordersJSON);
  const customerInfo = JSON.parse(customerInfoJSON);

  // 1. ご注文商品の表示
  const orderList = document.getElementById('orderList');
  if (orders.length > 0) {
    orderList.innerHTML = ''; // 既存の内容をクリア
    orders.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.p_fullname} × ${item.quantity}`;
      orderList.appendChild(li);
    });
  }

  // 2. コメントの表示
  const commentDisplay = document.getElementById('commentDisplay');
  if (commentText && commentText.trim() !== '') {
    commentDisplay.textContent = commentText;
  } else {
    commentDisplay.textContent = 'なし';
  }

  // 3. お客様情報の表示
  document.getElementById('orderId').textContent = orderId || '（未発行）';  
  document.getElementById('customerName').textContent = customerInfo.name ? `${customerInfo.name} 様` : '（未入力）';
  
  // 住所の組み立て
  const addressParts = [
    customerInfo.address1,
    customerInfo.address2,
    customerInfo.address3
  ].filter(part => part && part.trim() !== ''); // 空の要素を除外
  document.getElementById('customerAddress').textContent = addressParts.join(' ') || '（未入力）';

  document.getElementById('customerEmail').textContent = customerInfo.email || '（未入力）';
  document.getElementById('customerTel').textContent = customerInfo.tel || 'なし';
  document.getElementById('shippingMethod').textContent = customerInfo.shippingMethod || '（未選択）';

  // 4. お支払い金額の表示
  document.getElementById('orderTotal').textContent = `¥${Number(totalPrice || 0).toLocaleString()}`;
  document.getElementById('shippingFee').textContent = `¥${Number(shippingFee || 0).toLocaleString()}`;
  document.getElementById('grandTotal').textContent = `¥${Number(grandTotal || 0).toLocaleString()}`;

  // 5. Googleフォームへのリンクを設定
  const googleFormLink = document.getElementById('googleFormLink');
  if (googleFormLink && typeof config !== 'undefined' && config.googleFormUrl) {
    googleFormLink.href = config.googleFormUrl;
  }

  // 6. 「注文フォームへ」ボタンクリック時にカート情報をクリア
  //    ユーザーがフォームへ遷移した時点で、現在の注文は完了したとみなし、
    //    トップページに戻ったときにカートが空になるようにする。
  if (googleFormLink) {
    googleFormLink.addEventListener('click', (event) => {
      // まだコピーされていない場合は、アラートを表示して遷移を中止する
      if (!isCopied) {
        event.preventDefault(); // リンク先への遷移をキャンセル
        alert('先に「この内容をコピーする」ボタンを押して、注文内容をコピーしてください。');
        return;
      }

      // コピー済みの場合は、カート情報をクリアしてページ遷移を続行する
      // （注文番号や顧客情報は、ユーザーが戻ってきてコピーし直す可能性を考慮して残す）
      sessionStorage.removeItem('totalPrice');
      sessionStorage.removeItem('totalSize');
      sessionStorage.removeItem('orders');
      sessionStorage.removeItem('commentText');
      sessionStorage.removeItem('shippingFee');
      sessionStorage.removeItem('grandTotal');
    });
  }

window.copyOrderSummary = function () {
  const items = Array.from(document.querySelectorAll("#orderList li"))
    .map(li => li.textContent)
    .join("\n");

  const orderIdText = document.getElementById("orderId").textContent;
  const comment = document.getElementById("commentDisplay").textContent;
  const name = document.getElementById("customerName").textContent;
  const address = document.getElementById("customerAddress").textContent;
  const email = document.getElementById("customerEmail").textContent;
  const tel = document.getElementById("customerTel").textContent;
  const shipping = document.getElementById("shippingMethod").textContent;
  const total = document.getElementById("orderTotal").textContent;
  const fee = document.getElementById("shippingFee").textContent;
  const grand = document.getElementById("grandTotal").textContent;

  const text = [
    "【注文番号】",
    orderIdText,
    "", // ← 空白行
    "【ご注文商品】",
    items,
    "", // ← 空白行
    "【コメント】",
    comment,
    "", // ← 空白行
    "【お客様情報】",
    "お名前:",
    name,
    "", // ← 空白行
    "ご住所:",
    address,
    "", // ← 空白行
    "メールアドレス:",
    email,
    "", // ← 空白行
    "電話番号:",
    tel,
    "", // ← 空白行
    "【配送方法】",
    shipping,
    "", // ← 空白行
    "【お支払い金額】",
    "ご注文金額:",
    total,
    "", // ← 空白行
    "送料:",
    fee,
    "", // ← 空白行
    "合計金額（送料込み）:",
    grand
  ].join("\n");

  navigator.clipboard.writeText(text)
    .then(() => {
      alert("注文内容をコピーしました！");
      isCopied = true; // コピー成功時にフラグを立てる
    }) 
    .catch(() => alert("コピーに失敗しました。"));
};


  // --- 「入力画面に戻る」ボタンの動的なリンク設定 ---
  const backButton = document.getElementById('backToAddressButton');
  if (backButton) {
    // 「入力画面に戻る」ボタンは、常に直前のページ（住所入力画面 or 支払い画面）に戻る
    backButton.onclick = () => {
      history.back();
    };
  }
});