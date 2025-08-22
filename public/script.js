class HandDrawingApp {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.templateCanvas = document.getElementById('templateCanvas');
        this.fingerCanvas = document.getElementById('fingerCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.templateCtx = this.templateCanvas.getContext('2d');
        this.fingerCtx = this.fingerCanvas.getContext('2d');
        this.clearBtn = document.getElementById('clearBtn');
        this.toggleCameraBtn = document.getElementById('toggleCamera');
        this.colorPicker = document.getElementById('colorPicker');
        this.includeTemplate = document.getElementById('includeTemplate');
        // 默认不勾选包含轮廓
        this.includeTemplate.checked = false;
        this.toggleInstructionsBtn = document.getElementById('toggleInstructions');
        this.closeInstructionsBtn = document.getElementById('closeInstructions');
        this.instructions = document.getElementById('instructions');
        this.toggleTemplatesBtn = document.getElementById('toggleTemplates');
        this.closeTemplatesBtn = document.getElementById('closeTemplates');
        this.templatesModal = document.getElementById('templatesModal');
        this.brushTool = document.getElementById('brushTool');
        this.eraserTool = document.getElementById('eraserTool');
        this.saveBtn = document.getElementById('saveBtn');
        this.cameraPlaceholder = document.getElementById('cameraPlaceholder');
        
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.cameraActive = false;
        this.canvasSize = { width: 1000, height: 750 };
        this.currentTool = 'brush'; // 'brush' 或 'eraser'
        
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        // 先初始化canvas尺寸，然后创建camera
        this.initCanvasSize();
        
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                await this.hands.send({image: this.video});
            },
            width: this.canvasSize.width,
            height: this.canvasSize.height
        });
        window.addEventListener('resize', () => this.handleResize());
        
        this.initHands();
        this.initEventListeners();
        this.initCanvas();
        
        // 初始化时显示占位符，隐藏canvas
        this.showPlaceholder();
        this.hideCanvas();
    }
    
    initHands() {
        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.hands.onResults((results) => {
            this.onHandResults(results);
        });
    }
    
    initEventListeners() {
        this.clearBtn.addEventListener('click', () => {
            this.clearCanvas();
        });
        
        this.saveBtn.addEventListener('click', () => {
            this.saveCanvas();
        });
        
        this.toggleCameraBtn.addEventListener('click', () => {
            this.toggleCamera();
        });
        
        // 工具选择
        this.brushTool.addEventListener('click', () => {
            this.selectTool('brush');
        });
        
        this.eraserTool.addEventListener('click', () => {
            this.selectTool('eraser');
        });
        
        // 颜色选择
        this.colorPicker.addEventListener('change', (e) => {
            this.setColor(e.target.value);
        });
        
        // 基本颜色选择
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const color = e.target.dataset.color;
                this.setColor(color);
                this.colorPicker.value = color;
                this.updateColorButtons(color);
            });
        });
        
        // 画笔大小按钮选择
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const size = parseInt(e.target.dataset.size);
                this.setBrushSize(size);
                this.updateSizeButtons(e.target);
            });
        });
        
        this.toggleInstructionsBtn.addEventListener('click', () => {
            this.showInstructions();
        });
        
        this.closeInstructionsBtn.addEventListener('click', () => {
            this.hideInstructions();
        });
        
        // 点击遮罩层关闭使用说明
        this.instructions.addEventListener('click', (e) => {
            if (e.target === this.instructions) {
                this.hideInstructions();
            }
        });
        
        // 模板相关事件监听器
        this.toggleTemplatesBtn.addEventListener('click', () => {
            this.showTemplates();
        });
        
        this.closeTemplatesBtn.addEventListener('click', () => {
            this.hideTemplates();
        });
        
        // 点击遮罩层关闭模板选择
        this.templatesModal.addEventListener('click', (e) => {
            if (e.target === this.templatesModal) {
                this.hideTemplates();
            }
        });
        
        // 模板选择事件
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const template = e.currentTarget.dataset.template;
                this.loadTemplate(template);
                this.hideTemplates();
            });
        });
    }
    
    initCanvas() {
        this.ctx.strokeStyle = this.colorPicker.value;
        this.ctx.lineWidth = 8; // 默认中等大小
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalCompositeOperation = 'source-over';
        
        // 初始化颜色按钮状态
        this.updateColorButtons(this.colorPicker.value);
    }
    
    initCanvasSize() {
        // 获取canvas容器的实际显示尺寸
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // 计算合适的canvas尺寸（保持4:3比例）
        const maxWidth = rect.width - 40; // 留一些边距
        const maxHeight = rect.height - 40;
        
        let width = maxWidth;
        let height = (width * 3) / 4;
        
        if (height > maxHeight) {
            height = maxHeight;
            width = (height * 4) / 3;
        }
        
        this.canvasSize = { width: Math.floor(width), height: Math.floor(height) };
        
        // 设置canvas的实际尺寸
        this.canvas.width = this.canvasSize.width;
        this.canvas.height = this.canvasSize.height;
        this.templateCanvas.width = this.canvasSize.width;
        this.templateCanvas.height = this.canvasSize.height;
        this.fingerCanvas.width = this.canvasSize.width;
        this.fingerCanvas.height = this.canvasSize.height;
        
        // 设置视频尺寸以匹配canvas
        this.video.style.width = this.canvasSize.width + 'px';
        this.video.style.height = this.canvasSize.height + 'px';
        
        // 重新初始化画布样式
        this.initCanvas();
        
        // 调试信息（可选）
        console.log('Canvas尺寸:', this.canvasSize);
        console.log('视频尺寸:', this.video.style.width, 'x', this.video.style.height);
    }
    
    handleResize() {
        this.initCanvasSize();
        
        // 如果摄像头正在运行，重新启动以使用新的尺寸
        if (this.cameraActive) {
            this.camera.stop().then(() => {
                this.camera = new Camera(this.video, {
                    onFrame: async () => {
                        await this.hands.send({image: this.video});
                    },
                    width: this.canvasSize.width,
                    height: this.canvasSize.height
                });
                this.camera.start();
            });
        }
    }
    
    async toggleCamera() {
        if (this.cameraActive) {
            await this.camera.stop();
            this.cameraActive = false;
            this.toggleCameraBtn.textContent = '摄像头';
            this.showPlaceholder();
            this.hideCanvas();
        } else {
            // 确保使用当前的canvas尺寸
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    await this.hands.send({image: this.video});
                },
                width: this.canvasSize.width,
                height: this.canvasSize.height
            });
            
            await this.camera.start();
            this.cameraActive = true;
            this.toggleCameraBtn.textContent = '关闭';
            this.hidePlaceholder();
            this.showCanvas();
        }
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        this.templateCtx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        this.clearFingerPoint();
        // 重置画布样式
        this.initCanvas();
        // 清除当前模板
        this.currentTemplate = null;
    }
    
    onHandResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // 检查landmarks数据是否完整
            if (!landmarks || landmarks.length < 21) {
                this.isDrawing = false;
                this.clearFingerPoint();
                return;
            }
            
            const indexFinger = landmarks[8]; // 食指指尖
            
            // 检查关键点是否存在
            if (!indexFinger || typeof indexFinger.x === 'undefined') {
                this.isDrawing = false;
                this.clearFingerPoint();
                return;
            }
            
            // 将MediaPipe坐标转换为画布坐标
            const x = indexFinger.x * this.canvasSize.width;
            const y = indexFinger.y * this.canvasSize.height;
            
            // 检查是否应该开始画图（拇指和食指捏合）
            const shouldDraw = this.shouldStartDrawing(landmarks);
            
            if (shouldDraw) {
                if (!this.isDrawing) {
                    this.isDrawing = true;
                    this.lastX = x;
                    this.lastY = y;
                }
                
                // 画线
                this.ctx.beginPath();
                this.ctx.moveTo(this.lastX, this.lastY);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                
                this.lastX = x;
                this.lastY = y;
            } else {
                this.isDrawing = false;
            }
            
            // 在食指头位置显示圆点（在fingerCanvas上）
            this.drawFingerPoint(x, y, shouldDraw);
        } else {
            this.isDrawing = false;
            // 清除圆点
            this.clearFingerPoint();
        }
    }
    
    shouldStartDrawing(landmarks) {
        // 检查landmarks数据是否完整
        if (!landmarks || landmarks.length < 21) {
            return false;
        }
        
        // 获取拇指和食指的关键点
        const thumbTip = landmarks[4];      // 拇指尖
        const thumbIP = landmarks[3];       // 拇指第二关节
        const indexTip = landmarks[8];      // 食指尖
        const indexPIP = landmarks[6];      // 食指第二关节
        
        // 检查关键点是否存在
        if (!thumbTip || !thumbIP || !indexTip || !indexPIP) {
            return false;
        }
        
        // 计算拇指和食指之间的距离
        const distance = this.calculateDistance(thumbTip, indexTip);
        
        // 计算拇指和食指各自的长度作为参考
        const thumbLength = this.calculateDistance(thumbTip, thumbIP);
        const indexLength = this.calculateDistance(indexTip, indexPIP);
        
        // 调整阈值，让检测更宽松（从0.5改为0.8）
        const threshold = Math.min(thumbLength, indexLength) * 0.8;
        
        return distance < threshold;
    }
    
    calculateDistance(point1, point2) {
        // 检查点是否存在且有效
        if (!point1 || !point2 || 
            typeof point1.x === 'undefined' || typeof point2.x === 'undefined' ||
            typeof point1.y === 'undefined' || typeof point2.y === 'undefined' ||
            typeof point1.z === 'undefined' || typeof point2.z === 'undefined') {
            return 0;
        }
        
        const dx = point1.x - point2.x;
        const dy = point1.y - point2.y;
        const dz = point1.z - point2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    drawFingerPoint(x, y, isDrawing) {
        // 清除之前的圆点
        this.clearFingerPoint();
        
        // 保存当前画布状态
        this.fingerCtx.save();
        
        // 设置圆点样式
        if (isDrawing) {
            // 画图时显示红色圆点
            this.fingerCtx.fillStyle = '#ff0000';
            this.fingerCtx.strokeStyle = '#ffffff';
            this.fingerCtx.lineWidth = 2;
        } else {
            // 未画图时显示蓝色圆点
            this.fingerCtx.fillStyle = '#0066ff';
            this.fingerCtx.strokeStyle = '#ffffff';
            this.fingerCtx.lineWidth = 2;
        }
        
        // 绘制圆点
        this.fingerCtx.beginPath();
        this.fingerCtx.arc(x, y, 8, 0, 2 * Math.PI);
        this.fingerCtx.fill();
        this.fingerCtx.stroke();
        
        // 恢复画布状态
        this.fingerCtx.restore();
    }
    
    clearFingerPoint() {
        this.fingerCtx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
    }
    
    showInstructions() {
        this.instructions.classList.add('show');
    }
    
    hideInstructions() {
        this.instructions.classList.remove('show');
    }
    
    showPlaceholder() {
        this.cameraPlaceholder.classList.remove('content-hidden');
    }
    
    hidePlaceholder() {
        this.cameraPlaceholder.classList.add('content-hidden');
    }
    
    showCanvas() {
        this.canvas.style.opacity = '1';
        this.templateCanvas.style.opacity = '1';
        this.fingerCanvas.style.opacity = '1';
        this.video.style.opacity = '1';
    }
    
    hideCanvas() {
        this.canvas.style.opacity = '0';
        this.templateCanvas.style.opacity = '0';
        this.fingerCanvas.style.opacity = '0';
        this.video.style.opacity = '0';
    }
    
    selectTool(tool) {
        this.currentTool = tool;
        
        // 更新工具按钮状态
        this.brushTool.classList.toggle('active', tool === 'brush');
        this.eraserTool.classList.toggle('active', tool === 'eraser');
        
        // 根据工具设置画布属性
        if (tool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
        }
    }
    
    setColor(color) {
        this.ctx.strokeStyle = color;
        this.updateColorButtons(color);
    }
    
    updateColorButtons(selectedColor) {
        // 移除所有active状态
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 为匹配的颜色添加active状态
        document.querySelectorAll('.color-btn').forEach(btn => {
            if (btn.dataset.color === selectedColor) {
                btn.classList.add('active');
            }
        });
    }
    
    saveCanvas() {
        // 创建临时canvas来合并所有图层
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = this.canvasSize.width;
        tempCanvas.height = this.canvasSize.height;
        
        // 先填充白色背景
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        
        // 翻转画布内容
        tempCtx.scale(-1, 1);
        tempCtx.translate(-this.canvasSize.width, 0);
        
        // 根据用户选择决定是否包含模板轮廓
        if (this.includeTemplate.checked && this.currentTemplate) {
            // 先绘制模板轮廓
            this.drawTemplateToContext(tempCtx, this.currentTemplate);
        }
        
        // 绘制主画布
        tempCtx.drawImage(this.canvas, 0, 0);
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = `hand-drawing-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        link.href = tempCanvas.toDataURL();
        
        // 触发下载
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // 模板相关方法
    showTemplates() {
        this.templatesModal.classList.add('show');
    }
    
    hideTemplates() {
        this.templatesModal.classList.remove('show');
    }
    
    loadTemplate(templateName) {
        // 清除当前画布
        this.clearCanvas();
        
        // 根据模板名称绘制简笔画
        this.drawTemplate(templateName);
    }
    
    drawTemplate(templateName) {
        const centerX = this.canvasSize.width / 2;
        const centerY = this.canvasSize.height / 2;
        // 再增大一倍，现在占画面的大部分
        const scale = Math.min(this.canvasSize.width, this.canvasSize.height) / 100;
        
        // 清除模板画布
        this.templateCtx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        
        // 设置线条样式
        this.templateCtx.strokeStyle = '#000000';
        this.templateCtx.lineWidth = 2;
        this.templateCtx.globalCompositeOperation = 'source-over';
        
        switch(templateName) {
            case 'cat':
                this.drawCatToTemplate(centerX, centerY, scale);
                break;
            case 'dog':
                this.drawDogToTemplate(centerX, centerY, scale);
                break;
            case 'bird':
                this.drawBirdToTemplate(centerX, centerY, scale);
                break;
            case 'fish':
                this.drawFishToTemplate(centerX, centerY, scale);
                break;
            case 'flower':
                this.drawFlowerToTemplate(centerX, centerY, scale);
                break;
            case 'tree':
                this.drawTreeToTemplate(centerX, centerY, scale);
                break;
            case 'butterfly':
                this.drawButterflyToTemplate(centerX, centerY, scale);
                break;
            case 'house':
                this.drawHouseToTemplate(centerX, centerY, scale);
                break;
        }
        
        // 保存当前模板名称
        this.currentTemplate = templateName;
    }
    
    drawCat(x, y, scale) {
        this.ctx.beginPath();
        // 猫头
        this.ctx.arc(x, y - 30 * scale, 25 * scale, 0, Math.PI * 2);
        // 耳朵
        this.ctx.moveTo(x - 15 * scale, y - 45 * scale);
        this.ctx.lineTo(x - 25 * scale, y - 60 * scale);
        this.ctx.lineTo(x - 10 * scale, y - 50 * scale);
        this.ctx.moveTo(x + 15 * scale, y - 45 * scale);
        this.ctx.lineTo(x + 25 * scale, y - 60 * scale);
        this.ctx.lineTo(x + 10 * scale, y - 50 * scale);
        // 身体
        this.ctx.moveTo(x - 20 * scale, y - 5 * scale);
        this.ctx.quadraticCurveTo(x, y + 20 * scale, x + 20 * scale, y - 5 * scale);
        // 尾巴
        this.ctx.moveTo(x + 20 * scale, y - 5 * scale);
        this.ctx.quadraticCurveTo(x + 40 * scale, y - 15 * scale, x + 35 * scale, y + 5 * scale);
        this.ctx.stroke();
        
        // 眼睛和鼻子
        this.ctx.beginPath();
        this.ctx.arc(x - 8 * scale, y - 35 * scale, 3 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 8 * scale, y - 35 * scale, 3 * scale, 0, Math.PI * 2);
        this.ctx.arc(x, y - 25 * scale, 2 * scale, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawDog(x, y, scale) {
        this.ctx.beginPath();
        // 狗头
        this.ctx.arc(x, y - 30 * scale, 30 * scale, 0, Math.PI * 2);
        // 耳朵
        this.ctx.moveTo(x - 20 * scale, y - 50 * scale);
        this.ctx.quadraticCurveTo(x - 30 * scale, y - 70 * scale, x - 15 * scale, y - 60 * scale);
        this.ctx.moveTo(x + 20 * scale, y - 50 * scale);
        this.ctx.quadraticCurveTo(x + 30 * scale, y - 70 * scale, x + 15 * scale, y - 60 * scale);
        // 身体
        this.ctx.moveTo(x - 25 * scale, y);
        this.ctx.quadraticCurveTo(x, y + 30 * scale, x + 25 * scale, y);
        // 尾巴
        this.ctx.moveTo(x + 25 * scale, y);
        this.ctx.quadraticCurveTo(x + 45 * scale, y - 10 * scale, x + 40 * scale, y + 10 * scale);
        this.ctx.stroke();
        
        // 眼睛和鼻子
        this.ctx.beginPath();
        this.ctx.arc(x - 10 * scale, y - 35 * scale, 4 * scale, 0, Math.PI * 2);
        this.ctx.arc(x + 10 * scale, y - 35 * scale, 4 * scale, 0, Math.PI * 2);
        this.ctx.arc(x, y - 25 * scale, 3 * scale, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawBird(x, y, scale) {
        this.ctx.beginPath();
        // 鸟身
        this.ctx.ellipse(x, y, 20 * scale, 15 * scale, 0, 0, Math.PI * 2);
        // 翅膀
        this.ctx.moveTo(x - 15 * scale, y - 10 * scale);
        this.ctx.quadraticCurveTo(x - 25 * scale, y - 20 * scale, x - 20 * scale, y - 5 * scale);
        // 尾巴
        this.ctx.moveTo(x + 15 * scale, y);
        this.ctx.lineTo(x + 25 * scale, y - 10 * scale);
        this.ctx.lineTo(x + 25 * scale, y + 10 * scale);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // 眼睛和嘴巴
        this.ctx.beginPath();
        this.ctx.arc(x - 5 * scale, y - 5 * scale, 2 * scale, 0, Math.PI * 2);
        this.ctx.moveTo(x + 5 * scale, y);
        this.ctx.lineTo(x + 10 * scale, y - 2 * scale);
        this.ctx.stroke();
        this.ctx.fill();
    }
    
    drawFish(x, y, scale) {
        this.ctx.beginPath();
        // 鱼身
        this.ctx.ellipse(x, y, 25 * scale, 15 * scale, 0, 0, Math.PI * 2);
        // 尾巴
        this.ctx.moveTo(x + 20 * scale, y);
        this.ctx.lineTo(x + 35 * scale, y - 15 * scale);
        this.ctx.lineTo(x + 35 * scale, y + 15 * scale);
        this.ctx.closePath();
        this.ctx.stroke();
        
        // 眼睛
        this.ctx.beginPath();
        this.ctx.arc(x - 10 * scale, y - 5 * scale, 3 * scale, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawFlower(x, y, scale) {
        this.ctx.beginPath();
        // 花瓣
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const petalX = x + Math.cos(angle) * 20 * scale;
            const petalY = y + Math.sin(angle) * 20 * scale;
            this.ctx.arc(petalX, petalY, 8 * scale, 0, Math.PI * 2);
        }
        // 花心
        this.ctx.arc(x, y, 5 * scale, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 茎
        this.ctx.beginPath();
        this.ctx.moveTo(x, y + 15 * scale);
        this.ctx.lineTo(x, y + 40 * scale);
        this.ctx.stroke();
        
        // 叶子
        this.ctx.beginPath();
        this.ctx.ellipse(x - 5 * scale, y + 30 * scale, 8 * scale, 3 * scale, Math.PI / 4, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawTree(x, y, scale) {
        this.ctx.beginPath();
        // 树干
        this.ctx.moveTo(x, y + 20 * scale);
        this.ctx.lineTo(x, y - 20 * scale);
        this.ctx.stroke();
        
        // 树冠
        this.ctx.beginPath();
        this.ctx.arc(x, y - 30 * scale, 25 * scale, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 树枝
        this.ctx.beginPath();
        this.ctx.moveTo(x - 10 * scale, y - 10 * scale);
        this.ctx.lineTo(x - 20 * scale, y - 15 * scale);
        this.ctx.moveTo(x + 10 * scale, y - 10 * scale);
        this.ctx.lineTo(x + 20 * scale, y - 15 * scale);
        this.ctx.stroke();
    }
    
    drawButterfly(x, y, scale) {
        this.ctx.beginPath();
        // 左翅膀
        this.ctx.moveTo(x - 5 * scale, y);
        this.ctx.quadraticCurveTo(x - 25 * scale, y - 20 * scale, x - 20 * scale, y);
        this.ctx.quadraticCurveTo(x - 25 * scale, y + 20 * scale, x - 5 * scale, y);
        // 右翅膀
        this.ctx.moveTo(x + 5 * scale, y);
        this.ctx.quadraticCurveTo(x + 25 * scale, y - 20 * scale, x + 20 * scale, y);
        this.ctx.quadraticCurveTo(x + 25 * scale, y + 20 * scale, x + 5 * scale, y);
        this.ctx.stroke();
        
        // 身体
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - 10 * scale);
        this.ctx.lineTo(x, y + 10 * scale);
        this.ctx.stroke();
        
        // 触角
        this.ctx.beginPath();
        this.ctx.moveTo(x - 3 * scale, y - 10 * scale);
        this.ctx.quadraticCurveTo(x - 8 * scale, y - 15 * scale, x - 5 * scale, y - 20 * scale);
        this.ctx.moveTo(x + 3 * scale, y - 10 * scale);
        this.ctx.quadraticCurveTo(x + 8 * scale, y - 15 * scale, x + 5 * scale, y - 20 * scale);
        this.ctx.stroke();
    }
    
    drawHouse(x, y, scale) {
        this.ctx.beginPath();
        // 房子主体
        this.ctx.rect(x - 25 * scale, y - 15 * scale, 50 * scale, 30 * scale);
        // 屋顶
        this.ctx.moveTo(x - 30 * scale, y - 15 * scale);
        this.ctx.lineTo(x, y - 35 * scale);
        this.ctx.lineTo(x + 30 * scale, y - 15 * scale);
        this.ctx.stroke();
        
        // 门
        this.ctx.beginPath();
        this.ctx.rect(x - 8 * scale, y, 16 * scale, 15 * scale);
        this.ctx.stroke();
        
        // 窗户
        this.ctx.beginPath();
        this.ctx.rect(x - 15 * scale, y - 10 * scale, 8 * scale, 8 * scale);
        this.ctx.rect(x + 7 * scale, y - 10 * scale, 8 * scale, 8 * scale);
        this.ctx.stroke();
    }
    
    // 设置画笔大小
    setBrushSize(size) {
        this.ctx.lineWidth = size;
    }
    
    // 更新大小按钮状态
    updateSizeButtons(activeBtn) {
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }
    
    // 绘制模板到指定上下文（用于保存）
    drawTemplateToContext(ctx, templateName) {
        const centerX = this.canvasSize.width / 2;
        const centerY = this.canvasSize.height / 2;
        const scale = Math.min(this.canvasSize.width, this.canvasSize.height) / 100;
        
        // 设置线条样式
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.globalCompositeOperation = 'source-over';
        
        switch(templateName) {
            case 'cat':
                this.drawCatToContext(ctx, centerX, centerY, scale);
                break;
            case 'dog':
                this.drawDogToContext(ctx, centerX, centerY, scale);
                break;
            case 'bird':
                this.drawBirdToContext(ctx, centerX, centerY, scale);
                break;
            case 'fish':
                this.drawFishToContext(ctx, centerX, centerY, scale);
                break;
            case 'flower':
                this.drawFlowerToContext(ctx, centerX, centerY, scale);
                break;
            case 'tree':
                this.drawTreeToContext(ctx, centerX, centerY, scale);
                break;
            case 'butterfly':
                this.drawButterflyToContext(ctx, centerX, centerY, scale);
                break;
            case 'house':
                this.drawHouseToContext(ctx, centerX, centerY, scale);
                break;
        }
    }
    
    // 为每个模板添加绘制到指定上下文的方法
    drawCatToContext(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.arc(x, y - 30 * scale, 25 * scale, 0, Math.PI * 2);
        ctx.moveTo(x - 15 * scale, y - 45 * scale);
        ctx.lineTo(x - 25 * scale, y - 60 * scale);
        ctx.lineTo(x - 10 * scale, y - 50 * scale);
        ctx.moveTo(x + 15 * scale, y - 45 * scale);
        ctx.lineTo(x + 25 * scale, y - 60 * scale);
        ctx.lineTo(x + 10 * scale, y - 50 * scale);
        ctx.moveTo(x - 20 * scale, y - 5 * scale);
        ctx.quadraticCurveTo(x, y + 20 * scale, x + 20 * scale, y - 5 * scale);
        ctx.moveTo(x + 20 * scale, y - 5 * scale);
        ctx.quadraticCurveTo(x + 40 * scale, y - 15 * scale, x + 35 * scale, y + 5 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x - 8 * scale, y - 35 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.arc(x + 8 * scale, y - 35 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.arc(x, y - 25 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawDogToContext(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.arc(x, y - 30 * scale, 30 * scale, 0, Math.PI * 2);
        ctx.moveTo(x - 20 * scale, y - 50 * scale);
        ctx.quadraticCurveTo(x - 30 * scale, y - 70 * scale, x - 15 * scale, y - 60 * scale);
        ctx.moveTo(x + 20 * scale, y - 50 * scale);
        ctx.quadraticCurveTo(x + 30 * scale, y - 70 * scale, x + 15 * scale, y - 60 * scale);
        ctx.moveTo(x - 25 * scale, y);
        ctx.quadraticCurveTo(x, y + 30 * scale, x + 25 * scale, y);
        ctx.moveTo(x + 25 * scale, y);
        ctx.quadraticCurveTo(x + 45 * scale, y - 10 * scale, x + 40 * scale, y + 10 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x - 10 * scale, y - 35 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.arc(x + 10 * scale, y - 35 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.arc(x, y - 25 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawBirdToContext(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.ellipse(x, y, 20 * scale, 15 * scale, 0, 0, Math.PI * 2);
        ctx.moveTo(x - 15 * scale, y - 10 * scale);
        ctx.quadraticCurveTo(x - 25 * scale, y - 20 * scale, x - 20 * scale, y - 5 * scale);
        ctx.moveTo(x + 15 * scale, y);
        ctx.lineTo(x + 25 * scale, y - 10 * scale);
        ctx.lineTo(x + 25 * scale, y + 10 * scale);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x - 5 * scale, y - 5 * scale, 2 * scale, 0, Math.PI * 2);
        ctx.moveTo(x + 5 * scale, y);
        ctx.lineTo(x + 10 * scale, y - 2 * scale);
        ctx.stroke();
        ctx.fill();
    }
    
    drawFishToContext(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.ellipse(x, y, 25 * scale, 15 * scale, 0, 0, Math.PI * 2);
        ctx.moveTo(x + 20 * scale, y);
        ctx.lineTo(x + 35 * scale, y - 15 * scale);
        ctx.lineTo(x + 35 * scale, y + 15 * scale);
        ctx.closePath();
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x - 10 * scale, y - 5 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawFlowerToContext(ctx, x, y, scale) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const petalX = x + Math.cos(angle) * 20 * scale;
            const petalY = y + Math.sin(angle) * 20 * scale;
            ctx.arc(petalX, petalY, 8 * scale, 0, Math.PI * 2);
        }
        ctx.arc(x, y, 5 * scale, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y + 15 * scale);
        ctx.lineTo(x, y + 40 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.ellipse(x - 5 * scale, y + 30 * scale, 8 * scale, 3 * scale, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    drawTreeToContext(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.moveTo(x, y + 20 * scale);
        ctx.lineTo(x, y - 20 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x, y - 30 * scale, 25 * scale, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x - 10 * scale, y - 10 * scale);
        ctx.lineTo(x - 20 * scale, y - 15 * scale);
        ctx.moveTo(x + 10 * scale, y - 10 * scale);
        ctx.lineTo(x + 20 * scale, y - 15 * scale);
        ctx.stroke();
    }
    
    drawButterflyToContext(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.moveTo(x - 5 * scale, y);
        ctx.quadraticCurveTo(x - 25 * scale, y - 20 * scale, x - 20 * scale, y);
        ctx.quadraticCurveTo(x - 25 * scale, y + 20 * scale, x - 5 * scale, y);
        ctx.moveTo(x + 5 * scale, y);
        ctx.quadraticCurveTo(x + 25 * scale, y - 20 * scale, x + 20 * scale, y);
        ctx.quadraticCurveTo(x + 25 * scale, y + 20 * scale, x + 5 * scale, y);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x, y - 10 * scale);
        ctx.lineTo(x, y + 10 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x - 3 * scale, y - 10 * scale);
        ctx.quadraticCurveTo(x - 8 * scale, y - 15 * scale, x - 5 * scale, y - 20 * scale);
        ctx.moveTo(x + 3 * scale, y - 10 * scale);
        ctx.quadraticCurveTo(x + 8 * scale, y - 15 * scale, x + 5 * scale, y - 20 * scale);
        ctx.stroke();
    }
    
    drawHouseToContext(ctx, x, y, scale) {
        ctx.beginPath();
        ctx.rect(x - 25 * scale, y - 15 * scale, 50 * scale, 30 * scale);
        ctx.moveTo(x - 30 * scale, y - 15 * scale);
        ctx.lineTo(x, y - 35 * scale);
        ctx.lineTo(x + 30 * scale, y - 15 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.rect(x - 8 * scale, y, 16 * scale, 15 * scale);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.rect(x - 15 * scale, y - 10 * scale, 8 * scale, 8 * scale);
        ctx.rect(x + 7 * scale, y - 10 * scale, 8 * scale, 8 * scale);
        ctx.stroke();
    }
    
    // 绘制到模板画布的方法
    drawCatToTemplate(x, y, scale) {
        this.templateCtx.beginPath();
        // 猫头 - 向下移动
        this.templateCtx.arc(x, y - 10 * scale, 25 * scale, 0, Math.PI * 2);
        // 耳朵 - 相应调整
        this.templateCtx.moveTo(x - 15 * scale, y - 25 * scale);
        this.templateCtx.lineTo(x - 25 * scale, y - 40 * scale);
        this.templateCtx.lineTo(x - 10 * scale, y - 30 * scale);
        this.templateCtx.moveTo(x + 15 * scale, y - 25 * scale);
        this.templateCtx.lineTo(x + 25 * scale, y - 40 * scale);
        this.templateCtx.lineTo(x + 10 * scale, y - 30 * scale);
        // 身体 - 向下移动
        this.templateCtx.moveTo(x - 20 * scale, y + 15 * scale);
        this.templateCtx.quadraticCurveTo(x, y + 40 * scale, x + 20 * scale, y + 15 * scale);
        // 尾巴 - 相应调整
        this.templateCtx.moveTo(x + 20 * scale, y + 15 * scale);
        this.templateCtx.quadraticCurveTo(x + 40 * scale, y + 5 * scale, x + 35 * scale, y + 25 * scale);
        this.templateCtx.stroke();
        
        // 眼睛和鼻子 - 相应调整
        this.templateCtx.beginPath();
        this.templateCtx.arc(x - 8 * scale, y - 15 * scale, 3 * scale, 0, Math.PI * 2);
        this.templateCtx.arc(x + 8 * scale, y - 15 * scale, 3 * scale, 0, Math.PI * 2);
        this.templateCtx.arc(x, y - 5 * scale, 2 * scale, 0, Math.PI * 2);
        this.templateCtx.fill();
    }
    
    drawDogToTemplate(x, y, scale) {
        this.templateCtx.beginPath();
        // 狗头 - 向下移动
        this.templateCtx.arc(x, y - 10 * scale, 30 * scale, 0, Math.PI * 2);
        // 耳朵 - 相应调整
        this.templateCtx.moveTo(x - 20 * scale, y - 30 * scale);
        this.templateCtx.quadraticCurveTo(x - 30 * scale, y - 50 * scale, x - 15 * scale, y - 40 * scale);
        this.templateCtx.moveTo(x + 20 * scale, y - 30 * scale);
        this.templateCtx.quadraticCurveTo(x + 30 * scale, y - 50 * scale, x + 15 * scale, y - 40 * scale);
        // 身体 - 向下移动
        this.templateCtx.moveTo(x - 25 * scale, y + 20 * scale);
        this.templateCtx.quadraticCurveTo(x, y + 50 * scale, x + 25 * scale, y + 20 * scale);
        // 尾巴 - 相应调整
        this.templateCtx.moveTo(x + 25 * scale, y + 20 * scale);
        this.templateCtx.quadraticCurveTo(x + 45 * scale, y + 10 * scale, x + 40 * scale, y + 30 * scale);
        this.templateCtx.stroke();
        
        // 眼睛和鼻子 - 相应调整
        this.templateCtx.beginPath();
        this.templateCtx.arc(x - 10 * scale, y - 15 * scale, 4 * scale, 0, Math.PI * 2);
        this.templateCtx.arc(x + 10 * scale, y - 15 * scale, 4 * scale, 0, Math.PI * 2);
        this.templateCtx.arc(x, y - 5 * scale, 3 * scale, 0, Math.PI * 2);
        this.templateCtx.fill();
    }
    
    drawBirdToTemplate(x, y, scale) {
        this.templateCtx.beginPath();
        this.templateCtx.ellipse(x, y, 20 * scale, 15 * scale, 0, 0, Math.PI * 2);
        this.templateCtx.moveTo(x - 15 * scale, y - 10 * scale);
        this.templateCtx.quadraticCurveTo(x - 25 * scale, y - 20 * scale, x - 20 * scale, y - 5 * scale);
        this.templateCtx.moveTo(x + 15 * scale, y);
        this.templateCtx.lineTo(x + 25 * scale, y - 10 * scale);
        this.templateCtx.lineTo(x + 25 * scale, y + 10 * scale);
        this.templateCtx.closePath();
        this.templateCtx.stroke();
        
        this.templateCtx.beginPath();
        this.templateCtx.arc(x - 5 * scale, y - 5 * scale, 2 * scale, 0, Math.PI * 2);
        this.templateCtx.moveTo(x + 5 * scale, y);
        this.templateCtx.lineTo(x + 10 * scale, y - 2 * scale);
        this.templateCtx.stroke();
        this.templateCtx.fill();
    }
    
    drawFishToTemplate(x, y, scale) {
        this.templateCtx.beginPath();
        this.templateCtx.ellipse(x, y, 25 * scale, 15 * scale, 0, 0, Math.PI * 2);
        this.templateCtx.moveTo(x + 20 * scale, y);
        this.templateCtx.lineTo(x + 35 * scale, y - 15 * scale);
        this.templateCtx.lineTo(x + 35 * scale, y + 15 * scale);
        this.templateCtx.closePath();
        this.templateCtx.stroke();
        
        this.templateCtx.beginPath();
        this.templateCtx.arc(x - 10 * scale, y - 5 * scale, 3 * scale, 0, Math.PI * 2);
        this.templateCtx.fill();
    }
    
    drawFlowerToTemplate(x, y, scale) {
        this.templateCtx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI * 2) / 6;
            const petalX = x + Math.cos(angle) * 20 * scale;
            const petalY = y + Math.sin(angle) * 20 * scale;
            this.templateCtx.arc(petalX, petalY, 8 * scale, 0, Math.PI * 2);
        }
        this.templateCtx.arc(x, y, 5 * scale, 0, Math.PI * 2);
        this.templateCtx.stroke();
        
        this.templateCtx.beginPath();
        this.templateCtx.moveTo(x, y + 15 * scale);
        this.templateCtx.lineTo(x, y + 40 * scale);
        this.templateCtx.stroke();
        
        this.templateCtx.beginPath();
        this.templateCtx.ellipse(x - 5 * scale, y + 30 * scale, 8 * scale, 3 * scale, Math.PI / 4, 0, Math.PI * 2);
        this.templateCtx.stroke();
    }
    
    drawTreeToTemplate(x, y, scale) {
        this.templateCtx.beginPath();
        this.templateCtx.moveTo(x, y + 20 * scale);
        this.templateCtx.lineTo(x, y - 20 * scale);
        this.templateCtx.stroke();
        
        this.templateCtx.beginPath();
        this.templateCtx.arc(x, y - 30 * scale, 25 * scale, 0, Math.PI * 2);
        this.templateCtx.stroke();
        
        this.templateCtx.beginPath();
        this.templateCtx.moveTo(x - 10 * scale, y - 10 * scale);
        this.templateCtx.lineTo(x - 20 * scale, y - 15 * scale);
        this.templateCtx.moveTo(x + 10 * scale, y - 10 * scale);
        this.templateCtx.lineTo(x + 20 * scale, y - 15 * scale);
        this.templateCtx.stroke();
    }
    
    drawButterflyToTemplate(x, y, scale) {
        this.templateCtx.beginPath();
        this.templateCtx.moveTo(x - 5 * scale, y);
        this.templateCtx.quadraticCurveTo(x - 25 * scale, y - 20 * scale, x - 20 * scale, y);
        this.templateCtx.quadraticCurveTo(x - 25 * scale, y + 20 * scale, x - 5 * scale, y);
        this.templateCtx.moveTo(x + 5 * scale, y);
        this.templateCtx.quadraticCurveTo(x + 25 * scale, y - 20 * scale, x + 20 * scale, y);
        this.templateCtx.quadraticCurveTo(x + 25 * scale, y + 20 * scale, x + 5 * scale, y);
        this.templateCtx.stroke();
        
        this.templateCtx.beginPath();
        this.templateCtx.moveTo(x, y - 10 * scale);
        this.templateCtx.lineTo(x, y + 10 * scale);
        this.templateCtx.stroke();
        
        this.templateCtx.beginPath();
        this.templateCtx.moveTo(x - 3 * scale, y - 10 * scale);
        this.templateCtx.quadraticCurveTo(x - 8 * scale, y - 15 * scale, x - 5 * scale, y - 20 * scale);
        this.templateCtx.moveTo(x + 3 * scale, y - 10 * scale);
        this.templateCtx.quadraticCurveTo(x + 8 * scale, y - 15 * scale, x + 5 * scale, y - 20 * scale);
        this.templateCtx.stroke();
    }
    
    drawHouseToTemplate(x, y, scale) {
        this.templateCtx.beginPath();
        this.templateCtx.rect(x - 25 * scale, y - 15 * scale, 50 * scale, 30 * scale);
        this.templateCtx.moveTo(x - 30 * scale, y - 15 * scale);
        this.templateCtx.lineTo(x, y - 35 * scale);
        this.templateCtx.lineTo(x + 30 * scale, y - 15 * scale);
        this.templateCtx.stroke();
        
        this.templateCtx.beginPath();
        this.templateCtx.rect(x - 8 * scale, y, 16 * scale, 15 * scale);
        this.templateCtx.stroke();
        
        this.templateCtx.beginPath();
        this.templateCtx.rect(x - 15 * scale, y - 10 * scale, 8 * scale, 8 * scale);
        this.templateCtx.rect(x + 7 * scale, y - 10 * scale, 8 * scale, 8 * scale);
        this.templateCtx.stroke();
    }
}

// 当页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new HandDrawingApp();
});
