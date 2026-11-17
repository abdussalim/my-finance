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
import { getProjectLogo } from "../lib/project-utils";
import { ProjectWithStats, ProjectTask, WalletWithBalance, Category } from "@my-finance/shared";
import {
  Briefcase,
  Plus,
  Check,
  Clock,
  Trash2,
  Edit3,
  Calendar,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

const PROJECT_PALETTE = [
  "#0A84FF", // Apple Blue
  "#5E5CE6", // Apple Indigo (EDUNUSA)
  "#64D2FF", // Apple Cyan (SOBATPART)
  "#FF9F0A", // Apple Amber (ISTANA BLOCK)
  "#30D158", // Apple Green
  "#FF375F", // Apple Pink
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
  const [pLogoUrl, setPLogoUrl] = useState("");
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
    setPLogoUrl("");
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
    setPLogoUrl(p.logo_url || "");
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
        logo_url: pLogoUrl.trim() || null,
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
    <div className="space-y-6 pt-2 pb-6">
      {/* 1. iOS Large Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Proyek</h1>
          <p className="text-xs text-[rgba(235,235,245,0.60)] mt-0.5">Nilai kontrak, progress fisik, dan daftar pekerjaan</p>
        </div>
        <Button size="sm" onClick={handleOpenCreate} className="gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>Tambah</span>
        </Button>
      </div>

      {/* 2. iOS Inset Grouped: Portfolio Telemetry Card */}
      <Card className="bg-[#1C1C1E] border border-white/[0.06] p-5">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider">
            Total Nilai Portofolio
          </span>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[rgba(118,118,128,0.24)] text-[rgba(235,235,245,0.60)]">
            {projects.length} Proyek
          </span>
        </div>

        <div className="pt-3 pb-2">
          <div className="text-3xl font-bold tracking-tight text-white num-tabular">
            {formatCurrency(totalContractValue)}
          </div>
        </div>

        {/* Overall Task Progress Bar */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[rgba(235,235,245,0.60)] font-medium">Realisasi Pekerjaan Gabungan</span>
            <span className="text-[#0A84FF] font-semibold num-tabular">{portfolioProgress}% Selesai</span>
          </div>
          <ProgressBar progress={portfolioProgress} color="#0A84FF" height="md" />
          <div className="flex items-center justify-between text-[11px] text-[rgba(235,235,245,0.60)] pt-1">
            <span className="flex items-center gap-1.5 text-[#30D158] font-medium">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" /> {totalCompletedTasks} Selesai
            </span>
            <span className="flex items-center gap-1.5 text-[#FF9F0A] font-medium">
              <Clock className="w-3.5 h-3.5 stroke-[2]" /> {totalPendingTasks} Tertunda
            </span>
          </div>
        </div>
      </Card>

      {/* 3. iOS Inset Grouped: List of Projects */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[rgba(235,235,245,0.60)]">
            Daftar Portofolio
          </h2>
          <span className="text-xs text-[rgba(235,235,245,0.60)]">{projects.length} unit usaha</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[rgba(235,235,245,0.60)] text-sm">Memuat data proyek…</div>
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
                className="bg-[#1C1C1E] border border-white/[0.06] p-4.5 space-y-3.5 hover:border-white/[0.12] transition-colors"
              >
                {/* Project Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {(() => {
                      const logo = getProjectLogo(p);
                      return logo ? (
                        <div className="w-11 h-11 rounded-[12px] overflow-hidden bg-[rgba(118,118,128,0.20)] border border-white/[0.08] flex items-center justify-center shrink-0 p-1.5 shadow-xs">
                          <img
                            src={logo}
                            alt={p.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-11 h-11 rounded-[12px] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: p.color || "#0A84FF" }}
                        >
                          {p.code || p.name.slice(0, 3).toUpperCase()}
                        </div>
                      );
                    })()}
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white tracking-tight truncate">
                        {p.name}
                      </h3>
                      {p.description ? (
                        <p className="text-xs text-[rgba(235,235,245,0.60)] line-clamp-1 mt-0.5">{p.description}</p>
                      ) : null}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                      p.status === "completed"
                        ? "bg-[#30D158]/15 text-[#30D158]"
                        : p.status === "on_hold"
                        ? "bg-[#FF9F0A]/15 text-[#FF9F0A]"
                        : "bg-[#0A84FF]/15 text-[#0A84FF]"
                    }`}
                  >
                    {p.status === "completed" ? "Selesai" : p.status === "on_hold" ? "Hold" : "Aktif"}
                  </span>
                </div>

                {/* iOS Sub-Card for Metrics */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-[rgba(118,118,128,0.24)] rounded-[14px]">
                  <div>
                    <span className="text-[10px] text-[rgba(235,235,245,0.60)] font-medium uppercase tracking-wide">
                      Nilai Proyek
                    </span>
                    <p className="text-sm font-bold text-white num-tabular mt-0.5">
                      {p.target_revenue ? formatCurrency(p.target_revenue) : "Belum diatur"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[rgba(235,235,245,0.60)] font-medium uppercase tracking-wide">
                      Progress Kerja
                    </span>
                    <p className="text-sm font-bold text-[#0A84FF] num-tabular mt-0.5">
                      {progress}% Selesai
                    </p>
                  </div>
                </div>

                {/* Task Breakdown Indicator */}
                <div className="space-y-1.5">
                  <ProgressBar progress={progress} color={p.color || "#0A84FF"} height="sm" />
                  <div className="flex items-center justify-between text-[11px] text-[rgba(235,235,245,0.60)]">
                    <span>
                      {taskCount > 0 ? (
                        <>
                          <strong className="text-[#30D158] font-semibold">{completedCount}</strong> Selesai •{" "}
                          <strong className="text-[#FF9F0A] font-semibold">{pendingCount}</strong> Tertunda
                        </>
                      ) : (
                        "Belum ada list pekerjaan"
                      )}
                    </span>
                    <span className="flex items-center gap-0.5 text-[#0A84FF] font-medium text-xs">
                      Detail <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 4. iOS Project Cockpit Modal Sheet */}
      <BottomSheet
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.name || "Detail Proyek"}
        subtitle={selectedProject?.code ? `Kode Proyek: ${selectedProject.code}` : undefined}
      >
        {selectedProject ? (
          <div className="space-y-5">
            {/* Project Executive Summary Header */}
            <div className="p-4 bg-[rgba(118,118,128,0.24)] rounded-[20px] space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {(() => {
                    const logo = getProjectLogo(selectedProject);
                    return logo ? (
                      <div className="w-12 h-12 rounded-[13px] overflow-hidden bg-[rgba(118,118,128,0.20)] border border-white/[0.08] flex items-center justify-center shrink-0 p-1.5 shadow-xs">
                        <img
                          src={logo}
                          alt={selectedProject.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div
                        className="w-12 h-12 rounded-[13px] flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: selectedProject.color || "#0A84FF" }}
                      >
                        {selectedProject.code || selectedProject.name.slice(0, 3).toUpperCase()}
                      </div>
                    );
                  })()}
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-[rgba(235,235,245,0.60)] uppercase tracking-wide">
                      Nilai Proyek (Kontrak)
                    </span>
                    <div className="text-2xl font-bold text-white num-tabular mt-0.5 truncate">
                      {selectedProject.target_revenue
                        ? formatCurrency(selectedProject.target_revenue)
                        : "Rp 0"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(selectedProject)}
                    className="p-2 rounded-full bg-[#3A3A3C] hover:bg-[#48484A] text-[#0A84FF] ios-press cursor-pointer"
                    aria-label="Edit Proyek"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(selectedProject.id)}
                    className="p-2 rounded-full bg-[#3A3A3C] hover:bg-[#FF453A]/20 text-[rgba(235,235,245,0.60)] hover:text-[#FF453A] ios-press cursor-pointer"
                    aria-label="Hapus Proyek"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[rgba(235,235,245,0.60)] font-medium">Realisasi Pekerjaan Fisik</span>
                  <span className="text-[#0A84FF] font-bold num-tabular">
                    {selectedProject.progress_percentage || 0}% Selesai
                  </span>
                </div>
                <ProgressBar
                  progress={selectedProject.progress_percentage || 0}
                  color={selectedProject.color || "#0A84FF"}
                  height="md"
                />
                <div className="flex items-center justify-between text-[11px] text-[rgba(235,235,245,0.60)] pt-0.5">
                  <span className="text-[#30D158] font-medium">
                    {selectedProject.completed_tasks || 0} Selesai
                  </span>
                  <span className="text-[#FF9F0A] font-medium">
                    {selectedProject.pending_tasks || 0} Tertunda
                  </span>
                </div>
              </div>
            </div>

            {/* iOS Segmented Navigation Tabs */}
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
                {/* iOS Quick Add Task Box */}
                <form
                  onSubmit={handleCreateTask}
                  className="p-3.5 bg-[rgba(118,118,128,0.24)] rounded-[18px] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Tambah Pekerjaan Baru</span>
                    <span className="text-[10px] text-[rgba(235,235,245,0.60)]">Milestone / Task</span>
                  </div>

                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Contoh: Pengiriman Batch 2 Paving Block"
                    className="w-full px-3.5 py-2.5 bg-[#1C1C1E] rounded-[12px] border border-white/[0.06] text-xs text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none focus:border-[#0A84FF]"
                    required
                  />

                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <div>
                      <label className="text-[10px] text-[rgba(235,235,245,0.60)] block mb-1">Prioritas</label>
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value as any)}
                        className="w-full px-2.5 py-2 bg-[#1C1C1E] rounded-[10px] border border-white/[0.06] text-xs text-[#EBEBF5] focus:outline-none focus:border-[#0A84FF]"
                      >
                        <option value="high">Tinggi (Mendesak)</option>
                        <option value="medium">Sedang</option>
                        <option value="low">Rendah</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-[rgba(235,235,245,0.60)] block mb-1">Target Selesai</label>
                      <input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full px-2.5 py-2 bg-[#1C1C1E] rounded-[10px] border border-white/[0.06] text-xs text-[#EBEBF5] focus:outline-none focus:border-[#0A84FF]"
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

                {/* Filter Pills for Tasks */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTaskFilter("all")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ios-press transition-colors ${
                        taskFilter === "all"
                          ? "bg-[#0A84FF] text-white"
                          : "bg-[rgba(118,118,128,0.24)] text-[rgba(235,235,245,0.60)] hover:text-white"
                      }`}
                    >
                      Semua ({projectTasks.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskFilter("pending")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ios-press transition-colors ${
                        taskFilter === "pending"
                          ? "bg-[#FF9F0A]/20 text-[#FF9F0A] border border-[#FF9F0A]/30"
                          : "bg-[rgba(118,118,128,0.24)] text-[rgba(235,235,245,0.60)] hover:text-white"
                      }`}
                    >
                      Tertunda ({pendingTasksList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaskFilter("completed")}
                      className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ios-press transition-colors ${
                        taskFilter === "completed"
                          ? "bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/30"
                          : "bg-[rgba(118,118,128,0.24)] text-[rgba(235,235,245,0.60)] hover:text-white"
                      }`}
                    >
                      Selesai ({completedTasksList.length})
                    </button>
                  </div>
                </div>

                {/* iOS Task List Items */}
                {filteredTasks.length === 0 ? (
                  <div className="py-8 text-center text-[rgba(235,235,245,0.60)] text-xs bg-[rgba(118,118,128,0.24)] rounded-[18px]">
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
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#FF9F0A] flex items-center gap-1.5 px-1 pt-1">
                            <Clock className="w-3.5 h-3.5" /> Pekerjaan Tertunda ({pendingTasksList.length})
                          </div>
                        ) : null}

                        <div className="bg-[rgba(118,118,128,0.24)] rounded-[18px] overflow-hidden divide-y divide-white/[0.06]">
                          {pendingTasksList.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-start justify-between gap-3 p-3.5 hover:bg-white/[0.02] transition-colors"
                            >
                              {/* Apple Reminders Empty Circle Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggleTask(task)}
                                className="mt-0.5 w-5 h-5 rounded-full border-2 border-white/35 hover:border-[#30D158] transition-colors cursor-pointer shrink-0"
                                aria-label="Tandai selesai"
                              />

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-white leading-snug">
                                  {task.title}
                                </p>
                                {task.description ? (
                                  <p className="text-[11px] text-[rgba(235,235,245,0.60)] mt-0.5">{task.description}</p>
                                ) : null}

                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span
                                    className={`text-[9.5px] font-semibold px-1.5 py-0.2 rounded-full ${
                                      task.priority === "high"
                                        ? "bg-[#FF453A]/15 text-[#FF453A]"
                                        : task.priority === "medium"
                                        ? "bg-[#FF9F0A]/15 text-[#FF9F0A]"
                                        : "bg-[#0A84FF]/15 text-[#0A84FF]"
                                    }`}
                                  >
                                    {task.priority === "high" ? "Tinggi" : task.priority === "medium" ? "Sedang" : "Rendah"}
                                  </span>
                                  {task.due_date ? (
                                    <span className="text-[10px] text-[rgba(235,235,245,0.60)] flex items-center gap-1">
                                      <Calendar className="w-3 h-3" /> {relativeDate(task.due_date)}
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-[rgba(235,235,245,0.60)] hover:text-[#FF453A] p-1 ios-press cursor-pointer"
                                aria-label="Hapus pekerjaan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* SECTION: PEKERJAAN SELESAI */}
                    {(taskFilter === "all" || taskFilter === "completed") && completedTasksList.length > 0 ? (
                      <div className="space-y-2 pt-2">
                        {taskFilter === "all" ? (
                          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#30D158] flex items-center gap-1.5 px-1 pt-1">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Pekerjaan Selesai ({completedTasksList.length})
                          </div>
                        ) : null}

                        <div className="bg-[rgba(118,118,128,0.24)] rounded-[18px] overflow-hidden divide-y divide-white/[0.06] opacity-80">
                          {completedTasksList.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-start justify-between gap-3 p-3.5 hover:bg-white/[0.02] transition-colors"
                            >
                              {/* Apple Reminders Completed Circle Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggleTask(task)}
                                className="mt-0.5 w-5 h-5 rounded-full bg-[#30D158] flex items-center justify-center text-white cursor-pointer shrink-0"
                                aria-label="Batal selesai"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </button>

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[rgba(235,235,245,0.60)] line-through leading-snug">
                                  {task.title}
                                </p>
                                {task.completed_at ? (
                                  <p className="text-[10px] text-[#30D158]/80 mt-1 flex items-center gap-1">
                                    Selesai pada {relativeDate(task.completed_at)}
                                  </p>
                                ) : null}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-[rgba(235,235,245,0.60)] hover:text-[#FF453A] p-1 ios-press cursor-pointer"
                                aria-label="Hapus pekerjaan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
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
                  <div className="p-3.5 bg-[rgba(118,118,128,0.24)] rounded-[16px]">
                    <span className="text-[10px] text-[#30D158] font-semibold uppercase tracking-wider">
                      Uang Masuk
                    </span>
                    <div className="text-base font-bold text-white num-tabular mt-0.5">
                      {formatCurrency(selectedProject.total_income || 0)}
                    </div>
                  </div>

                  <div className="p-3.5 bg-[rgba(118,118,128,0.24)] rounded-[16px]">
                    <span className="text-[10px] text-[#FF453A] font-semibold uppercase tracking-wider">
                      Biaya Proyek
                    </span>
                    <div className="text-base font-bold text-white num-tabular mt-0.5">
                      {formatCurrency(selectedProject.total_expense || 0)}
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-[rgba(118,118,128,0.24)] rounded-[16px] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[rgba(235,235,245,0.60)] uppercase tracking-wider font-medium">
                      Laba Bersih Proyek
                    </span>
                    <div className="text-base font-bold text-white num-tabular mt-0.5">
                      {formatCurrency(selectedProject.net_profit || 0)}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      (selectedProject.net_profit || 0) >= 0
                        ? "bg-[#30D158]/15 text-[#30D158]"
                        : "bg-[#FF453A]/15 text-[#FF453A]"
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
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-semibold text-[rgba(235,235,245,0.60)] uppercase tracking-wider">
                      Riwayat Transaksi Terkait ({projectTransactions.length})
                    </span>
                  </div>

                  <div className="bg-[rgba(118,118,128,0.24)] rounded-[18px] overflow-hidden divide-y divide-white/[0.06]">
                    {projectTransactions.length === 0 ? (
                      <div className="py-6 text-center text-[rgba(235,235,245,0.60)] text-xs">
                        Belum ada transaksi yang dialokasikan ke proyek ini.
                      </div>
                    ) : (
                      projectTransactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3.5"
                        >
                          <div>
                            <p className="text-xs font-semibold text-white">
                              {tx.category_name || (tx.type === "income" ? "Pemasukan" : "Pengeluaran")}
                            </p>
                            <p className="text-[10px] text-[rgba(235,235,245,0.60)] mt-0.5">
                              {tx.wallet_name} • {relativeDate(tx.date)}
                              {tx.note ? ` • ${tx.note}` : ""}
                            </p>
                          </div>
                          <span
                            className={`text-xs font-bold num-tabular ${
                              tx.type === "income" ? "text-[#30D158]" : "text-[#FF453A]"
                            }`}
                          >
                            {tx.type === "income" ? "+" : "-"} {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
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
            <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">
              Nama Proyek / Ventura *
            </label>
            <input
              type="text"
              value={pName}
              onChange={(e) => setPName(e.target.value)}
              placeholder="Contoh: EDUNUSA, SOBATPART, ISTANA BLOCK"
              className="w-full px-3.5 py-2.5 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-sm text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none focus:border-[#0A84FF]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">Kode Singkat</label>
              <input
                type="text"
                maxLength={5}
                value={pCode}
                onChange={(e) => setPCode(e.target.value.toUpperCase())}
                placeholder="EDU, SOB, IBL"
                className="w-full px-3.5 py-2.5 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-sm text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none focus:border-[#0A84FF]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">Status Proyek</label>
              <select
                value={pStatus}
                onChange={(e) => setPStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-sm text-[#EBEBF5] focus:outline-none focus:border-[#0A84FF]"
              >
                <option value="active">Aktif</option>
                <option value="on_hold">Ditunda (On Hold)</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">
              Nilai Proyek / Target Omset (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="500000"
              value={pTargetRevenue || ""}
              onChange={(e) => setPTargetRevenue(Number(e.target.value))}
              placeholder="Contoh: 150000000"
              className="w-full px-3.5 py-2.5 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-sm text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none focus:border-[#0A84FF]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">
              Pagu Anggaran / Biaya Maksimal (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="500000"
              value={pBudget || ""}
              onChange={(e) => setPBudget(Number(e.target.value))}
              placeholder="Contoh: 50000000"
              className="w-full px-3.5 py-2.5 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-sm text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none focus:border-[#0A84FF]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">Deskripsi Singkat</label>
            <textarea
              rows={2}
              value={pDesc}
              onChange={(e) => setPDesc(e.target.value)}
              placeholder="Ruang lingkup pekerjaan dan keterangan spesifikasi…"
              className="w-full px-3.5 py-2.5 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-sm text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none focus:border-[#0A84FF]"
            />
          </div>

          {/* Logo Brand Selector & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[rgba(235,235,245,0.60)]">
                Logo Brand Proyek
              </label>
              {pLogoUrl ? (
                <button
                  type="button"
                  onClick={() => setPLogoUrl("")}
                  className="text-[11px] text-[#FF453A] hover:underline cursor-pointer"
                >
                  Hapus Logo
                </button>
              ) : null}
            </div>

            <div className="flex items-center gap-2.5">
              {pLogoUrl ? (
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(118,118,128,0.24)] border border-white/[0.1] p-1.5 flex items-center justify-center shrink-0">
                  <img src={pLogoUrl} alt="Preview" className="w-full h-full object-contain" />
                </div>
              ) : null}
              <input
                type="text"
                value={pLogoUrl}
                onChange={(e) => setPLogoUrl(e.target.value)}
                placeholder="/logos/edunusa.png atau tautan web…"
                className="flex-1 px-3.5 py-2.5 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-xs text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-1.5 pt-0.5">
              <span className="text-[11px] text-[rgba(235,235,245,0.60)]">Pilih preset brand lokal:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setPLogoUrl("/logos/edunusa.png");
                    if (!pName) setPName("EDUNUSA");
                    if (!pCode) setPCode("EDU");
                  }}
                  className={`px-2.5 py-1.5 rounded-[10px] border text-xs flex items-center gap-1.5 cursor-pointer ios-press transition-colors ${
                    pLogoUrl === "/logos/edunusa.png"
                      ? "border-[#0A84FF] bg-[#0A84FF]/20 text-white font-semibold"
                      : "border-white/[0.08] bg-[rgba(118,118,128,0.18)] text-[rgba(235,235,245,0.70)] hover:text-white"
                  }`}
                >
                  <img src="/logos/edunusa.png" alt="EDUNUSA" className="w-4 h-4 object-contain" />
                  <span>EDUNUSA</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPLogoUrl("/logos/sobatpart.png");
                    if (!pName) setPName("SOBATPART");
                    if (!pCode) setPCode("SOB");
                  }}
                  className={`px-2.5 py-1.5 rounded-[10px] border text-xs flex items-center gap-1.5 cursor-pointer ios-press transition-colors ${
                    pLogoUrl === "/logos/sobatpart.png"
                      ? "border-[#0A84FF] bg-[#0A84FF]/20 text-white font-semibold"
                      : "border-white/[0.08] bg-[rgba(118,118,128,0.18)] text-[rgba(235,235,245,0.70)] hover:text-white"
                  }`}
                >
                  <img src="/logos/sobatpart.png" alt="SOBATPART" className="w-4 h-4 object-contain" />
                  <span>SOBATPART</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPLogoUrl("/logos/istanablock.png");
                    if (!pName) setPName("ISTANA BLOCK");
                    if (!pCode) setPCode("IBL");
                  }}
                  className={`px-2.5 py-1.5 rounded-[10px] border text-xs flex items-center gap-1.5 cursor-pointer ios-press transition-colors ${
                    pLogoUrl === "/logos/istanablock.png"
                      ? "border-[#0A84FF] bg-[#0A84FF]/20 text-white font-semibold"
                      : "border-white/[0.08] bg-[rgba(118,118,128,0.18)] text-[rgba(235,235,245,0.70)] hover:text-white"
                  }`}
                >
                  <img src="/logos/istanablock.png" alt="ISTANA BLOCK" className="w-4 h-4 object-contain" />
                  <span>ISTANA BLOCK</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-2">Warna Identitas</label>
            <div className="flex gap-2.5 flex-wrap">
              {PROJECT_PALETTE.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setPColor(color)}
                  className={`w-7 h-7 rounded-full cursor-pointer ios-press transition-transform ${
                    pColor === color ? "ring-2 ring-white scale-110" : "opacity-80 hover:opacity-100"
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
              <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">Rekening Dompet</label>
              <select
                value={txWalletId}
                onChange={(e) => setTxWalletId(e.target.value)}
                className="w-full px-3.5 py-2 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-xs text-white focus:outline-none focus:border-[#0A84FF]"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.current_balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">Kategori</label>
              <select
                value={txCategoryId}
                onChange={(e) => setTxCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-xs text-white focus:outline-none focus:border-[#0A84FF]"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">Tanggal</label>
              <input
                type="date"
                value={txDate}
                onChange={(e) => setTxDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-xs text-white focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[rgba(235,235,245,0.60)] block mb-1">Keterangan</label>
              <input
                type="text"
                value={txNote}
                onChange={(e) => setTxNote(e.target.value)}
                placeholder="Contoh: Termin 1 / Beli Semen"
                className="w-full px-3.5 py-2 bg-[rgba(118,118,128,0.24)] rounded-[12px] border border-white/[0.06] text-xs text-white placeholder-[rgba(235,235,245,0.35)] focus:outline-none focus:border-[#0A84FF]"
              />
            </div>
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
