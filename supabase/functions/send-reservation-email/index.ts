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

    // 宛先を整理（空欄チェック付き）
    const recipients = [];
    if (customerEmail) recipients.push(customerEmail);
    if (shopEmail && shopEmail !== 'admin@example.com') recipients.push(shopEmail);

    if (recipients.length === 0) {
      throw new Error("宛先メールアドレスがありません");
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SnipSnapシステム <infec@snipsnap.biz>',
        to: recipients,
        subject: `【SnipSnap】予約完了：${customerName} 様`,
        html: `
          <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #2563eb;">予約完了のお知らせ</h2>
            <p><strong>${customerName} 様</strong></p>
            <p>この度は ${shopName} をご利用いただきありがとうございます。</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 5px 0;">📅 <strong>日時:</strong> ${startTime}</p>
              <p style="margin: 5px 0;">📋 <strong>メニュー:</strong> ${services}</p>
            </div>

            ${cancelUrl ? `
            <div style="background: #fff1f2; padding: 15px; border-radius: 10px; border: 1px solid #fecdd3; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #e11d48;">■ 予約のキャンセル・変更について</p>
              <p style="margin: 10px 0 0 0; font-size: 0.9rem;">
                以下のリンクよりお手続きをお願いいたします。<br>
                <a href="${cancelUrl}" style="color: #e11d48; font-weight: bold;">予約をキャンセルする</a>
              </p>
            </div>` : ''}
            
            <p>ご確認のほど、よろしくお願いいたします。</p>
          </div>
        `,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
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