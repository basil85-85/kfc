import { useEffect, useState } from 'react';
import api from '../services/api';
import Loading from '../components/Loading';
import { FiCreditCard, FiCheckCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

const MyPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/payments/my');
        setPayments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loading message="Loading payment records..." />;

  const totalDue = payments
    .filter((p) => p.status !== 'paid')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-8">
      <header className="glass-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="section-label">Financial Records</span>
          <h1 className="font-display text-3xl font-black text-white">My Payments</h1>
          <p className="text-xs text-slate-300">Track your club dues, session fees, and payment status.</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Total Outstanding</span>
          <p className="font-display text-2xl font-black text-rose-300">₹{totalDue}</p>
        </div>
      </header>

      <div className="grid gap-4">
        {payments.map((payment) => (
          <div key={payment._id} className="glass-card-hover flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
                  payment.status === 'paid'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                }`}
              >
                <FiCreditCard size={20} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white capitalize">
                  {payment.type.replace('_', ' ')}
                </h3>
                <p className="text-xs text-slate-400">
                  Due: {new Date(payment.dueDate).toLocaleDateString()}{' '}
                  {payment.description ? `• ${payment.description}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <span className="font-display text-lg font-bold text-white">₹{payment.amount}</span>
              <span
                className={`badge uppercase ${
                  payment.status === 'paid' ? 'badge-emerald' : 'badge-crimson'
                }`}
              >
                {payment.status === 'paid' ? <FiCheckCircle size={12} /> : <FiClock size={12} />}
                {payment.status}
              </span>
            </div>
          </div>
        ))}

        {payments.length === 0 && (
          <div className="glass-card p-12 text-center text-slate-500">
            <p className="font-display text-base font-bold text-white">No payment invoices logged.</p>
            <p className="mt-1 text-xs">All club dues are up-to-date!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPaymentsPage;
