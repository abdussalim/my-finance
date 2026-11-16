-- Seed initial project tasks for EDUNUSA, SOBATPART, and ISTANA BLOCK

-- EDUNUSA tasks (Education Platform)
INSERT OR REPLACE INTO project_tasks (id, project_id, title, description, status, priority, due_date, completed_at, created_at) VALUES
('task-edu-1', 'prj_edunusa', 'Penyusunan Kurikulum & Silabus Vokasi', 'Finalisasi modul pelatihan bersama industri mitra', 'completed', 'high', '2026-10-15', '2026-10-14 15:30:00', '2026-10-01 08:00:00'),
('task-edu-2', 'prj_edunusa', 'Deploy Platform LMS & Portal Ujian Online', 'Setup VPS cloud, CDN video, dan database peserta', 'completed', 'high', '2026-10-25', '2026-10-24 18:20:00', '2026-10-05 09:00:00'),
('task-edu-3', 'prj_edunusa', 'Integrasi Payment Gateway & Auto-Invoice', 'Aktivasi QRIS, Virtual Account, dan notifikasi WhatsApp', 'completed', 'medium', '2026-11-05', '2026-11-04 11:10:00', '2026-10-10 10:00:00'),
('task-edu-4', 'prj_edunusa', 'Rekrutmen & Onboarding 20 Instruktur Tamu', 'Screening pengajar praktisi dan penetapan jadwal mentoring', 'pending', 'high', '2026-11-25', NULL, '2026-10-20 14:00:00'),
('task-edu-5', 'prj_edunusa', 'Pelaksanaan Kampanye Marketing Batch 1 (500 Siswa)', 'Distribusi iklan meta ads, sponsorship kampus, dan webinar promo', 'pending', 'medium', '2026-12-05', NULL, '2026-11-01 13:00:00');

-- SOBATPART tasks (Automotive Spareparts Distribution)
INSERT OR REPLACE INTO project_tasks (id, project_id, title, description, status, priority, due_date, completed_at, created_at) VALUES
('task-sob-1', 'prj_sobatpart', 'Perjanjian Kerjasama Distributor Resmi (Jakarta & Surabaya)', 'Tanda tangan kontrak pasokan fast-moving spareparts OEM', 'completed', 'high', '2026-10-18', '2026-10-17 14:00:00', '2026-10-02 08:00:00'),
('task-sob-2', 'prj_sobatpart', 'Sistem Manajemen Pergudangan & Barcode SKU', 'Pelabelan 1.200 SKU part dan instalasi rak gudang sentral', 'completed', 'medium', '2026-11-02', '2026-11-01 17:45:00', '2026-10-12 11:00:00'),
('task-sob-3', 'prj_sobatpart', 'Integrasi Aplikasi Kasir & Aplikasi Order Mitra Bengkel', 'Uji coba pemesanan online oleh 15 bengkel mitra percontohan', 'pending', 'high', '2026-11-20', NULL, '2026-10-25 10:00:00'),
('task-sob-4', 'prj_sobatpart', 'Pengadaan 2 Unit Armada Pickup Pengiriman Wilayah Timur', 'Leasing dan pengurusan branding kendaraan logistik', 'pending', 'medium', '2026-12-01', NULL, '2026-11-05 09:30:00');

-- ISTANA BLOCK tasks (Paving & Concrete Construction Manufacturing)
INSERT OR REPLACE INTO project_tasks (id, project_id, title, description, status, priority, due_date, completed_at, created_at) VALUES
('task-ibl-1', 'prj_istanablock', 'Pengadaan & Instalasi Mesin Cetak Paving Hidrolik Otomatis', 'Kapasitas produksi 15.000 paving block per hari', 'completed', 'high', '2026-09-30', '2026-09-28 16:00:00', '2026-09-01 07:00:00'),
('task-ibl-2', 'prj_istanablock', 'Uji Kuat Tekan Laboratorium Beton K-300 & K-400', 'Sertifikasi kelayakan mutu dari Balai Uji Bahan Bangunan', 'completed', 'high', '2026-10-10', '2026-10-09 13:15:00', '2026-09-15 08:30:00'),
('task-ibl-3', 'prj_istanablock', 'Pengiriman Batch 1 Kawasan Industri (80.000 Pcs Paving)', 'Pengiriman armada tronton dan serah terima dokumen jalan', 'completed', 'high', '2026-10-28', '2026-10-27 19:00:00', '2026-10-01 10:00:00'),
('task-ibl-4', 'prj_istanablock', 'Produksi & Pengeringan Batch 2 (60.000 Pcs Paving)', 'Proses pencetakan dan curing standar 21 hari', 'pending', 'high', '2026-11-22', NULL, '2026-10-25 08:00:00'),
('task-ibl-5', 'prj_istanablock', 'Pemasangan & Pengerjaan Lapangan Area Parkir Truk', 'Sub-kontraktor paving pemasangan 3.500 m2', 'pending', 'medium', '2026-12-10', NULL, '2026-11-02 09:00:00'),
('task-ibl-6', 'prj_istanablock', 'Penagihan Termin 2 & Berita Acara Serah Terima (BAST)', 'Penerbitan faktur tagihan 40% sisa kontrak proyek', 'pending', 'high', '2026-12-20', NULL, '2026-11-08 14:00:00');
