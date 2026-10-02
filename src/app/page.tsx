import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Zap, Palette, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50 backdrop-blur-md sticky top-0 z-50 bg-zinc-950/80">
        <h1 className="text-xl font-bold text-white tracking-tight">
          Link<span className="text-emerald-400">Hub</span>
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/login"
            className="text-sm px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors shadow-sm shadow-emerald-950"
          >
            Criar meu perfil
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/20 via-zinc-950/0 to-transparent -z-10 pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          100% gratuito e configurável
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight max-w-3xl leading-tight">
          Todos os seus links em um{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            único lugar
          </span>
        </h2>

        <p className="mt-5 text-lg text-zinc-400 max-w-xl leading-relaxed">
          Crie sua página de links ultra-rápida, com temas personalizados, domínio próprio ou subdomínio exclusivo.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <Link
            href="/login"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-500/15"
          >
            Começar agora — É grátis
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/@mauricio"
            className="px-6 py-3.5 rounded-xl border border-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-900 transition-colors"
          >
            Ver exemplo ao vivo
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl text-left">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Performance Extrema</h3>
            <p className="text-sm text-zinc-400">Construído em Next.js com renderização ultra-otimizada e CDN global.</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Totalmente Customizável</h3>
            <p className="text-sm text-zinc-400">Alterne temas, cores de destaque, modos claro/escuro e estilos de cartões.</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Seu Domínio ou Nosso</h3>
            <p className="text-sm text-zinc-400">Acesse via <code className="text-zinc-300">links.codecadence.com.br/@você</code> ou configure seu domínio.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        <p>© {new Date().getFullYear()} Code Cadence. Todos os direitos reservados.</p>
      </footer>
    </main>
  );
}
