import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";
import { canAddModule, canEditModule } from "../utils/auth";

const todayKey = () => new Date().toISOString().slice(0, 10);
const monthStartKey = () => `${todayKey().slice(0, 7)}-01`;
const emptyForm = {
  type: "income",
  title: "",
  category: "",
  amount: "",
  date: todayKey(),
  method: "",
  notes: "",
  staffId: "",
};

const formatMoney = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function StatCard({ label, value, note, icon: Icon, tone }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{note}</p>
        </div>
        <div className={`rounded-2xl p-3 ${tone}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function FinanceTable({ title, items, emptyText, canEdit, onEdit, onDelete, income }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="text-sm text-slate-500">{items.length} entries</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-3 py-3">Title</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Category</th>
                <th className="px-3 py-3">Staff / Patient</th>
                <th className="px-3 py-3 text-right">Amount</th>
                {canEdit ? <th className="px-3 py-3 text-right">Action</th> : null}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 align-top">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">
                      {item.source === "payroll" ? "Managed from Payroll" : item.method || "Manual"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-slate-600">{formatDate(item.date)}</td>
                  <td className="px-3 py-3 text-slate-600">{item.category || "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{item.staffName || item.patientName || "-"}</td>
                  <td className={`px-3 py-3 text-right font-semibold ${income ? "text-emerald-700" : "text-rose-700"}`}>
                    {formatMoney(item.amount)}
                  </td>
                  {canEdit ? (
                    <td className="px-3 py-3">
                      {item.source === "payroll" ? (
                        <p className="text-right text-xs font-medium text-slate-400">Payroll locked</p>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function Finance() {
  const [fromDate, setFromDate] = useState(monthStartKey());
  const [toDate, setToDate] = useState(todayKey());
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canAdd = canAddModule("finance");
  const canEdit = canEditModule("finance");

  const loadFinance = useCallback(async () => {
    setLoading(true);
    try {
      const [financeResponse, usersResponse] = await Promise.all([
        API.get("/finance", { params: { from: fromDate, to: toDate } }),
        API.get("/users").catch(() => ({ data: [] })),
      ]);
      setData(financeResponse.data);
      setUsers(usersResponse.data || []);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load finance data.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadFinance();
  }, [loadFinance]);

  const summary = data?.summary || {};
  const manualIncome = data?.manualIncome || [];
  const patientIncome = data?.patientIncome || [];
  const expenses = data?.expenses || [];

  const staffOptions = useMemo(
    () => users.filter((user) => user.role !== "Admin" || user.status === "Active"),
    [users]
  );

  const submitEntry = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount || 0) };
      if (editingId) {
        await API.put(`/finance/entries/${editingId}`, payload);
      } else {
        await API.post("/finance/entries", payload);
      }
      setForm(emptyForm);
      setEditingId("");
      await loadFinance();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save finance entry.");
    } finally {
      setSaving(false);
    }
  };

  const editEntry = (item) => {
    setEditingId(item.id);
    setForm({
      type: item.type || "income",
      title: item.title || "",
      category: item.category || "",
      amount: item.amount || "",
      date: item.date || todayKey(),
      method: item.method || "",
      notes: item.notes || "",
      staffId: item.staffId || "",
    });
  };

  const deleteEntry = async (item) => {
    if (!window.confirm(`Delete ${item.title}?`)) return;
    await API.delete(`/finance/entries/${item.id}`);
    await loadFinance();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-emerald-950 to-cyan-900 p-6 text-white shadow-md">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-white/60">Finance Desk</p>
              <h1 className="mt-2 text-3xl font-semibold">Income and Expense</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/75">
                Patient payments are pulled automatically. Add manual income and expenses here.
              </p>
            </div>
            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm">
              {formatDate(fromDate)} to {formatDate(toDate)}
            </div>
          </div>
        </div>

        {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

        <form onSubmit={(event) => { event.preventDefault(); loadFinance(); }} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="text-sm font-medium text-slate-600">
              From
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-300 focus:bg-white" />
            </label>
            <label className="text-sm font-medium text-slate-600">
              To
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-300 focus:bg-white" />
            </label>
            <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white" type="submit">
              Apply Range
            </button>
          </div>
        </form>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Income" value={formatMoney(summary.totalIncome)} note="Patient + manual income" icon={TrendingUp} tone="bg-emerald-50 text-emerald-700" />
          <StatCard label="Total Expense" value={formatMoney(summary.totalExpense)} note="Manual + payroll expenses" icon={TrendingDown} tone="bg-rose-50 text-rose-700" />
          <StatCard label="Manual Income" value={formatMoney(summary.manualIncome)} note="Added by admin or staff" icon={Plus} tone="bg-violet-50 text-violet-700" />
          <StatCard label="Net Balance" value={formatMoney(summary.netBalance)} note={`${summary.paidPatientCount || 0} paid patients`} icon={Banknote} tone="bg-cyan-50 text-cyan-700" />
        </div>

        {(canAdd || editingId) && (
          <form onSubmit={submitEntry} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Plus size={18} className="text-emerald-600" />
              <h2 className="text-lg font-semibold text-slate-950">{editingId ? "Edit Finance Entry" : "Add Manual Entry"}</h2>
            </div>
            <div className="grid gap-3 lg:grid-cols-4">
              <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Title" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <input value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} placeholder="Category" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <input value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount" type="number" min="0" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <input value={form.date} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} type="date" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <input value={form.method} onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))} placeholder="Method" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
              <select value={form.staffId} onChange={(event) => setForm((current) => ({ ...current, staffId: event.target.value }))} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <option value="">No staff link</option>
                {staffOptions.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
              <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Notes" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" />
            </div>
            <div className="mt-4 flex gap-3">
              <button type="submit" disabled={saving} className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
                {saving ? "Saving..." : editingId ? "Update Entry" : "Save Entry"}
              </button>
              {editingId ? (
                <button type="button" onClick={() => { setEditingId(""); setForm(emptyForm); }} className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600">
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        )}

        {loading ? <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading finance data...</div> : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <FinanceTable title="Automatic Patient Income" items={patientIncome} emptyText="No patient payment income in this range." income />
          <FinanceTable title="Manual Income" items={manualIncome} emptyText="No manual income added yet." canEdit={canEdit} onEdit={editEntry} onDelete={deleteEntry} income />
          <FinanceTable title="Expenses" items={expenses} emptyText="No expense entry added yet." canEdit={canEdit} onEdit={editEntry} onDelete={deleteEntry} />
        </div>
      </div>
    </DashboardLayout>
  );
}
