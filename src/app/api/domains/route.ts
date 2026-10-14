import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeHostname, validateHostname } from "@/lib/domains/hostname";
import { removeDomainFromVercel } from "@/lib/vercel/domains";

export function getDnsRecords(hostname: string, token: string) {
  return [
    {
      type: "TXT",
      name: `_linkhub.${hostname}`,
      recordName: `_linkhub`,
      value: token,
      purpose: "Prova de propriedade (obrigatório para ativação)",
    },
    {
      type: "A",
      name: hostname,
      recordName: "@",
      value: "76.76.21.21",
      purpose: "Apontamento do domínio principal para a Vercel",
      note: "Modo DNS Only (nuvem cinza na Cloudflare)",
    },
    {
      type: "CNAME",
      name: `www.${hostname}`,
      recordName: "www",
      value: "cname.vercel-dns.com",
      purpose: "Apontamento do subdomínio www para a Vercel",
      note: "Modo DNS Only (nuvem cinza na Cloudflare)",
    },
  ];
}

export async function GET() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: domain } = await supabase
    .from("custom_domains")
    .select("*")
    .eq("profile_id", authData.user.id)
    .maybeSingle();

  if (!domain) {
    return NextResponse.json({ domain: null, records: [] });
  }

  return NextResponse.json({
    domain,
    records: getDnsRecords(domain.hostname, domain.verification_token),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { hostname?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  const normalized = normalizeHostname(body.hostname || "");
  const validationError = validateHostname(normalized);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 });
  }

  // Check if this user already has a domain configured
  const { data: existing } = await supabase
    .from("custom_domains")
    .select("*")
    .eq("profile_id", authData.user.id)
    .maybeSingle();

  if (existing) {
    if (existing.hostname === normalized) {
      return NextResponse.json({
        domain: existing,
        records: getDnsRecords(existing.hostname, existing.verification_token),
      });
    }

    // Changing domain: clean up previous on Vercel
    await removeDomainFromVercel(existing.hostname);

    // Delete previous row to insert new pending domain
    await supabase.from("custom_domains").delete().eq("id", existing.id);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("custom_domains")
    .insert({
      profile_id: authData.user.id,
      hostname: normalized,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Erro ao cadastrar domínio ou limite atingido." },
      { status: 422 }
    );
  }

  return NextResponse.json({
    domain: inserted,
    records: getDnsRecords(inserted.hostname, inserted.verification_token),
  });
}

export async function DELETE() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("custom_domains")
    .select("*")
    .eq("profile_id", authData.user.id)
    .maybeSingle();

  if (existing) {
    await removeDomainFromVercel(existing.hostname);
    await supabase.from("custom_domains").delete().eq("id", existing.id);
  }

  return NextResponse.json({ success: true });
}
