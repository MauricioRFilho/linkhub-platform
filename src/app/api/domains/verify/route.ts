import { NextResponse } from "next/server";
import { resolveTxt } from "node:dns/promises";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { addDomainToVercel, checkVercelDomain } from "@/lib/vercel/domains";
import { getDnsRecords } from "../route";

export async function POST() {
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
    return NextResponse.json({ error: "Nenhum domínio configurado." }, { status: 404 });
  }

  const txtTarget = `_linkhub.${domain.hostname}`;
  let txtFound = false;

  try {
    const records = await resolveTxt(txtTarget);
    // records is an array of string arrays, e.g. [["token1"], ["token2"]]
    const flat = records.flat().map((item) => item.trim());
    txtFound = flat.includes(domain.verification_token);
  } catch {
    txtFound = false;
  }

  if (!txtFound) {
    return NextResponse.json({
      verified: false,
      status: "pending",
      message: `Registro TXT "${txtTarget}" ainda não foi encontrado com o valor esperado. Pode levar alguns minutos para propagar no DNS.`,
      records: getDnsRecords(domain.hostname, domain.verification_token),
    });
  }

  // TXT ownership is proven! Now configure on Vercel
  try {
    await addDomainToVercel(domain.hostname);
    await addDomainToVercel(`www.${domain.hostname}`, domain.hostname);
  } catch (err) {
    console.warn("Aviso ao associar domínio na Vercel:", err);
  }

  // Check Vercel status
  const vercelStatus = await checkVercelDomain(domain.hostname);
  const newStatus = vercelStatus.misconfigured ? "misconfigured" : "active";

  // Update status via service client (bypasses RLS since authenticated cannot write status)
  const service = createServiceClient();
  const { data: updated, error: updateError } = await service
    .from("custom_domains")
    .update({
      status: newStatus,
      verified_at: new Date().toISOString(),
    })
    .eq("id", domain.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: "Erro ao atualizar status do domínio." }, { status: 500 });
  }

  return NextResponse.json({
    verified: true,
    status: newStatus,
    domain: updated,
    message:
      newStatus === "active"
        ? "Domínio verificado e ativo com sucesso!"
        : "Propriedade confirmada, mas o apontamento DNS (A ou CNAME) ainda não está apontando para a Vercel com DNS Only (nuvem cinza na Cloudflare).",
    records: getDnsRecords(domain.hostname, domain.verification_token),
  });
}
