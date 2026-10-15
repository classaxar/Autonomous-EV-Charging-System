import React from 'react';

export default function GstInvoiceModal({ payment, onClose }) {
  if (!payment) return null;

  const totalAmount = Number(payment.amount || 0);
  const baseAmount = payment.baseAmount !== undefined 
    ? Number(payment.baseAmount) 
    : Number((totalAmount / 1.18).toFixed(2));
  const cgst = payment.cgst !== undefined 
    ? Number(payment.cgst) 
    : Number(((totalAmount - baseAmount) / 2).toFixed(2));
  const sgst = payment.sgst !== undefined 
    ? Number(payment.sgst) 
    : Number(((totalAmount - baseAmount) / 2).toFixed(2));

  function handlePrint() {
    window.print();
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1100,
      background: 'rgba(4, 9, 18, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        color: '#0f172a',
        width: 'min(640px, 100%)',
        maxHeight: '92vh',
        overflowY: 'auto',
        borderRadius: '16px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        padding: '2rem',
        position: 'relative',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        {/* Top Controls (Hidden on Print) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          <button
            onClick={handlePrint}
            style={{
              background: '#0284c7',
              color: '#ffffff',
              border: 0,
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: '700',
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            🖨️ Print / Save as PDF
          </button>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              fontWeight: '700',
              display: 'grid',
              placeItems: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.4rem' }}>⚡</span>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', margin: 0, color: '#0f172a' }}>Bharat EV Charging Ltd</h2>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0', lineHeight: '1.4' }}>
              National Highway EV Charging Network<br />
              Maharashtra, India • GSTIN: <strong>27AABCE1234F1Z5</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              display: 'inline-block',
              background: payment.status === 'PAID' ? '#dcfce7' : '#fef3c7',
              color: payment.status === 'PAID' ? '#15803d' : '#b45309',
              fontSize: '0.75rem',
              fontWeight: '800',
              padding: '3px 10px',
              borderRadius: '99px',
              marginBottom: '4px'
            }}>
              {payment.status === 'PAID' ? 'TAX INVOICE (PAID)' : 'PROFORMA INVOICE (PENDING)'}
            </span>
            <div style={{ fontSize: '0.85rem', fontWeight: '700', fontFamily: 'monospace' }}>
              {payment.paymentId}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Date: {new Date(payment.paidAt || payment.createdAt || Date.now()).toLocaleDateString('en-IN')}
            </div>
          </div>
        </div>

        {/* Customer & Transaction Meta */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          fontSize: '0.78rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <span style={{ color: '#64748b' }}>Billed To:</span>
            <div style={{ fontWeight: '700', marginTop: '2px' }}>EV Owner ({payment.userId || 'Registered User'})</div>
            <div style={{ color: '#64748b', marginTop: '2px' }}>Payer: {payment.payerDetails || 'UPI / RuPay Card'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ color: '#64748b' }}>Charging Session:</span>
            <div style={{ fontWeight: '700', fontFamily: 'monospace', marginTop: '2px' }}>{payment.sessionId || 'N/A'}</div>
            {payment.transactionRef && (
              <div style={{ color: '#0369a1', fontWeight: '600', marginTop: '2px' }}>
                Bank Ref: {payment.transactionRef}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px' }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'center' }}>SAC</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Energy (kWh)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (₹/kWh)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '10px' }}>
                <strong>Fast EV Charging Service</strong>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Smart automated charging station</div>
              </td>
              <td style={{ padding: '10px', textAlign: 'center', fontFamily: 'monospace' }}>998714</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{Number(payment.energyKwh || 0).toFixed(2)}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>₹{payment.pricePerKwh}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>₹{baseAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {/* GST & Total Calculation */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Taxable Base Amount:</span>
              <span>₹{baseAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Central GST (CGST 9%):</span>
              <span>₹{cgst.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>State GST (SGST 9%):</span>
              <span>₹{sgst.toFixed(2)}</span>
            </div>
            <div style={{ borderTop: '2px solid #0f172a', margin: '4px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1rem', fontWeight: '800' }}>
              <span>Total (INR):</span>
              <span style={{ color: '#0f172a' }}>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          paddingTop: '1rem',
          fontSize: '0.72rem',
          color: '#64748b',
          textAlign: 'center',
          lineHeight: '1.4'
        }}>
          This is a computer-generated GST tax receipt authorized by Autonomous EV Charging System.<br />
          Currency: Indian Rupee (INR - ₹) • All taxes computed per Ministry of Power & GST Council guidelines.
        </div>
      </div>
    </div>
  );
}
