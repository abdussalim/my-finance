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
import { ProjectWithStats, ProjectTask, WalletWithBalance, Category } from "@my-finance/shared";
import {
  Briefcase,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit3,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  Receipt,
  AlertCircle,
  Filter,
} from "lucide-react";

const PROJECT_PALETTE = [
  "#6366F1", // Indigo (EDUNUSA)
  "#0EA5E9", // Sky Blue (SOBATPART)
  "#F59E0B", // Amber (ISTANA BLOCK)
  "#10B981", // Emerald
  "#EC4899", // Pink
  "#8B5CF6", // Purple
];

export function Projects() {
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [wallets, setWallets] = useState<WalletWithBalance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail Sheet (Project Management Cockpit)
  const [selectedProject, setSelectedProject] = useState<ProjectWithStats | null>(null);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [projectTransactions, setProjectTransactions] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [cockpitTab, setCockpitTab] = useState<"tasks" | "finance">("tasks");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");

  // New Task Form inside Cockpit
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  // Create / Edit Project Modal
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
    setCockpitTab("tasks");
    setTaskFilter("all");
    try {
      const res = await apiFetch<any>(`/api/projects/${p.id}`);
      setSelectedProject(res);
      setProjectTasks(res.tasks || []);
      setProjectTransactions(res.transactions || []);
    } catch (err) {
      console.error("Failed to load project details", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleToggleTask = async (task: ProjectTask) => {
    if (!selectedProject) return;
    const newStatus = task.status === "completed" ? "pending" : "completed";
    
    // Optimistic local update
    const updatedTasks = projectTasks.map((t) =>
      t.id === task.id
        ? {
            ...t,
            status: newStatus as any,
            completed_at: newStatus === "completed" ? new Date().toISOString() : null,
          }
        : t
    );
    setProjectTasks(updatedTasks);

    const completedCount = updatedTasks.filter((t) => t.status === "completed").length;
    const totalCount = updatedTasks.length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    setSelectedProject({
      ...selectedProject,
      completed_tasks: completedCount,
      pending_tasks: totalCount - completedCount,
      progress_percentage: progressPct,
    });

    setProjects((prev) =>
      prev.map((pr) =>
        pr.id === selectedProject.id
          ? {
              ...pr,
              completed_tasks: completedCount,
              pending_tasks: totalCount - completedCount,
              progress_percentage: progressPct,
            }
          : pr
      )
    );

    try {
      await apiFetch(`/api/projects/${selectedProject.id}/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to toggle task", err);
      // Revert on error
      const refreshed = await apiFetch<any>(`/api/projects/${selectedProject.id}`);
      setSelectedProject(refreshed);
      setProjectTasks(refreshed.tasks || []);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedProject) return;

    setTaskSubmitting(true);
    try {
      await apiFetch(`/api/projects/${selectedProject.id}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
          due_date: newTaskDueDate || null,
          status: "pending",
        }),
      });

      setNewTaskTitle("");
      setNewTaskDueDate("");
      setNewTaskPriority("medium");

      // Reload project details and list
      const refreshed = await apiFetch<any>(`/api/projects/${selectedProject.id}`);
      setSelectedProject(refreshed);
      setProjectTasks(refreshed.tasks || []);
      loadData();
    } catch (err) {
      console.error("Failed to add task", err);
    } finally {
      setTaskSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedProject) return;
    const prevTasks = [...projectTasks];
    setProjectTasks(projectTasks.filter((t) => t.id !== taskId));

    try {
      await apiFetch(`/api/projects/${selectedProject.id}/tasks/${taskId}`, {
        method: "DELETE",
      });
      const refreshed = await apiFetch<any>(`/api/projects/${selectedProject.id}`);
      setSelectedProject(refreshed);
      setProjectTasks(refreshed.tasks || []);
      loadData();
    } catch (err) {
      console.error("Failed to delete task", err);
      setProjectTasks(prevTasks);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setPName("");
    setPCode("");
    setPDesc("");
    setPColor(PROJECT_PALETTE[0]);
    setPStatus("active");
    setPBudget(0);
    setPTargetRevenue(0);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: ProjectWithStats) => {
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

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    setFormSubmitting(true);
    try {
      const payload = {
        name: pName.trim(),
        code: (pCode || pName.slice(0, 3)).toUpperCase().trim(),
        description: pDesc.trim() || null,
        color: pColor,
        status: pStatus,
        budget: Number(pBudget) || 0,
        target_revenue: Number(pTargetRevenue) || 0,
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
      if (selectedProject && editingId === selectedProject.id) {
        const refreshed = await apiFetch<any>(`/api/projects/${editingId}`);
        setSelectedProject(refreshed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!window.confirm("Hapus proyek ini? Seluruh daftar pekerjaan akan ikut terhapus.")) return;

    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      setSelectedProject(null);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProjectTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || txAmount <= 0 || !txWalletId) return;

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
          note: txNote.trim() || null,
        }),
      });

      setIsAddTxOpen(false);
      setTxAmount(0);
      setTxNote("");

      const refreshed = await apiFetch<any>(`/api/projects/${selectedProject.id}`);
      setSelectedProject(refreshed);
      setProjectTransactions(refreshed.transactions || []);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setTxSubmitting(false);
    }
  };

  // Aggregate Portfolio Telemetry
  const totalContractValue = projects.reduce((acc, p) => acc + (p.target_revenue || 0), 0);
  const totalCompletedTasks = projects.reduce((acc, p) => acc + (p.completed_tasks || 0), 0);
  const totalPendingTasks = projects.reduce((acc, p) => acc + (p.pending_tasks || 0), 0);
  const allTasksCount = totalCompletedTasks + totalPendingTasks;
  const portfolioProgress = allTasksCount > 0 ? Math.round((totalCompletedTasks / allTasksCount) * 100) : 0;

  // Filtered tasks for cockpit
  const filteredTasks = projectTasks.filter((t) => {
    if (taskFilter === "pending") return t.status !== "completed";
    if (taskFilter === "completed") return t.status === "completed";
    return true;
  });

  const pendingTasksList = projectTasks.filter((t) => t.status !== "completed");
  const completedTasksList = projectTasks.filter((t) => t.status === "completed");

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Header: Proximity & Clear Focal Identity */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Manajemen Proyek</h1>
          <p className="text-xs text-slate-400 mt-0.5">Pantau nilai proyek, progress kerja, dan pekerjaan</p>
        </div>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </Button>
      </div>

      {/* 2. Primary Focal Point: Portfolio Executive Summary */}
      <Card className="bg-[#12141D] border border-white/[0.08] p-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Total Nilai Proyek (Portofolio)
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {projects.length} Proyek Aktif
          </span>
        </div>

        <div className="pt-3 pb-2">
          <div className="text-2xl sm:text-3xl font-bold tracking-tight text-white num-tabular">
            {formatCurrency(totalContractValue)}
          </div>
        </div>

        {/* Overall Task Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Progress Pekerjaan Gabungan</span>
            <span className="text-white font-semibold num-tabular">{portfolioProgress}% Selesai</span>
          </div>
          <ProgressBar progress={portfolioProgress} color="#4F46E5" height="md" />
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> {totalCompletedTasks} Selesai
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Clock className="w-3.5 h-3.5" /> {totalPendingTasks} Tertunda
            </span>
          </div>
        </div>
      </Card>

      {/* 3. List of Projects (Gestalt: Common Region & Similarity) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Daftar Portofolio Proyek
          </h2>
          <span className="text-xs text-slate-500">{projects.length} unit usaha</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Memuat data proyek…</div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="w-6 h-6" />}
            title="Belum Ada Proyek"
            description="Tambahkan proyek usaha seperti EDUNUSA, SOBATPART, atau ISTANA BLOCK untuk mulai memantau progress kerja dan nilainya."
            action={
              <Button size="sm" onClick={handleOpenCreate}>
                Buat Proyek Pertama
              </Button>
            }
          />
        ) : (
          projects.map((p) => {
            const taskCount = (p.total_tasks || 0);
            const progress = p.progress_percentage || 0;
            const completedCount = p.completed_tasks || 0;
            const pendingCount = p.pending_tasks || 0;

            return (
              <Card
                key={p.id}
                interactive
                onClick={() => openProjectDetail(p)}
                className="bg-[#12141D] border border-white/[0.07] p-4.5 space-y-3.5 hover:border-white/[0.14] transition-all"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0"
                      style={{
                        backgroundColor: `${p.color || "#6366F1"}18`,
                        color: p.color || "#6366F1",
                        border: `1px solid ${p.color || "#6366F1"}30`,
                      }}
                    >
                      {p.code || p.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-tight leading-tight">
                        {p.name}
                      </h3>
                      {p.description ? (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{p.description}</p>
                      ) : null}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0 ${
                      p.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : p.status === "on_hold"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                    }`}
                  >
                    {p.status === "completed" ? "Selesai" : p.status === "on_hold" ? "Hold" : "Aktif"}
                  </span>
                </div>

                {/* Key Metrics: Nilai Proyek & Progress */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#171A26] rounded-xl border border-white/[0.04]">
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                      Nilai Proyek
                    </span>
                    <p className="text-sm font-bold text-white num-tabular mt-0.5">
                      {p.target_revenue ? formatCurrency(p.target_revenue) : "Belum diatur"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                      Progress Kerja
                    </span>
                    <p className="text-sm font-bold text-indigo-400 num-tabular mt-0.5">
                      {progress}% Selesai
                    </p>
                  </div>
                </div>

                {/* Task Breakdown Indicator */}
                <div className="space-y-1.5">
                  <ProgressBar progress={progress} color={p.color || "#6366F1"} height="sm" />
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      {taskCount > 0 ? (
                        <>
                          <strong className="text-emerald-400 font-medium">{completedCount}</strong> Selesai •{" "}
                          <strong className="text-amber-400 font-medium">{pendingCount}</strong> Tertunda
                        </>
                      ) : (
                        "Belum ada list pekerjaan"
                      )}
                    </span>
                    <span className="flex items-center gap-0.5 text-indigo-400 font-medium text-xs hover:text-indigo-300">
                      Buka Detail <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 4. Project Management Cockpit (Detailed BottomSheet) */}
      <BottomSheet
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.name || "Detail Proyek"}
        subtitle={selectedProject?.code ? `Kode: ${selectedProject.code}` : undefined}
      >
        {selectedProject ? (
          <div className="space-y-5">
            {/* Project Executive Summary Header */}
            <div className="p-4 bg-[#161925] rounded-2xl border border-white/[0.07] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                    Nilai Proyek (Kontrak)
                  </span>
                  <div className="text-xl font-bold text-white num-tabular mt-0.5">
                    {selectedProject.target_revenue
                      ? formatCurrency(selectedProject.target_revenue)
                      : "Rp 0"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedProject)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 press-scale cursor-pointer"
                    aria-label="Edit Proyek"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(selectedProject.id)}
                    className="p-2 rounded-xl bg-white/[0.05] hover:bg-red-500/20 text-slate-400 hover:text-red-400 press-scale cursor-pointer"
                    aria-label="Hapus Proyek"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Realisasi Pekerjaan Fisik</span>
                  <span className="text-indigo-400 font-bold num-tabular">
                    {selectedProject.progress_percentage || 0}% Selesai
                  </span>
                </div>
                <ProgressBar
                  progress={selectedProject.progress_percentage || 0}
                  color={selectedProject.color || "#6366F1"}
                  height="md"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span className="text-emerald-400 font-medium">
                    {selectedProject.completed_tasks || 0} Pekerjaan Selesai
                  </span>
                  <span className="text-amber-400 font-medium">
                    {selectedProject.pending_tasks || 0} Pekerjaan Tertunda
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs: Pekerjaan (Tasks) vs Keuangan (Finance) */}
            <SegmentedControl
              value={cockpitTab}
              onChange={(val) => setCockpitTab(val)}
              options={[
                { value: "tasks", label: `Pekerjaan (${projectTasks.length})` },
                { value: "finance", label: "Keuangan & Arus Kas" },
              ]}
            />

            {/* TAB CONTENT: PEKERJAAN (TASKS & WORK MANAGEMENT) */}
            {cockpitTab === "tasks" ? (
              <div className="space-y-4">
                {/* Form Quick Add Task */}
                <form
                  onSubmit={handleCreateTask}
                  className="p-3 bg-[#171A27] rounded-xl border border-white/[0.06] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Tambah Pekerjaan Baru</span>
                    <span className="text-[10px] text-slate-400">Milestone / To-Do</span>
                  </div>

                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Contoh: Pengiriman Batch 2 Paving Block"
                    className="w-full px-3 py-2 bg-[#10121A] rounded-lg border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    required
                  />

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Prioritas</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full px-2 py-1.5 bg-[#10121A] rounded-lg border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="high">Tinggi (Mendesak)</option>
                        <option value="medium">Sedang</option>
                        <option value="low">Rendah</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Target Selesai</label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full px-2 py-1.5 bg-[#10121A] rounded-lg border border-white/[0.08] text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    loading={taskSubmitting}
                    disabled={!newTaskTitle.trim()}
                    className="w-full mt-1"
                  >
                    + Simpan Pekerjaan
                  </Button>
                </form>

                {/* Filter Tabs for Tasks */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTaskFilter("all")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        taskFilter === "all"
                          ? "bg-indigo-600 text-white"
                          : "bg-white/[0.04] text-slate-400 hover:text-white"
                      }`}
                    >
                      Semua ({projectTasks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskFilter("pending")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        taskFilter === "pending"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-white/[0.04] text-slate-400 hover:text-white"
                      }`}
                    >
                      Tertunda ({pendingTasksList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskFilter("completed")}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        taskFilter === "completed"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-white/[0.04] text-slate-400 hover:text-white"
                      }`}
                    >
                      Selesai ({completedTasksList.length})
                    </button>
                  </div>
                </div>

                {/* List of Tasks */}
                {filteredTasks.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs bg-[#151722] rounded-xl border border-white/[0.05]">
                    {taskFilter === "completed"
                      ? "Belum ada pekerjaan yang diselesaikan"
                      : taskFilter === "pending"
                      ? "Semua pekerjaan telah selesai!"
                      : "Belum ada daftar pekerjaan untuk proyek ini"}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* SECTION: PEKERJAAN TERTUNDA */}
                    {(taskFilter === "all" || taskFilter === "pending") && pendingTasksList.length > 0 ? (
                      <div className="space-y-2">
                        {taskFilter === "all" ? (
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 pt-1">
                            <Clock className="w-3 h-3" /> Pekerjaan Tertunda ({pendingTasksList.length})
                          </div>
                        ) : null}

                        {pendingTasksList.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start justify-between gap-3 p-3 bg-[#161824] rounded-xl border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task)}
                              className="mt-0.5 text-slate-400 hover:text-emerald-400 cursor-pointer press-scale shrink-0"
                              aria-label="Tandai selesai"
                            >
                              <Circle className="w-5 h-5" />
                            </button>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white leading-snug">
                                {task.title}
                              </p>
                              {task.description ? (
                                <p className="text-[11px] text-slate-400 mt-0.5">{task.description}</p>
                              ) : null}

                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span
                                  className={`text-[9.5px] font-medium px-1.5 py-0.5 rounded ${
                                    task.priority === "high"
                                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                      : task.priority === "medium"
                                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                  }`}
                                >
                                  Prioritas: {task.priority === "high" ? "Tinggi" : task.priority === "medium" ? "Sedang" : "Rendah"}
                                </span>
                                {task.due_date ? (
                                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Deadline: {relativeDate(task.due_date)}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-500 hover:text-red-400 p-1 press-scale cursor-pointer"
                              aria-label="Hapus pekerjaan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* SECTION: PEKERJAAN SELESAI */}
                    {(taskFilter === "all" || taskFilter === "completed") && completedTasksList.length > 0 ? (
                      <div className="space-y-2 pt-2">
                        {taskFilter === "all" ? (
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 pt-2">
                            <CheckCircle2 className="w-3 h-3" /> Pekerjaan Selesai ({completedTasksList.length})
                          </div>
                        ) : null}

                        {completedTasksList.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-start justify-between gap-3 p-3 bg-[#13151E] rounded-xl border border-white/[0.04] opacity-80 transition-colors"
                          >
                            <button
                              type="button"
                              onClick={() => handleToggleTask(task)}
                              className="mt-0.5 text-emerald-400 hover:text-slate-400 cursor-pointer press-scale shrink-0"
                              aria-label="Batal selesai"
                            >
                              <CheckCircle2 className="w-5 h-5 fill-emerald-500/20" />
                            </button>

                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-300 line-through leading-snug">
                                {task.title}
                              </p>
                              {task.completed_at ? (
                                <p className="text-[10px] text-emerald-400/80 mt-1 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Selesai pada {relativeDate(task.completed_at)}
                                </p>
                              ) : null}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="text-slate-500 hover:text-red-400 p-1 press-scale cursor-pointer"
                              aria-label="Hapus pekerjaan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              /* TAB CONTENT: KEUANGAN & ARUS KAS */
              <div className="space-y-4">
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[#161925] rounded-xl border border-white/[0.06]">
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                      Uang Masuk
                    </span>
                    <div className="text-base font-bold text-white num-tabular mt-0.5">
                      {formatCurrency(selectedProject.total_income || 0)}
                    </div>
                  </div>

                  <div className="p-3 bg-[#161925] rounded-xl border border-white/[0.06]">
                    <span className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider">
                      Biaya Proyek
                    </span>
                    <div className="text-base font-bold text-white num-tabular mt-0.5">
                      {formatCurrency(selectedProject.total_expense || 0)}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#161925] rounded-xl border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                      Laba Bersih Proyek
                    </span>
                    <div className="text-base font-bold text-white num-tabular mt-0.5">
                      {formatCurrency(selectedProject.net_profit || 0)}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      (selectedProject.net_profit || 0) >= 0
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    }`}
                  >
                    Margin {selectedProject.margin_percentage || 0}%
                  </span>
                </div>

                <Button
                  size="md"
                  onClick={() => setIsAddTxOpen(true)}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Catat Transaksi Proyek</span>
                </Button>

                {/* Linked Transactions */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Riwayat Keuangan Terkait
                    </span>
                    <span className="text-xs text-slate-500">
                      {projectTransactions.length} transaksi
                    </span>
                  </div>

                  {projectTransactions.length === 0 ? (
                    <div className="py-6 text-center text-slate-500 text-xs bg-[#161925] rounded-xl border border-white/[0.05]">
                      Belum ada transaksi yang dialokasikan ke proyek ini.
                    </div>
                  ) : (
                    projectTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-[#161925] rounded-xl border border-white/[0.06]"
                      >
                        <div>
                          <p className="text-xs font-semibold text-white">
                            {tx.category_name || (tx.type === "income" ? "Pemasukan" : "Pengeluaran")}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {tx.wallet_name} • {relativeDate(tx.date)}
                            {tx.note ? ` • ${tx.note}` : ""}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold num-tabular ${
                            tx.type === "income" ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </BottomSheet>

      {/* 5. Create / Edit Project Modal */}
      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? "Edit Proyek Usaha" : "Tambah Proyek Baru"}
        subtitle="Kelola parameter nilai kontrak dan target omset proyek"
      >
        <form onSubmit={handleSaveProject} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Nama Proyek / Ventura *
            </label>
            <input
              type="text"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="Contoh: EDUNUSA, SOBATPART, ISTANA BLOCK"
              className="w-full px-3 py-2 bg-[#171A27] rounded-xl border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Kode Singkat</label>
              <input
                type="text"
                maxLength={5}
                value={pCode}
                onChange={(e) => setPCode(e.target.value.toUpperCase())}
                placeholder="EDU, SOB, IBL"
                className="w-full px-3 py-2 bg-[#171A27] rounded-xl border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Status Proyek</label>
              <select
                value={pStatus}
                onChange={(e) => setPStatus(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#171A27] rounded-xl border border-white/[0.08] text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="active">Aktif</option>
                <option value="on_hold">Ditunda (On Hold)</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Nilai Proyek / Target Omset (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="500000"
              value={pTargetRevenue || ""}
              onChange={(e) => setPTargetRevenue(Number(e.target.value))}
              placeholder="Contoh: 150000000"
              className="w-full px-3 py-2 bg-[#171A27] rounded-xl border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Pagu Anggaran / Biaya Maksimal (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="500000"
              value={pBudget || ""}
              onChange={(e) => setPBudget(Number(e.target.value))}
              placeholder="Contoh: 50000000"
              className="w-full px-3 py-2 bg-[#171A27] rounded-xl border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Deskripsi Singkat</label>
            <textarea
              rows={2}
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
              placeholder="Ruang lingkup pekerjaan dan keterangan spesifikasi…"
              className="w-full px-3 py-2 bg-[#171A27] rounded-xl border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">Warna Identitas</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPColor(color)}
                  className={`w-7 h-7 rounded-full cursor-pointer press-scale transition-transform ${
                    pColor === color ? "ring-2 ring-white scale-110" : "opacity-75 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Pilih warna ${color}`}
                />
              ))}
            </div>
          </div>

          <Button type="submit" size="lg" loading={formSubmitting} className="w-full mt-4">
            {editingId ? "Simpan Perubahan" : "Buat Proyek Baru"}
          </Button>
        </form>
      </BottomSheet>

      {/* 6. Quick Record Transaction for Project */}
      <BottomSheet
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        title={`Catat Transaksi: ${selectedProject?.name}`}
        subtitle="Alokasikan pendapatan atau pengeluaran ke proyek ini"
      >
        <form onSubmit={handleSaveProjectTx} className="space-y-4">
          <SegmentedControl
            value={txType}
            onChange={(val) => setTxType(val)}
            options={[
              { value: "income", label: "Pemasukan (Termin)" },
              { value: "expense", label: "Pengeluaran (Biaya)" },
            ]}
          />

          <NumberPad value={txAmount} onChange={(val) => setTxAmount(val)} />

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Rekening Dompet</label>
              <select
                value={txWalletId}
                onChange={(e) => setTxWalletId(e.target.value)}
                className="w-full px-3 py-2 bg-[#171A27] rounded-xl border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Kategori</label>
              <select
                value={txCategoryId}
                onChange={(e) => setTxCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-[#171A27] rounded-xl border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">(Tanpa Kategori)</option>
                {categories
                  .filter((c) => c.type === txType)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Tanggal</label>
            <input
              type="date"
              value={txDate}
              onChange={(e) => setTxDate(e.target.value)}
              className="w-full px-3 py-2 bg-[#171A27] rounded-xl border border-white/[0.08] text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Keterangan Catatan</label>
            <input
              type="text"
              value={txNote}
              onChange={(e) => setTxNote(e.target.value)}
              placeholder="Contoh: Pembayaran Termin 1 / Beli Semen 50 Sak"
              className="w-full px-3 py-2 bg-[#171A27] rounded-xl border border-white/[0.08] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            loading={txSubmitting}
            disabled={txAmount <= 0}
            className="w-full mt-2"
          >
            Simpan Transaksi Proyek
          </Button>
        </form>
      </BottomSheet>
    </div>
  );
}
