import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";
import { NumberPad } from "../components/ui/NumberPad";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { ProgressBar } from "../components/ui/ProgressBar";
import { formatCurrency, formatDate } from "../lib/format";
import { DebtPayment, DebtWithRemaining, WalletWithBalance } from "@my-finance/shared";
import { Plus, Trash2, CheckCircle2, ChevronRight, ChevronDown, User, History } from "lucide-react";

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
    if (!personName) return alert("Masukkan nama orang/pihak");
    if (totalAmount <= 0) return alert("Masukkan nominal yang valid");

    setLoading(true);
    try {
      await apiFetch("/api/debts", {
        method: "POST",
        body: JSON.stringify({
          person_name: personName,
          type: activeTab,
          total_amount: totalAmount,
          due_date: dueDate || null,
          note: note || null,
        }),
      });
      setIsAddOpen(false);
      setPersonName("");
      setTotalAmount(0);
      setDueDate("");
      setNote("");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal mencatat hutang/piutang");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedDebt) return;
    if (payAmount <= 0) return alert("Masukkan nominal cicilan");
    if (!payWalletId) return alert("Pilih dompet pembayaran");

    setLoading(true);
    try {
      await apiFetch(`/api/debts/${selectedDebt.id}/payments`, {
        method: "POST",
        body: JSON.stringify({
          wallet_id: payWalletId,
          amount: payAmount,
          payment_date: payDate,
          note: payNote || null,
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

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-[#1D1D1F] tracking-tight">Hutang & Piutang</h1>
        <Button size="sm" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-1" /> Catat
        </Button>
      </div>

      <SegmentedControl
        options={[
          { value: "debt", label: "Hutang Saya (Kewajiban)" },
          { value: "receivable", label: "Piutang (Hak Saya)" },
        ]}
        value={activeTab}
        onChange={(val) => setActiveTab(val as any)}
      />

      <div className="space-y-3">
        {filteredDebts.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-12">
            Belum ada catatan {activeTab === "debt" ? "hutang" : "piutang"}.
          </p>
        ) : (
          filteredDebts.map((item) => {
            const isSettled = item.status === "settled" || item.remaining_amount <= 0;
            const today = new Date().toISOString().slice(0, 10);
            const isOverdue = !isSettled && Boolean(item.due_date && item.due_date < today);
            const progress = (item.paid_amount / item.total_amount) * 100;
            const isExpanded = expandedId === item.id;
            const history = paymentsByDebt[item.id] || [];

            return (
              <Card key={item.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer flex-1"
                    onClick={() => toggleHistory(item.id)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1D1D1F] flex items-center gap-1">
                        {item.person_name}
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </p>
                      {item.due_date ? (
                        <p className={`text-[10px] ${isOverdue ? "text-rose-500 font-semibold" : "text-gray-400"}`}>
                          {isOverdue ? "Terlambat: " : "Jatuh tempo: "}
                          {formatDate(item.due_date)}
                        </p>
                      ) : null}
                      {item.note ? (
                        <p className="text-[10px] text-gray-400 italic">{item.note}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSettled ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Lunas
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
                      >
                        {activeTab === "debt" ? "Bayar" : "Terima"}
                        <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-gray-300 hover:text-red-500 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">
                      Sisa: <b className="text-[#1D1D1F]">{formatCurrency(item.remaining_amount)}</b>
                    </span>
                    <span className="text-gray-400">Total: {formatCurrency(item.total_amount)}</span>
                  </div>
                  <ProgressBar
                    progress={progress}
                    color={activeTab === "debt" ? "#FF9500" : "#34C759"}
                  />
                </div>

                {isExpanded ? (
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                      <History className="w-3 h-3" /> Riwayat Cicilan
                    </p>
                    {history.length === 0 ? (
                      <p className="text-[11px] text-gray-400">Belum ada pembayaran cicilan.</p>
                    ) : (
                      history.map((p) => (
                        <div key={p.id} className="flex justify-between text-xs py-1">
                          <div>
                            <span className="font-semibold text-gray-700">{p.wallet_name}</span>
                            <span className="text-gray-400 ml-1.5 text-[10px]">
                              {formatDate(p.payment_date)}
                            </span>
                            {p.note ? (
                              <span className="block text-[10px] text-gray-400">{p.note}</span>
                            ) : null}
                          </div>
                          <span className="font-bold text-[#1D1D1F]">{formatCurrency(p.amount)}</span>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })
        )}
      </div>

      {/* Add Debt Modal */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={activeTab === "debt" ? "Catat Hutang Baru" : "Catat Piutang Baru"}
      >
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase">
              {activeTab === "debt" ? "Berhutang Ke Siapa?" : "Siapa Yang Berhutang?"}
            </label>
            <input
              type="text"
              placeholder="Contoh: Budi, Bank Mandiri"
              className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />
          </div>

          <NumberPad value={totalAmount} onChange={setTotalAmount} />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Jatuh Tempo</label>
              <input
                type="date"
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan</label>
              <input
                type="text"
                placeholder="Opsional"
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <Button size="lg" onClick={handleCreate} loading={loading} className="mt-4">
            Simpan Catatan
          </Button>
        </div>
      </BottomSheet>

      {/* Payment Modal */}
      <BottomSheet
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title={activeTab === "debt" ? "Bayar Cicilan Hutang" : "Terima Pembayaran Piutang"}
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500">
            Pihak: <b>{selectedDebt?.person_name}</b> (Sisa hutang:{" "}
            {formatCurrency(selectedDebt?.remaining_amount || 0)})
          </p>

          <NumberPad value={payAmount} onChange={setPayAmount} />

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">
                {activeTab === "debt" ? "Bayar Pakai Dompet" : "Terima Ke Dompet"}
              </label>
              <select
                className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold"
                value={payWalletId}
                onChange={(e) => setPayWalletId(e.target.value)}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Tanggal</label>
                <input
                  type="date"
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase">Catatan</label>
                <input
                  type="text"
                  placeholder="Cicilan ke-..."
                  className="w-full mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                />
              </div>
            </div>

            <Button size="lg" onClick={handlePay} loading={loading} className="mt-4">
              Konfirmasi Pembayaran
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
