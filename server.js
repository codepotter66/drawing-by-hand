const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 添加一些调试信息
console.log("Starting server...");
console.log("Current directory:", __dirname);
console.log("Public directory:", path.join(__dirname, "public"));

// 静态文件服务
app.use(express.static("public"));

// 根路由
app.get("/", (req, res) => {
    console.log("Root route accessed");
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务运行在 http://localhost:${PORT}`);
});
