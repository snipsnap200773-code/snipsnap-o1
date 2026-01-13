import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// LINE通知用の定数（URLは共通）
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

// 💡 LINE送信用の共通関数（トークンを引数で受け取るように拡張）
async function safePushToLine(to: string, text: string, token: string, targetName: string) {
  if (!to || !token) return null;
  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
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
    // 💡 受取パラメーター
    const payload = await req.json();
    const { 
      type,               // 💡 追加： 'welcome' かどうかを判定
      shopId,             // 共通
      customerEmail,      // 予約用
      customerName,       // 予約用
      shopName,           // 共通
      startTime,          // 予約用
      services,           // 予約用
      shopEmail,          // 予約用
      cancelUrl,          // 予約用
      lineUserId,         // 予約用
      notifyLineEnabled,  // 予約用
      // 💡 歓迎メール用パラメーター
      owner_email,
      dashboard_url,
      reservations_url,
      reserve_url,
      password
    } = payload;
    
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ==========================================
    // 🚀 パターンA：店主様への歓迎メール送信（welcome）
    // ==========================================
    if (type === 'welcome') {
      const welcomeRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'SnipSnap 運営事務局 <infec@snipsnap.biz>',
          to: [owner_email],
          subject: `【SnipSnap】ご登録ありがとうございます！`,
          html: `
            <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; padding: 30px; border-radius: 12px;">
              <h1 style="color: #2563eb; font-size: 1.5rem; margin-top: 0;">${shopName} 様</h1>
              <p>この度は予約システム <strong>SnipSnap（スニップスナップ）</strong> にお申し込みいただき、誠にありがとうございます。</p>
              <p>本日より1ヶ月間の無料トライアルが開始されました。まずは以下の専用URLより、メニューの登録や店舗の設定を行ってください。</p>
              
              <div style="background: #f1f5f9; padding: 20px; border-radius: 10px; margin: 25px 0;">
                <h2 style="font-size: 1rem; margin-top: 0; color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px;">🔑 管理者用ログイン情報</h2>
                <p style="margin: 15px 0 5px 0;"><strong>● 設定画面（メニュー作成・営業時間など）</strong><br>
                <a href="${dashboard_url}" style="color: #2563eb;">${dashboard_url}</a></p>
                
                <p style="margin: 15px 0 5px 0;"><strong>● 予約台帳（日々の予約確認・キャンセル操作）</strong><br>
                <a href="${reservations_url}" style="color: #2563eb;">${reservations_url}</a></p>
                
                <p style="margin: 15px 0 5px 0;"><strong>● ログインパスワード</strong><br>
                <span style="font-size: 1.2rem; color: #e11d48; font-weight: bold; background: #fff; padding: 2px 8px; border-radius: 4px;">${password}</span></p>
              </div>

              <div style="background: #f0fdf4; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #bbf7d0;">
                <h2 style="font-size: 1rem; margin-top: 0; color: #166534; border-bottom: 2px solid #bbf7d0; padding-bottom: 8px;">📅 お客様用 予約URL</h2>
                <p>このURLを公式LINEのリッチメニュー、インスタのプロフィール、HP等に貼り付けてご利用ください：<br>
                <a href="${reserve_url}" style="color: #15803d; font-weight: bold;">${reserve_url}</a></p>
              </div>

              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              <p style="font-size: 0.85rem; color: #64748b;">
                ※公式LINEとの通知連携方法は、設定画面の下部にある「連携ガイド」を参考に進めてください。<br>
                ※トライアル期間終了後、自動的に課金されることはございませんのでご安心ください。<br><br>
                ご不明な点がございましたら、このメールに返信の形で運営事務局までお問い合わせください。
              </p>
            </div>
          `,
        }),
      });
      const welcomeData = await welcomeRes.json();
      return new Response(JSON.stringify(welcomeData), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ==========================================
    // 🚀 パターンB：通常の予約通知処理（既存ロジック）
    // ==========================================
    const { data: shopProfile } = await supabaseAdmin
      .from('profiles')
      .select('line_channel_access_token, line_admin_user_id')
      .eq('id', shopId)
      .single();

    const currentToken = shopProfile?.line_channel_access_token;
    const currentAdminId = shopProfile?.line_admin_user_id;

    const sendMail = async (to: string, isOwner: boolean) => {
      const subject = isOwner ? `【新着予約】${customerName} 様` : `予約完了のお知らせ：${customerName} 様`;
      const title = isOwner ? "新着予約のお知らせ（店舗控え）" : "予約完了のお知らせ";
      const greeting = isOwner ? `${shopName} 管理者様` : `${customerName} 様`;
      const bodyPrefix = isOwner ? "以下の通り, 新しい予約が入りました。" : `この度は ${shopName} をご利用いただきありがとうございます。`;

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

    let customerResData = null;
    if (customerEmail) {
      const customerRes = await sendMail(customerEmail, false);
      customerResData = await customerRes.json();
    }
    let shopResData = null;
    if (shopEmail && shopEmail !== 'admin@example.com') {
      const shopRes = await sendMail(shopEmail, true);
      shopResData = await shopRes.json();
    }

    let customerLineSent = false;
    let shopLineSent = false;

    if (lineUserId && currentToken) {
      const customerMsg = `${customerName}様\n\nご予約ありがとうございます。\n以下の内容で承りました。\n\n📅 日時: ${startTime}〜\n📋 メニュー: ${services}\n\nご来店を心よりお待ちしております！\n\n■キャンセル・変更について\n以下のURLよりお手続きをお願いいたします。\n${cancelUrl}`;
      customerLineSent = await safePushToLine(lineUserId, customerMsg, currentToken, "CUSTOMER");
    }

    if (notifyLineEnabled !== false && currentToken && currentAdminId) {
      const shopMsg = `【新着予約】\n\n👤 お客様: ${customerName} 様\n📅 日時: ${startTime}〜\n📋 メニュー: ${services}\n\nご確認をお願いいたします。`;
      shopLineSent = await safePushToLine(currentAdminId, shopMsg, currentToken, "SHOP_OWNER");
    }

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