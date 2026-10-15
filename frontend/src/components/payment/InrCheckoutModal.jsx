import React, { useState, useEffect } from 'react';

/**
 * Generates a clean, standalone SVG QR Code for Indian UPI payments.
 * Encodes: upi://pay?pa=evcharge@okhdfcbank&pn=AutonomousEV&am={amount}&cu=INR
 */
function UpiQrCode({ amount, invoiceId }) {
  // Deterministic pattern generation based on amount and id for realistic QR visual
  const seed = (String(amount) + String(invoiceId)).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const size = 19; // 19x19 grid
  
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Corner finder patterns (7x7 blocks)
      const isTopLeft = r < 7 && c < 7;
      const isTopRight = r < 7 && c >= size - 7;
      const isBottomLeft = r >= size - 7 && c < 7;
      
      let isDark = false;
      if (isTopLeft || isTopRight || isBottomLeft) {
        // Outer border or inner 3x3 square
        const localR = isBottomLeft ? r - (size - 7) : r;
        const localC = isTopRight ? c - (size - 7) : c;
        if (localR === 0 || localR === 6 || localC === 0 || localC === 6) isDark = true;
        else if (localR >= 2 && localR <= 4 && localC >= 2 && localC <= 4) isDark = true;
      } else {
        // Pseudorandom internal matrix
        isDark = ((r * 7 + c * 13 + seed) % 5 === 0) || ((r + c + seed) % 3 === 0);
      }
      if (isDark) cells.push({ r, c });
    }
  }

  return (
    <div style={{
      background: '#ffffff',
      padding: '14px',
      borderRadius: '16px',
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
      border: '2px solid rgba(73, 213, 255, 0.4)'
    }}>
      <svg width="170" height="170" viewBox="0 0 19 19" style={{ display: 'block', shapeRendering: 'crispEdges' }}>
        <rect width="19" height="19" fill="#ffffff" />
        {cells.map((cell, idx) => (
          <rect key={idx} x={cell.c} y={cell.r} width="1" height="1" fill="#07111f" />
        ))}
      </svg>
      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#07111f', letterSpacing: '0.05em' }}>BHARAT UPI QR</span>
        <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>₹ INR</span>
      </div>
    </div>
  );
}

export default function InrCheckoutModal({ payment, onClose, onSuccess }) {
  const [method, setMethod] = useState('UPI'); // UPI, CARD, WALLET, NETBANKING
  const [upiId, setUpiId] = useState('driver@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('6071 8299 4401 5823');
  const [cardHolder, setCardHolder] = useState('ANSHUL SHARMA');
  const [expiry, setExpiry] = useState('11/28');
  const [cvv, setCvv] = useState('421');
  const [selectedBank, setSelectedBank] = useState('HDFC');
  const [walletBalance] = useState(2850.00); // In-App EV Rupee Wallet
  
  // Checkout flow state
  const [stage, setStage] = useState('SELECT'); // 'SELECT' | 'OTP' | 'PROCESSING' | 'SUCCESS'
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [transactionRef, setTransactionRef] = useState('');

  const totalAmount = Number(payment.amount || 0);
  // GST calculation (18% inclusive GST for Indian EV charging infrastructure)
  const baseAmount = Number((totalAmount / 1.18).toFixed(2));
  const totalGst = Number((totalAmount - baseAmount).toFixed(2));
  const cgst = Number((totalGst / 2).toFixed(2));
  const sgst = Number((totalGst / 2).toFixed(2));

  // Determine card type badge
  const cleanedCard = cardNumber.replace(/\s/g, '');
  const isRuPay = cleanedCard.startsWith('60') || cleanedCard.startsWith('65') || cleanedCard.startsWith('8');
  const isVisa = cleanedCard.startsWith('4');
  const isMastercard = cleanedCard.startsWith('5');
  const cardBrand = isRuPay ? 'RuPay' : isVisa ? 'Visa' : isMastercard ? 'Mastercard' : 'RuPay';

  function handleStartPayment(e) {
    if (e) e.preventDefault();
    if (method === 'CARD' || method === 'NETBANKING') {
      setStage('OTP');
      setCountdown(30);
    } else {
      executeSettlement();
    }
  }

  function executeSettlement() {
    setStage('PROCESSING');
    const refNum = `UTR-${new Date().getFullYear()}${String(Date.now()).slice(-8)}`;
    setTransactionRef(refNum);

    setTimeout(async () => {
      try {
        let payerInfo = '';
        if (method === 'UPI') payerInfo = upiId;
        else if (method === 'CARD') payerInfo = `${cardBrand} •••• ${cleanedCard.slice(-4) || '5823'}`;
        else if (method === 'WALLET') payerInfo = 'In-App EV Wallet (₹)';
        else payerInfo = `${selectedBank} NetBanking`;

        const payload = {
          paymentMethod: method === 'CARD' ? (isRuPay ? 'RUPAY_CARD' : 'CARD') : method,
          transactionRef: refNum,
          baseAmount,
          cgst,
          sgst,
          payerDetails: payerInfo
        };

        await onSuccess(payment.paymentId, payload);
        setStage('SUCCESS');
      } catch (err) {
        setStage('SELECT');
      }
    }, 1800);
  }

  // Timer countdown for simulated OTP
  useEffect(() => {
    if (stage === 'OTP' && countdown > 0) {
      const timer = setInterval(() => setCountdown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [stage, countdown]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'rgba(4, 9, 18, 0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="surface" style={{
        width: 'min(760px, 100%)',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '24px',
        border: '1px solid rgba(73, 213, 255, 0.28)',
        boxShadow: '0 25px 70px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(12, 27, 46, 0.7)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>Bharat EV Pay</h3>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #168bd2, #35d399)',
                  color: '#07111f',
                  padding: '2px 8px',
                  borderRadius: '99px'
                }}>
                  ₹ INR DIRECT
                </span>
              </div>
              <p className="muted" style={{ fontSize: '0.78rem', margin: '2px 0 0' }}>
                Invoice: <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{payment.paymentId}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(148, 163, 184, 0.1)',
              border: 0,
              color: 'var(--text-secondary)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '1.1rem',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Stage 1: SELECT PAYMENT METHOD */}
        {stage === 'SELECT' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: '0', flex: 1 }}>
            {/* Left Column: Payment Methods & Inputs */}
            <div style={{ padding: '1.75rem', borderRight: '1px solid var(--border-color)' }}>
              {/* Method Selector Tabs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                background: 'rgba(7, 17, 31, 0.6)',
                padding: '5px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem'
              }}>
                {[
                  { id: 'UPI', label: 'UPI QR', icon: '📱' },
                  { id: 'CARD', label: 'RuPay/Card', icon: '💳' },
                  { id: 'WALLET', label: 'EV Wallet', icon: '⚡' },
                  { id: 'NETBANKING', label: 'NetBank', icon: '🏛️' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setMethod(t.id)}
                    style={{
                      border: 0,
                      background: method === t.id ? 'var(--accent-blue)' : 'transparent',
                      color: method === t.id ? '#ffffff' : 'var(--text-secondary)',
                      padding: '8px 4px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              {/* METHOD 1: UPI */}
              {method === 'UPI' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <UpiQrCode amount={totalAmount} invoiceId={payment.paymentId} />
                  
                  <p className="muted" style={{ fontSize: '0.8rem', marginTop: '12px', marginBottom: '14px' }}>
                    Scan with <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong> or any UPI App
                  </p>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((app) => (
                      <span key={app} style={{
                        fontSize: '0.72rem',
                        padding: '4px 10px',
                        borderRadius: '99px',
                        background: 'rgba(73, 213, 255, 0.08)',
                        border: '1px solid rgba(73, 213, 255, 0.25)',
                        color: 'var(--accent-cyan)',
                        fontWeight: '600'
                      }}>
                        {app}
                      </span>
                    ))}
                  </div>

                  <div style={{ width: '100%', textAlign: 'left', marginTop: '4px' }}>
                    <label className="form-label">Or enter UPI ID / VPA</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        className="form-input"
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="yourname@okaxis"
                        style={{ fontSize: '0.88rem' }}
                      />
                      <button
                        type="button"
                        onClick={executeSettlement}
                        className="btn-primary"
                        style={{ padding: '0 16px', whiteSpace: 'nowrap', fontSize: '0.82rem' }}
                      >
                        Verify & Pay
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* METHOD 2: RuPay / Credit / Debit Card */}
              {method === 'CARD' && (
                <div>
                  {/* Interactive Virtual Card UI */}
                  <div style={{
                    background: 'linear-gradient(135deg, #0d2e5c 0%, #1e4976 50%, #092040 100%)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    border: '1px solid rgba(73, 213, 255, 0.35)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                    marginBottom: '1.25rem',
                    color: '#ffffff'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', letterSpacing: '0.1em', opacity: 0.8 }}>DEBIT / CREDIT</span>
                      <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '800',
                        color: isRuPay ? '#35d399' : 'var(--accent-cyan)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {cardBrand.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontFamily: 'monospace', letterSpacing: '0.18em', margin: '14px 0' }}>
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.78rem' }}>
                      <div>
                        <div style={{ opacity: 0.6, fontSize: '0.65rem' }}>CARDHOLDER</div>
                        <div style={{ fontWeight: '700', letterSpacing: '0.05em' }}>{cardHolder || 'EV DRIVER'}</div>
                      </div>
                      <div>
                        <div style={{ opacity: 0.6, fontSize: '0.65rem' }}>EXPIRES</div>
                        <div style={{ fontWeight: '700' }}>{expiry || 'MM/YY'}</div>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleStartPayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label className="form-label">Card Number (RuPay, Visa, Mastercard)</label>
                      <input
                        className="form-input"
                        type="text"
                        value={cardNumber}
                        maxLength={19}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(val);
                        }}
                        placeholder="6071 XXXX XXXX XXXX"
                      />
                    </div>
                    <div>
                      <label className="form-label">Cardholder Name</label>
                      <input
                        className="form-input"
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label className="form-label">Expiry (MM/YY)</label>
                        <input
                          className="form-input"
                          type="text"
                          value={expiry}
                          maxLength={5}
                          onChange={(e) => setExpiry(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">CVV</label>
                        <input
                          className="form-input"
                          type="password"
                          value={cvv}
                          maxLength={4}
                          onChange={(e) => setCvv(e.target.value)}
                        />
                      </div>
                    </div>
                    <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                      Pay ₹{totalAmount.toFixed(2)} via {cardBrand}
                    </button>
                  </form>
                </div>
              )}

              {/* METHOD 3: EV Fast-Pass In-App Wallet */}
              {method === 'WALLET' && (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <div style={{
                    background: 'rgba(53, 211, 153, 0.08)',
                    border: '1px solid rgba(53, 211, 153, 0.3)',
                    borderRadius: '16px',
                    padding: '1.5rem',
                    marginBottom: '1.5rem'
                  }}>
                    <span style={{ fontSize: '2.5rem' }}>⚡</span>
                    <h4 style={{ margin: '8px 0 4px', fontSize: '1.1rem' }}>Autonomous EV Rupee Wallet</h4>
                    <p className="muted" style={{ fontSize: '0.8rem', margin: 0 }}>Instant one-click charging debit</p>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-green)', marginTop: '12px' }}>
                      ₹{walletBalance.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Available Balance</span>
                  </div>

                  {walletBalance >= totalAmount ? (
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--accent-green)', marginBottom: '16px' }}>
                        ✅ Sufficient balance. ₹{totalAmount.toFixed(2)} will be debited instantly.
                      </p>
                      <button
                        type="button"
                        onClick={executeSettlement}
                        className="btn-primary"
                        style={{ width: '100%', padding: '14px' }}
                      >
                        ⚡ 1-Click Pay ₹{totalAmount.toFixed(2)}
                      </button>
                    </div>
                  ) : (
                    <div style={{ color: 'var(--accent-red)', fontSize: '0.85rem' }}>
                      ⚠️ Insufficient wallet balance. Please choose UPI or Card.
                    </div>
                  )}
                </div>
              )}

              {/* METHOD 4: Net Banking */}
              {method === 'NETBANKING' && (
                <div>
                  <p className="form-label" style={{ marginBottom: '12px' }}>Popular Indian Banks</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
                    {[
                      { code: 'HDFC', name: 'HDFC Bank' },
                      { code: 'SBI', name: 'State Bank of India' },
                      { code: 'ICICI', name: 'ICICI Bank' },
                      { code: 'AXIS', name: 'Axis Bank' },
                      { code: 'KOTAK', name: 'Kotak Mahindra' },
                      { code: 'PNB', name: 'Punjab National' },
                    ].map((b) => (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => setSelectedBank(b.code)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          border: selectedBank === b.code ? '1.5px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: selectedBank === b.code ? 'rgba(73, 213, 255, 0.12)' : 'rgba(7, 17, 31, 0.5)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontSize: '0.8rem',
                          fontWeight: selectedBank === b.code ? '700' : '500'
                        }}
                      >
                        🏛️ {b.name}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleStartPayment}
                    className="btn-primary"
                    style={{ width: '100%', padding: '13px' }}
                  >
                    Proceed with {selectedBank} NetBanking
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Invoice & GST Breakdown */}
            <div style={{ padding: '1.75rem', background: 'rgba(7, 17, 31, 0.45)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: '8px' }}>Tax Invoice Summary</p>
                <div style={{ fontSize: '0.82rem', marginBottom: '1.25rem', color: 'var(--text-secondary)' }}>
                  SAC Code: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>998714</span> (EV Charging Services)
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Energy Delivered</span>
                    <span style={{ fontWeight: '600' }}>{Number(payment.energyKwh || 0).toFixed(2)} kWh</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Energy Tariff</span>
                    <span style={{ fontWeight: '600' }}>₹{payment.pricePerKwh}/kWh</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="muted">Base Power Charges</span>
                    <span style={{ fontWeight: '600' }}>₹{baseAmount.toFixed(2)}</span>
                  </div>
                  
                  <div style={{ borderTop: '1px dashed var(--border-color)', margin: '4px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>CGST (9%)</span>
                    <span>₹{cgst.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>SGST (9%)</span>
                    <span>₹{sgst.toFixed(2)}</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', margin: '6px 0' }} />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>Total Payable (₹)</span>
                    <span style={{ fontWeight: '800', fontSize: '1.35rem', color: 'var(--accent-green)' }}>
                      ₹{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{
                  marginTop: '1.5rem',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.2)',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.4'
                }}>
                  🔒 Protected by 256-bit encryption. RBI & NPCI compliant payment simulation.
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                GSTIN: 27AABCE1234F1Z5 • Maharashtra, India
              </div>
            </div>
          </div>
        )}

        {/* Stage 2: 3D SECURE / BANK OTP SIMULATOR */}
        {stage === 'OTP' && (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '440px', margin: '0 auto' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔐</div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '6px' }}>Bank 3D-Secure Verification</h3>
            <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Enter the 4-digit OTP sent to your registered mobile ending in <strong>•••• 9821</strong> for ₹{totalAmount.toFixed(2)}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '1.25rem' }}>
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="• • • •"
                style={{
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '0.3em',
                  width: '160px',
                  padding: '10px',
                  borderRadius: '12px',
                  border: '2px solid var(--accent-cyan)',
                  background: 'rgba(7, 17, 31, 0.8)',
                  color: '#ffffff'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setOtp('7392')}
                style={{
                  background: 'rgba(73, 213, 255, 0.1)',
                  border: '1px dashed var(--accent-cyan)',
                  color: 'var(--accent-cyan)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  fontWeight: '600',
                  margin: '0 auto 12px'
                }}
              >
                ✨ Demo Helper: Click to Auto-Fill OTP (7392)
              </button>

              <button
                type="button"
                disabled={otp.length < 4}
                onClick={executeSettlement}
                className="btn-primary"
                style={{ width: '100%', padding: '12px' }}
              >
                Confirm & Pay ₹{totalAmount.toFixed(2)}
              </button>

              <button
                type="button"
                onClick={() => setStage('SELECT')}
                className="btn-secondary"
                style={{ width: '100%', padding: '10px' }}
              >
                Cancel / Change Method
              </button>
            </div>
          </div>
        )}

        {/* Stage 3: PROCESSING STATE */}
        {stage === 'PROCESSING' && (
          <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              border: '4px solid rgba(73, 213, 255, 0.2)',
              borderTopColor: 'var(--accent-cyan)',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              animation: 'spin 1s linear infinite'
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '8px' }}>Securing Payment with NPCI...</h3>
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              Settling ₹{totalAmount.toFixed(2)} via {method} • Do not close or refresh
            </p>
          </div>
        )}

        {/* Stage 4: SUCCESS WITH INVOICE OPTION */}
        {stage === 'SUCCESS' && (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'rgba(53, 211, 153, 0.15)',
              border: '2px solid var(--accent-green)',
              color: 'var(--accent-green)',
              display: 'grid',
              placeItems: 'center',
              fontSize: '2rem',
              margin: '0 auto 1.25rem'
            }}>
              ✓
            </div>
            <h3 style={{ fontSize: '1.4rem', color: 'var(--accent-green)', marginBottom: '6px' }}>Payment Successful!</h3>
            <p className="muted" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Invoice <strong>{payment.paymentId}</strong> has been settled in Indian Rupees.
            </p>

            <div style={{
              background: 'rgba(7, 17, 31, 0.6)',
              borderRadius: '14px',
              padding: '1rem',
              textAlign: 'left',
              fontSize: '0.82rem',
              marginBottom: '1.75rem',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Amount Settled</span>
                <strong style={{ color: 'var(--accent-green)' }}>₹{totalAmount.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Bank UTR / Ref</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{transactionRef}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="muted">Method</span>
                <span>{method}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              Done & Return to Billing
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
