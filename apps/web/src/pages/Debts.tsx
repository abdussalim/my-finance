import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";
import { NumberPad } from "../components/ui/NumberPad";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { formatCurrency, formatDate } from "../lib/format";
import { DebtPayment, DebtWithRemaining, WalletWithBalance } from "@my-finance/shared";
import {
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  User,
  History,
  AlertCircle,
  Calendar,
  FileText,
  Wallet as WalletIcon,
} from "lucide-react";

interface PaymentWithWallet extends DebtPayment {
  wallet_name: string;
}

export function Debts() {
  const [debts, setDebts] = useState<DebtWithRemaining[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [activeTab, setActiveTab] = useState<"debt" | "receivable">("debt");

  // Expandable payment history
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paymentsByDebt, setPaymentsByDebt] = useState<Record<string, PaymentWithWallet[]>>({});

  // Create Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [note, setNote] = useState("");

  // Payment Modal
  const [selectedDebt, setSelectedDebt] = useState<DebtWithRemaining | null>(null);
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payWalletId, setPayWalletId] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [payNote, setPayNote] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [allDebts, wts] = await Promise.all([
        apiFetch<DebtWithRemaining[]>("/api/debts"),
        apiFetch<WalletWithBalance[]>("/api/wallets"),
      ]);
      setDebts(allDebts);
      setWallets(wts);
      if (wts.length > 0 && !payWalletId) setPayWalletId(wts[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleHistory = async (debtId: string) => {
    if (expandedId === debtId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(debtId);
    try {
      const list = await apiFetch<PaymentWithWallet[]>(`/api/debts/${debtId}/payments`);
      setPaymentsByDebt((prev) => ({ ...prev, [debtId]: list }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!personName.trim()) return alert("Masukkan nama orang atau pihak bersangkutan");
    if (totalAmount <= 0) return alert("Masukkan nominal yang valid");

    setLoading(true);
    try {
      await apiFetch("/api/debts", {
        method: "POST",
        body: JSON.stringify({
          person_name: personName.trim(),
          type: activeTab,
          total_amount: totalAmount,
          due_date: dueDate || null,
          note: note.trim() || null,
        }),
      });
      setIsAddOpen(false);
      setPersonName("");
      setTotalAmount(0);
      setDueDate("");
      setNote("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat data");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedDebt) return;
    if (payAmount <= 0) return alert("Masukkan nominal pembayaran cicilan");
    if (!payWalletId) return alert("Pilih dompet yang digunakan");

    setLoading(true);
    try {
      await apiFetch(`/api/debts/${selectedDebt.id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          wallet_id: payWalletId,
          amount: payAmount,
          payment_date: payDate,
          note: payNote.trim() || null,
        }),
      });
      setIsPayOpen(false);
      setPayAmount(0);
      setPayNote("");
      await loadData();
      if (expandedId === selectedDebt.id) {
        const list = await apiFetch<PaymentWithWallet[]>(`/api/debts/${selectedDebt.id}/payments`);
        setPaymentsByDebt((prev) => ({ ...prev, [selectedDebt.id]: list }));
      }
    } catch (err: any) {
      alert(err.message || "Gagal memproses pembayaran");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus catatan ini beserta seluruh riwayat cicilannya?")) return;
    try {
      await apiFetch(`/api/debts/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredDebts = debts.filter((d) => d.type === activeTab);
  const totalRemaining = filteredDebts.reduce((acc, curr) => acc + curr.remaining_amount, 0);
  const totalOverdue = filteredDebts.filter((d) => {
    const today = new Date().toISOString().slice(0, 10);
    return d.status !== "settled" && d.remaining_amount > 0 && d.due_date && d.due_date < today;
  }).length;

  return (
    <div className="space-y-4 pt-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Kewajiban & Hak
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Hutang & Piutang
          </h1>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="gap-1 shadow-sm"
          aria-label="Catat Hutang atau Piutang Baru"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Catat
        </Button>
      </div>

      {/* Segmented Switch */}
      <SegmentedControl
        ariaLabel="Pilih jenis catatan hutang atau piutang"
        options={[
          { value: "debt", label: "Hutang Saya (Kewajiban)" },
          { value: "receivable", label: "Piutang (Hak Saya)" },
        ]}
        value={activeTab}
        onChange={(val) => {
          setActiveTab(val as any);
          setExpandedId(null);
        }}
      />

      {/* Active Tab Highlight Summary Card */}
      <div
        className={`p-4 rounded-3xl border shadow-sm transition-colors duration-150 ${
          activeTab === "debt"
            ? "bg-gradient-to-br from-amber-50/80 to-orange-50/60 border-amber-200/60"
            : "bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border-emerald-200/60"
        }`}
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {activeTab === "debt" ? "Total Sisa Hutang" : "Total Sisa Piutang"}
          </p>
          {totalOverdue > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" aria-hidden="true" />
              {totalOverdue} Jatuh Tempo
            </span>
          ) : null}
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 num-tabular tracking-tight">
          {formatCurrency(totalRemaining)}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {filteredDebts.length} catatan ({filteredDebts.filter((d) => d.remaining_amount <= 0).length} lunas)
        </p>
      </div>

      {/* Debts List */}
      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <EmptyState
            icon={<User className="w-7 h-7" />}
            title={`Belum ada catatan ${activeTab === "debt" ? "hutang" : "piutang"}`}
            description={
              activeTab === "debt"
                ? "Catat pinjaman atau tagihan yang perlu Anda bayar di kemudian hari."
                : "Catat pinjaman yang Anda berikan ke pihak lain agar tidak terlupa."
            }
            action={
              <Button size="sm" onClick={() => setIsAddOpen(true)}>
                <Plus className="w-4 h-4 mr-1" aria-hidden="true" /> Buat Catatan Baru
              </Button>
            }
          />
        ) : (
          filteredDebts.map((item) => {
            const isSettled = item.status === "settled" || item.remaining_amount <= 0;
            const today = new Date().toISOString().slice(0, 10);
            const isOverdue = !isSettled && Boolean(item.due_date && item.due_date < today);
            const progress = (item.paid_amount / item.total_amount) * 100;
            const isExpanded = expandedId === item.id;
            const history = paymentsByDebt[item.id] || [];

            return (
              <Card key={item.id} className="p-4 space-y-3.5 border-slate-200/50">
                {/* Person Header */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-3 cursor-pointer flex-1 text-left focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none rounded-xl"
                    onClick={() => toggleHistory(item.id)}
                    aria-expanded={isExpanded}
                    aria-label={`Rincian cicilan untuk ${item.person_name}`}
                  >
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs ${
                        isSettled
                          ? "bg-emerald-100 text-emerald-700"
                          : activeTab === "debt"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-[#007AFF]"
                      }`}
                    >
                      <User className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                        {item.person_name}
                        <ChevronDown
                          aria-hidden="true"
                          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </p>
                      {item.due_date ? (
                        <p
                          className={`text-[11px] ${
                            isOverdue
                              ? "text-rose-600 font-bold flex items-center gap-1"
                              : "text-slate-400"
                          }`}
                        >
                          {isOverdue ? (
                            <>
                              <AlertCircle className="w-3 h-3 text-rose-500" aria-hidden="true" />
                              Terlambat: {formatDate(item.due_date)}
                            </>
                          ) : (
                            `Jatuh tempo: ${formatDate(item.due_date)}`
                          )}
                        </p>
                      ) : null}
                      {item.note ? (
                        <p className="text-[11px] text-slate-400 italic mt-0.5">{item.note}</p>
                      ) : null}
                    </div>
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isSettled ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> Lunas
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelectedDebt(item);
                          setPayAmount(item.remaining_amount);
                          setIsPayOpen(true);
                        }}
                        className="text-xs py-1.5 px-3 min-h-[32px] gap-1"
                      >
                        {activeTab === "debt" ? "Bayar" : "Terima"}
                        <ChevronRight className="w-3 h-3 text-slate-400" aria-hidden="true" />
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg press-scale cursor-pointer focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
                      aria-label={`Hapus catatan ${item.person_name}`}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Progress & Numbers */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs num-tabular">
                    <span className="text-slate-500 font-medium">
                      Sisa:{" "}
                      <b className="text-slate-900 font-bold">
                        {formatCurrency(item.remaining_amount)}
                      </b>
                    </span>
                    <span className="text-slate-400">
                      Total: {formatCurrency(item.total_amount)}
                    </span>
                  </div>
                  <ProgressBar
                    ariaLabel={`Kemajuan pelunasan ${item.person_name}`}
                    progress={progress}
                    color={isSettled ? "#10B981" : activeTab === "debt" ? "#F59E0B" : "#007AFF"}
                  />
                  <div className="flex justify-end text-[10px] text-slate-400 num-tabular font-medium">
                    {Math.round(progress)}% terbayar
                  </div>
                </div>

                {/* Accordion Payment History */}
                {isExpanded ? (
                  <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <History className="w-3 h-3" aria-hidden="true" /> Riwayat Cicilan ({history.length})
                    </p>
                    {history.length === 0 ? (
                      <p className="text-xs text-slate-400 py-1 italic">
                        Belum ada pembayaran cicilan yang dicatat.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        {history.map((p) => (
                          <div
                            key={p.id}
                            className="flex justify-between items-center text-xs py-1.5 px-2 bg-slate-50 rounded-xl"
                          >
                            <div>
                              <span className="font-bold text-slate-700">{p.wallet_name}</span>
                              <span className="text-slate-400 ml-2 text-[10px]">
                                {formatDate(p.payment_date)}
                              </span>
                              {p.note ? (
                                <p className="text-[10px] text-slate-400 italic mt-0.5">{p.note}</p>
                              ) : null}
                            </div>
                            <span className="font-extrabold text-slate-900 num-tabular">
                              {formatCurrency(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </div>

      {/* Add Debt Bottom Sheet */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={activeTab === "debt" ? "Catat Hutang Baru" : "Catat Piutang Baru"}
        subtitle="Isi rincian nama pihak dan total nominal pinjaman"
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor="debt-person-name"
              className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1"
            >
              <User className="w-3.5 h-3.5" aria-hidden="true" />
              {activeTab === "debt" ? "Berhutang Ke Siapa?" : "Siapa Yang Berhutang?"}
            </label>
            <input
              id="debt-person-name"
              name="person_name"
              type="text"
              placeholder="Contoh: Budi, Bank Mandiri…"
              className="w-full p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-900 focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />
          </div>

          <NumberPad value={totalAmount} onChange={setTotalAmount} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="debt-due-date"
                className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1"
              >
                <Calendar className="w-3 h-3" aria-hidden="true" /> Jatuh Tempo
              </label>
              <input
                id="debt-due-date"
                name="due_date"
                type="date"
                className="w-full p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="debt-note"
                className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1"
              >
                <FileText className="w-3 h-3" aria-hidden="true" /> Catatan
              </label>
              <input
                id="debt-note"
                name="note"
                type="text"
                placeholder="Misal: Modal usaha…"
                className="w-full p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <Button size="lg" onClick={handleCreate} loading={loading} className="mt-3">
            Simpan Catatan
          </Button>
        </div>
      </BottomSheet>

      {/* Payment Bottom Sheet */}
      <BottomSheet
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title={activeTab === "debt" ? "Bayar Cicilan Hutang" : "Terima Pembayaran Piutang"}
        subtitle={`Pihak: ${selectedDebt?.person_name} (Sisa: ${formatCurrency(
          selectedDebt?.remaining_amount || 0
        )})`}
      >
        <div className="space-y-4">
          <NumberPad value={payAmount} onChange={setPayAmount} />

          <div className="space-y-3">
            {/* Wallet Selector */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                <WalletIcon className="w-3.5 h-3.5" aria-hidden="true" />
                {activeTab === "debt" ? "Bayar Pakai Dompet" : "Terima Ke Dompet"}
              </span>
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Pilih dompet pembayaran"
              >
                {wallets.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setPayWalletId(w.id)}
                    aria-pressed={payWalletId === w.id}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-colors duration-150 press-scale cursor-pointer focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none ${
                      payWalletId === w.id
                        ? "bg-blue-50/70 border-[#007AFF] text-slate-900 shadow-xs"
                        : "bg-slate-50 border-slate-200/80 text-slate-600"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: w.color || "#007AFF" }}
                      aria-hidden="true"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold truncate">{w.name}</p>
                      <p className="text-[10px] text-slate-400 num-tabular truncate">
                        {formatCurrency(w.current_balance)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label
                  htmlFor="pay-date"
                  className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1"
                >
                  <Calendar className="w-3 h-3" aria-hidden="true" /> Tanggal Bayar
                </label>
                <input
                  id="pay-date"
                  name="payment_date"
                  type="date"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="pay-note"
                  className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1"
                >
                  <FileText className="w-3 h-3" aria-hidden="true" /> Catatan
                </label>
                <input
                  id="pay-note"
                  name="payment_note"
                  type="text"
                  placeholder="Cicilan ke-… (opsional)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 focus-visible:ring-2 focus-visible:ring-[#007AFF] focus-visible:outline-none"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </div>
            </div>

            <Button size="lg" onClick={handlePay} loading={loading} className="mt-3">
              Konfirmasi Pembayaran
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
