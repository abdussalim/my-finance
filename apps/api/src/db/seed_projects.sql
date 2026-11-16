-- Seed initial projects for the user
INSERT OR IGNORE INTO projects (id, name, code, description, color, status, budget, target_revenue)
VALUES 
  ('prj_edunusa', 'EDUNUSA', 'EDU', 'Platform Edukasi Digital & Program Pelatihan Kampus', '#8B5CF6', 'active', 50000000, 150000000),
  ('prj_sobatpart', 'SOBATPART', 'SOB', 'Distribusi Suku Cadang & Aksesoris Motor Presisi', '#F59E0B', 'active', 75000000, 220000000),
  ('prj_istanablock', 'ISTANA BLOCK', 'IBL', 'Manufaktur Paving Block & Batako Berkualitas Tinggi', '#06B6D4', 'active', 120000000, 380000000);
