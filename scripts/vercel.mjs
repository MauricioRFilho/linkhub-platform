#!/usr/bin/env node

/**
 * Vercel REST API Manager for LinkHub Platform
 *
 * Automates project creation, domain linking, and environment setup on Vercel.
 * Reads VERCEL_TOKEN and VERCEL_PROJECT_ID from .env.local without exposing secrets.
 *
 * Commands:
 *   node scripts/vercel.mjs verify
 *   node scripts/vercel.mjs projects
 *   node scripts/vercel.mjs create-project [project_name]
 *   node scripts/vercel.mjs add-domain [domain_name] [project_name]
 *   node scripts/vercel.mjs check-domain [domain_name] [project_name]
 *   node scripts/vercel.mjs sync-env [project_name]
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
      val = val.replace(/^["']|["']$/g, "").trim();
      env[key] = val;
    }
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const token = (env.VERCEL_TOKEN || env.VERCEL_API_TOKEN || "").replace(/^bearer\s+/i, "").trim();
const defaultProjectName = env.VERCEL_PROJECT_NAME || "linkhub-platform";
const defaultProjectId = env.VERCEL_PROJECT_ID || "";
const defaultDomain = "links.cadencecode.com.br";

if (!token) {
  console.error("❌ Erro: VERCEL_TOKEN não foi encontrado no arquivo .env.local");
  console.error("Adicione no seu .env.local: VERCEL_TOKEN=seu_token");
  process.exit(1);
}

function getHeaders() {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function vercelFetch(path, options = {}) {
  const url = `https://api.vercel.com${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.error?.message || data.message || JSON.stringify(data);
    throw new Error(`Vercel API error (${res.status}): ${msg}`);
  }
  return data;
}

// -------------------------------------------------------------
// Commands
// -------------------------------------------------------------

async function verifyToken() {
  console.log("🔐 Verificando autenticação na Vercel...");
  try {
    const userRes = await vercelFetch("/v2/user");
    const user = userRes.user;
    console.log(`✅ Token válido!`);
    console.log(`   Usuário: ${user.name || user.username} (${user.email})`);
    console.log(`   User ID: ${user.id}`);
    return user;
  } catch (err) {
    console.error(`\n❌ Falha na verificação: ${err.message}`);
    return null;
  }
}

async function listProjects() {
  console.log("🔍 Buscando projetos na sua conta Vercel...\n");
  const data = await vercelFetch("/v9/projects");
  const projects = data.projects || [];
  if (projects.length === 0) {
    console.log("Nenhum projeto encontrado nesta conta.");
    return [];
  }
  console.log("--------------------------------------------------------------------------------");
  console.log("ID                                 | Nome                 | Framework | Criado em");
  console.log("--------------------------------------------------------------------------------");
  for (const p of projects) {
    const created = new Date(p.createdAt).toLocaleDateString("pt-BR");
    console.log(`${p.id.padEnd(34)} | ${p.name.padEnd(20)} | ${(p.framework || "other").padEnd(9)} | ${created}`);
  }
  console.log("--------------------------------------------------------------------------------");
  return projects;
}

async function getProject(projectIdentifier) {
  if (projectIdentifier) {
    try {
      return await vercelFetch(`/v9/projects/${encodeURIComponent(projectIdentifier)}`);
    } catch {
      // fallback
    }
  }

  // Try default project name first (e.g. linkhub-platform)
  try {
    return await vercelFetch(`/v9/projects/${encodeURIComponent(defaultProjectName)}`);
  } catch {
    // fallback
  }

  // Fallback to configured ID
  if (defaultProjectId) {
    try {
      return await vercelFetch(`/v9/projects/${encodeURIComponent(defaultProjectId)}`);
    } catch {
      // fallback
    }
  }

  return null;
}

async function createProject(name = defaultProjectName) {
  console.log(`🚀 Criando projeto "${name}" na Vercel...`);
  
  // First check if it already exists
  const existing = await getProject(name);
  if (existing) {
    console.log(`ℹ️ Projeto "${name}" já existe (ID: ${existing.id}).`);
    return existing;
  }

  // Create project payload
  const body = {
    name,
    framework: "nextjs",
    gitRepository: {
      type: "github",
      repo: "MauricioRFilho/linkhub-platform",
    },
  };

  try {
    const project = await vercelFetch("/v10/projects", {
      method: "POST",
      body: JSON.stringify(body),
    });
    console.log(`✅ Projeto criado com sucesso!`);
    console.log(`   Nome: ${project.name}`);
    console.log(`   ID:   ${project.id}`);
    return project;
  } catch (err) {
    // If linking repo fails (e.g. GitHub app not installed on that specific repo), create standalone project
    if (err.message.includes("gitRepository") || err.message.includes("GitHub")) {
      console.log(`⚠️ Tentando criar sem vincular repositório git diretamente...`);
      const fallbackBody = { name, framework: "nextjs" };
      const fallbackProject = await vercelFetch("/v10/projects", {
        method: "POST",
        body: JSON.stringify(fallbackBody),
      });
      console.log(`✅ Projeto criado com sucesso (standalone)!`);
      console.log(`   Nome: ${fallbackProject.name}`);
      console.log(`   ID:   ${fallbackProject.id}`);
      return fallbackProject;
    }
    throw err;
  }
}

async function addDomain(domainName = defaultDomain, projectIdentifier = null) {
  let project = await getProject(projectIdentifier);
  if (!project) {
    console.log(`Projeto não encontrado. Criando projeto "${defaultProjectName}" primeiro...`);
    project = await createProject(defaultProjectName);
  }

  console.log(`🌐 Adicionando domínio "${domainName}" ao projeto "${project.name}" (ID: ${project.id})...\n`);

  try {
    const res = await vercelFetch(`/v9/projects/${project.id}/domains`, {
      method: "POST",
      body: JSON.stringify({ name: domainName }),
    });
    console.log(`✅ Domínio adicionado com sucesso!`);
    console.log(`   Nome:       ${res.name}`);
    console.log(`   Verificado: ${res.verified ? "🟢 Sim" : "🟡 Pendente de verificação"}`);
    
    // Now trigger verification check
    return await checkDomain(domainName, project.id);
  } catch (err) {
    if (err.message.includes("already exists") || err.message.includes("409")) {
      console.log(`ℹ️ O domínio "${domainName}" já está associado ao projeto. Verificando status...`);
      return await checkDomain(domainName, project.id);
    }
    throw err;
  }
}

async function checkDomain(domainName = defaultDomain, projectIdentifier = null) {
  const project = await getProject(projectIdentifier);
  if (!project) {
    throw new Error(`Projeto não encontrado para verificar domínio.`);
  }

  console.log(`🔍 Verificando status do domínio "${domainName}" no projeto "${project.name}"...`);
  
  try {
    const verifyRes = await vercelFetch(`/v9/projects/${project.id}/domains/${encodeURIComponent(domainName)}/verify`, {
      method: "POST",
    });
    
    console.log("\n--------------------------------------------------------------------------------");
    console.log(`Domínio:     ${verifyRes.name}`);
    console.log(`Verificado:  ${verifyRes.verified ? "🟢 SIM (Pronto para tráfego!)" : "🟡 PENDENTE"}`);
    console.log(`Apex Domain: ${verifyRes.apexName || "cadencecode.com.br"}`);
    console.log("--------------------------------------------------------------------------------\n");
    return verifyRes;
  } catch (err) {
    // Try GET if POST verify isn't ready
    const domainInfo = await vercelFetch(`/v9/projects/${project.id}/domains/${encodeURIComponent(domainName)}`);
    console.log("\n--------------------------------------------------------------------------------");
    console.log(`Domínio:     ${domainInfo.name}`);
    console.log(`Verificado:  ${domainInfo.verified ? "🟢 SIM (Pronto!)" : "🟡 PENDENTE"}`);
    console.log("--------------------------------------------------------------------------------\n");
    return domainInfo;
  }
}

async function syncEnv(projectIdentifier = null) {
  const project = await getProject(projectIdentifier);
  if (!project) {
    throw new Error("Projeto não encontrado para sincronizar variáveis.");
  }

  console.log(`🔐 Sincronizando variáveis de ambiente com o projeto "${project.name}" (ID: ${project.id})...\n`);

  // Fetch existing env vars to avoid duplicates or update them
  const existingEnvs = await vercelFetch(`/v9/projects/${project.id}/env`);
  const existingKeys = new Map((existingEnvs.envs || []).map((e) => [e.key, e.id]));

  const keysToSync = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_APP_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  let synced = 0;
  for (const key of keysToSync) {
    let val = env[key];
    if (key === "NEXT_PUBLIC_APP_URL" && !val) {
      val = "https://links.cadencecode.com.br";
    }

    if (!val) {
      console.log(`⚪ ${key}: não configurado localmente (pulado).`);
      continue;
    }

    const payload = {
      key,
      value: val,
      type: "plain",
      target: ["production", "preview", "development"],
    };

    if (existingKeys.has(key)) {
      const envId = existingKeys.get(key);
      await vercelFetch(`/v9/projects/${project.id}/env/${envId}`, {
        method: "PATCH",
        body: JSON.stringify({ value: val }),
      });
      console.log(`🔄 ${key}: atualizado na Vercel.`);
    } else {
      await vercelFetch(`/v10/projects/${project.id}/env`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      console.log(`➕ ${key}: criado na Vercel.`);
    }
    synced++;
  }

  console.log(`\n🎉 Total de ${synced} variáveis sincronizadas com sucesso na Vercel!`);
}

async function getDeployments(projectIdentifier = null) {
  const project = await getProject(projectIdentifier);
  if (!project) {
    throw new Error("Projeto não encontrado na Vercel.");
  }

  console.log(`🔎 Verificando status do projeto "${project.name}" (ID: ${project.id})...\n`);

  if (project.link) {
    console.log(`🔗 Repositório Git conectado: ${project.link.org}/${project.link.repo} (${project.link.type})`);
    console.log(`🌿 Branch de produção: ${project.link.productionBranch || "main"}\n`);
  } else {
    console.log(`⚠️ Repositório Git ainda não conectado via Vercel Settings -> Git.\n`);
  }

  const res = await vercelFetch(`/v6/deployments?projectId=${project.id}&limit=5`);
  const deps = res.deployments || [];

  if (deps.length === 0) {
    console.log("ℹ️ Nenhum deploy realizado ainda neste projeto.");
    console.log("Dica: Faça um commit no GitHub ou rode 'npx vercel --prod' para disparar o primeiro deploy.");
    return;
  }

  console.log("--------------------------------------------------------------------------------------------------");
  console.log("Estado       | URL                                      | Criado em           | Trigger");
  console.log("--------------------------------------------------------------------------------------------------");
  for (const d of deps) {
    const stateEmoji =
      d.state === "READY"
        ? "🟢 READY"
        : d.state === "BUILDING"
        ? "🟡 BUILDING"
        : d.state === "ERROR"
        ? "🔴 ERROR"
        : `⚪ ${d.state}`;
    const date = new Date(d.createdAt).toLocaleString("pt-BR");
    const meta = d.meta?.githubCommitMessage ? `Git: "${d.meta.githubCommitMessage.slice(0, 30)}..."` : "Manual / CLI";
    console.log(`${stateEmoji.padEnd(12)} | ${(d.url || "").padEnd(40)} | ${date.padEnd(19)} | ${meta}`);
  }
  console.log("--------------------------------------------------------------------------------------------------");
  return deps;
}

// -------------------------------------------------------------
// CLI Router
// -------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "verify";

  try {
    switch (command) {
      case "verify":
        await verifyToken();
        break;

      case "projects":
        await listProjects();
        break;

      case "create-project":
        await createProject(args[1]);
        break;

      case "add-domain":
        await addDomain(args[1], args[2]);
        break;

      case "check-domain":
        await checkDomain(args[1], args[2]);
        break;

      case "sync-env":
        await syncEnv(args[1]);
        break;

      case "status":
      case "deployments":
        await getDeployments(args[1]);
        break;

      case "setup":
        console.log("✨ Iniciando configuração completa na Vercel...\n");
        await verifyToken();
        const proj = await createProject(args[1]);
        await addDomain(defaultDomain, proj.id);
        await syncEnv(proj.id);
        break;

      case "help":
      default:
        console.log(`
Uso do utilitário Vercel CLI LinkHub:
  npm run vercel verify                     - Testa autenticação do token
  npm run vercel projects                   - Lista todos os projetos da conta
  npm run vercel create-project [nome]      - Cria projeto na Vercel
  npm run vercel add-domain [domínio]       - Adiciona domínio ao projeto
  npm run vercel check-domain [domínio]     - Checa status e SSL do domínio
  npm run vercel sync-env                   - Sincroniza .env.local para a Vercel
  npm run vercel status                     - Mostra status do Git e deploys
  npm run vercel setup                      - Executa todo o setup automático
`);
        break;
    }
  } catch (err) {
    console.error(`\n❌ Erro na operação: ${err.message}`);
    process.exit(1);
  }
}

main();
