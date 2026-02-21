/**
 * 推送接口封装
 * 我本想让用户自己写post的json请求体，但感觉他们应该不会，只能这样了
 */

const axios = require('axios');

const GG_PUSH_URL = 'http://www.ggsuper.com.cn/push/api/v1/sendMsg3_New.php';
const GG_PUSH_SUCCESS_CODE = '80000000';

function assertRequiredText(name, value) {
    const text = String(value || '').trim();
    if (!text) {
        throw new Error(`${name} 不能为空`);
    }
    return text;
}

/**
 * 发送推送
 * @param {object} payload
 * @param {string} payload.title 必填 推送标题
 * @param {string} payload.msg 必填 推送内容
 * @param {string} payload.token
 * @param {string} [payload.url] 点击跳转链接
 * @param {string} [payload.sender] 发送者
 * @param {number} [payload.issecure=0] 固定值 0
 * @param {string} [payload.endpoint] 自定义接口地址
 * @param {object} [options]
 * @param {number} [options.timeoutMs=10000] 请求超时毫秒
 * @param {string} [options.endpoint] 
 * @returns {Promise<{ok: boolean, code: string, msg: string, raw: any}>}
 */
async function sendGgPushMessage(payload = {}, options = {}) {
    const title = assertRequiredText('title', payload.title);
    const msg = assertRequiredText('msg', payload.msg);
    const token = assertRequiredText('token', payload.token);
    const timeoutMs = Math.max(1000, Number(options.timeoutMs) || 10000);

    const body = {
        title,
        msg,
        token,
        issecure: 0,
    };

    if (payload.url !== undefined && payload.url !== null && String(payload.url).trim()) {
        body.url = String(payload.url).trim();
    }
    if (payload.sender !== undefined && payload.sender !== null && String(payload.sender).trim()) {
        body.sender = String(payload.sender).trim();
    }
    if (payload.issecure !== undefined && payload.issecure !== null) {
        body.issecure = Number(payload.issecure) || 0;
    }

    const endpoint = String(options.endpoint || payload.endpoint || GG_PUSH_URL).trim() || GG_PUSH_URL;
    const response = await axios.post(endpoint, body, {
        timeout: timeoutMs,
        headers: {
            'Content-Type': 'application/json',
        },
        validateStatus: () => true,
    });

    const data = (response && response.data && typeof response.data === 'object')
        ? response.data
        : {};
    const code = String(data.code || '');
    const message = String(data.msg || data.message || '');
    const ok = code === GG_PUSH_SUCCESS_CODE;

    return {
        ok,
        code,
        msg: message,
        raw: data,
    };
}

module.exports = {
    GG_PUSH_URL,
    GG_PUSH_SUCCESS_CODE,
    sendGgPushMessage,
};
