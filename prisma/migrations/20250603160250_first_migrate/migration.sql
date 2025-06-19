-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" TEXT NOT NULL,
    "tipo_pessoa" "TipoPessoa" NOT NULL,
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
    "data_cadastro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "tipos_servico" (
    "id_tipo_servico" TEXT NOT NULL,
    "nome_tipo_servico" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "tipos_servico_pkey" PRIMARY KEY ("id_tipo_servico")
);

-- CreateTable
CREATE TABLE "status_servico" (
    "id_status_servico" TEXT NOT NULL,
    "nome_status" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER,

    CONSTRAINT "status_servico_pkey" PRIMARY KEY ("id_status_servico")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id_servico" TEXT NOT NULL,
    "id_cliente" TEXT NOT NULL,
    "id_tipo_servico" TEXT NOT NULL,
    "descricao_problema" TEXT NOT NULL,
    "equipamento_descricao" TEXT,
    "equipamento_marca" TEXT,
    "equipamento_modelo" TEXT,
    "equipamento_num_serie" TEXT,
    "data_entrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_previsao_saida" TIMESTAMP(3),
    "data_efetiva_saida" TIMESTAMP(3),
    "id_status_atual" TEXT NOT NULL,
    "valor_servico" DOUBLE PRECISION DEFAULT 0.0,
    "valor_pecas" DOUBLE PRECISION DEFAULT 0.0,
    "valor_mao_de_obra" DOUBLE PRECISION DEFAULT 0.0,
    "descricao_solucao" TEXT,
    "observacoes_internas" TEXT,
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id_servico")
);

-- CreateTable
CREATE TABLE "historico_servico" (
    "id_historico_servico" TEXT NOT NULL,
    "id_servico" TEXT NOT NULL,
    "id_status_anterior" TEXT,
    "id_status_novo" TEXT NOT NULL,
    "data_alteracao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacao" TEXT,

    CONSTRAINT "historico_servico_pkey" PRIMARY KEY ("id_historico_servico")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_id_tipo_servico_fkey" FOREIGN KEY ("id_tipo_servico") REFERENCES "tipos_servico"("id_tipo_servico") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_id_status_atual_fkey" FOREIGN KEY ("id_status_atual") REFERENCES "status_servico"("id_status_servico") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_servico" ADD CONSTRAINT "historico_servico_id_servico_fkey" FOREIGN KEY ("id_servico") REFERENCES "servicos"("id_servico") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_servico" ADD CONSTRAINT "historico_servico_id_status_anterior_fkey" FOREIGN KEY ("id_status_anterior") REFERENCES "status_servico"("id_status_servico") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_servico" ADD CONSTRAINT "historico_servico_id_status_novo_fkey" FOREIGN KEY ("id_status_novo") REFERENCES "status_servico"("id_status_servico") ON DELETE RESTRICT ON UPDATE CASCADE;
