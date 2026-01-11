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
    // 💡 受取パラメーターに shopId を追加（DB検索用）
    const { 
      shopId,             // 必須：店舗特定用
      customerEmail, 
      customerName, 
      shopName, 
      startTime, 
      services, 
      shopEmail, 
      cancelUrl,
      lineUserId, 
      notifyLineEnabled 
    } = await req.json()
    
    // 💡 環境変数からDB接続情報とメールキーを取得
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? "";
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    // 💡 Supabaseクライアントの初期化
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 🚀 【重要】データベースから店舗ごとのLINE設定を取得
    const { data: shopProfile } = await supabaseAdmin
      .from('profiles')
      .select('line_channel_access_token, line_admin_user_id')
      .eq('id', shopId)
      .single();

    // 店舗独自のトークンが設定されていなければ、三土手さんのトークンをデフォルトにする等の処理も可能ですが、
    // ここでは取得したトークン（shopProfile.line_channel_access_token）を優先的に使用します。
    const currentToken = shopProfile?.line_channel_access_token;
    const currentAdminId = shopProfile?.line_admin_user_id;

    // --- 💡 共通のメール送信関数（文面・レイアウトは一切変更なし） ---
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

    // 1. メール送信処理
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

    // 2. LINE通知処理（取得した動的トークンを使用）
    let customerLineSent = false;
    let shopLineSent = false;

    // A. お客様本人へのLINE
    if (lineUserId && currentToken) {
      const customerMsg = `${customerName}様\n\nご予約ありがとうございます。\n以下の内容で承りました。\n\n📅 日時: ${startTime}〜\n📋 メニュー: ${services}\n\nご来店を心よりお待ちしております！\n\n■キャンセル・変更について\n以下のURLよりお手続きをお願いいたします。\n${cancelUrl}`;
      customerLineSent = await safePushToLine(lineUserId, customerMsg, currentToken, "CUSTOMER");
    }

    // B. 店舗側へのLINE（その店舗の店長IDへ、その店舗のトークンで送る）
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