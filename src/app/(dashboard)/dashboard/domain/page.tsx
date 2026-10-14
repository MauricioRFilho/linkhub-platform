"use client";

import { useEffect, useState } from "react";
import {
  Globe,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import type { CustomDomain } from "@/types/database";

interface DnsRecord {
  type: string;
  name: string;
  recordName: string;
  value: string;
  purpose: string;
  note?: string;
}

export default function DomainSettingsPage() {
  const [domain, setDomain] = useState<CustomDomain | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [hostnameInput, setHostnameInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const res = await fetch("/api/domains");
        if (!res.ok) throw new Error("Falha ao carregar informações de domínio.");
        const data = await res.json();
        if (!ignore) {
          setDomain(data.domain || null);
          setRecords(data.records || []);
          if (data.domain?.hostname) {
            setHostnameInput(data.domain.hostname);
          }
        }
      } catch (err) {
        if (!ignore) {
          setActionError(err instanceof Error ? err.message : "Erro desconhecido");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleAddDomain(e: React.FormEvent) {
    e.preventDefault();
    if (!hostnameInput.trim()) return;

    setSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname: hostnameInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Falha ao salvar domínio.");
      }

      setDomain(data.domain);
      setRecords(data.records || []);
      setActionMessage("Domínio adicionado! Agora configure os registros DNS abaixo para ativá-lo.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao adicionar domínio.");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    setVerifying(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const res = await fetch("/api/domains/verify", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Falha na verificação.");
      }

      if (data.domain) {
        setDomain(data.domain);
      }
      if (data.records) {
        setRecords(data.records);
      }

      setActionMessage(data.message);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao verificar domínio.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleDeleteDomain() {
    if (!confirm("Tem certeza que deseja desconectar este domínio? Ele deixará de apontar para sua página.")) {
      return;
    }

    setSaving(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const res = await fetch("/api/domains", { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover domínio.");

      setDomain(null);
      setRecords([]);
      setHostnameInput("");
      setActionMessage("Domínio desconectado com sucesso.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Erro ao remover domínio.");
    } finally {
      setSaving(false);
    }
  }

  function handleCopy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2.5">
          <Globe className="w-6 h-6 text-emerald-400" />
          Domínio Próprio
        </h1>
        <p className="text-zinc-400 text-sm">
          Use seu próprio domínio (ex: <span className="text-zinc-200 font-mono">seunome.com.br</span>) como link da bio no Instagram e TikTok.
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* State A: No domain yet */}
      {!domain && (
        <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-6">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold text-white mb-2">Conectar um novo domínio</h2>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Digite o domínio que você já possui registrado no Registro.br, Cloudflare, GoDaddy ou Hostinger.
              Você receberá instruções passo a passo para fazer o apontamento.
            </p>

            <form onSubmit={handleAddDomain} className="space-y-4">
              <div>
                <label htmlFor="hostname" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Seu domínio
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">
                      https://
                    </span>
                    <input
                      id="hostname"
                      type="text"
                      required
                      placeholder="seunome.com.br"
                      value={hostnameInput}
                      onChange={(e) => setHostnameInput(e.target.value)}
                      className="w-full pl-20 pr-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-50 shrink-0 cursor-pointer shadow-lg shadow-emerald-950/20"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    Conectar Domínio
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="pt-6 border-t border-zinc-800/60 grid sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-xs font-semibold text-white mb-1">Certificado SSL Automático</h3>
              <p className="text-xs text-zinc-500">HTTPS gratuito e renovado automaticamente para máxima segurança.</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
              <Globe className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-xs font-semibold text-white mb-1">Apex e WWW Unificados</h3>
              <p className="text-xs text-zinc-500">Seus visitantes chegam na página digitando com ou sem o www.</p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mb-2" />
              <h3 className="text-xs font-semibold text-white mb-1">Zero Downtime</h3>
              <p className="text-xs text-zinc-500">Sua página continua funcionando no link padrão enquanto configura.</p>
            </div>
          </div>
        </div>
      )}

      {/* State B: Domain Configured */}
      {domain && (
        <div className="space-y-6">
          {/* Domain Status Card */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-white font-mono">{domain.hostname}</span>
                {domain.status === "active" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Ativo e Verificado
                  </span>
                )}
                {domain.status === "pending" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5 animate-pulse" />
                    Aguardando Configuração DNS
                  </span>
                )}
                {domain.status === "misconfigured" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Apontamento Incorreto
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Cadastrado em {new Date(domain.created_at).toLocaleDateString("pt-BR")}.
                {domain.verified_at && ` Verificado em ${new Date(domain.verified_at).toLocaleDateString("pt-BR")}.`}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {domain.status === "active" && (
                <a
                  href={`https://${domain.hostname}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Abrir Domínio
                </a>
              )}
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifying ? "animate-spin" : ""}`} />
                {verifying ? "Verificando..." : "Verificar DNS"}
              </button>
              <button
                onClick={handleDeleteDomain}
                disabled={saving}
                className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="Desconectar domínio"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* DNS Configuration Table */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Registros DNS para configurar no seu provedor
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Acesse o painel onde você gerencia o DNS do domínio (Cloudflare, Registro.br, etc.) e adicione os seguintes registros:
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400">
                    <th className="py-2.5 px-3 font-medium">Tipo</th>
                    <th className="py-2.5 px-3 font-medium">Nome / Host</th>
                    <th className="py-2.5 px-3 font-medium">Valor / Destino</th>
                    <th className="py-2.5 px-3 font-medium">Finalidade</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-mono">
                  {records.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 font-semibold">
                          {rec.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-200">
                        <div className="flex items-center gap-1.5">
                          <span>{rec.recordName}</span>
                          <span className="text-[10px] text-zinc-500 font-sans">({rec.name})</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-zinc-300 max-w-xs truncate" title={rec.value}>
                        {rec.value}
                      </td>
                      <td className="py-3 px-3 text-zinc-400 font-sans text-[11px]">
                        {rec.purpose}
                        {rec.note && <span className="block text-amber-400/90 text-[10px] mt-0.5">{rec.note}</span>}
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <button
                          onClick={() => handleCopy(rec.value, `val-${idx}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                        >
                          {copiedKey === `val-${idx}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copiar
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Practical Help & Best Practices */}
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              Dicas Importantes para Ativação Rápida
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 text-xs text-zinc-400">
              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60 space-y-1.5">
                <span className="font-semibold text-zinc-200 block">☁️ Se você usa Cloudflare:</span>
                <p>
                  Desative o proxy (nuvem laranja) para os registros apontados para a Vercel. Deixe-os em modo{" "}
                  <strong className="text-amber-300">DNS Only (nuvem cinza)</strong>. Caso contrário, a Vercel não conseguirá emitir o certificado SSL.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60 space-y-1.5">
                <span className="font-semibold text-zinc-200 block">🇧🇷 Registro.br ou GoDaddy:</span>
                <p>
                  No domínio raiz, provedores que não suportam CNAME flattening exigem o registro tipo{" "}
                  <strong className="text-emerald-300">A</strong> apontando para <code className="text-zinc-200">76.76.21.21</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60 space-y-1.5">
                <span className="font-semibold text-zinc-200 block">⏱️ Propagação do DNS:</span>
                <p>
                  Registros DNS podem levar de 2 a 30 minutos para se propagarem na internet. Se a verificação falhar de imediato, aguarde alguns minutos e clique novamente em &quot;Verificar DNS&quot;.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/60 space-y-1.5">
                <span className="font-semibold text-zinc-200 block">📱 Link na Bio:</span>
                <p>
                  Assim que estiver ativo, você pode colocar <code className="text-zinc-200">{domain.hostname}</code> diretamente na bio do seu perfil do Instagram e do TikTok.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
