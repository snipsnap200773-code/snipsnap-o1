import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function CancelReservation() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const token = params.get("token");

  const [view, setView] = useState('loading'); // loading, confirm, success, error
  const [reservation, setReservation] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (!token) {
      showError("URLが正しくありません。");
      return;
    }
    fetchReservation();
  }, [token]);

  const fetchReservation = async () => {
    try {
      const { data, error } = await supabase
        .from("reservations")
        .select("*")
        .eq("cancel_token", token)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        showError("予約が見つからないか、既にキャンセル済みです。");
        return;
      }

      setReservation(data);
      setView('confirm');
    } catch (err) {
      console.error(err);
      showError("通信エラーが発生しました。");
    }
  };

  const execCancel = async () => {
    if (!reservation || !window.confirm("本当にキャンセルしますか？")) return;
    setView('loading');
    try {
      // 💡 移植：旧システムのストアドプロシージャをそのまま実行
      const { error } = await supabase.rpc("delete_reservation_smart", { p_res_id: reservation.id });
      if (error) throw error;
      setView('success');
    } catch (err) {
      showError("処理に失敗しました。店舗へお電話ください。");
    }
  };

  const showError = (msg) => {
    setErrMsg(msg);
    setView('error');
  };

  // スタイル設定（旧HTMLのCSSをReact用に移植）
  const containerStyle = { maxWidth: '500px', margin: '40px auto', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center', fontFamily: 'sans-serif' };
  const btnStyle = { display: 'block', width: '100%', padding: '14px', marginTop: '12px', borderRadius: '10px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer', textDecoration: 'none', boxSizing: 'border-box' };
  const detailsStyle = { textAlign: 'left', background: '#f8fafc', padding: '15px', borderRadius: '8px', margin: '20px 0', fontSize: '14px', border: '1px solid #e2e8f0', lineHeight: '1.8' };

  if (view === 'loading') {
    return (
      <div style={containerStyle}>
        <p>予約情報を確認しています...</p>
        <div style={{ margin: '20px auto', width: '30px', height: '30px', border: '4px solid #f3f3f3', borderTop: '4px solid #ff7b7b', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (view === 'confirm' && reservation) {
    const d = new Date(reservation.start_at);
    const dateStr = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return (
      <div style={containerStyle}>
        <h1 style={{ color: '#ff7b7b', fontSize: '20px' }}>予約キャンセル</h1>
        <p>以下のご予約をキャンセルしますか？</p>
        <div style={detailsStyle}>
          <strong>日時:</strong> {dateStr}<br />
          <strong>お名前:</strong> {reservation.customer_name} 様<br />
          <strong>メニュー:</strong> {reservation.options?.services?.map(s => s.name).join(', ') || 'なし'}
        </div>
        <p style={{ fontSize: '12px', color: '#666' }}>※変更の場合は一度キャンセルして再度ご予約ください。</p>
        <button style={{ ...btnStyle, background: '#e74c3c', color: '#fff' }} onClick={execCancel}>予約をキャンセルする</button>
        <Link to="/" style={{ ...btnStyle, background: '#eee', color: '#333' }}>戻る</Link>
      </div>
    );
  }

  if (view === 'success') {
    return (
      <div style={containerStyle}>
        <h1 style={{ color: '#333', fontSize: '20px' }}>キャンセル完了</h1>
        <p>キャンセルを受け付けました。</p>
        <Link to="/" style={{ ...btnStyle, background: '#ff7b7b', color: '#fff' }}>新しい予約を入れる</Link>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h1 style={{ color: '#333', fontSize: '20px' }}>エラー</h1>
      <p>{errMsg}</p>
      <Link to="/" style={{ ...btnStyle, background: '#eee', color: '#333' }}>トップへ戻る</Link>
    </div>
  );
}

export default CancelReservation;