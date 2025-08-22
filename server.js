const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 静态文件服务
app.use(express.static("public"));

// 根路由
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务运行在 http://localhost:${PORT}`);
});
