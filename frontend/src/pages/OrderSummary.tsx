import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { MockRazorpayModal } from '../components/MockRazorpayModal';
import { ArrowLeft, ShoppingBag, CreditCard, ShieldCheck, AlertTriangle } from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const OrderSummary: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = location.state as {
    customPizza: boolean;
    pizzaDetails: {
      base: string;
      sauce: string;
      cheese: string;
      vegetables: string[];
    };
    totalPrice: number;
  } | null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Checkout simulation state
  const [checkoutData, setCheckoutData] = useState<{
    orderId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
  } | null>(null);
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);

  if (!stateData) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div className="glass-card" style={{ padding: '40px' }}>
          <AlertTriangle size={48} color="var(--accent-secondary)" style={{ marginBottom: '20px' }} />
          <h2>No Order Data Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px', marginBottom: '30px' }}>
            It looks like you loaded this page without configuring a pizza first.
          </p>
          <Link to="/dashboard" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { customPizza, pizzaDetails, totalPrice } = stateData;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. Create the pending order in the database
      const orderRes = await api.post('/orders', {
        customPizza,
        pizzaDetails,
        totalPrice,
      }, true);

      if (!orderRes.success) {
        setError(orderRes.message || 'Failed to place order. Ingredients might be out of stock.');
        setLoading(false);
        return;
      }

      const orderId = orderRes.order._id;

      // 2. Initialize checkout session
      const checkoutRes = await api.post('/payments/checkout', { orderId }, true);

      if (!checkoutRes.success) {
        setError(checkoutRes.message || 'Payment initiation failed.');
        setLoading(false);
        return;
      }

      const { simulated, keyId, amount, currency, razorpayOrderId } = checkoutRes;

      if (simulated) {
        // Run Simulated / Mock Payment Checkout Modal
        setCheckoutData({
          orderId,
          razorpayOrderId,
          amount,
          currency,
        });
        setIsMockModalOpen(true);
        setLoading(false);
      } else {
        // Run Real Razorpay Checkout popup
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          // Script failed to load, fall back to mock checkout
          console.warn('Failed to load Razorpay SDK. Falling back to checkout simulator.');
          setCheckoutData({
            orderId,
            razorpayOrderId,
            amount,
            currency,
          });
          setIsMockModalOpen(true);
          setLoading(false);
          return;
        }

        const options = {
          key: keyId,
          amount: amount,
          currency: currency,
          name: 'PizzaCraft',
          description: customPizza ? 'Custom Gourmet Pizza' : 'Specialty Recipe Pizza',
          order_id: razorpayOrderId,
          handler: async function (response: any) {
            setLoading(true);
            try {
              const verifyRes = await api.post('/payments/verify', {
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                simulated: false,
              }, true);

              if (verifyRes.success) {
                navigate('/dashboard');
              } else {
                setError(verifyRes.message || 'Payment verification failed.');
              }
            } catch (err) {
              console.error(err);
              setError('An error occurred during payment verification.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: '',
            email: '',
          },
          theme: {
            color: '#ff5e3a',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during the checkout process.');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentDetails: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
    simulated: boolean;
  }) => {
    setIsMockModalOpen(false);
    setLoading(true);

    try {
      const verifyRes = await api.post('/payments/verify', {
        orderId: checkoutData?.orderId,
        razorpayOrderId: paymentDetails.razorpayOrderId,
        razorpayPaymentId: paymentDetails.razorpayPaymentId,
        razorpaySignature: paymentDetails.razorpaySignature,
        simulated: true,
      }, true);

      if (verifyRes.success) {
        navigate('/dashboard');
      } else {
        setError(verifyRes.message || 'Payment simulation verification failed.');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred during payment simulation.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentFailure = (message: string) => {
    setIsMockModalOpen(false);
    setError(message);
  };

  return (
    <div style={{ maxWidth: '750px', margin: '40px auto', padding: '0 20px' }}>
      
      <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', gap: '6px', marginBottom: '20px' }}>
        <ArrowLeft size={14} /> Back
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
        <ShoppingBag size={28} color="var(--accent-primary)" />
        <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Review Your Order</h1>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '24px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Side: Summary Card */}
        <div className="glass-card" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px', marginBottom: '20px' }}>
            Pizza Configuration
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Crust Base</span>
              <strong style={{ color: 'white' }}>{pizzaDetails.base}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pizza Sauce</span>
              <strong style={{ color: 'white' }}>{pizzaDetails.sauce}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cheese Layer</span>
              <strong style={{ color: 'white' }}>{pizzaDetails.cheese}</strong>
            </div>

            <div style={{ borderTop: '1px dashed var(--glass-border)', paddingTop: '16px' }}>
              <span style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Selected Toppings:</span>
              {pizzaDetails.vegetables.length === 0 ? (
                <em style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No toppings selected</em>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {pizzaDetails.vegetables.map((veg, index) => (
                    <span key={index} style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '4px 10px', borderRadius: '15px', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {veg}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Total Summary */}
        <div className="glass-card" style={{ padding: '24px', position: 'sticky', top: '100px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Tally Summary</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Base Oven Fee</span>
              <span>₹100.00</span>
            </div>
            <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Ingredients Extra</span>
              <span>₹{(totalPrice - 100).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <span style={{ fontWeight: '600', fontSize: '15px' }}>Total Price</span>
            <strong style={{ fontSize: '22px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
              ₹{totalPrice.toFixed(2)}
            </strong>
          </div>

          <button
            onClick={handleCheckout}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', borderRadius: '10px', fontSize: '15px', display: 'flex', gap: '8px' }}
            disabled={loading}
          >
            <CreditCard size={18} /> {loading ? 'Processing...' : 'Pay with Razorpay'}
          </button>

          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
            <ShieldCheck size={12} /> Secure Checkout Integration
          </p>
        </div>

      </div>

      {/* Mock Razorpay Popup Modal */}
      {checkoutData && (
        <MockRazorpayModal
          isOpen={isMockModalOpen}
          orderId={checkoutData.orderId}
          razorpayOrderId={checkoutData.razorpayOrderId}
          amount={checkoutData.amount}
          currency={checkoutData.currency}
          onClose={() => setIsMockModalOpen(false)}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}

    </div>
  );
};

export default OrderSummary;
