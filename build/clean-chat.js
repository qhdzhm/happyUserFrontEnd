// 清理重复聊天记录脚本
console.log("清理重复聊天记录...");

const keys = Object.keys(localStorage).filter(k => k.startsWith("chatbot_messages_"));
console.log("找到聊天记录键:", keys);

// 如果同时存在guest和agent的聊天记录，删除guest的
if (keys.includes("chatbot_messages_guest") && keys.includes("chatbot_messages_11")) {
    localStorage.removeItem("chatbot_messages_guest");
    console.log("已删除guest聊天记录");
}

// 检查并清理过长的聊天记录
keys.forEach(key => {
    try {
        const data = localStorage.getItem(key);
        if (data && data.length > 50000) { // 如果聊天记录超过50KB
            console.log(`聊天记录 ${key} 过长 (${data.length} 字符)，建议清理`);
            // 可以选择性地清理或截断
        }
    } catch (e) {
        console.error(`处理聊天记录 ${key} 时出错:`, e);
    }
});

console.log("清理完成");
