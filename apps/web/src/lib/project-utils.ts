/**
 * Project Logo Resolver Helper
 * Resolves the logo image URL for a project from either:
 * 1. An explicit logo_url / project_logo provided in data
 * 2. Automatic matching for known brand assets (EDUNUSA, SOBATPART, ISTANA BLOCK)
 */
export function getProjectLogo(p?: {
  id?: string | null;
  code?: string | null;
  name?: string | null;
  logo_url?: string | null;
  project_logo?: string | null;
} | null): string | null {
  if (!p) return null;
  if (p.logo_url) return p.logo_url;
  if (p.project_logo) return p.project_logo;

  const id = (p.id || "").toLowerCase();
  const code = (p.code || "").toUpperCase();
  const name = (p.name || "").toLowerCase();

  if (id.includes("edunusa") || code === "EDU" || name.includes("edunusa")) {
    return "/logos/edunusa.png";
  }
  if (id.includes("sobatpart") || code === "SOB" || name.includes("sobatpart")) {
    return "/logos/sobatpart.png";
  }
  if (id.includes("istana") || code === "IBL" || name.includes("istana")) {
    return "/logos/istanablock.png";
  }

  return null;
}
