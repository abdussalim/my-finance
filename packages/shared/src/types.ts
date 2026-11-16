import { z } from "zod";
import {
  walletSchema,
  categorySchema,
  projectSchema,
  transactionSchema,
  transferSchema,
  debtSchema,
  debtPaymentSchema,
  pinSchema,
  projectTaskSchema,
  updateProjectTaskSchema,
} from "./schemas";

export type WalletInput = z.infer<typeof walletSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectTaskInput = z.infer<typeof projectTaskSchema>;
export type UpdateProjectTaskInput = z.infer<typeof updateProjectTaskSchema>;
export type TransactionInput = z.infer<typeof transactionSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type DebtInput = z.infer<typeof debtSchema>;
export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>;
export type PinInput = z.infer<typeof pinSchema>;

export interface Wallet extends WalletInput {
  id: string;
  created_at: string;
}

export interface Category extends CategoryInput {
  id: string;
}

export interface Project extends ProjectInput {
  id: string;
  created_at: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ProjectWithStats extends Project {
  total_income: number;
  total_expense: number;
  net_profit: number;
  margin_percentage: number;
  budget_burn_percentage: number;
  revenue_progress_percentage: number;
  transaction_count: number;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  progress_percentage: number;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  category_id: string | null;
  project_id: string | null;
  type: "income" | "expense" | "transfer_in" | "transfer_out";
  amount: number;
  transfer_pair_id: string | null;
  date: string;
  note: string | null;
  created_at: string;
}

export interface Debt {
  id: string;
  person_name: string;
  type: "debt" | "receivable";
  total_amount: number;
  due_date: string | null;
  status: "unpaid" | "partially_paid" | "settled";
  note: string | null;
  created_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  wallet_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  created_at: string;
}

export interface AuthConfig {
  id: string;
  pin_hash: string;
  salt: string;
  failed_attempts: number;
  locked_until: string | null;
}

export interface WalletWithBalance extends Wallet {
  current_balance: number;
}

export interface DebtWithRemaining extends Debt {
  remaining_amount: number;
  paid_amount: number;
}

export interface TransactionWithDetails extends Transaction {
  wallet_name: string;
  category_name: string | null;
  project_name?: string | null;
  project_color?: string | null;
  project_code?: string | null;
}

export interface DashboardSummary {
  total_balance: number;
  month_income: number;
  month_expense: number;
  total_debt: number;
  total_receivable: number;
  recent_transactions: TransactionWithDetails[];
  projects_summary?: {
    total_projects: number;
    active_projects: number;
    total_project_income: number;
    total_project_expense: number;
    total_project_profit: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
