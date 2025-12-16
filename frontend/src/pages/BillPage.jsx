import { useState } from "react";
import axios from "axios";

export default function BillPage({ defaultStoreName = "", onSaved }) {
  const [storeName, setStoreName] = useState(defaultStoreName);
  const [billNumber, setBillNumber] = useState("");
  const [items, setItems] = useState([
    { productName: "", productCode: "", quantity: "", finalPrice: "" }
  ]);

  const grandTotal = items.reduce((sum, it) => sum + (Number(it.finalPrice) || 0), 0);

  const addItem = () => setItems([...items, { productName: "", productCode: "", quantity: "", finalPrice: "" }]);
  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, patch) => setItems(items.map((it, i) => i === idx ? { ...it, ...patch } : it));

  const handleSave = async () => {
    try {
      if (!storeName.trim()) {
        alert('Please enter store name');
        return;
      }
      const cleaned = items
        .map(it => ({
          productName: (it.productName || '').trim(),
          productCode: (it.productCode || '').trim(),
          quantity: it.quantity !== "" ? Number(it.quantity) || 0 : undefined,
          finalPrice: Number(it.finalPrice) || 0
        }))
        .filter(it => it.productName && it.finalPrice > 0);

      if (cleaned.length === 0) {
        alert('Add at least one product with name and final price');
        return;
      }

      const payload = {
        storeName: storeName.trim(),
        billNumber: billNumber !== "" ? Number(billNumber) : undefined,
        products: cleaned
      };

      const res = await axios.post('/api/bills', payload);

      alert(res?.data?.message || "Bill saved successfully ✅");

      setItems([{ productName: "", productCode: "", quantity: "", finalPrice: "" }]);
      setBillNumber("");
      if (onSaved) onSaved(res.data.bill);
    } catch (err) {
      console.error('Save error', err?.response || err);
      const msg = err?.response?.data?.error || err?.message || 'Error saving bill';
      alert(`Error saving bill ❌ - ${msg}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Create Bill</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            className="input"
            placeholder="Store Name"
            value={storeName}
            onChange={e => setStoreName(e.target.value)}
          />
          <input
            className="input"
            placeholder="Bill Number"
            value={billNumber}
            onChange={e => setBillNumber(e.target.value)}
          />
        </div>
        <div className="space-y-3">
          {items.map((it, idx) => (
            <div key={idx} className="bg-gray-50 p-3 rounded">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  className="input"
                  placeholder="Product Name"
                  value={it.productName}
                  onChange={e => updateItem(idx, { productName: e.target.value })}
                />
                <input
                  className="input"
                  placeholder="Product Code (optional)"
                  value={it.productCode}
                  onChange={e => updateItem(idx, { productCode: e.target.value })}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Quantity (optional)"
                  value={it.quantity}
                  onChange={e => updateItem(idx, { quantity: e.target.value })}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Final Price"
                  value={it.finalPrice}
                  onChange={e => updateItem(idx, { finalPrice: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end">
                {items.length > 1 && (
                  <button
                    className="px-3 py-1 mt-2 bg-red-600 text-white rounded w-full sm:w-auto"
                    onClick={() => removeItem(idx)}
                  >Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 p-3 rounded mb-3 text-sm font-semibold">
          Grand Total: ₹{grandTotal.toFixed(2)}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-between mt-3">
          <button className="px-3 py-2 bg-gray-200 rounded w-full sm:w-auto" onClick={addItem}>Add Product</button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold w-full sm:w-auto"
          >
            Save Bill
          </button>
        </div>
      </div>
    </div>
  );
}
