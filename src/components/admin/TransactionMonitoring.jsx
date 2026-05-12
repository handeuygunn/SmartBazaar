import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Activity, AlertTriangle, CheckCircle2, XCircle, 
  Search, Eye, Clock, User, DollarSign, Filter
} from 'lucide-react';

const TransactionMonitoring = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);

  useEffect(() => {
    fetchTransactions();

    // Real-time subscription
    const channel = supabase
      .channel('transactions-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transactions' },
        (payload) => {
          setTransactions(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      setError('Failed to load transactions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Logic to flag repeated failed transactions
  const flaggedUsers = useMemo(() => {
    const failures = {};
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    transactions.forEach(tx => {
      if (tx.status === 'failed' && new Date(tx.created_at) > tenMinutesAgo) {
        failures[tx.user_id] = (failures[tx.user_id] || 0) + 1;
      }
    });

    return Object.entries(failures)
      .filter(([_, count]) => count >= 3)
      .map(([userId]) => userId);
  }, [transactions]);

  const filteredTransactions = transactions.filter(tx => 
    tx.user_id?.toLowerCase().includes(search.toLowerCase()) ||
    tx.status?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status" />
      <p className="mt-3 text-muted">Listening for live transactions...</p>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {/* Flagged Alerts */}
      {flaggedUsers.length > 0 && (
        <div className="alert alert-warning border-0 shadow-sm rounded-4 mb-4 d-flex align-items-center gap-3">
          <AlertTriangle className="text-warning" size={24} />
          <div>
            <h6 className="fw-bold mb-1">Security Alert: Repeated Failures Detected</h6>
            <p className="mb-0 small">
              Multiple failed transaction attempts from users: {flaggedUsers.map(u => u.slice(0, 8)).join(', ')}. 
              Possible payment fraud or system issue.
            </p>
          </div>
        </div>
      )}

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        <div className="card-header bg-white border-bottom p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div className="d-flex align-items-center gap-2">
            <Activity className="text-primary" size={20} />
            <h5 className="fw-bold m-0">Live Transaction Log</h5>
          </div>
          <div className="input-group" style={{ maxWidth: '300px' }}>
            <span className="input-group-text bg-light border-end-0">
              <Search size={16} className="text-muted" />
            </span>
            <input 
              type="text" 
              className="form-control bg-light border-start-0" 
              placeholder="Search by User ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="py-3">User ID</th>
                  <th className="py-3">Amount</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">Method</th>
                  <th className="px-4 py-3 text-end">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isFlagged = flaggedUsers.includes(tx.user_id);
                  return (
                    <tr key={tx.id} className={isFlagged ? 'table-warning' : ''}>
                      <td className="px-4 text-muted small">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-medium">#{tx.user_id?.slice(0, 8)}</span>
                          {isFlagged && <AlertTriangle size={14} className="text-danger" />}
                        </div>
                      </td>
                      <td className="fw-bold">${tx.amount?.toFixed(2)}</td>
                      <td>
                        {tx.status === 'success' ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2 py-1">
                            <CheckCircle2 size={12} className="me-1" /> Success
                          </span>
                        ) : (
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1">
                            <XCircle size={12} className="me-1" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="text-capitalize small">{tx.payment_method?.replace('_', ' ')}</td>
                      <td className="px-4 text-end">
                        <button 
                          className="btn btn-sm btn-light border rounded-pill px-3"
                          onClick={() => setSelectedTx(tx)}
                        >
                          <Eye size={14} className="me-1" /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-bottom p-4">
                <h5 className="fw-bold m-0">Transaction Details</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedTx(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-4">
                  <div className="col-6">
                    <label className="text-muted small fw-medium text-uppercase mb-1 d-block">Transaction ID</label>
                    <div className="fw-bold">#{selectedTx.id}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small fw-medium text-uppercase mb-1 d-block">Status</label>
                    <div className={`fw-bold ${selectedTx.status === 'success' ? 'text-success' : 'text-danger'}`}>
                      {selectedTx.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small fw-medium text-uppercase mb-1 d-block">User ID</label>
                    <div className="fw-medium">{selectedTx.user_id}</div>
                  </div>
                  <div className="col-6">
                    <label className="text-muted small fw-medium text-uppercase mb-1 d-block">Amount</label>
                    <div className="fw-bold text-primary fs-5">${selectedTx.amount?.toFixed(2)}</div>
                  </div>
                  <div className="col-12">
                    <label className="text-muted small fw-medium text-uppercase mb-1 d-block">Full Payload (Debug)</label>
                    <pre className="bg-light p-3 rounded-3 small text-muted overflow-auto" style={{ maxHeight: '200px' }}>
                      {JSON.stringify(selectedTx.details, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0 p-4 pt-0">
                <button className="btn btn-primary w-100 fw-bold py-2 rounded-3" onClick={() => setSelectedTx(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionMonitoring;
