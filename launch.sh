#!/bin/bash

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 在终端中运行启动脚本，并确保在正确的目录中执行
osascript -e 'tell application "Terminal" to do script "cd \"'"$SCRIPT_DIR"'\" && ./start.sh"'
