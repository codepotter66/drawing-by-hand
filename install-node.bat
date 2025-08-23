@echo off
chcp 65001 >nul
title Node.js 自动安装器

echo ==========================================
echo     Node.js 自动安装器
echo ==========================================
echo.

REM 检查是否已经安装
where node >nul 2>nul
if %errorlevel% equ 0 (
    for /f "tokens=1,2 delims=." %%a in ('node --version') do set NODE_VERSION=%%a
    set NODE_VERSION=%NODE_VERSION:~1%
    if %NODE_VERSION% geq 16 (
        echo ✅ Node.js 已安装且版本符合要求:
        node --version
        echo ✅ npm 已安装:
        npm --version
        echo.
        pause
        exit /b 0
    ) else (
        echo ⚠️ 检测到Node.js版本过低:
        node --version
        echo 需要版本: 16.0.0 或更高
        echo.
    )
)

echo 📦 正在检测系统信息...

REM 检测架构
if "%PROCESSOR_ARCHITECTURE%"=="AMD64" (
    set ARCH=x64
) else (
    set ARCH=x86
)

echo ✅ 检测到系统: Windows-%ARCH%

REM 下载Node.js
set NODE_VERSION=18.19.0
set DOWNLOAD_URL=https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-%ARCH%.zip
set INSTALL_DIR=%USERPROFILE%\.local\nodejs

echo 📥 正在下载 Node.js v%NODE_VERSION%...
echo 下载地址: %DOWNLOAD_URL%

REM 保存原始目录
set ORIGINAL_DIR=%CD%

REM 创建临时目录
set TEMP_DIR=%TEMP%\nodejs-install
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%"
cd /d "%TEMP_DIR%"

REM 下载Node.js
echo 正在下载，请稍候...
powershell -Command "& {try { Invoke-WebRequest -Uri '%DOWNLOAD_URL%' -OutFile 'nodejs.zip' -UseBasicParsing; exit 0 } catch { Write-Host '下载失败: ' + $_.Exception.Message; exit 1 }}"
if %errorlevel% neq 0 (
    echo ❌ 下载失败
    echo 请检查网络连接或手动下载: %DOWNLOAD_URL%
    echo.
    pause
    exit /b 1
)

if not exist "nodejs.zip" (
    echo ❌ 下载文件不存在
    echo 请检查网络连接或手动下载: %DOWNLOAD_URL%
    echo.
    pause
    exit /b 1
)

echo 📦 正在解压...
powershell -Command "& {try { Expand-Archive -Path 'nodejs.zip' -DestinationPath '.' -Force; exit 0 } catch { Write-Host '解压失败: ' + $_.Exception.Message; exit 1 }}"
if %errorlevel% neq 0 (
    echo ❌ 解压失败
    echo 请检查下载的文件是否完整
    echo.
    pause
    exit /b 1
)

REM 检查解压后的目录
if not exist "node-v%NODE_VERSION%-win-%ARCH%" (
    echo ❌ 解压后的目录结构不正确
    echo 请检查下载的文件
    echo.
    pause
    exit /b 1
)

REM 创建安装目录
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM 复制文件
echo 📦 正在安装...
xcopy /s /e /y "node-v%NODE_VERSION%-win-%ARCH%\*" "%INSTALL_DIR%\"
if %errorlevel% neq 0 (
    echo ❌ 安装失败
    echo 请检查权限或磁盘空间
    echo.
    pause
    exit /b 1
)

REM 检查安装目录是否存在
if not exist "%INSTALL_DIR%\node.exe" (
    echo ❌ 安装目录结构不正确，node.exe不存在
    echo 请检查安装过程
    echo.
    pause
    exit /b 1
)

REM 添加到PATH
echo 🔧 正在配置环境变量...

REM 添加到用户PATH
setx PATH "%INSTALL_DIR%;%PATH%"
if %errorlevel% neq 0 (
    echo ⚠️ 无法自动添加到PATH，请手动添加: %INSTALL_DIR%
) else (
    echo ✅ 已添加到系统PATH
)

REM 立即生效
set PATH=%INSTALL_DIR%;%PATH%

REM 验证安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 安装验证失败，Node.js未找到
    echo 请手动添加以下路径到PATH: %INSTALL_DIR%
    echo.
    pause
    exit /b 1
)

REM 验证npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 安装验证失败，npm未找到
    echo 请检查安装目录: %INSTALL_DIR%
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js 安装完成!
echo 📋 版本信息:
echo    Node.js:
"%INSTALL_DIR%\node.exe" --version
echo    npm:
"%INSTALL_DIR%\npm.cmd" --version
echo.

REM 清理临时文件
rmdir /s /q "%TEMP_DIR%"

echo 🎉 安装完成！
echo.
echo 📋 下一步操作：
echo 1. 重新打开命令提示符或运行: set PATH=%INSTALL_DIR%;%%PATH%%
echo 2. 进入项目目录: cd /d "%ORIGINAL_DIR%"
echo 3. 运行启动脚本: start.bat
echo.
pause
