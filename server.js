const express = require("express");
const path = require("path");

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
});

// 导出app供Vercel使用
module.exports = app;
