import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Company, CompanyRole, CompanyTag } from "@/lib/company-types";

// Re-export types and constants for server-side consumers
export type { Company, CompanyRole, CompanyTag } from "@/lib/company-types";
export { DISCIPLINE_COLOURS, TRACK_LABELS } from "@/lib/company-types";

/* ── Queries ── */

/**
 * Fetch all companies (with roles) for a user, ordered by sort_order.
 */
export const getCompaniesForUser = cache(async (userId: string): Promise<Company[]> => {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: companies } = await (supabase as any)
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true }) as { data: Record<string, unknown>[] | null };

  if (!companies || companies.length === 0) return [];

  const companyIds = companies.map((c: any) => c.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roles } = await (supabase as any)
    .from("company_roles")
    .select("*")
    .in("company_id", companyIds)
    .order("sort_order", { ascending: true }) as { data: Record<string, unknown>[] | null };

  const rolesByCompany = new Map<string, CompanyRole[]>();
  for (const role of (roles ?? []) as any[]) {
    const list = rolesByCompany.get(role.company_id) ?? [];
    list.push(role as CompanyRole);
    rolesByCompany.set(role.company_id, list);
  }

  return companies.map((c: any) => ({
    ...c,
    tags: (c.tags as CompanyTag[]) ?? [],
    blurb_left: c.blurb_left as Company["blurb_left"],
    blurb_right: c.blurb_right as Company["blurb_right"],
    roles: rolesByCompany.get(c.id) ?? [],
  })) as Company[];
});

/**
 * Fetch a single company by slug for a given user.
 */
export const getCompanyBySlug = cache(async (userId: string, slug: string): Promise<Company | null> => {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: company } = await (supabase as any)
    .from("companies")
    .select("*")
    .eq("user_id", userId)
    .eq("slug", slug)
    .single() as { data: Record<string, unknown> | null };

  if (!company) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: roles } = await (supabase as any)
    .from("company_roles")
    .select("*")
    .eq("company_id", (company as any).id)
    .order("sort_order", { ascending: true }) as { data: Record<string, unknown>[] | null };

  return {
    ...company,
    tags: ((company as any).tags as CompanyTag[]) ?? [],
    blurb_left: (company as any).blurb_left as Company["blurb_left"],
    blurb_right: (company as any).blurb_right as Company["blurb_right"],
    roles: ((roles ?? []) as CompanyRole[]),
  } as Company;
});
