/**
 * 隐私脱敏：梦原料入梦前对密钥/令牌/凭据打码。
 * 只处理明显模式与超长高熵串，宁可漏报不误伤正常文本。
 *
 * @module dsh-dream/mask
 */

/** 已知密钥/令牌模式。 */
export const SECRET_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /sk-[A-Za-z0-9_-]{16,}/g, label: '疑似 sk 密钥' },
  { re: /(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{16,}/g, label: '疑似 GitHub 令牌' },
  { re: /github_pat_[A-Za-z0-9_]{16,}/g, label: '疑似 GitHub 细粒度令牌' },
  { re: /gsk_[A-Za-z0-9]{16,}/g, label: '疑似 Groq 密钥' },
  { re: /xox[baprs]-[A-Za-z0-9-]{10,}/g, label: '疑似 Slack 令牌' },
  { re: /AKIA[0-9A-Z]{16}/g, label: '疑似 AWS 访问密钥' },
  { re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g, label: '疑似 JWT' },
]

/** 凭据赋值模式：password/secret/token/apikey = 值。 */
const CRED_ASSIGN = /(password|passwd|secret|token|api[_-]?key)(\s*[:=：]\s*)([^\s"',，。]{6,})/gi

/** 超长高熵串：40+ 位字母数字混合（含大小写或数字）。 */
const LONG_TOKEN = /(?<![A-Za-z0-9])[A-Za-z0-9_\-+/=]{40,}(?![A-Za-z0-9])/g

function looksHighEntropy(text: string): boolean {
  return /[a-z]/.test(text) && (/[A-Z]/.test(text) || /[0-9]/.test(text))
}

/** 对文本做脱敏；无命中时原样返回。 */
export function maskSecrets(text: string): string {
  let out = text
  for (const { re, label } of SECRET_PATTERNS) {
    out = out.replace(re, '[已脱敏·' + label + ']')
  }
  out = out.replace(CRED_ASSIGN, (_m, key, sep) => key + sep + '[已脱敏·凭据]')
  out = out.replace(LONG_TOKEN, (m) => (looksHighEntropy(m) ? '[已脱敏·长令牌]' : m))
  return out
}
