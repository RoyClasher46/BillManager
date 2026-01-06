import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BillPage from './BillPage';

export default function StoreDetail() {
  const { id: storeId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('bills');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingBillId, setSavingBillId] = useState('');
  const [paidInputs, setPaidInputs] = useState({});
  const [lumpAmount, setLumpAmount] = useState('');
  const [applying, setApplying] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/stores/${storeId}`);
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [storeId]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <button className="px-3 py-1 bg-gray-200 rounded w-full sm:w-auto" onClick={() => navigate(-1)}>← Back</button>
          <h1 className="text-2xl font-bold">{data?.store?.name || 'Store'}</h1>
        </div>

        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}

        {data && (
          <div className="bg-white p-4 rounded shadow">
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>Total: ₹{(data.totals.totalAmount || 0).toFixed(2)}</div>
              <div>Paid: ₹{(data.totals.totalPaid || 0).toFixed(2)}</div>
              <div>Pending: ₹{(data.totals.totalPending || 0).toFixed(2)}</div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Pay amount to oldest bills</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Amount to pay"
                  value={lumpAmount}
                  onChange={e => setLumpAmount(e.target.value)}
                />
              </div>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-60 w-full md:w-auto"
                disabled={applying || !lumpAmount || Number(lumpAmount) <= 0}
                onClick={async () => {
                  try {
                    setApplying(true);
                    const amount = Number(lumpAmount);
                    const res = await axios.post(`/api/stores/${storeId}/payments/apply`, { amount });
                    const msg = res?.data?.applied?.length
                      ? `Applied to ${res.data.applied.length} bill(s).| Store Pending: ₹${(res?.data?.totals?.totalPending || 0).toFixed(2)}`
                      : 'No bills updated';
                    alert(msg);
                    setLumpAmount('');
                    await load();
                  } catch (e) {
                    alert(e?.response?.data?.error || e.message);
                  } finally {
                    setApplying(false);
                  }
                }}
              >Apply Payment</button>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setTab('bills')} className={`px-3 py-2 rounded w-full sm:w-auto ${tab==='bills'?'bg-blue-600 text-white':'bg-white'}`}>Bills</button>
          <button onClick={() => setTab('add')} className={`px-3 py-2 rounded w-full sm:w-auto ${tab==='add'?'bg-blue-600 text-white':'bg-white'}`}>Add Bill</button>
        </div>

        {tab === 'bills' && (
          <div className="mt-4 space-y-3">
            {(data?.bills || []).map(b => (
              <div key={b._id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">Bill #{b.billNumber}</div>
                    <div className="text-xs text-gray-500">{new Date(b.date).toLocaleString()}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div>Total: ₹{(b.grandTotal || 0).toFixed(2)}</div>
                    <div className="flex flex-wrap items-center gap-2 justify-end mt-1">
                      <span>Paid: </span>
                      <input
                        type="number"
                        min={0}
                        max={b.grandTotal || undefined}
                        className="border rounded px-2 py-1 w-28"
                        value={paidInputs[b._id] ?? b.paidAmount ?? 0}
                        onChange={e => {
                          const v = e.target.value;
                          setPaidInputs({ ...paidInputs, [b._id]: v });
                        }}
                      />
                      <button
                        className="px-2 py-1 bg-gray-500 text-white rounded disabled:opacity-60 w-full sm:w-auto"
                        disabled={savingBillId === b._id}
                        onClick={() => setPaidInputs({ ...paidInputs, [b._id]: b.grandTotal })}
                      >Pay Full</button>
                      <button
                        className="px-2 py-1 bg-blue-600 text-white rounded disabled:opacity-60 w-full sm:w-auto"
                        disabled={savingBillId === b._id || Number(paidInputs[b._id] ?? b.paidAmount ?? 0) > (b.grandTotal || 0)}
                        onClick={async () => {
                          try {
                            setSavingBillId(b._id);
                            let val = Number(paidInputs[b._id] ?? b.paidAmount ?? 0);
                            if (val < 0) val = 0;
                            if (b.grandTotal && val > b.grandTotal) val = b.grandTotal;
                            const resp = await axios.patch(`/api/bills/${b._id}/paid`, { paidAmount: val });
                            const pending = resp?.data?.bill?.pendingAmount;
                            if (typeof pending === 'number') {
                              alert(`Pending updated: ₹${pending.toFixed(2)}`);
                            }
                            await load();
                          } catch (e) {
                            alert(e?.response?.data?.error || e.message);
                          } finally {
                            setSavingBillId('');
                          }
                        }}
                      >Save</button>
                    </div>
                    {Number(paidInputs[b._id] ?? b.paidAmount ?? 0) > (b.grandTotal || 0) && (
                      <div className="text-xs text-red-600 mt-1">Paid cannot exceed total ₹{(b.grandTotal || 0).toFixed(2)}</div>
                    )}
                    <div className="font-semibold">Pending: ₹{(b.pendingAmount || 0).toFixed(2)}</div>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <ul className="list-disc pl-5">
                    {b.products.map((p, i) => (
                      <li key={i}>
                        {p.productName} ({p.productCode || '—'}): ₹{(p.finalPrice || 0).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
            {data && data.bills?.length === 0 && (
              <div className="text-gray-600">No bills yet.</div>
            )}
          </div>
        )}

        {tab === 'add' && (
          <div className="mt-4">
            <BillPage defaultStoreName={data?.store?.name || ''} onSaved={() => { setTab('bills'); load(); }} />
          </div>
        )}
      </div>
    </div>
  );
}
