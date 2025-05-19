#!/bin/bash

# NarrFlow-Web3 部署脚本
# 此脚本从GitHub克隆项目并完成生产环境部署

# 设置错误处理
set -e
trap 'echo "错误: 命令 \"$BASH_COMMAND\" 在行 $LINENO 失败，退出码: $?"; exit 1' ERR

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 打印带颜色的消息
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具是否安装
check_prerequisites() {
  log_info "检查必要的工具..."
  
  # 检查Node.js
  if ! command -v node &> /dev/null; then
    log_error "Node.js未安装，请安装Node.js 18+版本"
    exit 1
  fi
  
  # 检查npm
  if ! command -v npm &> /dev/null; then
    log_error "npm未安装，请安装npm"
    exit 1
  fi
  
  # 检查pnpm
  if ! command -v pnpm &> /dev/null; then
    log_warning "pnpm未安装，正在安装pnpm..."
    npm install -g pnpm
  fi
  
  # 检查pm2
  if ! command -v pm2 &> /dev/null; then
    log_warning "pm2未安装，正在安装pm2..."
    npm install -g pm2
  fi
  
  # 检查git
  if ! command -v git &> /dev/null; then
    log_error "git未安装，请安装git"
    exit 1
  fi
  
  # 检查sui (可选)
  if ! command -v sui &> /dev/null; then
    log_warning "Sui CLI未安装，如需部署合约请安装Sui CLI"
  fi
  
  log_success "所有必要工具已就绪"
}

# 克隆仓库
clone_repository() {
  log_info "克隆NarrFlow-Web3仓库..."
  
  # 如果目录已存在，询问是否删除
  if [ -d "NarrFlow-Web3" ]; then
    read -p "NarrFlow-Web3目录已存在，是否删除并重新克隆? (y/n): " answer
    if [ "$answer" = "y" ]; then
      rm -rf NarrFlow-Web3
    else
      log_info "使用现有目录"
      return
    fi
  fi
  
  git clone https://github.com/DudeGuuud/NarrFlow-Web3.git
  cd NarrFlow-Web3
  log_success "仓库克隆完成"
}

# 创建环境变量文件
create_env_file() {
  log_info "创建环境变量文件..."
  
  # 检查是否已存在.env文件
  if [ -f ".env" ]; then
    read -p ".env文件已存在，是否覆盖? (y/n): " answer
    if [ "$answer" != "y" ]; then
      log_info "保留现有.env文件"
      return
    fi
  fi
  
  # 提示用户输入必要的环境变量
  read -p "输入PACKAGE_ID (默认: 0xa47599a6525da242f712bec2601dceab88f4785c6f549bb412eee30f15ed623d): " PACKAGE_ID
  PACKAGE_ID=${PACKAGE_ID:-"0xa47599a6525da242f712bec2601dceab88f4785c6f549bb412eee30f15ed623d"}
  
  read -p "输入STORYBOOK_ID (默认: 0x67cea7bae77db8331e56858125809f578d46b17156e8ad5aaf5bb44a3bea416d): " STORYBOOK_ID
  STORYBOOK_ID=${STORYBOOK_ID:-"0x67cea7bae77db8331e56858125809f578d46b17156e8ad5aaf5bb44a3bea416d"}
  
  read -p "输入TREASURY_ID (默认: 0xffca3c14c8273a07dccdd84b3c35529ad796063814eb031d2cdd6b66b6b079e9): " TREASURY_ID
  TREASURY_ID=${TREASURY_ID:-"0xffca3c14c8273a07dccdd84b3c35529ad796063814eb031d2cdd6b66b6b079e9"}
  
  read -p "输入SUI_NETWORK (testnet/mainnet, 默认: testnet): " SUI_NETWORK
  SUI_NETWORK=${SUI_NETWORK:-"testnet"}
  
  read -p "输入SUPABASE_URL: " SUPABASE_URL
  if [ -z "$SUPABASE_URL" ]; then
    log_error "SUPABASE_URL不能为空"
    create_env_file
    return
  fi
  
  read -p "输入SUPABASE_KEY (前端API Key): " SUPABASE_KEY
  if [ -z "$SUPABASE_KEY" ]; then
    log_error "SUPABASE_KEY不能为空"
    create_env_file
    return
  fi
  
  read -p "输入SUPABASE_SERVICE_KEY (服务角色Key): " SUPABASE_SERVICE_KEY
  if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    log_error "SUPABASE_SERVICE_KEY不能为空"
    create_env_file
    return
  fi
  
  read -p "输入ADMIN_PRIVATE_KEY (管理员钱包私钥): " ADMIN_PRIVATE_KEY
  if [ -z "$ADMIN_PRIVATE_KEY" ]; then
    log_error "ADMIN_PRIVATE_KEY不能为空"
    create_env_file
    return
  fi
  
  read -p "输入VOTING_COUNTDOWN_SECONDS (默认: 300): " VOTING_COUNTDOWN_SECONDS
  VOTING_COUNTDOWN_SECONDS=${VOTING_COUNTDOWN_SECONDS:-"300"}
  
  read -p "输入VOTE_THRESHOLD (默认: 10): " VOTE_THRESHOLD
  VOTE_THRESHOLD=${VOTE_THRESHOLD:-"10"}
  
  read -p "输入PORT (默认: 3001): " PORT
  PORT=${PORT:-"3001"}
  
  # 创建.env文件
  cat > .env << EOF
# 区块链配置
VITE_PACKAGE_ID=${PACKAGE_ID}
VITE_STORYBOOK_ID=${STORYBOOK_ID}
VITE_TREASURY_ID=${TREASURY_ID}
VITE_SUI_NETWORK=${SUI_NETWORK}

# 数据库配置
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_KEY=${SUPABASE_KEY}
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_KEY=${SUPABASE_SERVICE_KEY}

# 后端配置
PORT=${PORT}
VOTING_COUNTDOWN_SECONDS=${VOTING_COUNTDOWN_SECONDS}
VOTE_THRESHOLD=${VOTE_THRESHOLD}

# 管理员钱包私钥
ADMIN_PRIVATE_KEY=${ADMIN_PRIVATE_KEY}
EOF

  log_success ".env文件创建完成"
}

# 设置Supabase数据库
setup_database() {
  log_info "设置Supabase数据库..."
  
  read -p "是否需要设置Supabase数据库表? (y/n): " answer
  if [ "$answer" != "y" ]; then
    log_info "跳过数据库设置"
    return
  fi
  
  log_info "请在Supabase控制台中执行以下SQL语句:"
  cat << 'EOF'
-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建投票会话表
CREATE TABLE IF NOT EXISTS public.voting_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('title', 'paragraph')),
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'failed')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建提案表
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('title', 'paragraph')),
  votes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建投票表
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  voter TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(voter)
);

-- 创建提案统计表
CREATE TABLE IF NOT EXISTS public.proposal_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author TEXT NOT NULL UNIQUE,
  proposals_submitted INTEGER NOT NULL DEFAULT 0,
  proposals_won INTEGER NOT NULL DEFAULT 0,
  votes_received INTEGER NOT NULL DEFAULT 0,
  tokens_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 创建允许服务角色完全访问的策略
CREATE POLICY "允许服务角色完全访问投票会话" ON public.voting_sessions USING (auth.role() = 'service_role');
CREATE POLICY "允许服务角色完全访问提案" ON public.proposals USING (auth.role() = 'service_role');
CREATE POLICY "允许服务角色完全访问投票" ON public.votes USING (auth.role() = 'service_role');
CREATE POLICY "允许服务角色完全访问提案统计" ON public.proposal_stats USING (auth.role() = 'service_role');
EOF

  read -p "SQL语句已执行完成? (y/n): " answer
  if [ "$answer" = "y" ]; then
    log_success "数据库设置完成"
  else
    log_warning "数据库设置未完成，请手动完成设置"
  fi
}

# 安装依赖并构建前端
build_frontend() {
  log_info "安装前端依赖并构建..."
  
  # 安装依赖
  pnpm install
  
  # 构建前端
  pnpm build
  
  log_success "前端构建完成"
}

# 构建后端
build_backend() {
  log_info "构建后端..."
  
  # 进入server目录
  cd server
  
  # 安装依赖
  npm install
  
  # 构建后端
  npm run build
  
  # 返回根目录
  cd ..
  
  log_success "后端构建完成"
}

# 部署后端服务
deploy_backend() {
  log_info "部署后端服务..."
  
  # 进入server目录
  cd server
  
  # 使用PM2启动后端服务
  pm2 delete narrflow-backend 2>/dev/null || true
  pm2 start dist/index.js --name "narrflow-backend"
  
  # 保存PM2配置
  pm2 save
  
  # 设置PM2开机自启
  pm2 startup
  
  # 返回根目录
  cd ..
  
  log_success "后端服务部署完成"
}

# 部署前端
deploy_frontend() {
  log_info "部署前端..."
  
  read -p "选择前端部署方式: 1) Nginx 2) serve: " deploy_method
  
  case $deploy_method in
    1)
      deploy_frontend_nginx
      ;;
    2)
      deploy_frontend_serve
      ;;
    *)
      log_error "无效的选择"
      deploy_frontend
      ;;
  esac
}

# 使用Nginx部署前端
deploy_frontend_nginx() {
  log_info "使用Nginx部署前端..."
  
  # 检查Nginx是否安装
  if ! command -v nginx &> /dev/null; then
    log_warning "Nginx未安装，正在安装..."
    sudo apt-get update
    sudo apt-get install -y nginx
  fi
  
  # 创建Nginx配置
  sudo tee /etc/nginx/sites-available/narrflow.conf > /dev/null << EOF
server {
    listen 80;
    server_name _;
    
    location / {
        root $(pwd)/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:${PORT}/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
  
  # 启用配置
  sudo ln -sf /etc/nginx/sites-available/narrflow.conf /etc/nginx/sites-enabled/
  
  # 测试Nginx配置
  sudo nginx -t
  
  # 重启Nginx
  sudo systemctl restart nginx
  
  log_success "前端已通过Nginx部署"
}

# 使用serve部署前端
deploy_frontend_serve() {
  log_info "使用serve部署前端..."
  
  # 检查serve是否安装
  if ! command -v serve &> /dev/null; then
    log_warning "serve未安装，正在安装..."
    npm install -g serve
  fi
  
  # 使用PM2启动serve
  pm2 delete narrflow-frontend 2>/dev/null || true
  pm2 start serve --name "narrflow-frontend" -- -s dist -l ${PORT}
  
  # 保存PM2配置
  pm2 save
  
  log_success "前端已通过serve部署"
}

# 部署智能合约 (可选)
deploy_contract() {
  log_info "部署智能合约..."
  
  read -p "是否需要部署智能合约? (y/n): " answer
  if [ "$answer" != "y" ]; then
    log_info "跳过智能合约部署"
    return
  fi
  
  # 检查Sui CLI是否安装
  if ! command -v sui &> /dev/null; then
    log_error "Sui CLI未安装，无法部署合约"
    return
  fi
  
  # 进入合约目录
  cd move
  
  # 编译合约
  sui move build
  
  # 部署合约
  read -p "输入gas预算 (默认: 100000000): " gas_budget
  gas_budget=${gas_budget:-"100000000"}
  
  sui client publish --gas-budget $gas_budget
  
  # 返回根目录
  cd ..
  
  log_success "智能合约部署完成"
}

# 设置定时任务
setup_cron() {
  log_info "设置定时任务..."
  
  read -p "是否需要设置定时任务? (y/n): " answer
  if [ "$answer" != "y" ]; then
    log_info "跳过定时任务设置"
    return
  fi
  
  # 创建定时任务脚本
  cat > check_voting.sh << 'EOF'
#!/bin/bash
curl -s http://localhost:3001/api/voting-sessions/check
EOF
  
  chmod +x check_voting.sh
  
  # 添加到crontab
  (crontab -l 2>/dev/null; echo "* * * * * $(pwd)/check_voting.sh") | crontab -
  
  log_success "定时任务设置完成"
}

# 显示部署信息
show_deployment_info() {
  log_info "部署信息:"
  echo "========================================"
  echo "前端URL: http://localhost:80"
  echo "后端API: http://localhost:${PORT}/api"
  echo "健康检查: http://localhost:${PORT}/api/health"
  echo "========================================"
  echo "PM2进程:"
  pm2 list
  echo "========================================"
  log_success "NarrFlow-Web3部署完成!"
}

# 主函数
main() {
  log_info "开始部署NarrFlow-Web3..."
  
  check_prerequisites
  clone_repository
  create_env_file
  setup_database
  build_frontend
  build_backend
  deploy_backend
  deploy_frontend
  deploy_contract
  setup_cron
  show_deployment_info
}

# 执行主函数
main
