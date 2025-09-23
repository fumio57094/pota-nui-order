document.addEventListener('DOMContentLoaded', () => {
  // sessionStorageから合計金額を取得
  const grandTotal = sessionStorage.getItem('grandTotal');

  // 金額情報がない場合は、最初のページに戻す
  if (!grandTotal) {
    alert('お支払い情報が見つかりませんでした。お手数ですが、最初からやり直してください。');
    window.location.href = 'index.html';
    return;
  }

  // お支払い金額を表示
  document.getElementById('grandTotal').textContent = `¥${Number(grandTotal).toLocaleString()}`;

  // --- ここからAmazon Payの処理 ---
  // 実際のAmazon Pay連携では、ここにボタンをレンダリングする処理を記述します。
  // バックエンドから取得した checkoutSessionId が必要になります。

  /*
  // 【サンプルコード：実際にはバックエンドとの連携が必要】
  async function mountAmazonPayButton() {
    try {
      // 1. バックエンドにリクエストを送り、Amazon PayのチェックアウトセッションIDを取得する
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          // その他、注文IDなどの情報
        })
      });
      
      if (!response.ok) {
        throw new Error('チェックアウトセッションの作成に失敗しました。');
      }

      const { checkoutSessionId } = await response.json();

      // 2. 取得したIDを使ってAmazon Payボタンをレンダリングする
      const amazonPayButton = amazon.Pay.renderButton('#amazonPayButton', {
        merchantId: 'YOUR_MERCHANT_ID', // ご自身のAmazon PayマーチャントIDに置き換えてください
        checkoutSessionId: checkoutSessionId,
        ledgerCurrency: 'JPY',
        buttonColor: 'Gold',
        buttonType: 'AmazonPay',
        buttonSize: 'medium',
      });

    } catch (error) {
      console.error('Amazon Payボタンの表示に失敗しました:', error);
      document.getElementById('amazonPayButton').textContent = '決済ボタンの表示に失敗しました。時間をおいて再度お試しください。';
    }
  }

  mountAmazonPayButton();
  */

  // 現時点では、決済完了をシミュレートするダミーボタンを表示します
  const dummyButton = document.createElement('button');
  dummyButton.className = 'dummy-amazon-pay-button';
  dummyButton.textContent = 'Amazon Pay で支払う（開発用ダミー）';
  dummyButton.onclick = () => {
    // --- 注文番号を生成 ---
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
    const orderId = generateOrderId();

    // 注文番号をsessionStorageに保存
    sessionStorage.setItem('orderId', orderId);

    // TODO: 本番実装時には、ここでサーバーに最終的な注文データを送信します。
    alert('決済が完了したと仮定して、完了ページへ進みます。');
    
    // location.hrefによるリダイレクトではなく、フォームを生成して送信することで、
    // file:// プロトコルなど特定の環境下でのセッションストレージの引き継ぎ問題を回避します。
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = '05_complete.html';
    document.body.appendChild(form);
    form.submit();
  };
  document.getElementById('amazonPayButton').appendChild(dummyButton);
});