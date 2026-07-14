#!/bin/bash
set -euo pipefail

# ==============================================================================
#  EstruturaPRO — Script de Deploy Automático (Docker)
# ==============================================================================

# Cores para logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem Cor

echo -e "${GREEN}⚡ Iniciando processo de build/deploy do EstruturaPRO...${NC}"

# 1. Verificar arquivo de configuração do Supabase
if [ ! -f "js/config.js" ]; then
    echo -e "${YELLOW}⚠️  Aviso: O arquivo 'js/config.js' não foi encontrado!${NC}"
    echo -e "Criando a partir do modelo 'js/config.example.js'..."
    cp js/config.example.js js/config.js
    echo -e "${RED}❌ Por favor, edite o arquivo 'js/config.js' com suas credenciais de produção do Supabase antes de continuar!${NC}"
    exit 1
fi

# Verificar se as chaves ainda estão com o valor padrão do template
if grep -q "SUA_URL_DO_SUPABASE_AQUI" js/config.js; then
    echo -e "${RED}❌ Erro: O arquivo 'js/config.js' ainda contém os valores padrão do template.${NC}"
    echo -e "Insira suas credenciais do Supabase no arquivo antes de rodar o deploy."
    exit 1
fi

# 2. Derrubar container antigo se estiver rodando
if [ -t 0 ]; then
    read -r -p "$(echo -e "${YELLOW}⚠️  Isso vai derrubar o container em produção (se estiver rodando). Continuar? [s/N] ${NC}")" confirm
    if [[ ! "$confirm" =~ ^[sS]$ ]]; then
        echo -e "${YELLOW}Deploy cancelado.${NC}"
        exit 0
    fi
fi

echo -e "${YELLOW}🔄 Parando containers antigos (se houver)...${NC}"
if ! docker compose down; then
    echo -e "${RED}❌ Erro ao parar os containers antigos. Verifique os logs acima.${NC}"
    exit 1
fi

# 3. Construir a imagem Docker
echo -e "${YELLOW}🛠️  Construindo imagem Docker (isso pode levar alguns instantes)...${NC}"
if ! docker compose build --no-cache; then
    echo -e "${RED}❌ Erro ao construir a imagem Docker. Verifique os logs acima.${NC}"
    exit 1
fi

# 4. Iniciar o container em segundo plano
echo -e "${YELLOW}🚀 Iniciando aplicação...${NC}"
if docker compose up -d; then
    echo -e "${GREEN}====================================================${NC}"
    echo -e "${GREEN}✅ Deploy realizado com sucesso!${NC}"
    echo -e "${GREEN}Plataforma ativa e respondendo na porta configurada (ver docker-compose.yml).${NC}"
    echo -e "${GREEN}====================================================${NC}"
    docker compose ps
else
    echo -e "${RED}❌ Falha ao iniciar os containers.${NC}"
    exit 1
fi
