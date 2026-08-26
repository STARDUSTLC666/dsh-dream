/**
 * 测试夹具：按官方格式生成“多帧 zstd 拼接的 JSONL”会话文件。
 */
import { zstdCompressSync } from 'node:zlib'

/** 每条记录一帧（模拟 DSH 的追加批），返回拼接后的 Buffer。 */
export function makeSessionFile(lines) {
  const frames = lines.map((line) => zstdCompressSync(Buffer.from(line + '\n', 'utf8')))
  return Buffer.concat(frames)
}

export function makeHeader(id, overrides = {}) {
  return JSON.stringify({ type: 'session', version: 0, id, createdAt: 1786646790597, cwd: 'E:\\demo', delegationDepth: 0, agentPreset: 'code', ...overrides })
}

export function makeEvent(type, seq, data) {
  return JSON.stringify({ type, seq, time: 1786646800000 + seq * 1000, data })
}

/** 一个完整主会话：标题 + 3 轮 + 用户消息 + 助手回应 + 工具调用。 */
export function makeMainSessionLines(id) {
  return [
    makeHeader(id),
    makeEvent('session/title', 0, '帮我修输入法的会话'),
    makeEvent('turn/start', 1, {}),
    makeEvent('user/message', 2, '打不出中文了'),
    makeEvent('tool/call', 3, { name: 'bash' }),
    makeEvent('assistant/message', 4, '已开启兼容模式并重启输入法进程'),
    makeEvent('turn/end', 5, {}),
    makeEvent('turn/start', 6, {}),
    makeEvent('user/message', 7, '还是不行'),
    makeEvent('assistant/message', 8, '建议彻底重启应用'),
    makeEvent('turn/end', 9, {}),
  ]
}
