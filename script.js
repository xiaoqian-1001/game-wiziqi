class GomokuGame {
    constructor() {
        this.canvas = document.getElementById('gameBoard');
        this.ctx = this.canvas.getContext('2d');
        this.boardSize = 15; // 15x15的棋盘
        this.cellSize = this.canvas.width / (this.boardSize + 1);
        
        // 游戏状态
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1; // 1代表黑子，2代表白子
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        this.blackScore = 0;
        this.whiteScore = 0;
        
        // 最后落子位置
        this.lastMove = null;
        
        this.init();
    }
    
    init() {
        this.drawBoard();
        this.setupEventListeners();
        this.updateDisplay();
    }
    
    drawBoard() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const size = this.boardSize;
        const cellSize = this.cellSize;
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格
        ctx.strokeStyle = '#8B7355';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < size; i++) {
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(cellSize + i * cellSize, cellSize);
            ctx.lineTo(cellSize + i * cellSize, canvas.height - cellSize);
            ctx.stroke();
            
            // 水平线
            ctx.beginPath();
            ctx.moveTo(cellSize, cellSize + i * cellSize);
            ctx.lineTo(canvas.width - cellSize, cellSize + i * cellSize);
            ctx.stroke();
        }
        
        // 绘制星位（天元和星位）
        const starPoints = [
            [3, 3], [3, 7], [3, 11],
            [7, 3], [7, 7], [7, 11],
            [11, 3], [11, 7], [11, 11]
        ];
        
        ctx.fillStyle = '#8B7355';
        starPoints.forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(cellSize + x * cellSize, cellSize + y * cellSize, 4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // 绘制棋子
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (this.board[i][j] !== 0) {
                    this.drawPiece(i, j, this.board[i][j]);
                }
            }
        }
        
        // 高亮最后落子位置
        if (this.lastMove && !this.gameOver) {
            const [x, y] = this.lastMove;
            ctx.strokeStyle = '#FF6B6B';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cellSize + x * cellSize, cellSize + y * cellSize, 12, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    drawPiece(x, y, player) {
        const ctx = this.ctx;
        const cellSize = this.cellSize;
        const centerX = cellSize + x * cellSize;
        const centerY = cellSize + y * cellSize;
        const radius = cellSize * 0.4;
        
        // 绘制阴影
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // 绘制棋子
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        
        if (player === 1) {
            // 黑子
            const gradient = ctx.createRadialGradient(
                centerX - radius/3, centerY - radius/3, radius/10,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(1, '#000');
            ctx.fillStyle = gradient;
        } else {
            // 白子
            const gradient = ctx.createRadialGradient(
                centerX - radius/3, centerY - radius/3, radius/10,
                centerX, centerY, radius
            );
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(1, '#ccc');
            ctx.fillStyle = gradient;
        }
        
        ctx.fill();
        ctx.restore();
        
        // 添加高光效果
        ctx.beginPath();
        ctx.arc(centerX - radius/4, centerY - radius/4, radius/6, 0, Math.PI * 2);
        ctx.fillStyle = player === 1 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
    }
    
    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
    }
    
    handleClick(e) {
        if (this.gameOver) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        const mouseX = (e.clientX - rect.left) * scaleX;
        const mouseY = (e.clientY - rect.top) * scaleY;
        
        // 计算最近的交叉点
        const x = Math.round((mouseX - this.cellSize) / this.cellSize);
        const y = Math.round((mouseY - this.cellSize) / this.cellSize);
        
        // 检查是否在棋盘内
        if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize) return;
        
        // 检查是否已有棋子
        if (this.board[x][y] !== 0) return;
        
        // 落子
        this.placePiece(x, y);
    }
    
    placePiece(x, y) {
        this.board[x][y] = this.currentPlayer;
        this.moveHistory.push({ x, y, player: this.currentPlayer });
        this.lastMove = [x, y];
        
        // 检查胜负
        if (this.checkWin(x, y)) {
            this.gameOver = true;
            this.winner = this.currentPlayer;
            this.updateScore();
            this.showWinner();
        } else if (this.checkDraw()) {
            this.gameOver = true;
            this.winner = 0; // 平局
            this.showWinner();
        } else {
            // 切换玩家
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        }
        
        this.drawBoard();
        this.updateDisplay();
    }
    
    checkWin(x, y) {
        const directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 对角线
            [1, -1]   // 反对角线
        ];
        
        const player = this.board[x][y];
        
        for (let [dx, dy] of directions) {
            let count = 1;
            
            // 正方向检查
            for (let i = 1; i < 5; i++) {
                const newX = x + i * dx;
                const newY = y + i * dy;
                if (newX >= 0 && newX < this.boardSize && 
                    newY >= 0 && newY < this.boardSize && 
                    this.board[newX][newY] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            // 反方向检查
            for (let i = 1; i < 5; i++) {
                const newX = x - i * dx;
                const newY = y - i * dy;
                if (newX >= 0 && newX < this.boardSize && 
                    newY >= 0 && newY < this.boardSize && 
                    this.board[newX][newY] === player) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 5) return true;
        }
        
        return false;
    }
    
    checkDraw() {
        // 检查棋盘是否已满
        for (let i = 0; i < this.boardSize; i++) {
            for (let j = 0; j < this.boardSize; j++) {
                if (this.board[i][j] === 0) return false;
            }
        }
        return true;
    }
    
    updateScore() {
        if (this.winner === 1) {
            this.blackScore++;
            document.getElementById('blackScore').textContent = this.blackScore;
        } else if (this.winner === 2) {
            this.whiteScore++;
            document.getElementById('whiteScore').textContent = this.whiteScore;
        }
    }
    
    showWinner() {
        const messageEl = document.getElementById('winnerMessage');
        if (this.winner === 1) {
            messageEl.textContent = '🎉 黑子获胜！';
            messageEl.style.color = '#333';
        } else if (this.winner === 2) {
            messageEl.textContent = '🎉 白子获胜！';
            messageEl.style.color = '#333';
        } else {
            messageEl.textContent = '🤝 平局！';
            messageEl.style.color = '#667eea';
        }
    }
    
    updateDisplay() {
        const currentPlayerEl = document.getElementById('currentPlayer');
        if (!this.gameOver) {
            if (this.currentPlayer === 1) {
                currentPlayerEl.innerHTML = '⚫ 黑子';
                currentPlayerEl.style.color = '#333';
            } else {
                currentPlayerEl.innerHTML = '⚪ 白子';
                currentPlayerEl.style.color = '#999';
            }
        } else {
            currentPlayerEl.innerHTML = '游戏结束';
            currentPlayerEl.style.color = '#999';
        }
    }
    
    undo() {
        if (this.gameOver || this.moveHistory.length === 0) return;
        
        const lastMove = this.moveHistory.pop();
        this.board[lastMove.x][lastMove.y] = 0;
        this.currentPlayer = lastMove.player;
        
        if (this.moveHistory.length > 0) {
            const prevMove = this.moveHistory[this.moveHistory.length - 1];
            this.lastMove = [prevMove.x, prevMove.y];
        } else {
            this.lastMove = null;
        }
        
        this.drawBoard();
        this.updateDisplay();
    }
    
    restart() {
        this.board = Array(this.boardSize).fill().map(() => Array(this.boardSize).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.winner = null;
        this.moveHistory = [];
        this.lastMove = null;
        
        document.getElementById('winnerMessage').textContent = '';
        
        this.drawBoard();
        this.updateDisplay();
    }
}

// 启动游戏
window.addEventListener('DOMContentLoaded', () => {
    new GomokuGame();
});
