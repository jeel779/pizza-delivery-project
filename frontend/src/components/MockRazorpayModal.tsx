import React from 'react';
import { CreditCard, ShieldCheck, X } from 'lucide-react';

interface MockRazorpayModalProps {
  isOpen: boolean;
  orderId: string;
  razorpayOrderId: string;
  amount: number; // in paisa
  currency: string;
  onClose: () => void;
  onSuccess: (paymentDetails: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    simulated: boolean;
  }) => void;
  onFailure: (message: string) => void;
}

export const MockRazorpayModal: React.FC<MockRazorpayModalProps> = ({
  isOpen,
  orderId,
  razorpayOrderId,
  amount,
  currency,
  onClose,
  onSuccess,
  onFailure,
}) => {
  if (!isOpen) return null;

  const displayAmount = (amount / 100).toFixed(2);

  const handleSimulateSuccess = () => {
    const paymentId = `pay_mock_${Math.random().toString(36).substr(2, 9)}`;
    const signature = `sig_mock_${Math.random().toString(36).substr(2, 15)}`;
    onSuccess({
      razorpayOrderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: signature,
      simulated: true,
    });
  };

  const handleSimulateFailure = () => {
    onFailure('Payment cancelled or declined by user.');
  };

  return (
    <div className="modal-overlay">
      <div className="glass-card modal-content" style={{ maxWidth: '420px', padding: '0', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
        {/* Razorpay-themed Header */}
        <div style={{ backgroundColor: '#0f172a', padding: '24px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ backgroundColor: '#2563eb', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '0.5px' }}>Razorpay Checkout</h3>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0' }}>TEST MODE</p>
            </div>
          </div>
          <button onClick={handleSimulateFailure} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Amount to Pay</span>
            <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'white', margin: '4px 0' }}>
              {currency === 'INR' ? '₹' : '$'}{displayAmount}
            </h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255, 179, 0, 0.1)', border: '1px solid rgba(255, 179, 0, 0.2)', padding: '4px 10px', borderRadius: '15px', fontSize: '11px', color: 'var(--accent-secondary)' }}>
              <ShieldCheck size={12} /> Test Integration Mode
            </div>
          </div>

          <div style={{ fontSize: '13px', borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Order Receipt ID</span>
              <strong style={{ color: 'var(--text-primary)' }}>{orderId.substring(orderId.length - 8)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Razorpay Order ID</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '11px' }}>{razorpayOrderId}</strong>
            </div>
          </div>

          <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleSimulateSuccess}
              className="btn btn-success"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px' }}
            >
              Simulate Success (Pay Now)
            </button>
            <button
              onClick={handleSimulateFailure}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '15px', color: '#f44336', borderColor: 'rgba(244, 67, 54, 0.2)' }}
            >
              Simulate Failure (Cancel)
            </button>
          </div>
        </div>

        {/* Razorpay Footer */}
        <div style={{ backgroundColor: '#1e293b', padding: '12px', textAlign: 'center', fontSize: '11px', color: '#64748b' }}>
          Secured by Razorpay. Trusted by over 5 million businesses.
        </div>
      </div>
    </div>
  );
};

export default MockRazorpayModal;
