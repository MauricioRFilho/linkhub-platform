import Link from "next/link";
import { ArrowRight, Sparkles, Zap, Palette, Globe } from "lucide-react";

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
          Visitas públicas grátis · criação básica grátis para criadores
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight max-w-3xl leading-tight">
          Links, portfólio e apresentação em um{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
            único lugar
          </span>
        </h2>

        <p className="mt-5 text-lg text-zinc-400 max-w-xl leading-relaxed">
          Reúna seus canais, mostre seu trabalho ou apresente sua empresa. Personalize cores, conteúdo e ordem sem programar.
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
            href="#recursos"
            className="px-6 py-3.5 rounded-xl border border-zinc-800 text-zinc-300 font-medium text-sm hover:bg-zinc-900 transition-colors"
          >
            Conhecer recursos
          </Link>
        </div>

        {/* Feature Grid */}
        <div id="recursos" className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl text-left scroll-mt-24">
          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Para links e portfólios</h3>
            <p className="text-sm text-zinc-400">Apresente canais, projetos, produtos e serviços em uma única página pública.</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-4">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Cinco estilos visuais</h3>
            <p className="text-sm text-zinc-400">Combine templates, cores de destaque e modos claro ou escuro.</p>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white mb-1">Organize do seu jeito</h3>
            <p className="text-sm text-zinc-400">Ordene itens, crie divisões, destaque produtos e oculte links quando precisar.</p>
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
