import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Search() {
  const navigate = useNavigate();
  const [billNumber, setBillNumber] = useState('');
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/api/stores');
        setStores(res.data.stores || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const search = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (billNumber) params.billNumber = billNumber;
      if (storeId) params.storeId = storeId;
      const res = await axios.get('/api/bills/search', { params });
      setResults(res.data.bills || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="text-2xl font-bold">Search Bills</h1>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <div className="grid md:grid-cols-3 gap-3">
            <input className="input" type="number" placeholder="Bill number" value={billNumber} onChange={e => setBillNumber(e.target.value)} />
            <select className="input" value={storeId} onChange={e => setStoreId(e.target.value)}>
              <option value="">All stores</option>
              {stores.map(s => (
                <option value={s.storeId} key={s.storeId}>{s.name}</option>
              ))}
            </select>
            <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={search}>Search</button>
          </div>
        </div>

        {loading && <div className="mt-4">Loading...</div>}
        {error && <div className="mt-4 text-red-600">{error}</div>}

        <div className="mt-4 space-y-3">
          {results.map(b => (
            <div key={b._id} className="bg-white p-4 rounded shadow">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">Bill #{b.billNumber}</div>
                  <div className="text-xs text-gray-500">{new Date(b.date).toLocaleString()}</div>
                </div>
                <div className="text-right text-sm">
                  <div>Store: {b.store?.name || '—'}</div>
                  <div>Total: ₹{(b.grandTotal || 0).toFixed(2)}</div>
                  <div>Paid: ₹{(b.paidAmount || 0).toFixed(2)}</div>
                  <div className="font-semibold">Pending: ₹{(b.pendingAmount || 0).toFixed(2)}</div>
                </div>
              </div>
              <div className="mt-2 text-sm">
                <ul className="list-disc pl-5">
                  {b.products.map((p, i) => (
                    <li key={i}>{p.productName} ({p.productCode || '—'}): {p.quantity} × ₹{p.price} → ₹{(p.finalPrice || 0).toFixed(2)}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          {!loading && results.length === 0 && (
            <div className="text-gray-600">No results.</div>
          )}
        </div>
      </div>
    </div>
  );
}
