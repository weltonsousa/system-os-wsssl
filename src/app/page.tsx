import Image from 'next/image';
import Card from '@/components/ui/Card';
import Link from 'next/link'; // Still need link for navigation, but maybe we can use Button as a link wrapper if we had it, or just use Link content
import { buttonVariants } from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <section className="text-center space-y-6 pt-12">
        <h1 className="text-5xl md:text-6xl font-display font-bold text-slate-900 tracking-tighter">
          WS Service Solutions
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light">
          Sistema de gerenciamento de serviços de informática de alto desempenho.
        </p>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="hover:border-indigo-200 transition-colors group">
          <div className="p-2 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Soluções em TI
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Gerencie seus serviços com eficiência e precisão. Desde o cadastro até a finalização, controle total do fluxo de trabalho.
            </p>
            <div className="pt-4 flex justify-center">
              <Image
                src="/logo2.png"
                alt="Logo WS Service Solutions"
                width={150}
                height={75}
                className="opacity-80 grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </div>
        </Card>

        <Card className="hover:border-indigo-200 transition-colors">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Sobre o Sistema</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Desenvolvido para otimizar processos e garantir a satisfação do cliente.
              Utilize a navegação superior para acessar os módulos de Clientes, Serviços e Relatórios.
            </p>
            <div className="pt-4">
              <Link href="/login" className={buttonVariants('primary', 'md', 'w-full')}>
                Acessar Painel
              </Link>
            </div>
          </div>
        </Card>
      </div>

      <footer className="text-center pt-8 border-t border-slate-200/50">
        <p className="text-xs text-slate-400 uppercase tracking-widest">
          Internal System v2.0
        </p>
      </footer>
    </div>
  );
}

