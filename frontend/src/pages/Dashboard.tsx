import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import OrderStatusTracker from '../components/OrderStatusTracker';
import { Wrench, ShoppingBag, History, Pizza, ShieldAlert } from 'lucide-react';

interface OrderType {
  _id: string;
  customPizza: boolean;
  pizzaDetails: {
    base: string;
    sauce: string;
    cheese: string;
    vegetables: string[];
  };
  totalPrice: number;
  payment: {
    status: 'pending' | 'paid' | 'failed';
  };
  status: 'Order Received' | 'In Kitchen' | 'Sent to Delivery';
  createdAt: string;
}

const PRESET_PIZZAS = [
  {
    name: 'Classic Margherita',
    desc: 'Simple and elegant. Fresh Roma tomatoes with classic marinara sauce and shredded mozzarella cheese.',
    price: 130,
    pizzaDetails: {
      base: 'Thin Crust',
      sauce: 'Classic Marinara',
      cheese: 'Shredded Mozzarella',
      vegetables: ['Roma Tomatoes'],
    },
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    name: 'Veggie Supreme',
    desc: 'Loaded with goodness. Red onions, green bell peppers, sliced mushrooms, black olives, and roma tomatoes.',
    price: 215,
    pizzaDetails: {
      base: 'Wheat Crust',
      sauce: 'Basil Pesto',
      cheese: 'Shredded Mozzarella',
      vegetables: ['Roma Tomatoes', 'Red Onions', 'Green Bell Peppers', 'Sliced Mushrooms', 'Black Olives'],
    },
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  },
  {
    name: 'Spicy Firehouse',
    desc: 'For the thrill seekers. Pickled jalapenos, onions, and mushrooms on sharp cheddar and spicy buffalo sauce.',
    price: 195,
    pizzaDetails: {
      base: 'Cheese Burst Crust',
      sauce: 'Tangy Buffalo Sauce',
      cheese: 'Sharp Cheddar',
      vegetables: ['Red Onions', 'Sliced Mushrooms', 'Pickled Jalapenos'],
    },
    image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'
  }
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      connectSocket(user.id);
      fetchOrders();
    }

    return () => {
      disconnectSocket();
    };
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/my-orders', true);
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderPreset = (preset: typeof PRESET_PIZZAS[0]) => {
    navigate('/order-summary', {
      state: {
        customPizza: false,
        pizzaDetails: preset.pizzaDetails,
        totalPrice: preset.price,
      }
    });
  };

  const activeOrders = orders.filter(
    (order) => order.payment.status === 'paid' && order.status !== 'Sent to Delivery'
  );
  
  const pastOrders = orders.filter(
    (order) => order.payment.status === 'paid' && order.status === 'Sent to Delivery'
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 20px' }}>
      
      {/* Welcome Banner */}
      <div className="glass-card" style={{ padding: '40px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', background: 'linear-gradient(135deg, rgba(142, 36, 170, 0.2), rgba(255, 94, 58, 0.1))', border: '1px solid rgba(255, 94, 58, 0.15)' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '8px' }}>Craft Your Dream Pizza</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', maxWidth: '600px' }}>
            Choose from our premium preset recipes or unlock your culinary imagination by selecting custom crusts, fresh sauces, cheeses, and farm-fresh toppings.
          </p>
        </div>
        <button
          onClick={() => navigate('/custom-builder')}
          className="btn btn-primary"
          style={{ padding: '16px 32px', fontSize: '16px', gap: '8px' }}
        >
          <Wrench size={18} /> Custom Pizza Builder
        </button>
      </div>

      {/* Active Orders Section */}
      {activeOrders.length > 0 && (
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)' }}>
            <ShoppingBag size={22} /> Track Your Active Orders
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {activeOrders.map((order) => (
              <OrderStatusTracker
                key={order._id}
                orderId={order._id}
                initialStatus={order.status}
                pizzaDetails={order.pizzaDetails}
                totalPrice={order.totalPrice}
                createdAt={order.createdAt}
              />
            ))}
          </div>
        </div>
      )}

      {/* Preset Varieties */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Pizza size={22} color="var(--accent-secondary)" /> Our Specialty Pizza Varieties
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '30px' }}>
          {PRESET_PIZZAS.map((preset, idx) => (
            <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
              <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={preset.image}
                  alt={preset.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.85)' }}
                />
                <div style={{ position: 'absolute', bottom: '15px', right: '15px', backgroundColor: '#000', padding: '4px 12px', borderRadius: '15px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
                  ₹{preset.price}
                </div>
              </div>
              <div style={{ padding: '24px', flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '19px', fontWeight: '700', marginBottom: '10px' }}>{preset.name}</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '20px' }}>{preset.desc}</p>
                </div>
                <button
                  onClick={() => handleOrderPreset(preset)}
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: '600' }}
                >
                  Quick Order Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order History */}
      <div>
        <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <History size={22} /> Past Orders History
        </h2>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading history...</p>
        ) : pastOrders.length === 0 ? (
          <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            You don't have any past orders yet. Order your first pizza now!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {pastOrders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div key={order._id} className="glass-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: '600' }}>
                      {order.customPizza ? 'Custom Prepared Pizza' : 'Specialty Recipe Pizza'}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Ordered on {formattedDate} | ID: {order._id.substring(order._id.length - 8)}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                      {order.pizzaDetails.base} with {order.pizzaDetails.sauce}, {order.pizzaDetails.cheese}
                      {order.pizzaDetails.vegetables.length > 0 && ` & toppings: ${order.pizzaDetails.vegetables.join(', ')}`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>₹{order.totalPrice.toFixed(2)}</p>
                    <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(0, 230, 118, 0.1)', color: 'var(--success)', border: '1px solid rgba(0, 230, 118, 0.2)', padding: '2px 8px', borderRadius: '10px', marginTop: '6px' }}>
                      Delivered Successfully
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
