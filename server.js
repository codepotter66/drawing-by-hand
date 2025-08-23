const express = require("express");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;

// 添加一些调试信息
console.log("Starting server...");
console.log("Current directory:", __dirname);
console.log("Public directory:", path.join(__dirname, "public"));

// 静态文件服务 - 确保路径正确
app.use(express.static(path.join(__dirname, "public")));

// 根路由
app.get("/", (req, res) => {
    console.log("Root route accessed");
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 通配符路由 - 处理所有其他请求
app.get("*", (req, res) => {
    console.log("Wildcard route accessed:", req.path);
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务运行在 http://localhost:${PORT}`);
    console.log("正在自动打开浏览器...");
    
    // 自动打开浏览器
    const url = `http://localhost:${PORT}`;
    const platform = process.platform;
    
    let command;
    if (platform === 'darwin') {
        command = `open "${url}"`;
    } else if (platform === 'win32') {
        command = `start "${url}"`;
    } else {
        command = `xdg-open "${url}"`;
    }
    
    exec(command, (error) => {
        if (error) {
            console.log("无法自动打开浏览器，请手动访问:", url);
        } else {
            console.log("浏览器已打开:", url);
        }
    });
});

// 导出app供Vercel使用
module.exports = app;
