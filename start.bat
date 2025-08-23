@echo off
chcp 65001 >nul
title 手部追踪画图应用 - 启动器

REM 确保在正确的目录中运行
cd /d "%~dp0"

REM 检查必要文件是否存在
if not exist "server.js" (
    echo ❌ 错误: 找不到 server.js 文件
    echo 当前目录: %CD%
    echo 请确保在正确的项目目录中运行此脚本
    echo.
    pause
    exit /b 1
)

echo ==========================================
echo     手部追踪画图应用 - 启动器
echo ==========================================
echo 当前目录: %CD%
echo.

REM 检查Node.js是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Node.js
    echo.
    echo 🔧 是否自动安装Node.js? (y/n)
    set /p choice=
    if /i "%choice%"=="y" (
        echo 📦 正在启动自动安装器...
        if exist "install-node.bat" (
            call install-node.bat
            REM 重新检查
            where node >nul 2>nul
            if %errorlevel% neq 0 (
                echo ❌ 自动安装失败，请手动安装Node.js
                echo 访问: https://nodejs.org/
                echo.
                pause
                exit /b 1
            )
        ) else (
            echo ❌ 未找到安装脚本，请手动安装Node.js
            echo 访问: https://nodejs.org/
            echo.
            pause
            exit /b 1
        )
    ) else (
        echo 请手动安装Node.js:
        echo 1. 访问 https://nodejs.org/
        echo 2. 下载并安装Node.js 16或更高版本
        echo 3. 重新运行此脚本
        echo.
        pause
        exit /b 1
    )
)

REM 检查Node.js版本
for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
set NODE_VERSION=%NODE_VERSION:~1%
if %NODE_VERSION% lss 16 (
    echo ❌ 错误: Node.js版本过低
    echo 当前版本: 
    node --version
    echo 需要版本: 16.0.0 或更高
    echo.
    echo 请更新Node.js到最新版本
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js版本检查通过:
node --version
echo.

REM 检查依赖是否安装
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

echo 🚀 正在启动手部追踪画图应用...
echo.
echo 如果浏览器没有自动打开，请手动访问: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务器
echo.

REM 启动服务器
node server.js

REM 如果服务器异常退出，等待用户按键
echo.
echo 服务器已停止
pause
