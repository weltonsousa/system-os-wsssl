import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ConfiracoesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-12">Ajuste do Sistema</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Cadastrar Tipo de Serviço</h2>
          <p className="text-gray-600 mb-4">Cadastre o tipo de serviço.</p>
          <Link href="/configuracao/tipos-servico" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Cadastrar
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Cadastrar Status do Serviço</h2>
          <p className="text-gray-600 mb-4">Cadastre o tipo de status.</p>
          <Link href="/configuracao/status-servico" className="inline-block bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            Cadastrar
          </Link>
        </div>

        {/* <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Relatórios</h2>
          <p className="text-gray-600 mb-4">Gere relatórios detalhados sobre os serviços prestados, status, faturamento e outras métricas importantes para o seu negócio.</p>
          <Link href="/relatorios" className="inline-block bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
            Ver Relatórios
          </Link>
        </div> */}
      </div>

      {/* <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">Sobre este Sistema</h3>
        <p className="text-gray-600">
          Este sistema foi desenvolvido para ajudar a WS Service Solutions a gerenciar de forma eficiente seus serviços de informática, desde o cadastro inicial do cliente e do serviço até o acompanhamento do status e a geração de relatórios. Utilize os links acima para navegar pelas principais seções.
        </p>
      </div> */}
    </div>
  );
}

