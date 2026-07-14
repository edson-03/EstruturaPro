# 🚀 Guia de Deploy em VPS — EstruturaPRO

Este guia detalha o passo a passo completo para colocar a plataforma **EstruturaPRO** no ar em um servidor VPS (Virtual Private Server), garantindo segurança, performance e criptografia SSL (HTTPS) gratuita.

---

## 📋 Pré-requisitos

1. **Servidor VPS**: Qualquer VPS rodando Linux (recomendado **Ubuntu 22.04 LTS** ou superior).
2. **Domínio**: Um domínio ou subdomínio (ex: `estruturapro.suainstituicao.edu.br` ou `estruturas.seudominio.com`) apontado para o endereço IP público da sua VPS via registro DNS tipo `A`.
3. **Docker & Docker Compose**: Instalados na VPS.
4. **Projeto Supabase**: Uma conta/projeto ativo no [Supabase](https://supabase.com).

---

## 🛠️ Passo 1: Configuração do Banco de Dados (Supabase)

O **EstruturaPRO** utiliza o Supabase como banco de dados em nuvem. Para configurar a estrutura:

1. Acesse o painel do seu projeto no **Supabase**.
2. No menu lateral esquerdo, vá em **SQL Editor** e clique em **New query**.
3. Abra o arquivo [supabase_schema.sql](file:///c:/Users/EDSON/OneDrive/Área de Trabalho/Projeto de Estrutura/supabase_schema.sql) que está na raiz do seu projeto local, copie todo o seu conteúdo e cole-o no SQL Editor do Supabase.
4. Clique em **Run** (Executar). Esse script irá criar todas as tabelas necessárias (`profiles`, `modules`, `activities`, `student_progress`, `student_answers`, `activity_logs`, `settings`) e as permissões de segurança básicas.

---

## 🔑 Passo 2: Configuração das Credenciais do Cliente

Antes de empacotar a aplicação, você deve fornecer as chaves públicas do Supabase para que a plataforma saiba onde salvar o progresso dos alunos.

1. No Supabase, vá em **Project Settings** (Configurações do Projeto) > **API**.
2. Copie a **Project API URL** e a **`anon` `public` key**.
3. Na pasta do seu projeto local (ou na VPS), localize o arquivo `js/config.example.js` e renomeie-o para **`js/config.js`** (este arquivo está no `.gitignore` e não deve ser enviado ao Git público para evitar expor as chaves).
4. Abra o `js/config.js` e insira as credenciais copiadas:

```javascript
// js/config.js
window.SUPABASE_URL = 'https://seu-projeto.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX...';
```

---

## 🐳 Passo 3: Deploy utilizando Docker & Docker Compose (Recomendado)

O uso de Docker simplifica o deploy pois empacota o servidor web Nginx otimizado e os arquivos estáticos dentro de um ambiente isolado.

### 1. Clonando ou Enviando os Arquivos para a VPS

Você pode clonar o seu repositório Git diretamente na VPS ou transferir os arquivos via SCP/SFTP:

```bash
# Exemplo clonando repositório na VPS
git clone https://github.com/seu-usuario/projeto-estrutura.git /var/www/estruturapro
cd /var/www/estruturapro
```

> [!IMPORTANT]
> Lembre-se de criar o arquivo `js/config.js` diretamente na VPS dentro da pasta `js/` com as chaves reais de produção obtidas no Passo 2!

### 2. Rodando o Script de Deploy Automático

Nós criamos um script para automatizar a build e inicialização dos containers. Dê permissão de execução e execute-o:

```bash
chmod +x deploy.sh
./deploy.sh
```

O script irá validar a presença das credenciais, parar instâncias antigas se houver, compilar o Nginx com a compressão e regras de cache e colocar a aplicação no ar em segundo plano.

### 3. Gerenciamento Básico (Docker Compose)

Caso queira gerenciar os containers manualmente na VPS, utilize os comandos padrão:

*   **Verificar status**: `docker compose ps`
*   **Ver logs em tempo real**: `docker compose logs -f`
*   **Parar aplicação**: `docker compose down`
*   **Reconstruir após alterar arquivos**: `docker compose up -d --build`

---

## 🔒 Passo 4: Configuração de Domínio e SSL (HTTPS) com Let's Encrypt

Para garantir que as senhas e o progresso dos alunos trafeguem de forma criptografada, é fundamental utilizar HTTPS. O método mais limpo na VPS é utilizar um **Proxy Reverso** com Nginx instalado diretamente no host.

### 1. Porta no Docker Compose

Por padrão, o `docker-compose.yml` já expõe o container apenas em `127.0.0.1:8080`, deixando as portas 80 e 443 livres no host VPS para o Nginx gerenciador de SSL. Não é necessário alterar nada — se quiser expor a porta 80 diretamente (sem proxy reverso, sem HTTPS), troque para `"80:80"` por sua conta e risco.

### 2. Instalar Nginx e Certbot no Host VPS

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### 3. Configurar Bloco do Servidor no Nginx

Crie um arquivo de configuração para o seu domínio:

```bash
sudo nano /etc/nginx/sites-available/estruturapro
```

Cole a seguinte configuração (substituindo `seu-dominio.com` pelo seu domínio real):

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ative o site e reinicie o Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/estruturapro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. Obter Certificado SSL Gratuito

Execute o Certbot para obter o certificado Let's Encrypt e configurar automaticamente o HTTPS no Nginx:

```bash
sudo certbot --nginx -d seu-dominio.com
```

Siga as instruções na tela (digite seu e-mail e concorde com os termos). O Certbot irá alterar a configuração do Nginx automaticamente e configurar a renovação automática de 90 dias do certificado.

Pronto! Acesse `https://seu-dominio.com` e sua plataforma estará online, segura e extremamente veloz.

---

## 📁 Passo 5: Deploy Tradicional (Sem Docker)

Se preferir não usar Docker e servir os arquivos diretamente por um Nginx rodando no host:

1. Instale o Nginx na VPS (`sudo apt install nginx -y`).
2. Mova todos os arquivos do projeto (garantindo que o `js/config.js` esteja configurado) para a pasta `/var/www/estruturapro`:
   ```bash
   sudo mkdir -p /var/www/estruturapro
   sudo cp -r * /var/www/estruturapro/
   sudo chown -R www-data:www-data /var/www/estruturapro
   ```
3. Crie a configuração no Nginx (`/etc/nginx/sites-available/estruturapro`):
   ```nginx
   server {
       listen 80;
       server_name seu-dominio.com;
       root /var/www/estruturapro;
       index index.html;

       location / {
           try_files $uri $uri/ =404;
       }

       # Copie as regras de compressão gzip e cabeçalhos de segurança do nginx.conf do projeto aqui.
   }
   ```
4. Ative e reinicie o Nginx, em seguida rode o comando do Certbot (`sudo certbot --nginx -d seu-dominio.com`) conforme explicado anteriormente.
