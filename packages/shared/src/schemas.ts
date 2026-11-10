import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const walletSchema = z.object({
  name: z.string().min(1, "Nama dompet wajib diisi"),
  type: z.enum(["bank", "cash", "ewallet"]),
  icon: z.string().optional().default("wallet"),
  color: z.string().optional().default("#007AFF"),
  initial_balance: z.number().int().nonnegative("Saldo awal tidak boleh negatif").default(0),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi"),
  type: z.enum(["expense", "income"]),
  icon: z.string().optional().default("tag"),
  color: z.string().optional().default("#8E8E93"),
});

export const transactionSchema = z.object({
  wallet_id: z.string().min(1, "Dompet wajib dipilih"),
  category_id: z.string().optional().nullable(),
  type: z.enum(["income", "expense", "transfer_in", "transfer_out"]),
  amount: z.number().int().positive("Nominal harus lebih dari 0"),
  date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD"),
  note: z.string().optional().nullable(),
});

export const transferSchema = z.object({
  source_wallet_id: z.string().min(1, "Dompet asal wajib dipilih"),
  target_wallet_id: z.string().min(1, "Dompet tujuan wajib dipilih"),
  amount: z.number().int().positive("Nominal transfer harus lebih dari 0"),
  date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD"),
  note: z.string().optional().nullable(),
});

export const debtSchema = z.object({
  person_name: z.string().min(1, "Nama pihak wajib diisi"),
  type: z.enum(["debt", "receivable"]),
  total_amount: z.number().int().positive("Nominal hutang/piutang harus lebih dari 0"),
  due_date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD").optional().nullable(),
  note: z.string().optional().nullable(),
});

export const debtPaymentSchema = z.object({
  wallet_id: z.string().min(1, "Dompet pembayaran wajib dipilih"),
  amount: z.number().int().positive("Nominal cicilan harus lebih dari 0"),
  payment_date: z.string().regex(dateRegex, "Format tanggal harus YYYY-MM-DD"),
  note: z.string().optional().nullable(),
});

export const pinSchema = z.object({
  pin: z.string().length(6, "PIN harus 6 digit").regex(/^\d{6}$/, "PIN hanya boleh berupa angka"),
});
