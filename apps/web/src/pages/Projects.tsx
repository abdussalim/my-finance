import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api-client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { BottomSheet } from "../components/ui/BottomSheet";
import { NumberPad } from "../components/ui/NumberPad";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { ProgressBar } from "../components/ui/ProgressBar";
import { EmptyState } from "../components/ui/EmptyState";
import { formatCurrency, relativeDate } from "../lib/format";
import { ProjectWithStats, WalletWithBalance, Category } from "@my-finance/shared";
import {
  Briefcase,
  Plus,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  ChevronRight,
  Receipt,
  FileText,
} from "lucide-react";

const PROJECT_PALETTE = [
  "#8B5CF6", // Violet (EDUNUSA)
  "#F59E0B", // Amber (SOBATPART)
  "#06B6D4", // Cyan (ISTANA BLOCK)
  "#10B981", // Emerald
  "#EC4899", // Pink
  "#6366F1", // Indigo
  "#3B82F6", // Blue
  "#F43F5E", // Rose
];

export function Projects() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Sheet
  const [selectedProject, setSelectedProject] = useState<ProjectWithStats | null>(null);
  const [projectTransactions, setProjectTransactions] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Create / Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pName, setPName] = useState("");
  const [pCode, setPCode] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pColor, setPColor] = useState(PROJECT_PALETTE[0]);
  const [pStatus, setPStatus] = useState<"active" | "on_hold" | "completed">("active");
  const [pBudget, setPBudget] = useState(0);
  const [pTargetRevenue, setPTargetRevenue] = useState(0);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Quick Add Transaction for Project
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [txType, setTxType] = useState<"income" | "expense">("income");
  const [txAmount, setTxAmount] = useState(0);
  const [txWalletId, setTxWalletId] = useState("");
  const [txCategoryId, setTxCategoryId] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txNote, setTxNote] = useState("");
  const [txSubmitting, setTxSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [prjs, wts, cats] = await Promise.all([
        apiFetch<ProjectWithStats[]>("/api/projects"),
        apiFetch<WalletWithBalance[]>("/api/wallets"),
        apiFetch<Category[]>("/api/categories"),
      ]);
      setProjects(prjs);
      setWallets(wts);
      setCategories(cats);
      if (wts.length > 0 && !txWalletId) setTxWalletId(wts[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openProjectDetail = async (p: ProjectWithStats) => {
    setSelectedProject(p);
    setLoadingDetails(true);
    try {
      const detail = await apiFetch<any>(`/api/projects/${p.id}`);
      setProjectTransactions(detail.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setPName("");
    setPCode("");
    setPDesc("");
    setPColor(PROJECT_PALETTE[projects.length % PROJECT_PALETTE.length]);
    setPStatus("active");
    setPBudget(0);
    setPTargetRevenue(0);
    setIsFormOpen(true);
  };

  const openEditForm = (p: ProjectWithStats) => {
    setEditingId(p.id);
    setPName(p.name);
    setPCode(p.code || "");
    setPDesc(p.description || "");
    setPColor(p.color || PROJECT_PALETTE[0]);
    setPStatus(p.status as any);
    setPBudget(p.budget || 0);
    setPTargetRevenue(p.target_revenue || 0);
    setIsFormOpen(true);
  };

  const handleSaveProject = async () => {
    if (!pName.trim()) return alert("Nama proyek wajib diisi");

    setFormSubmitting(true);
    try {
      const payload = {
        name: pName.trim(),
        code: (pCode || pName.slice(0, 3)).toUpperCase().trim(),
        description: pDesc.trim() || null,
        color: pColor,
        status: pStatus,
        budget: pBudget,
        target_revenue: pTargetRevenue,
      };

      if (editingId) {
        await apiFetch(`/api/projects/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/projects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      setIsFormOpen(false);
      await loadData();
      if (selectedProject && selectedProject.id === editingId) {
        const refreshed = await apiFetch<any>(`/api/projects/${editingId}`);
        setSelectedProject(refreshed);
      }
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan proyek");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Hapus proyek "${name}"? Transaksi yang sudah tercatat akan tetap ada dan dilepas dari proyek.`)) return;
    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      setSelectedProject(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus proyek");
    }
  };

  const handleCreateProjectTransaction = async () => {
    if (!selectedProject) return;
    if (txAmount <= 0) return alert("Masukkan nominal transaksi yang valid");
    if (!txWalletId) return alert("Pilih dompet yang digunakan");

    setTxSubmitting(true);
    try {
      await apiFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          wallet_id: txWalletId,
          category_id: txCategoryId || null,
          project_id: selectedProject.id,
          type: txType,
          amount: txAmount,
          date: txDate,
          note: txNote || `Transaksi proyek ${selectedProject.name}`,
        }),
      });

      setIsAddTxOpen(false);
      setTxAmount(0);
      setTxNote("");
      // Reload both list and detail
      await loadData();
      const updated = await apiFetch<any>(`/api/projects/${selectedProject.id}`);
      setSelectedProject(updated);
      setProjectTransactions(updated.transactions || []);
    } catch (err: any) {
      alert(err.message || "Gagal mencatat transaksi proyek");
    } finally {
      setTxSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6 space-y-4 animate-pulse" role="status" aria-label="Memuat data proyek…">
        <div className="h-40 bg-white/[0.04] rounded-2xl border border-white/[0.08]" />
        <div className="h-32 bg-white/[0.04] rounded-2xl border border-white/[0.08]" />
        <div className="h-32 bg-white/[0.04] rounded-2xl border border-white/[0.08]" />
      </div>
    );
  }

  // Aggregate project statistics
  const totalProjectRevenue = projects.reduce((acc, p) => acc + p.total_income, 0);
  const totalProjectExpense = projects.reduce((acc, p) => acc + p.total_expense, 0);
  const totalProjectProfit = totalProjectRevenue - totalProjectExpense;
  const averageMargin =
    totalProjectRevenue > 0
      ? Math.round((totalProjectProfit / totalProjectRevenue) * 100)
      : 0;

  return (
    <div className="space-y-4 pt-3">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400/90 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" aria-hidden="true" /> Multi-Venture Ledger
          </span>
          <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Manajemen Proyek & Bisnis
          </h1>
        </div>
        <Button
          size="sm"
          onClick={openCreateForm}
          className="gap-1 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
          aria-label="Tambah Proyek Baru"
        >
          <Plus className="w-4 h-4" aria-hidden="true" /> Proyek Baru
        </Button>
      </div>

      {/* Hero Telemetry Card */}
      <Card className="p-4 relative overflow-hidden border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-[#11141E]/90 to-purple-950/30 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-cyan-400 to-purple-500" aria-hidden="true" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Laba Bersih Seluruh Proyek
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
              totalProjectProfit >= 0
                ? "text-emerald-400 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                : "text-rose-400 bg-rose-500/15 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
            }`}
          >
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            {averageMargin >= 0 ? `+${averageMargin}% Margin` : `${averageMargin}% Margin`}
          </span>
        </div>

        <div
          className={`text-3xl font-extrabold num-tabular tracking-tight my-1 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] ${
            totalProjectProfit >= 0 ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {totalProjectProfit >= 0 ? "+" : ""}
          {formatCurrency(totalProjectProfit)}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/[0.08] text-xs">
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" /> Omset Proyek
            </span>
            <p className="text-sm font-bold text-emerald-400 num-tabular mt-0.5">
              {formatCurrency(totalProjectRevenue)}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
              <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" /> Biaya Operasional
            </span>
            <p className="text-sm font-bold text-rose-400 num-tabular mt-0.5">
              {formatCurrency(totalProjectExpense)}
            </p>
          </div>
        </div>
      </Card>

      {/* Projects List Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" /> Portofolio Bisnis ({projects.length})
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            Ketuk kartu untuk analisis & transaksi
          </span>
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-6 h-6" />}
            title="Belum ada proyek"
            description="Tambahkan proyek usaha atau bisnis Anda (seperti EDUNUSA, SOBATPART, ISTANA BLOCK) untuk memantau omset dan profit secara terpisah."
            action={
              <Button size="sm" onClick={openCreateForm}>
                <Plus className="w-4 h-4 mr-1" aria-hidden="true" /> Buat Proyek Pertama
              </Button>
            }
          />
        ) : (
          projects.map((p) => {
            const hasTarget = (p.target_revenue || 0) > 0;
            const hasBudget = (p.budget || 0) > 0;

            return (
              <Card
                key={p.id}
                interactive
                onClick={() => openProjectDetail(p)}
                className="p-4 space-y-3 border-white/[0.09] hover:border-indigo-500/40 relative overflow-hidden group shadow-lg"
              >
                {/* Accent top stripe */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: p.color || "#6366F1", boxShadow: `0 0 10px ${p.color || "#6366F1"}` }}
                  aria-hidden="true"
                />

                {/* Project Header */}
                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shadow-md border border-white/20 shrink-0"
                      style={{
                        backgroundColor: p.color || "#6366F1",
                        boxShadow: `0 0 15px ${p.color || "#6366F1"}55`,
                      }}
                    >
                      {p.code || p.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {p.name}
                        </h3>
                        <span
                          className={`inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                            p.status === "active"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : p.status === "completed"
                              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              p.status === "active" ? "bg-emerald-400 animate-pulse" : "bg-current"
                            }`}
                          />
                          {p.status === "active" ? "Aktif" : p.status === "completed" ? "Selesai" : "Pending"}
                        </span>
                      </div>
                      {p.description ? (
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {p.description}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors shrink-0 mt-2" aria-hidden="true" />
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Omset</span>
                    <p className="text-xs font-bold text-emerald-400 num-tabular truncate mt-0.5">
                      {formatCurrency(p.total_income)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Biaya</span>
                    <p className="text-xs font-bold text-rose-400 num-tabular truncate mt-0.5">
                      {formatCurrency(p.total_expense)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Laba Bersih</span>
                    <p
                      className={`text-xs font-extrabold num-tabular truncate mt-0.5 ${
                        p.net_profit >= 0 ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {p.net_profit >= 0 ? "+" : ""}
                      {formatCurrency(p.net_profit)}
                    </p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-1.5 pt-0.5 text-[11px]">
                  {hasTarget ? (
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1 num-tabular">
                        <span>Pencapaian Target ({p.revenue_progress_percentage}%)</span>
                        <span className="text-slate-300 font-medium">
                          {formatCurrency(p.total_income)} / {formatCurrency(p.target_revenue)}
                        </span>
                      </div>
                      <ProgressBar
                        progress={p.revenue_progress_percentage}
                        color={p.color || "#10B981"}
                        height="sm"
                      />
                    </div>
                  ) : null}

                  {hasBudget ? (
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1 num-tabular">
                        <span>Serapan Anggaran ({p.budget_burn_percentage}%)</span>
                        <span className="text-slate-300 font-medium">
                          {formatCurrency(p.total_expense)} / {formatCurrency(p.budget)}
                        </span>
                      </div>
                      <ProgressBar
                        progress={p.budget_burn_percentage}
                        color={p.budget_burn_percentage > 90 ? "#F43F5E" : "#6366F1"}
                        height="sm"
                      />
                    </div>
                  ) : null}

                  {!hasTarget && !hasBudget ? (
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>{p.transaction_count} transaksi tercatat</span>
                      <span className="font-semibold text-indigo-400">
                        Margin: {p.margin_percentage}%
                      </span>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Project Detail Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedProject)}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.name || "Rincian Proyek"}
        subtitle={selectedProject?.description || "Detail kinerja finansial proyek"}
      >
        {selectedProject ? (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex gap-2">
              <Button
                size="md"
                className="flex-1 gap-1.5"
                onClick={() => {
                  setTxAmount(0);
                  setTxNote("");
                  setIsAddTxOpen(true);
                }}
              >
                <Plus className="w-4 h-4" aria-hidden="true" /> Catat Transaksi Proyek
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  openEditForm(selectedProject);
                }}
                className="px-3"
                aria-label="Edit Proyek"
              >
                <Edit3 className="w-4 h-4" aria-hidden="true" />
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => handleDeleteProject(selectedProject.id, selectedProject.name)}
                className="px-3"
                aria-label="Hapus Proyek"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
              </Button>
            </div>

            {/* Performance Metric Box */}
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Kinerja Finansial
                </span>
                <span
                  className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${
                    selectedProject.net_profit >= 0
                      ? "text-emerald-400 bg-emerald-500/15"
                      : "text-rose-400 bg-rose-500/15"
                  }`}
                >
                  Margin: {selectedProject.margin_percentage}%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-white/[0.03]">
                  <p className="text-[10px] text-slate-400 uppercase">Omset</p>
                  <p className="text-xs font-bold text-emerald-400 num-tabular mt-0.5">
                    {formatCurrency(selectedProject.total_income)}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03]">
                  <p className="text-[10px] text-slate-400 uppercase">Biaya</p>
                  <p className="text-xs font-bold text-rose-400 num-tabular mt-0.5">
                    {formatCurrency(selectedProject.total_expense)}
                  </p>
                </div>
                <div className="p-2 rounded-xl bg-white/[0.03]">
                  <p className="text-[10px] text-slate-400 uppercase">Laba Bersih</p>
                  <p
                    className={`text-xs font-extrabold num-tabular mt-0.5 ${
                      selectedProject.net_profit >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(selectedProject.net_profit)}
                  </p>
                </div>
              </div>
            </div>

            {/* Linked Transactions List */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Riwayat Transaksi Proyek ({projectTransactions.length})</span>
              </h4>

              {loadingDetails ? (
                <p className="text-xs text-slate-500 py-3 text-center">Memuat transaksi…</p>
              ) : projectTransactions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                  Belum ada transaksi tercatat untuk proyek ini. Klik tombol di atas untuk mencatat.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {projectTransactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            tx.type === "income"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {tx.type === "income" ? (
                            <ArrowDownRight className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">
                            {tx.note || tx.category_name || "Transaksi Proyek"}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {tx.wallet_name} • {relativeDate(tx.date)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-extrabold num-tabular ${
                          tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </BottomSheet>

      {/* Create / Edit Project Bottom Sheet */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? "Edit Informasi Proyek" : "Buat Proyek Baru"}
        subtitle="Kelola inisiatif bisnis atau unit usaha Anda"
      >
        <div className="space-y-3.5">
          <div>
            <label
              htmlFor="project-name"
              className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
            >
              Nama Proyek / Bisnis
            </label>
            <input
              id="project-name"
              name="project_name"
              type="text"
              placeholder="Contoh: EDUNUSA, SOBATPART…"
              className="w-full p-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-xs font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="project-code"
                className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
              >
                Kode Singkat (3-4 Huruf)
              </label>
              <input
                id="project-code"
                name="project_code"
                type="text"
                maxLength={6}
                placeholder="Misal: EDU, SOB, IBL…"
                className="w-full p-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-xs font-semibold text-white uppercase focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none"
                value={pCode}
                onChange={(e) => setPCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Status
              </span>
              <SegmentedControl
                ariaLabel="Pilih status proyek"
                size="sm"
                options={[
                  { value: "active", label: "Aktif" },
                  { value: "on_hold", label: "Tunda" },
                  { value: "completed", label: "Selesai" },
                ]}
                value={pStatus}
                onChange={(val) => setPStatus(val as any)}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="project-desc"
              className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
            >
              Deskripsi Singkat / Sektor
            </label>
            <input
              id="project-desc"
              name="project_description"
              type="text"
              placeholder="Misal: Distribusi sparepart otomotif…"
              className="w-full p-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-xs font-medium text-white focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none"
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
            />
          </div>

          {/* Color Swatch */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Warna Identitas Proyek
            </span>
            <div className="flex gap-2 py-1" role="group" aria-label="Pilih warna proyek">
              {PROJECT_PALETTE.map((col) => (
                <button
                  key={col}
                  type="button"
                  aria-label={`Pilih warna ${col}`}
                  onClick={() => setPColor(col)}
                  className={`w-7 h-7 rounded-xl cursor-pointer transition-transform duration-120 press-scale border border-white/20 focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none ${
                    pColor === col ? "scale-115 ring-2 ring-offset-2 ring-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.6)]" : ""
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          {/* Targets */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label
                htmlFor="project-target"
                className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
              >
                Target Omset (Rp)
              </label>
              <input
                id="project-target"
                name="project_target"
                type="number"
                placeholder="0"
                className="w-full p-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-xs font-bold text-white num-tabular focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none"
                value={pTargetRevenue || ""}
                onChange={(e) => setPTargetRevenue(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div>
              <label
                htmlFor="project-budget"
                className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
              >
                Anggaran Biaya (Rp)
              </label>
              <input
                id="project-budget"
                name="project_budget"
                type="number"
                placeholder="0"
                className="w-full p-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-xs font-bold text-white num-tabular focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none"
                value={pBudget || ""}
                onChange={(e) => setPBudget(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleSaveProject}
            loading={formSubmitting}
            className="mt-2"
          >
            {editingId ? "Simpan Perubahan" : "Buat Proyek Baru"}
          </Button>
        </div>
      </BottomSheet>

      {/* Quick Add Transaction for this Project */}
      <BottomSheet
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        title={`Catat Transaksi: ${selectedProject?.name}`}
        subtitle="Transaksi ini akan otomatis terhubung ke proyek"
      >
        <div className="space-y-3.5">
          <SegmentedControl
            ariaLabel="Pilih jenis transaksi proyek"
            options={[
              { value: "income", label: "Pemasukan Proyek (Omset)" },
              { value: "expense", label: "Biaya / Operasional Proyek" },
            ]}
            value={txType}
            onChange={(val) => setTxType(val as any)}
          />

          <NumberPad value={txAmount} onChange={setTxAmount} />

          {/* Wallet Selector */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Masuk/Keluar Melalui Dompet
            </span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Pilih dompet transaksi">
              {wallets.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setTxWalletId(w.id)}
                  aria-pressed={txWalletId === w.id}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all press-scale cursor-pointer ${
                    txWalletId === w.id
                      ? "bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: w.color || "#6366F1" }}
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

          {/* Date & Note Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="prj-tx-date"
                className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1"
              >
                <Calendar className="w-3 h-3" aria-hidden="true" /> Tanggal
              </label>
              <input
                id="prj-tx-date"
                name="project_transaction_date"
                type="date"
                className="w-full p-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs font-semibold text-white focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="prj-tx-note"
                className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1"
              >
                <FileText className="w-3 h-3" aria-hidden="true" /> Catatan
              </label>
              <input
                id="prj-tx-note"
                name="project_transaction_note"
                type="text"
                placeholder="Misal: Pembayaran klien…"
                className="w-full p-2 bg-white/[0.05] border border-white/10 rounded-xl text-xs font-medium text-white focus-visible:ring-2 focus-visible:ring-[#6366F1] focus-visible:outline-none"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
              />
            </div>
          </div>

          <Button
            size="lg"
            onClick={handleCreateProjectTransaction}
            loading={txSubmitting}
            className="mt-2"
          >
            Simpan Transaksi Proyek
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
