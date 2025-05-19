#!/bin/bash

# NarrFlow-Web3 远程服务器部署脚本
# 此脚本用于在全新的远程服务器上自动部署NarrFlow-Web3项目

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

# 检查是否为root用户
check_root() {
  if [ "$(id -u)" != "0" ]; then
    log_error "此脚本需要root权限运行"
    log_info "请使用 'sudo ./remote_deploy.sh' 重新运行"
    exit 1
  fi
}

# 安装系统依赖
install_system_dependencies() {
  log_info "更新系统并安装必要的系统依赖..."
  
  # 更新系统
  apt-get update
  apt-get upgrade -y
  
  # 安装基本工具
  apt-get install -y curl wget git build-essential nginx
  
  log_success "系统依赖安装完成"
}

# 安装Node.js和npm
install_nodejs() {
  log_info "安装Node.js和npm..."
  
  # 检查Node.js是否已安装
  if command -v node &> /dev/null; then
    local node_version=$(node -v | cut -d 'v' -f 2)
    if [[ "$(echo "$node_version >= 18.0.0" | bc)" -eq 1 ]]; then
      log_info "Node.js v$node_version 已安装，跳过安装"
      return
    fi
  fi
  
  # 安装Node.js 18
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
  
  # 验证安装
  node -v
  npm -v
  
  log_success "Node.js和npm安装完成"
}

# 安装pnpm
install_pnpm() {
  log_info "安装pnpm..."
  
  # 检查pnpm是否已安装
  if command -v pnpm &> /dev/null; then
    log_info "pnpm已安装，跳过安装"
    return
  fi
  
  # 安装pnpm
  npm install -g pnpm
  
  # 验证安装
  pnpm -v
  
  log_success "pnpm安装完成"
}

# 安装PM2
install_pm2() {
  log_info "安装PM2..."
  
  # 检查PM2是否已安装
  if command -v pm2 &> /dev/null; then
    log_info "PM2已安装，跳过安装"
    return
  fi
  
  # 安装PM2
  npm install -g pm2
  
  # 验证安装
  pm2 -v
  
  # 设置PM2开机自启
  pm2 startup
  
  log_success "PM2安装完成"
}

# 克隆仓库
clone_repository() {
  log_info "克隆NarrFlow-Web3仓库..."
  
  # 创建项目目录
  mkdir -p /var/www
  cd /var/www
  
  # 如果目录已存在，删除它
  if [ -d "NarrFlow-Web3" ]; then
    log_warning "NarrFlow-Web3目录已存在，正在删除..."
    rm -rf NarrFlow-Web3
  fi
  
  # 克隆仓库
  git clone https://github.com/DudeGuuud/NarrFlow-Web3.git
  cd NarrFlow-Web3
  
  log_success "仓库克隆完成"
}

# 创建环境变量文件
create_env_file() {
  log_info "创建环境变量文件..."
  
  # 检查是否提供了所有必要的环境变量
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$SUPABASE_SERVICE_KEY" ] || [ -z "$ADMIN_PRIVATE_KEY" ]; then
    log_error "缺少必要的环境变量"
    log_info "请设置以下环境变量后重新运行脚本:"
    log_info "SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY, ADMIN_PRIVATE_KEY"
    exit 1
  fi
  
  # 设置默认值
  PACKAGE_ID=${PACKAGE_ID:-"0xa47599a6525da242f712bec2601dceab88f4785c6f549bb412eee30f15ed623d"}
  STORYBOOK_ID=${STORYBOOK_ID:-"0x67cea7bae77db8331e56858125809f578d46b17156e8ad5aaf5bb44a3bea416d"}
  TREASURY_ID=${TREASURY_ID:-"0xffca3c14c8273a07dccdd84b3c35529ad796063814eb031d2cdd6b66b6b079e9"}
  SUI_NETWORK=${SUI_NETWORK:-"testnet"}
  VOTING_COUNTDOWN_SECONDS=${VOTING_COUNTDOWN_SECONDS:-"300"}
  VOTE_THRESHOLD=${VOTE_THRESHOLD:-"10"}
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

# 构建前端
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
  
  # 返回根目录
  cd ..
  
  log_success "后端服务部署完成"
}

# 配置Nginx
configure_nginx() {
  log_info "配置Nginx..."
  
  # 创建Nginx配置
  cat > /etc/nginx/sites-available/narrflow.conf << EOF
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
  ln -sf /etc/nginx/sites-available/narrflow.conf /etc/nginx/sites-enabled/
  
  # 删除默认配置
  rm -f /etc/nginx/sites-enabled/default
  
  # 测试Nginx配置
  nginx -t
  
  # 重启Nginx
  systemctl restart nginx
  
  log_success "Nginx配置完成"
}

# 设置定时任务
setup_cron() {
  log_info "设置定时任务..."
  
  # 创建定时任务脚本
  cat > /var/www/check_voting.sh << 'EOF'
#!/bin/bash
curl -s http://localhost:3001/api/voting-sessions/check
EOF
  
  chmod +x /var/www/check_voting.sh
  
  # 添加到crontab
  (crontab -l 2>/dev/null | grep -v "check_voting.sh"; echo "* * * * * /var/www/check_voting.sh") | crontab -
  
  log_success "定时任务设置完成"
}

# 设置防火墙
setup_firewall() {
  log_info "配置防火墙..."
  
  # 检查ufw是否安装
  if ! command -v ufw &> /dev/null; then
    apt-get install -y ufw
  fi
  
  # 配置防火墙规则
  ufw allow ssh
  ufw allow http
  ufw allow https
  
  # 启用防火墙
  ufw --force enable
  
  log_success "防火墙配置完成"
}

# 显示部署信息
show_deployment_info() {
  # 获取服务器IP
  SERVER_IP=$(hostname -I | awk '{print $1}')
  
  log_info "部署信息:"
  echo "========================================"
  echo "前端URL: http://${SERVER_IP}"
  echo "后端API: http://${SERVER_IP}/api"
  echo "健康检查: http://${SERVER_IP}/api/health"
  echo "========================================"
  echo "PM2进程:"
  pm2 list
  echo "========================================"
  log_success "NarrFlow-Web3部署完成!"
}

# 主函数
main() {
  log_info "开始部署NarrFlow-Web3..."
  
  check_root
  install_system_dependencies
  install_nodejs
  install_pnpm
  install_pm2
  clone_repository
  create_env_file
  build_frontend
  build_backend
  deploy_backend
  configure_nginx
  setup_cron
  setup_firewall
  show_deployment_info
  
  log_success "NarrFlow-Web3已成功部署到服务器!"
}

# 执行主函数
main
