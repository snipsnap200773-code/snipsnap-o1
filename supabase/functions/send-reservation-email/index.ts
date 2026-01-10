// 必要な型定義のインポート
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// 🔵 1. ブラウザ(localhost)からのアクセスを許可するCORS設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 🔵 2. 事前確認(OPTIONSリクエスト)への応答
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 🔵 3. フロントからデータを受け取る（shopEmailに加えて cancelUrl を追加）
    const { customerEmail, customerName, shopName, startTime, services, shopEmail, cancelUrl } = await req.json()
    
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // 宛先リストを作成（お客さんと店舗）
    // ※Resend無料枠の場合、登録済みの自分のアドレス以外には届かない制限があるため注意
    const recipients = [customerEmail];
    if (shopEmail) {
      recipients.push(shopEmail);
    }

    // 🔵 4. Resend API で一斉送信
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'SnipSnap <onboarding@resend.dev>',
        to: recipients, // 🔵 両方に送る
        subject: `【SnipSnap】予約完了：${customerName} 様`,
        html: `
          <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
            <h2 style="color: #2563eb;">予約完了のお知らせ</h2>
            <p><strong>${shopName} 御中 / ${customerName} 様</strong></p>
            <p>以下の内容で予約が確定しましたのでお知らせいたします。</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>📅 日時:</strong> ${startTime}</p>
              <p style="margin: 5px 0;"><strong>📋 メニュー:</strong> ${services}</p>
              <p style="margin: 5px 0;"><strong>👤 お客様名:</strong> ${customerName} 様</p>
            </div>

            <div style="background: #fff1f2; padding: 15px; border-radius: 10px; border: 1px solid #fecdd3; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold; color: #e11d48;">■ 予約のキャンセル・変更について</p>
              <p style="margin: 10px 0 0 0; font-size: 0.9rem; color: #444;">
                ご都合が悪くなった場合は、以下のリンクよりお手続きをお願いいたします。<br>
                <a href="${cancelUrl || '#'}" style="display: inline-block; margin-top: 10px; color: #e11d48; text-decoration: underline; font-weight: bold;">予約をキャンセルする</a>
              </p>
            </div>
            
            <p>ご確認のほど、よろしくお願いいたします。</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 0.8rem; color: #64748b;">※このメールは SnipSnap システムより自動送信されています。</p>
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
    console.error("Error in Edge Function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})