import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Pencil,
  Plus,
  ReceiptText,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import API from "../services/api";
import { canAddModule, canEditModule } from "../utils/auth";

const todayKey = () => new Date().toISOString().slice(0, 10);
const currentMonthKey = () => todayKey().slice(0, 7);
const emptyForm = {
  staffId: "",
  bonus: "",
  commission: "",
  paidDate: todayKey(),
  method: "",
  notes: "",
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

export default function Payroll() {
  const [month, setMonth] = useState(currentMonthKey());
  const [data, setData] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canAdd = canAddModule("payroll");
  const canEdit = canEditModule("payroll");

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const response = await API.get("/payroll", { params: { month } });
      setData(response.data);
      setError("");
    } catch (loadError) {
      setError(loadError.response?.data?.message || "Failed to load payroll.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    loadPayroll();
  }, [loadPayroll]);

  const staffOptions = useMemo(() => data?.staff || [], [data?.staff]);
  const payments = data?.payments || [];
  const summary = data?.summary || {};
  const selectedStaff = useMemo(
    () => staffOptions.find((staff) => staff.id === form.staffId),
    [form.staffId, staffOptions]
  );

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const submitPayroll = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        month,
        bonus: Number(form.bonus || 0),
        commission: Number(form.commission || 0),
      };

      if (editing) {
        await API.put(`/payroll/payments/${editing.id}`, payload);
      } else {
        await API.post("/payroll/payments", payload);
      }

      resetForm();
      await loadPayroll();
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Failed to save payroll payment.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (payment) => {
    setEditing(payment);
    setForm({
      staffId: payment.staffId,
      bonus: payment.bonus || "",
      commission: payment.commission || "",
      paidDate: payment.paidDate || todayKey(),
      method: payment.method || "",
      notes: payment.notes || "",
    });
  };

  const deletePayment = async (payment) => {
    if (!window.confirm(`Delete payroll for ${payment.staffNameSnapshot || payment.staffName}?`)) {
      return;
    }

    try {
      await API.delete(`/payroll/payments/${payment.id}`);
      await loadPayroll();
      if (editing?.id === payment.id) {
        resetForm();
      }
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || "Failed to delete payroll payment.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(187,247,208,0.7),_transparent_34%),linear-gradient(135deg,#f8fafc,#ecfeff)] p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-teal-600">Staff Payroll</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-950">Monthly Salary Payments</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Pay staff month wise. Salary is captured as a snapshot, so future salary increases never change old payroll records.
              </p>
            </div>
            <label className="text-sm font-semibold text-slate-600">
              Payroll month
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value || currentMonthKey())}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
              />
            </label>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Base Salary" value={formatMoney(summary.baseSalary)} note={`${summary.paymentCount || 0} paid staff`} icon={WalletCards} tone="bg-cyan-50 text-cyan-700" />
          <StatCard label="Bonus" value={formatMoney(summary.bonus)} note="Extra monthly reward" icon={Plus} tone="bg-emerald-50 text-emerald-700" />
          <StatCard label="Commission" value={formatMoney(summary.commission)} note="Patient or target based" icon={ReceiptText} tone="bg-amber-50 text-amber-700" />
          <StatCard label="Total Paid" value={formatMoney(summary.totalAmount)} note="Added to finance expense" icon={CalendarDays} tone="bg-violet-50 text-violet-700" />
        </div>

        {(canAdd || editing) ? (
          <form onSubmit={submitPayroll} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  {editing ? "Edit Payroll Payment" : "Add Payroll Payment"}
                </h2>
                <p className="text-sm text-slate-500">
                  {editing
                    ? `Base salary snapshot: ${formatMoney(editing.baseSalary)}`
                    : selectedStaff
                      ? `Current salary: ${formatMoney(selectedStaff.monthlySalary)}`
                      : "Select staff to capture their current salary for this month."}
                </p>
              </div>
              {editing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <select
                value={form.staffId}
                disabled={Boolean(editing)}
                onChange={(event) => setForm((current) => ({ ...current, staffId: event.target.value }))}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-300 focus:bg-white"
                required
              >
                <option value="">Select staff</option>
                {staffOptions.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} - {staff.status || "Active"} {staff.alreadyPaid ? "(paid)" : ""}
                  </option>
                ))}
              </select>
              <input
                value={form.bonus}
                onChange={(event) => setForm((current) => ({ ...current, bonus: event.target.value }))}
                placeholder="Bonus"
                type="number"
                min="0"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-300 focus:bg-white"
              />
              <input
                value={form.commission}
                onChange={(event) => setForm((current) => ({ ...current, commission: event.target.value }))}
                placeholder="Commission"
                type="number"
                min="0"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-300 focus:bg-white"
              />
              <input
                value={form.paidDate}
                onChange={(event) => setForm((current) => ({ ...current, paidDate: event.target.value }))}
                type="date"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-300 focus:bg-white"
              />
              <input
                value={form.method}
                onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}
                placeholder="Payment method"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-300 focus:bg-white"
              />
              <input
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Notes"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-teal-300 focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={saving || (!canAdd && !editing)}
              className="mt-4 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : editing ? "Update Payroll" : "Save Payroll"}
            </button>
          </form>
        ) : null}

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Paid Payroll History</h2>
              <p className="text-sm text-slate-500">
                Inactive staff remain visible here whenever salary was paid earlier.
              </p>
            </div>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-semibold text-teal-700">
              {data?.monthLabel || month}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Loading payroll...
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No payroll paid for this month yet.
            </div>
          ) : (
            <div className="grid gap-3">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-3xl border border-slate-200 p-4 transition hover:border-teal-200 hover:bg-teal-50/30">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-50 text-cyan-700">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">{payment.staffNameSnapshot || payment.staffName}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${payment.staffStatus === "Inactive" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                            {payment.staffStatus || payment.staffStatusSnapshot || "Active"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          Paid {formatDate(payment.paidDate)} {payment.method ? `by ${payment.method}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm sm:grid-cols-4 lg:min-w-[560px]">
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-400">Salary</p>
                        <p className="font-semibold text-slate-900">{formatMoney(payment.baseSalary)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-400">Bonus</p>
                        <p className="font-semibold text-slate-900">{formatMoney(payment.bonus)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-3 py-2">
                        <p className="text-xs text-slate-400">Commission</p>
                        <p className="font-semibold text-slate-900">{formatMoney(payment.commission)}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-950 px-3 py-2 text-white">
                        <p className="text-xs text-white/50">Total</p>
                        <p className="font-semibold">{formatMoney(payment.totalAmount)}</p>
                      </div>
                    </div>

                    {canEdit ? (
                      <div className="flex gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() => startEdit(payment)}
                          className="rounded-2xl border border-slate-200 p-2 text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                          title="Edit payroll"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePayment(payment)}
                          className="rounded-2xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                          title="Delete payroll"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
