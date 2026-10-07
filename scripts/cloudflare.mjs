#!/usr/bin/env node

/**
 * Cloudflare DNS & Zone Manager for LinkHub Platform
 *
 * Automates DNS configuration for codecadence.com.br and links.codecadence.com.br.
 * Reads CLOUDFLARE_API_KEY from .env.local without exposing secrets.
 *
 * Usage:
 *   node scripts/cloudflare.mjs verify
 *   node scripts/cloudflare.mjs zones
 *   node scripts/cloudflare.mjs dns [zone_name]
 *   node scripts/cloudflare.mjs setup-links [target_cname]
 *   node scripts/cloudflare.mjs add-cname <name> <target> [--proxied]
 *   node scripts/cloudflare.mjs purge-cache [zone_name]
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// 1. Load environment variables from .env.local safely
function loadEnv() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return {};
  const content = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      // Remove surrounding quotes and trailing inline comments if any
      val = val.replace(/^["']|["']$/g, "").trim();
      env[key] = val;
    }
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const apiToken = (env.CLOUDFLARE_API_TOKEN || "").replace(/^bearer\s+/i, "").trim();
let apiKey = (env.CLOUDFLARE_API_KEY || "").replace(/^bearer\s+/i, "").trim();
const rawKey = apiToken || apiKey;
const email = env.CLOUDFLARE_EMAIL ? env.CLOUDFLARE_EMAIL.trim() : null;

if (!rawKey) {
  console.error("❌ Erro: CLOUDFLARE_API_KEY ou CLOUDFLARE_API_TOKEN não foi encontrada no arquivo .env.local");
  console.error("Adicione no seu .env.local: CLOUDFLARE_API_KEY=seu_token");
  process.exit(1);
}

// Determines whether to use Bearer token or Global API Key
let authMode = apiToken ? "token" : (email && apiKey.length === 37 ? "global" : "token");

function getHeaders() {
  if (authMode === "global" && email) {
    return {
      "X-Auth-Key": apiKey,
      "X-Auth-Email": email,
      "Content-Type": "application/json",
    };
  }
  return {
    Authorization: `Bearer ${rawKey}`,
    "Content-Type": "application/json",
  };
}

async function cfFetch(path, options = {}) {
  const url = `https://api.cloudflare.com/client/v4${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!data.success) {
    const errMsgs = (data.errors || []).map((e) => `${e.code}: ${e.message}`).join(", ");
    throw new Error(`Cloudflare API error (${res.status}): ${errMsgs}`);
  }
  return data.result;
}

// -------------------------------------------------------------
// Commands
// -------------------------------------------------------------

async function verifyToken() {
  console.log("🔐 Verificando autenticação na Cloudflare...");
  try {
    if (authMode === "token") {
      const res = await cfFetch("/user/tokens/verify");
      console.log(`✅ API Token válido! Status: ${res.status} (ID: ${res.id})`);
      return true;
    } else {
      const user = await cfFetch("/user");
      console.log(`✅ Global API Key válida para a conta: ${user.email} (ID: ${user.id})`);
      return true;
    }
  } catch (err) {
    // If token mode failed and we have email + apiKey, try falling back to global key
    if (authMode === "token" && email && apiKey) {
      try {
        authMode = "global";
        const user = await cfFetch("/user");
        console.log(`✅ Global API Key válida para a conta: ${user.email} (ID: ${user.id})`);
        return true;
      } catch {
        authMode = "token"; // restore
      }
    }
    console.error(`\n❌ Falha na verificação: ${err.message}`);
    console.log("\n💡 Dica de configuração na Cloudflare:");
    console.log("1. Se você gerou um **API Token** (Recomendado):");
    console.log("   - Acesse: https://dash.cloudflare.com/profile/api-tokens");
    console.log("   - Clique em 'Create Token' -> use o template 'Edit zone DNS'.");
    console.log("   - Em 'Zone Resources', selecione 'All zones' ou 'cadencecode.com.br'.");
    console.log("   - Cole no .env.local: CLOUDFLARE_API_KEY=seu_token");
    console.log("\n2. Se você está usando sua **Global API Key** antiga:");
    console.log("   - É obrigatório informar o e-mail da conta no .env.local:");
    console.log("     CLOUDFLARE_EMAIL=seu-email@exemplo.com");
    console.log("     CLOUDFLARE_API_KEY=sua_global_api_key");
    return false;
  }
}

async function listZones() {
  console.log("🔍 Buscando zonas na sua conta Cloudflare...\n");
  const zones = await cfFetch("/zones");
  if (!zones || zones.length === 0) {
    console.log("Nenhuma zona encontrada nesta conta.");
    return;
  }
  console.log("--------------------------------------------------------------------------------");
  console.log("ID                                 | Nome                 | Status   | Plano");
  console.log("--------------------------------------------------------------------------------");
  for (const z of zones) {
    console.log(`${z.id} | ${z.name.padEnd(20)} | ${z.status.padEnd(8)} | ${z.plan?.name || "Free"}`);
  }
  console.log("--------------------------------------------------------------------------------");
  return zones;
}

async function getZone(zoneName = "cadencecode.com.br") {
  const zones = await cfFetch(`/zones?name=${encodeURIComponent(zoneName)}`);
  if (!zones || zones.length === 0) {
    throw new Error(`Zona "${zoneName}" não encontrada na conta Cloudflare.`);
  }
  return zones[0];
}

async function listDns(zoneName = "cadencecode.com.br") {
  const zone = await getZone(zoneName);
  console.log(`📋 Registros DNS para a zona: ${zone.name} (${zone.id})\n`);
  const records = await cfFetch(`/zones/${zone.id}/dns_records?per_page=100`);

  console.log("--------------------------------------------------------------------------------------------------------");
  console.log("Tipo  | Nome                                     | Conteúdo / Alvo                      | Proxy");
  console.log("--------------------------------------------------------------------------------------------------------");
  for (const r of records) {
    const proxied = r.proxied ? "🟠 Ativo" : "⚪ DNS Only";
    console.log(`${r.type.padEnd(5)} | ${r.name.padEnd(40)} | ${r.content.padEnd(36)} | ${proxied}`);
  }
  console.log("--------------------------------------------------------------------------------------------------------");
  return records;
}

async function setupLinks(target = "cname.vercel-dns.com", zoneName = "cadencecode.com.br") {
  const zone = await getZone(zoneName);
  const fullName = `links.${zone.name}`;
  console.log(`🚀 Configurando CNAME "${fullName}" -> "${target}" na Cloudflare...\n`);

  // Check if record already exists
  const existing = await cfFetch(`/zones/${zone.id}/dns_records?name=${encodeURIComponent(fullName)}`);

  if (existing && existing.length > 0) {
    const rec = existing[0];
    console.log(`ℹ️ Registro já existe (ID: ${rec.id}). Atualizando para "${target}"...`);
    const updated = await cfFetch(`/zones/${zone.id}/dns_records/${rec.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        type: "CNAME",
        name: fullName,
        content: target,
        proxied: false, // DNS Only required for Vercel SSL verification
        ttl: 1, // Auto
      }),
    });
    console.log(`✅ Sucesso! CNAME ${updated.name} atualizado -> ${updated.content} (Proxy: DNS Only)`);
  } else {
    console.log(`➕ Criando novo registro CNAME para ${fullName}...`);
    const created = await cfFetch(`/zones/${zone.id}/dns_records`, {
      method: "POST",
      body: JSON.stringify({
        type: "CNAME",
        name: "links",
        content: target,
        proxied: false, // DNS Only required for Vercel SSL verification
        ttl: 1, // Auto
      }),
    });
    console.log(`✅ Sucesso! CNAME criado: ${created.name} -> ${created.content} (Proxy: DNS Only)`);
  }

  console.log("\n💡 Nota: O proxy está definido como '⚪ DNS Only' (sem nuvem laranja), padrão recomendado pela Vercel para emissão automática de SSL.");
}

async function addCname(name, target, proxied = false, zoneName = "cadencecode.com.br") {
  const zone = await getZone(zoneName);
  console.log(`➕ Adicionando CNAME "${name}" -> "${target}" (Proxy: ${proxied})...`);
  const record = await cfFetch(`/zones/${zone.id}/dns_records`, {
    method: "POST",
    body: JSON.stringify({
      type: "CNAME",
      name,
      content: target,
      proxied,
      ttl: 1,
    }),
  });
  console.log(`✅ Registro criado com sucesso: ${record.name} -> ${record.content}`);
}

async function purgeCache(zoneName = "cadencecode.com.br") {
  const zone = await getZone(zoneName);
  console.log(`🧹 Purgando todo o cache da zona ${zone.name}...`);
  await cfFetch(`/zones/${zone.id}/purge_cache`, {
    method: "POST",
    body: JSON.stringify({ purge_everything: true }),
  });
  console.log(`✅ Cache purgado com sucesso para ${zone.name}!`);
}

function printHelp() {
  console.log(`
🌐 Cloudflare CLI - LinkHub Platform

Comandos disponíveis:
  npm run cf verify
    Verifica se a chave/token e permissões estão funcionando na API.

  npm run cf zones
    Lista todas as zonas e domínios da sua conta Cloudflare.

  npm run cf dns [dominio]
    Lista todos os registros DNS do domínio (padrão: cadencecode.com.br).

  npm run cf setup-links [alvo]
    Cria ou atualiza automaticamente o CNAME links.cadencecode.com.br
    apontando para a Vercel (cname.vercel-dns.com) com DNS Only.

  npm run cf add-cname <subdominio> <destino> [--proxied]
    Adiciona um registro CNAME customizado.

  npm run cf purge-cache [dominio]
    Limpa todo o cache da Cloudflare para o domínio.
`);
}

// -------------------------------------------------------------
// CLI Runner
// -------------------------------------------------------------
const [cmd, arg1, arg2, arg3] = process.argv.slice(2);

try {
  switch (cmd) {
    case "verify":
      await verifyToken();
      break;
    case "zones":
      await listZones();
      break;
    case "dns":
      await listDns(arg1 || "cadencecode.com.br");
      break;
    case "setup-links":
      await setupLinks(arg1 || "cname.vercel-dns.com", arg2 || "cadencecode.com.br");
      break;
    case "add-cname":
      if (!arg1 || !arg2) {
        console.error("Uso: npm run cf add-cname <subdominio> <destino> [--proxied]");
        process.exit(1);
      }
      await addCname(arg1, arg2, arg3 === "--proxied");
      break;
    case "purge-cache":
      await purgeCache(arg1 || "cadencecode.com.br");
      break;
    default:
      printHelp();
      break;
  }
} catch (err) {
  console.error(`\n❌ Falha na operação: ${err.message}`);
  process.exit(1);
}
