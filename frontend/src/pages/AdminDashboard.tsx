import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { connectAdminSocket, disconnectSocket, getSocket } from '../services/socket';
import { Package, Shield, ListOrdered, Save, RotateCcw, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface InventoryItem {
  _id: string;
  name: string;
  category: 'base' | 'sauce' | 'cheese' | 'vegetable';
  stock: number;
  price: number;
  threshold: number;
}

interface OrderType {
  _id: string;
  user: {
    name: string;
    email: string;
  };
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

export const AdminDashboard: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // Stock edit tracking
  const [editingStock, setEditingStock] = useState<{ [id: string]: number }>({});
  const [editingThreshold, setEditingThreshold] = useState<{ [id: string]: number }>({});
  const [saveSuccessId, setSaveSuccessId] = useState<string | null>(null);

  // Stats
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    connectAdminSocket();
    fetchInventory();
    fetchOrders();

    const socket = getSocket();

    // Listen for real-time new orders placed
    socket.on('newOrderPlaced', (newOrder: OrderType) => {
      setOrders(prev => [newOrder, ...prev]);
      setSuccessMsg('New pizza order received in real-time!');
      setTimeout(() => setSuccessMsg(null), 5000);
      // Auto refresh inventory since stock was decremented
      fetchInventory();
    });

    // Listen for live individual stock changes
    socket.on('inventoryUpdate', (updatedItem: InventoryItem) => {
      setInventory(prev => prev.map(item => item._id === updatedItem._id ? updatedItem : item));
    });

    // Listen for stock recalculations
    socket.on('stockUpdate', () => {
      fetchInventory();
    });

    return () => {
      disconnectSocket();
    };
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory', true);
      if (res.success) {
        setInventory(res.data);
      }
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoadingInventory(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders', true);
      if (res.success) {
        setOrders(res.orders);
      }
    } catch (err) {
      console.error('Error fetching admin orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdateStock = async (id: string) => {
    const updatedStock = editingStock[id];
    const updatedThreshold = editingThreshold[id];

    if (updatedStock === undefined && updatedThreshold === undefined) return;

    try {
      const body: any = {};
      if (updatedStock !== undefined) body.stock = updatedStock;
      if (updatedThreshold !== undefined) body.threshold = updatedThreshold;

      const res = await api.put(`/inventory/${id}`, body, true);

      if (res.success) {
        setSaveSuccessId(id);
        setTimeout(() => setSaveSuccessId(null), 2000);
        
        // Remove from local editing tracking
        const copyStock = { ...editingStock };
        delete copyStock[id];
        setEditingStock(copyStock);

        const copyThresh = { ...editingThreshold };
        delete copyThresh[id];
        setEditingThreshold(copyThresh);

        fetchInventory();
      }
    } catch (err) {
      console.error('Failed to update stock:', err);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: 'Order Received' | 'In Kitchen' | 'Sent to Delivery') => {
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus }, true);
      if (res.success) {
        setOrders(prev => prev.map(order => order._id === orderId ? { ...order, status: newStatus } : order));
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  };

  const getStockWarningClass = (item: InventoryItem) => {
    const threshold = item.threshold;
    if (item.stock < threshold) {
      return { border: '1px solid rgba(255, 23, 68, 0.4)', backgroundColor: 'rgba(255, 23, 68, 0.05)' };
    }
    return {};
  };

  const activePaidOrders = orders.filter(o => o.payment.status === 'paid');

  return (
    <div style={{ maxWidth: '1300px', margin: '40px auto', padding: '0 20px' }}>
      
      {/* Admin Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: 'rgba(255, 179, 0, 0.1)', padding: '10px', borderRadius: '8px', color: 'var(--accent-secondary)' }}>
            <Shield size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Store & inventory management operations</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => { fetchInventory(); fetchOrders(); }} className="btn btn-secondary" style={{ padding: '8px 16px', display: 'flex', gap: '6px', fontSize: '13px' }}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="alert alert-success" style={{ marginBottom: '24px' }}>
          <CheckCircle size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid Layout for Inventory and Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 500px', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Side: Orders Management Panel */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListOrdered size={20} color="var(--accent-primary)" /> Customer Orders Queue ({activePaidOrders.length})
          </h2>

          {loadingOrders ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading orders...</p>
          ) : activePaidOrders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px 0' }}>No active paid orders in queue.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activePaidOrders.map((order) => {
                const orderDate = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
                  ' on ' + new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={order._id}
                    className="glass-card"
                    style={{
                      padding: '20px',
                      borderLeft: `4px solid ${
                        order.status === 'Sent to Delivery'
                          ? 'var(--success)'
                          : order.status === 'In Kitchen'
                          ? 'var(--accent-secondary)'
                          : 'var(--accent-primary)'
                      }`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '10px' }}>
                      <div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>ID: {order._id}</span>
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginTop: '2px', fontWeight: '600' }}>
                          Customer: {order.user?.name} ({order.user?.email})
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Ordered at {orderDate}</span>
                        <p style={{ fontSize: '15px', fontWeight: '800', color: 'var(--accent-secondary)', marginTop: '2px' }}>
                          ₹{order.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                      <p>
                        <strong>Base:</strong> {order.pizzaDetails.base} | <strong>Sauce:</strong> {order.pizzaDetails.sauce} | <strong>Cheese:</strong> {order.pizzaDetails.cheese}
                      </p>
                      {order.pizzaDetails.vegetables.length > 0 && (
                        <p style={{ marginTop: '4px' }}>
                          <strong>Toppings:</strong> {order.pizzaDetails.vegetables.join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Status Management Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Status: <strong style={{ color: 'white' }}>{order.status}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleStatusChange(order._id, 'Order Received')}
                          className={`btn ${order.status === 'Order Received' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                        >
                          Received
                        </button>
                        <button
                          onClick={() => handleStatusChange(order._id, 'In Kitchen')}
                          className={`btn ${order.status === 'In Kitchen' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                        >
                          Kitchen
                        </button>
                        <button
                          onClick={() => handleStatusChange(order._id, 'Sent to Delivery')}
                          className={`btn ${order.status === 'Sent to Delivery' ? 'btn-success' : 'btn-secondary'}`}
                          style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                        >
                          Dispatched
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Inventory Stocks Management */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={20} color="var(--accent-secondary)" /> Ingredients Inventory
          </h2>

          {loadingInventory ? (
            <p style={{ color: 'var(--text-secondary)' }}>Loading inventory levels...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {inventory.map((item) => {
                const isLowStock = item.stock < item.threshold;
                const isSaving = saveSuccessId === item._id;

                return (
                  <div
                    key={item._id}
                    className="glass-card"
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      ...getStockWarningClass(item),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '700' }}>{item.name}</span>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '2px' }}>
                          Category: {item.category}
                        </p>
                      </div>
                      {isLowStock && (
                        <span style={{ fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 23, 68, 0.1)', border: '1px solid rgba(255, 23, 68, 0.2)', color: 'var(--danger)', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>
                          <AlertTriangle size={10} /> LOW STOCK
                        </span>
                      )}
                    </div>

                    {/* Stock & Threshold Updates */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '90px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Stock Level</span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={editingStock[item._id] !== undefined ? editingStock[item._id] : item.stock}
                          onChange={(e) =>
                            setEditingStock({
                              ...editingStock,
                              [item._id]: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1', minWidth: '90px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Alert Limit</span>
                        <input
                          type="number"
                          className="form-control"
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          value={editingThreshold[item._id] !== undefined ? editingThreshold[item._id] : item.threshold}
                          onChange={(e) =>
                            setEditingThreshold({
                              ...editingThreshold,
                              [item._id]: Math.max(0, parseInt(e.target.value) || 0),
                            })
                          }
                        />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingTop: '18px' }}>
                        <button
                          onClick={() => handleUpdateStock(item._id)}
                          className={`btn ${isSaving ? 'btn-success' : 'btn-primary'}`}
                          style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '12px', height: '34px', gap: '4px' }}
                          disabled={
                            editingStock[item._id] === undefined &&
                            editingThreshold[item._id] === undefined
                          }
                        >
                          {isSaving ? 'Saved' : <><Save size={12} /> Save</>}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
