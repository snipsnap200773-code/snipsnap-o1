import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// 💡 LINE通知用の定数（司令塔として追加）
const LINE_CHANNEL_ACCESS_TOKEN = "SDDXvMI+SyF8djRDeitHhCM7jx0lFUBM/kXU9JNu3biqmm5T7zWhh8eqShoUC7avRG/lOQEjuC0P+VG3BBoOUsWt7VtksdJDqRdJhGXMvqm4SHuut5GYSwysbs3vr3em9tdorkFKC56hyLFozPPmvAdB04t89/1O/w1cDnyilFU=";
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
const LINE_ADMIN_USER_ID = "U471d8a27e1ea8430d65ac7dc0cc00546";

// 💡 LINE送信用の共通関数（司令塔として追加）
async function safePushToLine(to: string, text: string, targetName: string) {
  if (!to) return null;
  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
    });
    return res.ok;
  } catch (err) {
    console.error(`[${targetName}] LINE Push Error:`, err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 💡 受取パラメーターに LINE 関連を追加
    const { 
      customerEmail, 
      customerName, 
      shopName, 
      startTime, 
      services, 
      shopEmail, 
      cancelUrl,
      lineUserId,         // 追加
      notifyLineEnabled   // 追加
    } = await req.json()
    
    // 💡 金庫から最新の鍵を取り出す
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // --- 💡 共通のメール送信関数（文面・レイアウトは一切変更なし） ---
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
              
              <p>ご確認のほど, よろしくお願いいたします。</p>
            </div>
          `,
        }),
      });
    };

    // 1. お客様へのメール送信
    let customerResData = null;
    if (customerEmail) {
      const customerRes = await sendMail(customerEmail, false);
      customerResData = await customerRes.json();
    }

    // 2. 店主へのメール送信
    let shopResData = null;
    if (shopEmail && shopEmail !== 'admin@example.com') {
      const shopRes = await sendMail(shopEmail, true);
      shopResData = await shopRes.json();
    }

    // --- 💡 LINE通知ロジック（司令塔として追加） ---
    let customerLineSent = false;
    let shopLineSent = false;

    // A. お客様本人へのLINE（lineUserIdがある場合のみ）
    if (lineUserId) {
      const customerMsg = `${customerName}様\n\nご予約ありがとうございます。\n以下の内容で承りました。\n\n📅 日時: ${startTime}〜\n📋 メニュー: ${services}\n\nご来店を心よりお待ちしております！\n\n■キャンセル・変更について\n以下のURLよりお手続きをお願いいたします。\n${cancelUrl}`;
      customerLineSent = await safePushToLine(lineUserId, customerMsg, "CUSTOMER");
    }

    // B. 店舗側へのLINE（管理者の通知設定が有効な場合のみ）
    if (notifyLineEnabled !== false) {
      const shopMsg = `【新着予約】\n\n👤 お客様: ${customerName} 様\n📅 日時: ${startTime}〜\n📋 メニュー: ${services}\n\nご確認をお願いいたします。`;
      shopLineSent = await safePushToLine(LINE_ADMIN_USER_ID, shopMsg, "SHOP_OWNER");
    }

    // 結果をまとめて返す
    return new Response(JSON.stringify({ 
      customerEmail: customerResData, 
      shopEmail: shopResData,
      customerLine: customerLineSent,
      shopLine: shopLineSent
    }), {
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