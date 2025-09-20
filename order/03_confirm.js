document.addEventListener('DOMContentLoaded', () => {
  // sessionStorageから各種情報を取得
  const ordersJSON = sessionStorage.getItem('orders');
  const commentText = sessionStorage.getItem('commentText');
  const customerInfoJSON = sessionStorage.getItem('customerInfo');
  const totalPrice = sessionStorage.getItem('totalPrice');
  const shippingFee = sessionStorage.getItem('shippingFee');
  const grandTotal = sessionStorage.getItem('grandTotal');

  // 必須情報が欠けている場合は、前のページに戻す
  if (!ordersJSON || !customerInfoJSON || !totalPrice || !shippingFee || !grandTotal) {
    alert('注文情報が不足しています。お手数ですが、最初からやり直してください。');
    window.location.href = '01_order5.html';
    return;
  }

  // JSON文字列をオブジェクトにパース
  const orders = JSON.parse(ordersJSON);
  const customerInfo = JSON.parse(customerInfoJSON);

  // 1. 注文商品と個数を表示
  const orderListElement = document.getElementById('orderList');
  if (orders.length > 0) {
    orders.forEach(order => {
      const listItem = document.createElement('li');
      listItem.textContent = `${order.p_fullname} × ${order.quantity}`;
      orderListElement.appendChild(listItem);
    });
  }

  // 2. コメントを表示
  const commentDisplayElement = document.getElementById('commentDisplay');
  if (commentText && commentText.trim() !== '') {
    // 改行を<br>に変換して表示
    commentDisplayElement.innerHTML = commentText.replace(/\n/g, '<br>');
  } else {
    commentDisplayElement.textContent = 'なし';
  }

  // 3. お客様情報を表示
  document.getElementById('customerName').textContent = customerInfo.name;
  
  // 住所を連結して表示
  const fullAddress = `${customerInfo.address1} ${customerInfo.address2} ${customerInfo.address3 || ''}`.trim();
  document.getElementById('customerAddress').textContent = fullAddress;
  
  document.getElementById('customerEmail').textContent = customerInfo.email;
  document.getElementById('customerTel').textContent = customerInfo.tel || 'なし';
  document.getElementById('shippingMethod').textContent = customerInfo.shippingMethod;

  // 4. 金額情報を表示
  document.getElementById('orderTotal').textContent = `¥${Number(totalPrice).toLocaleString()}`;
  document.getElementById('shippingFee').textContent = `¥${Number(shippingFee).toLocaleString()}`;
  document.getElementById('grandTotal').textContent = `¥${Number(grandTotal).toLocaleString()}`;

  // フォーム送信時の処理（注文確定）
  const finalOrderForm = document.getElementById('finalOrderForm');
  if (finalOrderForm) {
    finalOrderForm.addEventListener('submit', (event) => {
      // このボタンの役割は、入力内容を最終確認して決済ページに進むことです。
      // sessionStorageにデータは保存済みなので、ここでは特別な処理は不要です。
      // フォームのデフォルトのsubmit動作（action属性で指定されたページへの遷移）をそのまま実行します。
      console.log('お支払い画面へ遷移します...');
    });
  }
});