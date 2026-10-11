import React, { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import { ClipboardList, Flame, Truck, CheckCircle2 } from 'lucide-react';

interface OrderStatusTrackerProps {
  orderId: string;
  initialStatus: 'Order Received' | 'In Kitchen' | 'Sent to Delivery';
  pizzaDetails: {
    base: string;
    sauce: string;
    cheese: string;
    vegetables: string[];
  };
  totalPrice: number;
  createdAt: string;
}

export const OrderStatusTracker: React.FC<OrderStatusTrackerProps> = ({
  orderId,
  initialStatus,
  pizzaDetails,
  totalPrice,
  createdAt,
}) => {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    const socket = getSocket();

    const handleStatusUpdate = (data: { orderId: string; status: 'Order Received' | 'In Kitchen' | 'Sent to Delivery' }) => {
      if (data.orderId === orderId) {
        setStatus(data.status);
      }
    };

    socket.on('orderStatusUpdate', handleStatusUpdate);

    return () => {
      socket.off('orderStatusUpdate', handleStatusUpdate);
    };
  }, [orderId]);

  const steps = [
    {
      name: 'Order Received',
      key: 'Order Received',
      icon: <ClipboardList size={18} />,
      desc: 'Your payment was confirmed and the kitchen received your order.',
    },
    {
      name: 'In Kitchen',
      key: 'In Kitchen',
      icon: <Flame size={18} />,
      desc: 'Our chefs are crafting your pizza with fresh ingredients.',
    },
    {
      name: 'Sent to Delivery',
      key: 'Sent to Delivery',
      icon: <Truck size={18} />,
      desc: 'Your piping-hot pizza is out with our delivery rider!',
    },
  ];

  const getStepStatusClass = (stepKey: string) => {
    const statusOrder = ['Order Received', 'In Kitchen', 'Sent to Delivery'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (stepIndex < currentIndex) {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'active';
    } else {
      return 'pending';
    }
  };

  const formattedDate = new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
    ' on ' + new Date(createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <div className="glass-card" style={{ padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Order ID: {orderId}</span>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Placed at {formattedDate}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Total Price</span>
          <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-secondary)' }}>₹{totalPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Pizza Details Summary */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', border: '1px solid rgba(255,255,255,0.04)' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '6px', fontWeight: '500' }}>Pizza Details:</p>
        <p style={{ color: 'white' }}>
          <strong>Base:</strong> {pizzaDetails.base} | <strong>Sauce:</strong> {pizzaDetails.sauce} | <strong>Cheese:</strong> {pizzaDetails.cheese}
        </p>
        {pizzaDetails.vegetables.length > 0 && (
          <p style={{ color: 'white', marginTop: '4px' }}>
            <strong>Toppings:</strong> {pizzaDetails.vegetables.join(', ')}
          </p>
        )}
      </div>

      <h4 style={{ marginBottom: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Live Tracking Status 
        {status === 'Sent to Delivery' ? (
          <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(0, 230, 118, 0.1)', color: 'var(--success)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '2px 8px', borderRadius: '10px' }}>
            <CheckCircle2 size={10} /> Dispatched
          </span>
        ) : (
          <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 94, 58, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(255, 94, 58, 0.2)', padding: '2px 8px', borderRadius: '10px' }}>
            Processing
          </span>
        )}
      </h4>

      <div className="status-tracker">
        {steps.map((step) => {
          const stepStatus = getStepStatusClass(step.key);
          return (
            <div key={step.key} className={`status-step ${stepStatus}`}>
              <div className="status-icon-wrapper">
                {step.icon}
              </div>
              <div className="status-text">
                <span className="status-title" style={{ color: stepStatus === 'active' ? 'var(--accent-primary)' : stepStatus === 'completed' ? 'var(--success)' : 'var(--text-secondary)' }}>
                  {step.name}
                </span>
                <span className="status-desc">{step.desc}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderStatusTracker;
