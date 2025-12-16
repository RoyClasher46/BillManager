import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newStoreName, setNewStoreName] = useState('');
  const [creating, setCreating] = useState(false);
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      // validate date range
      if (fromDate && toDate && new Date(toDate) < new Date(fromDate)) {
        setError('To date cannot be earlier than From date');
        setPayments([]);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      const paymentParams = { limit: 10, page };
      if (fromDate) paymentParams.from = fromDate;
      if (toDate) paymentParams.to = toDate;
      const [storesRes, paymentsRes] = await Promise.all([
        axios.get('/api/stores'),
        axios.get('/api/payments', { params: paymentParams })
      ]);
      setStores(storesRes.data.stores || []);
      setPayments(paymentsRes.data.payments || []);
      setTotalPages(paymentsRes.data.totalPages || 1);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
          <h1 className="text-2xl font-bold">Stores Summary</h1>
          <div className="flex gap-2 flex-wrap">
            <button className="px-3 py-2 bg-gray-800 text-white rounded w-full sm:w-auto" onClick={() => navigate('/search')}>Search Bills</button>
            <button className="px-3 py-2 bg-blue-600 text-white rounded w-full sm:w-auto" onClick={() => navigate('/new-bill')}>New Bill</button>
          </div>
        </div>
        {/* Quick Add Store */}
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
            <input className="input md:col-span-2" placeholder="New store name" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} />
            <button
              className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-60 w-full md:w-auto"
              disabled={creating || !newStoreName.trim()}
              onClick={async () => {
                try {
                  setCreating(true);
                  await axios.post('/api/stores', { name: newStoreName.trim() });
                  setNewStoreName('');
                  await load();
                } catch (e) {
                  alert(e?.response?.data?.error || e.message);
                } finally {
                  setCreating(false);
                }
              }}
            >Add Store</button>
          </div>
        </div>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(stores || []).map(s => (
            <div key={s.storeId} className="bg-white rounded shadow p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-lg">{s.name}</div>
                  <div className="text-sm text-gray-500">Bills: {s.billsCount}</div>
                </div>
                <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={() => navigate(`/stores/${s.storeId}`)}>Open</button>
              </div>
              <div className="mt-3 text-sm">
                <div>Total Amount: ₹{(s.totalAmount || 0).toFixed(2)}</div>
                <div>Paid: ₹{(s.totalPaid || 0).toFixed(2)}</div>
                <div className="font-semibold">Pending: ₹{(s.totalPending || 0).toFixed(2)}</div>
              </div>
            </div>
          ))}
          {!loading && stores.length === 0 && (
            <div className="text-gray-600">No stores yet. Create a bill to get started.</div>
          )}

        </div>

        {/* Global totals footer */}
        <div className="mt-6 bg-white rounded shadow p-4">
          {(() => {
            const totals = (stores || []).reduce((acc, s) => {
              acc.totalAmount += s.totalAmount || 0;
              acc.totalPaid += s.totalPaid || 0;
              acc.totalPending += s.totalPending || 0;
              return acc;
            }, { totalAmount: 0, totalPaid: 0, totalPending: 0 });
            return (
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="font-semibold">All Stores Total: ₹{totals.totalAmount.toFixed(2)}</div>
                <div className="font-semibold">All Paid: ₹{totals.totalPaid.toFixed(2)}</div>
                <div className="font-semibold">All Pending: ₹{totals.totalPending.toFixed(2)}</div>
              </div>
            );
          })()}
        </div>

        {/* Recent Payments */}
        <div className="mt-6 bg-white rounded shadow p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-end mb-2">
            <h2 className="font-semibold">Recent Payments</h2>
            <div className="flex items-end gap-2 flex-wrap">
              <div className="w-full sm:w-auto">
                <label className="block text-xs mb-1">From</label>
                <input type="date" className="input" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="w-full sm:w-auto">
                <label className="block text-xs mb-1">To</label>
                <input type="date" className="input" value={toDate} min={fromDate || undefined} onChange={e => setToDate(e.target.value)} />
              </div>
              <button className="px-2 py-2 text-sm bg-gray-800 text-white rounded w-full sm:w-auto" onClick={() => { setPage(1); load(); }}>Filter</button>
              <button className="px-2 py-2 text-sm bg-gray-200 rounded w-full sm:w-auto" onClick={() => { setFromDate(''); setToDate(''); setPage(1); setTimeout(load, 0); }}>Clear</button>
            </div>
          </div>
          {payments.length === 0 ? (
            <div className="text-gray-600 text-sm">No payments yet.</div>
          ) : (
            <div className="divide-y">
              {payments.map(p => (
                <div key={p._id} className="py-2 text-sm flex justify-between items-center">
                  <div>
                    <div>
                      ₹{(p.amount || 0).toFixed(2)} paid to <span className="font-medium">{p.store?.name || '—'}</span>
                    </div>
                    <div className="text-gray-500 text-xs">
                      Bill #{p.bill?.billNumber || '—'} · {p.date ? new Date(p.date).toLocaleString() : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <button
                className="px-3 py-2 text-sm bg-gray-200 rounded disabled:opacity-60"
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
              >Prev</button>
              <div className="flex gap-1 flex-wrap">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={`px-3 py-2 text-sm rounded ${page === (i+1) ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    onClick={() => setPage(i + 1)}
                  >{i + 1}</button>
                ))}
              </div>
              <button
                className="px-3 py-2 text-sm bg-gray-200 rounded disabled:opacity-60"
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              >Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
