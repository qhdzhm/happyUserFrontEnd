class WebSocketService {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 3000;
        this.listeners = new Map();
        this.sessionId = null;
        this.userId = null;
        
        // WebSocket服务器配置
        this.wsBaseUrl = this.getWebSocketBaseUrl();
    }
    
    // 获取WebSocket基础URL
    getWebSocketBaseUrl() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NODE_ENV === 'production' 
            ? window.location.host 
            : 'localhost:8080';
        return `${protocol}//${host}`;
    }

    // 连接WebSocket
    connect(userId, sessionId) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return;
        }

        this.userId = userId;
        this.sessionId = sessionId;

        try {
            // 构建WebSocket连接URL
            const wsUrl = `${this.wsBaseUrl}/ws/service?userId=${userId}&sessionId=${sessionId}`;
            console.log('正在连接WebSocket:', wsUrl);
            this.socket = new WebSocket(wsUrl);

            this.socket.onopen = () => {
                console.log('WebSocket连接已建立');
                this.reconnectAttempts = 0;
                this.emit('connected');
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.emit('message', data);
                } catch (error) {
                    console.error('解析WebSocket消息失败:', error);
                }
            };

            this.socket.onclose = () => {
                console.log('WebSocket连接已关闭');
                this.emit('disconnected');
                this.handleReconnect();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket错误:', error);
                this.emit('error', error);
            };
        } catch (error) {
            console.error('WebSocket连接失败:', error);
            this.handleReconnect();
        }
    }

    // 断开连接
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.reconnectAttempts = 0;
        this.listeners.clear();
    }

    // 发送消息
    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
            return true;
        } else {
            console.warn('WebSocket未连接，无法发送消息');
            return false;
        }
    }

    // 重连机制
    handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`尝试重连WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                if (this.userId && this.sessionId) {
                    this.connect(this.userId, this.sessionId);
                }
            }, this.reconnectInterval);
        } else {
            console.error('WebSocket重连失败，已达到最大重连次数');
            this.emit('reconnectFailed');
        }
    }

    // 添加事件监听器
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    // 移除事件监听器
    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    // 触发事件
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('WebSocket事件处理器错误:', error);
                }
            });
        }
    }

    // 获取连接状态
    getConnectionState() {
        if (!this.socket) return 'DISCONNECTED';
        
        switch (this.socket.readyState) {
            case WebSocket.CONNECTING:
                return 'CONNECTING';
            case WebSocket.OPEN:
                return 'CONNECTED';
            case WebSocket.CLOSING:
                return 'CLOSING';
            case WebSocket.CLOSED:
                return 'DISCONNECTED';
            default:
                return 'UNKNOWN';
        }
    }
}

// 创建单例实例
const websocketService = new WebSocketService();

export default websocketService; 