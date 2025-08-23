#!/bin/bash

echo "=========================================="
echo "    Node.js 自动安装器"
echo "=========================================="
echo ""

# 检查是否已经安装
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 16 ]; then
        echo "✅ Node.js 已安装且版本符合要求: $(node --version)"
        echo "✅ npm 已安装: $(npm --version)"
        echo ""
        echo "按任意键退出..."
        read -n 1
        exit 0
    else
        echo "⚠️ 检测到Node.js版本过低: $(node --version)"
        echo "需要版本: 16.0.0 或更高"
        echo ""
    fi
fi

echo "📦 正在检测系统信息..."

# 检测操作系统
OS=""
ARCH=""
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="darwin"
else
    echo "❌ 不支持的操作系统: $OSTYPE"
    exit 1
fi

# 检测架构
if [[ $(uname -m) == "x86_64" ]]; then
    ARCH="x64"
elif [[ $(uname -m) == "arm64" ]]; then
    ARCH="arm64"
else
    echo "❌ 不支持的架构: $(uname -m)"
    exit 1
fi

echo "✅ 检测到系统: $OS-$ARCH"

# 下载Node.js
NODE_VERSION="18.19.0"
DOWNLOAD_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-${OS}-${ARCH}.tar.gz"
INSTALL_DIR="$HOME/.local/nodejs"

echo "📥 正在下载 Node.js v${NODE_VERSION}..."
echo "下载地址: $DOWNLOAD_URL"

# 保存原始目录
ORIGINAL_DIR=$(pwd)

# 创建临时目录
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

# 下载Node.js
echo "正在下载，请稍候..."
if command -v curl &> /dev/null; then
    curl -L -o nodejs.tar.gz "$DOWNLOAD_URL"
    DOWNLOAD_SUCCESS=$?
elif command -v wget &> /dev/null; then
    wget -O nodejs.tar.gz "$DOWNLOAD_URL"
    DOWNLOAD_SUCCESS=$?
else
    echo "❌ 需要 curl 或 wget 来下载文件"
    echo "请手动安装: https://nodejs.org/"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

if [ $DOWNLOAD_SUCCESS -ne 0 ] || [ ! -f "nodejs.tar.gz" ]; then
    echo "❌ 下载失败"
    echo "请检查网络连接或手动下载: $DOWNLOAD_URL"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

echo "📦 正在解压..."
if ! tar -xzf nodejs.tar.gz; then
    echo "❌ 解压失败"
    echo "请检查下载的文件是否完整"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

# 检查解压后的目录
if [ ! -d "node-v${NODE_VERSION}-${OS}-${ARCH}" ]; then
    echo "❌ 解压后的目录结构不正确"
    echo "请检查下载的文件"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

# 创建安装目录
mkdir -p "$INSTALL_DIR"

# 复制文件
echo "📦 正在安装..."
if ! cp -r node-v${NODE_VERSION}-${OS}-${ARCH}/* "$INSTALL_DIR/"; then
    echo "❌ 安装失败"
    echo "请检查权限或磁盘空间"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

# 添加到PATH
echo "🔧 正在配置环境变量..."

# 检测shell类型
SHELL_CONFIG=""
if [[ "$SHELL" == *"zsh"* ]]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [[ "$SHELL" == *"bash"* ]]; then
    SHELL_CONFIG="$HOME/.bashrc"
else
    SHELL_CONFIG="$HOME/.profile"
fi

# 确保shell配置文件存在
if [ ! -f "$SHELL_CONFIG" ]; then
    echo "⚠️ Shell配置文件不存在: $SHELL_CONFIG"
    echo "正在创建..."
    touch "$SHELL_CONFIG"
fi

# 检查bin目录是否存在
if [ ! -d "$INSTALL_DIR/bin" ]; then
    echo "❌ 安装目录结构不正确，bin目录不存在"
    echo "请检查安装过程"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

# 添加PATH配置
if ! grep -q "$INSTALL_DIR/bin" "$SHELL_CONFIG"; then
    echo "" >> "$SHELL_CONFIG"
    echo "# Node.js 自动安装" >> "$SHELL_CONFIG"
    echo "export PATH=\"$INSTALL_DIR/bin:\$PATH\"" >> "$SHELL_CONFIG"
    echo "✅ 已添加到 $SHELL_CONFIG"
else
    echo "✅ PATH配置已存在"
fi

# 立即生效
export PATH="$INSTALL_DIR/bin:$PATH"

# 验证安装
if ! command -v node &> /dev/null; then
    echo "❌ 安装验证失败，Node.js未找到"
    echo "请手动添加以下路径到PATH: $INSTALL_DIR/bin"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

# 验证npm
if ! command -v npm &> /dev/null; then
    echo "❌ 安装验证失败，npm未找到"
    echo "请检查安装目录: $INSTALL_DIR/bin"
    echo ""
    echo "按任意键退出..."
    read -n 1
    exit 1
fi

echo "✅ Node.js 安装完成!"
echo "📋 版本信息:"
echo "   Node.js: $(node --version)"
echo "   npm: $(npm --version)"
echo ""
echo "💡 提示: 请重新打开终端或运行 'source $SHELL_CONFIG' 使环境变量生效"
echo ""

# 清理临时文件
rm -rf "$TEMP_DIR"

echo "🎉 安装完成！"
echo ""
echo "📋 下一步操作："
echo "1. 重新打开终端或运行: source $SHELL_CONFIG"
echo "2. 进入项目目录: cd \"$ORIGINAL_DIR\""
echo "3. 运行启动脚本: ./start.sh"
echo ""
echo "按任意键退出..."
read -n 1
