#!/bin/bash

# 确保在正确的目录中运行
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 检查必要文件是否存在
if [ ! -f "server.js" ]; then
    echo "❌ 错误: 找不到 server.js 文件"
    echo "当前目录: $(pwd)"
    echo "请确保在正确的项目目录中运行此脚本"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

# 设置标题
echo "=========================================="
echo "    手部追踪画图应用 - 启动器"
echo "=========================================="
echo "当前目录: $(pwd)"
echo ""

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到Node.js"
    echo ""
    echo "🔧 是否自动安装Node.js? (y/n)"
    read -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 正在启动自动安装器..."
        if [ -f "./install-node.sh" ]; then
            chmod +x ./install-node.sh
            ./install-node.sh
            # 重新加载环境变量
            source ~/.zshrc 2>/dev/null || source ~/.bashrc 2>/dev/null || source ~/.profile 2>/dev/null
            # 重新检查
            if ! command -v node &> /dev/null; then
                echo "❌ 自动安装失败，请手动安装Node.js"
                echo "访问: https://nodejs.org/"
                echo ""
                echo "按任意键退出..."
                read -n 1
                exit 1
            fi
        else
            echo "❌ 未找到安装脚本，请手动安装Node.js"
            echo "访问: https://nodejs.org/"
            echo ""
            echo "按任意键退出..."
            read -n 1
            exit 1
        fi
    else
        echo "请手动安装Node.js:"
        echo "1. 访问 https://nodejs.org/"
        echo "2. 下载并安装Node.js 16或更高版本"
        echo "3. 重新运行此脚本"
        echo ""
        echo "按任意键退出..."
        read -n 1
        exit 1
    fi
fi

# 检查Node.js版本
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ 错误: Node.js版本过低"
    echo "当前版本: $(node --version)"
    echo "需要版本: 16.0.0 或更高"
    echo ""
    echo "请更新Node.js到最新版本"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

echo "✅ Node.js版本检查通过: $(node --version)"
echo ""

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        echo "按任意键退出..."
        read -n 1
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo ""
fi

echo "🚀 正在启动手部追踪画图应用..."
echo ""
echo "如果浏览器没有自动打开，请手动访问: http://localhost:3000"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

# 启动服务器
node server.js

# 如果服务器异常退出，等待用户按键
echo ""
echo "服务器已停止"
echo "按任意键退出..."
read -n 1
