export enum TipoPessoa {
  FISICA = "FISICA",
  JURIDICA = "JURIDICA",
}

export interface Cliente {
  id_cliente?: string;
  tipo_pessoa: TipoPessoa;
  nome_completo?: string | null;
  cpf?: string | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cnpj?: string | null;
  inscricao_estadual?: string | null;
  inscricao_municipal?: string | null;
  nome_contato_pj?: string | null;
  telefone_principal: string;
  telefone_secundario?: string | null;
  email: string;
  cep?: string | null;
  rua?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado_uf?: string | null;
  observacoes?: string | null;
  data_cadastro?: string; // ISOString
  data_atualizacao?: string; // ISOString
  ativo?: boolean;
}

export interface TipoServico {
  id_tipo_servico: string;
  nome_tipo_servico: string;
  descricao?: string | null;
}

export interface StatusServico {
  id_status_servico: string;
  nome_status: string;
  descricao?: string | null;
  ordem?: number | null;
}

export interface HistoricoServico {
  id_historico_servico: string;
  id_servico: string;
  id_status_anterior?: string | null;
  status_anterior?: { nome_status: string } | null;
  id_status_novo: string;
  status_novo: { nome_status: string };
  data_alteracao: string; // ISOString
  observacao?: string | null;
}

export interface Servico {
  id_servico?: string; // OS - Ordem de Serviço
  id_cliente: string;
  cliente?: Cliente; // Para exibição
  id_tipo_servico: string;
  tipo_servico?: TipoServico; // Para exibição
  descricao_problema: string;
  equipamento_descricao?: string | null;
  equipamento_marca?: string | null;
  equipamento_modelo?: string | null;
  equipamento_num_serie?: string | null;
  data_entrada?: string; // ISOString
  data_previsao_saida?: string | null; // ISOString
  data_efetiva_saida?: string | null; // ISOString
  id_status_atual: string;
  status_atual?: StatusServico; // Para exibição
  valor_servico?: number | null;
  valor_pecas?: number | null;
  valor_mao_de_obra?: number | null;
  descricao_solucao?: string | null;
  observacoes_internas?: string | null;
  data_criacao?: string; // ISOString
  data_atualizacao?: string; // ISOString
  historico?: HistoricoServico[];
}

export interface PaginatedResponse<T> {
  data: T[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

