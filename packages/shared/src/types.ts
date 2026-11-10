import { z } from "zod";
import {
  walletSchema,
  categorySchema,
  transactionSchema,
  transferSchema,
  debtSchema,
  debtPaymentSchema,
  pinSchema,
} from "./schemas";

export type WalletInput = z.infer<typeof walletSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
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

export interface Transaction {
  id: string;
  wallet_id: string;
  category_id: string | null;
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
}

export interface DashboardSummary {
  total_balance: number;
  month_income: number;
  month_expense: number;
  total_debt: number;
  total_receivable: number;
  recent_transactions: TransactionWithDetails[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
