document.addEventListener('DOMContentLoaded', () => {
  // sessionStorageから合計金額を取得
  const grandTotal = sessionStorage.getItem('grandTotal');

  // 金額情報がない場合は、最初のページに戻す
  if (!grandTotal) {
    alert('お支払い情報が見つかりませんでした。お手数ですが、最初からやり直してください。');
    window.location.href = '01_order5.html';
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
    alert('決済が完了したと仮定して、完了ページへ進みます。');
    window.location.href = '05_complete.html'; // 完了画面のファイル名に合わせてください
  };
  document.getElementById('amazonPayButton').appendChild(dummyButton);
});