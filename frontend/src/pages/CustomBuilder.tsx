import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, ArrowRight, Check, Pizza } from 'lucide-react';

interface InventoryItem {
  _id: string;
  name: string;
  category: 'base' | 'sauce' | 'cheese' | 'vegetable';
  stock: number;
  price: number;
  threshold: number;
}

const STEP_NAMES = ['Choose Crust Base', 'Choose Sauce', 'Choose Cheese', 'Add Toppings'];

export const CustomBuilder: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard State
  const [step, setStep] = useState(1);
  const [selectedBase, setSelectedBase] = useState<InventoryItem | null>(null);
  const [selectedSauce, setSelectedSauce] = useState<InventoryItem | null>(null);
  const [selectedCheese, setSelectedCheese] = useState<InventoryItem | null>(null);
  const [selectedVeggies, setSelectedVeggies] = useState<InventoryItem[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      if (res.success) {
        setInventory(res.data);
      } else {
        setError('Failed to fetch available ingredients.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to contact server for ingredients list.');
    } finally {
      setLoading(false);
    }
  };

  // Grouped items
  const bases = inventory.filter((item) => item.category === 'base');
  const sauces = inventory.filter((item) => item.category === 'sauce');
  const cheeses = inventory.filter((item) => item.category === 'cheese');
  const vegetables = inventory.filter((item) => item.category === 'vegetable');

  // Dynamic price calculation: Base flat fee of ₹100 + individual selections
  const basePizzaFee = 100;
  const calculateTotal = () => {
    let total = basePizzaFee;
    if (selectedBase) total += selectedBase.price;
    if (selectedSauce) total += selectedSauce.price;
    if (selectedCheese) total += selectedCheese.price;
    selectedVeggies.forEach((veg) => {
      total += veg.price;
    });
    return total;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Step 4 complete, redirect to order summary
      if (!selectedBase || !selectedSauce || !selectedCheese) {
        setError('Please complete all selection stages first.');
        return;
      }
      navigate('/order-summary', {
        state: {
          customPizza: true,
          pizzaDetails: {
            base: selectedBase.name,
            sauce: selectedSauce.name,
            cheese: selectedCheese.name,
            vegetables: selectedVeggies.map((veg) => veg.name),
          },
          totalPrice: calculateTotal(),
        },
      });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/dashboard');
    }
  };

  const toggleVeggie = (veg: InventoryItem) => {
    if (selectedVeggies.some((v) => v._id === veg._id)) {
      setSelectedVeggies(selectedVeggies.filter((v) => v._id !== veg._id));
    } else {
      setSelectedVeggies([...selectedVeggies, veg]);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading fresh ingredients from kitchen...</p>
      </div>
    );
  }

  const progressPercentage = ((step - 1) / 3) * 100;

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', padding: '0 20px' }}>
      
      {/* Page Title */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Pizza color="var(--accent-primary)" /> Customize Your Pizza
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '6px' }}>
          Step {step} of 4: {STEP_NAMES[step - 1]}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '0 auto 20px auto' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Progress Indicator */}
      <div className="builder-progress">
        <div className="progress-line-active" style={{ width: `${progressPercentage}%` }} />
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`progress-step ${step === s ? 'active' : step > s ? 'completed' : ''}`}
            onClick={() => s < step && setStep(s)} // Allow skipping backwards only
            style={{ cursor: s < step ? 'pointer' : 'default' }}
          >
            {step > s ? <Check size={18} /> : s}
          </div>
        ))}
      </div>

      {/* Wizard Step Render */}
      <div className="glass-card" style={{ padding: '40px', marginBottom: '30px' }}>
        
        {/* Step 1: Base */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Select Crust Type</h2>
            <div className="options-grid">
              {bases.map((baseItem) => {
                const isSelected = selectedBase?._id === baseItem._id;
                const isOutOfStock = baseItem.stock < 1;
                return (
                  <div
                    key={baseItem._id}
                    onClick={() => !isOutOfStock && setSelectedBase(baseItem)}
                    className={`glass-card option-card ${isSelected ? 'selected' : ''}`}
                    style={{ opacity: isOutOfStock ? 0.4 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: '700' }}>{baseItem.name}</span>
                    {isOutOfStock ? (
                      <span style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '6px', fontWeight: '700' }}>OUT OF STOCK</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>Stock: {baseItem.stock}</span>
                    )}
                    <span className="option-price">+₹{baseItem.price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Sauce */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Choose Pizza Sauce</h2>
            <div className="options-grid">
              {sauces.map((sauceItem) => {
                const isSelected = selectedSauce?._id === sauceItem._id;
                const isOutOfStock = sauceItem.stock < 1;
                return (
                  <div
                    key={sauceItem._id}
                    onClick={() => !isOutOfStock && setSelectedSauce(sauceItem)}
                    className={`glass-card option-card ${isSelected ? 'selected' : ''}`}
                    style={{ opacity: isOutOfStock ? 0.4 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: '700' }}>{sauceItem.name}</span>
                    {isOutOfStock ? (
                      <span style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '6px', fontWeight: '700' }}>OUT OF STOCK</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>Stock: {sauceItem.stock}</span>
                    )}
                    <span className="option-price">+₹{sauceItem.price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Cheese */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Choose Cheese Type</h2>
            <div className="options-grid">
              {cheeses.map((cheeseItem) => {
                const isSelected = selectedCheese?._id === cheeseItem._id;
                const isOutOfStock = cheeseItem.stock < 1;
                return (
                  <div
                    key={cheeseItem._id}
                    onClick={() => !isOutOfStock && setSelectedCheese(cheeseItem)}
                    className={`glass-card option-card ${isSelected ? 'selected' : ''}`}
                    style={{ opacity: isOutOfStock ? 0.4 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: '700' }}>{cheeseItem.name}</span>
                    {isOutOfStock ? (
                      <span style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '6px', fontWeight: '700' }}>OUT OF STOCK</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>Stock: {cheeseItem.stock}</span>
                    )}
                    <span className="option-price">+₹{cheeseItem.price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Vegetables */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Add Vegetable Toppings (Multiple Selection)</h2>
            <div className="options-grid">
              {vegetables.map((vegItem) => {
                const isSelected = selectedVeggies.some((v) => v._id === vegItem._id);
                const isOutOfStock = vegItem.stock < 1;
                return (
                  <div
                    key={vegItem._id}
                    onClick={() => !isOutOfStock && toggleVeggie(vegItem)}
                    className={`glass-card option-card ${isSelected ? 'selected' : ''}`}
                    style={{ opacity: isOutOfStock ? 0.4 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                  >
                    <span style={{ fontSize: '16px', fontWeight: '700' }}>{vegItem.name}</span>
                    {isOutOfStock ? (
                      <span style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '6px', fontWeight: '700' }}>OUT OF STOCK</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '6px' }}>Stock: {vegItem.stock}</span>
                    )}
                    <span className="option-price">+₹{vegItem.price}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Bottom Tally Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--glass-border)', paddingTop: '24px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Live Price Estimate</span>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent-secondary)' }}>
              ₹{calculateTotal().toFixed(2)}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button onClick={handleBack} className="btn btn-secondary" style={{ padding: '12px 24px', display: 'flex', gap: '6px' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button
              onClick={handleNext}
              className="btn btn-primary"
              style={{ padding: '12px 28px', display: 'flex', gap: '6px' }}
              disabled={
                (step === 1 && !selectedBase) ||
                (step === 2 && !selectedSauce) ||
                (step === 3 && !selectedCheese)
              }
            >
              {step === 4 ? 'Review Order' : 'Continue'} <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomBuilder;
