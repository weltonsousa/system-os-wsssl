import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';

export default async function ConfiracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-4xl font-bold text-center mb-12 text-slate-800 tracking-tight">Ajuste do Sistema</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="hover:border-indigo-200 transition-colors shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-slate-800">Cadastrar Tipo de Serviço</h2>
          <p className="text-slate-600 mb-6 min-h-[3rem]">Gerencie os tipos de serviços oferecidos pela sua empresa.</p>
          <Link href="/configuracao/tipos-servico" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm w-xs text-center">
            Acessar Cadastro
          </Link>
        </Card>

        <Card className="hover:border-indigo-200 transition-colors shadow-sm">
          <h2 className="text-2xl font-semibold mb-4 text-slate-800">Cadastrar Status do Serviço</h2>
          <p className="text-slate-600 mb-6 min-h-[3rem]">Defina as etapas do fluxo de trabalho das ordens de serviço.</p>
          <Link href="/configuracao/status-servico" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors shadow-sm w-xs text-center">
            Acessar Cadastro
          </Link>
        </Card>
      </div>
    </div>
  );
}

