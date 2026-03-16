#!/bin/bash
source ~/.bashrc 
# =================================================================
# Agent Vegas 1.0 - 自动化部署脚本
# =================================================================

# 1. 确保在正确的目录下执行
PROJECT_DIR=$(pwd)
echo "🚀 开始部署 Agent Vegas 1.0..."
echo "📍 当前目录: $PROJECT_DIR"

# 2. 从 Git 拉取最新代码
echo "📥 正在从 Git 拉取最新代码..."
git pull origin main

# 3. 安装依赖 (生产环境建议使用 clean-install)
echo "📦 正在安装依赖..."
npm install

# 4. 创建技能文件公共服务软连接
echo "🔗 正在更新 llm.md 与 llm.txt 的软连接..."
ln -sf ../.agents/skills/agent-vegas/SKILL.md public/llm.md
ln -sf ../.agents/skills/agent-vegas/SKILL.md public/llm.txt

# 5. 构建项目 (Nuxt 4 / Nitro)
echo "🏗️ 正在构建生产环境版本 (nuxt build)..."
npm run build

# 6. 检查 PM2 是否正在运行并重启
# 使用 reload 而不是 restart 可以实现更平滑的切换
echo "🔄 正在重启 PM2 进程..."
if pm2 list | grep -q "agent-vegas"; then
    echo "✅ 发现正在运行的应用，正在执行平滑重载..."
    pm2 reload ecosystem.config.cjs --env production
else
    echo "⚠️ 未发现正在运行的应用，正在启动新进程..."
    pm2 start ecosystem.config.cjs --env production
fi

# 7. 保存 PM2 状态（防止服务器重启后不自启）
pm2 save

echo "✨ 部署完成！Agent Vegas 1.0 已经成功更新并上线。"
echo "📈 执行 'pm2 status' 查看运行状态。"
