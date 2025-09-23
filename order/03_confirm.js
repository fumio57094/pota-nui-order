document.addEventListener('DOMContentLoaded', () => {
  // --- ページ読み込み時のデータ表示処理 ---
  const ordersJSON = sessionStorage.getItem('orders');
  const commentText = sessionStorage.getItem('commentText');
  const customerInfoJSON = sessionStorage.getItem('customerInfo');
  const totalPrice = sessionStorage.getItem('totalPrice');
  const shippingFee = sessionStorage.getItem('shippingFee');
  const grandTotal = sessionStorage.getItem('grandTotal');

  // 必須情報が欠けている場合は、最初のページにリダイレクト
  if (!ordersJSON || !customerInfoJSON || !grandTotal) {
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
  document.getElementById('customerName').textContent = customerInfo.name || '（未入力）';
  
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


  // --- 「入力画面に戻る」ボタンの動的なリンク設定 ---
  const backButton = document.getElementById('backToAddressButton');
  if (backButton) {
    // 「入力画面に戻る」ボタンは、常に直前のページ（住所入力画面 or 支払い画面）に戻る
    backButton.onclick = () => {
      history.back();
    };
  }
});