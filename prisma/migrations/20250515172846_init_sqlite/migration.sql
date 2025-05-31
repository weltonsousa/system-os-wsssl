-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" TEXT NOT NULL PRIMARY KEY,
    "tipo_pessoa" TEXT NOT NULL,
    "nome_completo" TEXT,
    "cpf" TEXT,
    "razao_social" TEXT,
    "nome_fantasia" TEXT,
    "cnpj" TEXT,
    "inscricao_estadual" TEXT,
    "inscricao_municipal" TEXT,
    "nome_contato_pj" TEXT,
    "telefone_principal" TEXT NOT NULL,
    "telefone_secundario" TEXT,
    "email" TEXT NOT NULL,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado_uf" TEXT,
    "observacoes" TEXT,
    "data_cadastro" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "tipos_servico" (
    "id_tipo_servico" TEXT NOT NULL PRIMARY KEY,
    "nome_tipo_servico" TEXT NOT NULL,
    "descricao" TEXT
);

-- CreateTable
CREATE TABLE "status_servico" (
    "id_status_servico" TEXT NOT NULL PRIMARY KEY,
    "nome_status" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER
);

-- CreateTable
CREATE TABLE "servicos" (
    "id_servico" TEXT NOT NULL PRIMARY KEY,
    "id_cliente" TEXT NOT NULL,
    "id_tipo_servico" TEXT NOT NULL,
    "descricao_problema" TEXT NOT NULL,
    "equipamento_descricao" TEXT,
    "equipamento_marca" TEXT,
    "equipamento_modelo" TEXT,
    "equipamento_num_serie" TEXT,
    "data_entrada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_previsao_saida" DATETIME,
    "data_efetiva_saida" DATETIME,
    "id_status_atual" TEXT NOT NULL,
    "valor_servico" REAL DEFAULT 0.0,
    "valor_pecas" REAL DEFAULT 0.0,
    "valor_mao_de_obra" REAL DEFAULT 0.0,
    "descricao_solucao" TEXT,
    "observacoes_internas" TEXT,
    "data_criacao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" DATETIME NOT NULL,
    CONSTRAINT "servicos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes" ("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "servicos_id_tipo_servico_fkey" FOREIGN KEY ("id_tipo_servico") REFERENCES "tipos_servico" ("id_tipo_servico") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "servicos_id_status_atual_fkey" FOREIGN KEY ("id_status_atual") REFERENCES "status_servico" ("id_status_servico") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "historico_servico" (
    "id_historico_servico" TEXT NOT NULL PRIMARY KEY,
    "id_servico" TEXT NOT NULL,
    "id_status_anterior" TEXT,
    "id_status_novo" TEXT NOT NULL,
    "data_alteracao" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,
    CONSTRAINT "historico_servico_id_servico_fkey" FOREIGN KEY ("id_servico") REFERENCES "servicos" ("id_servico") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "historico_servico_id_status_anterior_fkey" FOREIGN KEY ("id_status_anterior") REFERENCES "status_servico" ("id_status_servico") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "historico_servico_id_status_novo_fkey" FOREIGN KEY ("id_status_novo") REFERENCES "status_servico" ("id_status_servico") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cpf_key" ON "clientes"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cnpj_key" ON "clientes"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_email_key" ON "clientes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_servico_nome_tipo_servico_key" ON "tipos_servico"("nome_tipo_servico");

-- CreateIndex
CREATE UNIQUE INDEX "status_servico_nome_status_key" ON "status_servico"("nome_status");
