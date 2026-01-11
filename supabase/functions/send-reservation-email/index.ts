import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { customerEmail, customerName, shopName, startTime, services, shopEmail, cancelUrl } = await req.json()
    
    // 💡 金庫から最新の鍵を取り出す
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // --- 💡 共通のメール送信関数（宛先によって文面を切り替える） ---
    const sendMail = async (to: string, isOwner: boolean) => {
      const subject = isOwner ? `【新着予約】${customerName} 様` : `予約完了のお知らせ：${customerName} 様`;
      const title = isOwner ? "新着予約のお知らせ（店舗控え）" : "予約完了のお知らせ";
      const greeting = isOwner ? `${shopName} 管理者様` : `${customerName} 様`;
      const bodyPrefix = isOwner ? "以下の通り、新しい予約が入りました。" : `この度は ${shopName} をご利用いただきありがとうございます。`;

      return await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: '予約管理システム <infec@snipsnap.biz>',
          to: [to],
          subject: subject,
          html: `
            <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
              <h2 style="color: #2563eb;">${title}</h2>
              <p><strong>${greeting}</strong></p>
              <p>${bodyPrefix}</p>
              
              <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="margin: 5px 0;">👤 <strong>お客様:</strong> ${customerName} 様</p>
                <p style="margin: 5px 0;">📅 <strong>日時:</strong> ${startTime}</p>
                <p style="margin: 5px 0;">📋 <strong>メニュー:</strong> ${services}</p>
              </div>

              ${(!isOwner && cancelUrl) ? `
              <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold; color: #64748b;">■ ご予約のキャンセル・変更について</p>
                <p style="margin: 10px 0 0 0; font-size: 0.85rem; color: #64748b;">
                  ご予定が変わられた場合は、以下のリンクよりお手続きをお願いいたします。<br>
                  <a href="${cancelUrl}" style="color: #2563eb; text-decoration: underline;">ご予約のキャンセルはこちら</a>
                </p>
              </div>` : ''}
              
              <p>ご確認のほど、よろしくお願いいたします。</p>
            </div>
          `,
        }),
      });
    };

    // 1. お客様への送信（予約完了文面・キャンセルリンクあり）
    let customerResData = null;
    if (customerEmail) {
      const customerRes = await sendMail(customerEmail, false);
      customerResData = await customerRes.json();
    }

    // 2. 店主への送信（新着予約文面・キャンセルリンクなし）
    let shopResData = null;
    if (shopEmail && shopEmail !== 'admin@example.com') {
      const shopRes = await sendMail(shopEmail, true);
      shopResData = await shopRes.json();
    }

    // 両方の結果をまとめて返す（少なくとも一方が成功していれば成功とする）
    return new Response(JSON.stringify({ customer: customerResData, shop: shopResData }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error("Error:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})