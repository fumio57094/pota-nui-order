document.addEventListener('DOMContentLoaded', () => {
  const orderId = sessionStorage.getItem('orderId');

  // 注文番号がない場合は不正なアクセスとみなし、トップページに戻す
  if (!orderId) {
    alert('注文情報が見つかりませんでした。');
    window.location.href = 'index.html';
    return;
  }

  // 注文完了メッセージに注文番号を埋め込む
  const messageElement = document.getElementById('completionMessage');
  messageElement.textContent = `ご注文を承りました。注文番号は ${orderId} です。`;

  // メール再送ボタンの処理
  const resendButton = document.getElementById('resendEmailButton');
  if (resendButton) {
    resendButton.addEventListener('click', () => {
      const customerInfoJSON = sessionStorage.getItem('customerInfo');
      if (!customerInfoJSON) {
        alert('顧客情報が見つからず、メールを再送できません。');
        return;
      }
      const customerInfo = JSON.parse(customerInfoJSON);
      const email = customerInfo.email;

      // --- TODO: 本番実装時には、ここにサーバーサイドへのメール再送APIを呼び出す処理を記述 ---
      // 例:
      // fetch('/api/resend-email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ orderId: orderId, email: email })
      // });
      // ----------------------------------------------------------------

      // 今回はサーバーサイドがないため、UI上でのみ完了メッセージを表示
      console.log(`【開発用ログ】メール再送処理を実行。宛先: ${email}, 注文番号: ${orderId}`);
      const statusMessage = document.getElementById('resendStatusMessage');
      statusMessage.textContent = `${email} 宛に確認メールを再送しました。`;
      
      // ボタンを一時的に無効化して連打を防ぐ
      resendButton.disabled = true;
      setTimeout(() => {
        resendButton.disabled = false;
        statusMessage.textContent = ''; // メッセージをクリア
      }, 5000); // 5秒後に再度押せるようにする
    });
  }

  // 注文が完了したら、カート情報（商品選択など）は不要になるのでクリアする
  // これにより、ユーザーがトップページに戻ったときに前回の選択が残らないようにする
  // ただし、注文情報（customerInfo, orderIdなど）はメール再送のために残しておく
  sessionStorage.removeItem('totalPrice');
  sessionStorage.removeItem('totalSize');
  sessionStorage.removeItem('orders');
  sessionStorage.removeItem('commentText');
  sessionStorage.removeItem('shippingMethod');
  sessionStorage.removeItem('addressPage');
  sessionStorage.removeItem('shippingFee');
  sessionStorage.removeItem('grandTotal');
});