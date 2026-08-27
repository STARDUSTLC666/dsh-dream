/**
 * 隐私脱敏：梦原料入梦前对密钥/令牌/凭据打码。
 * 只处理明显模式与超长高熵串，宁可漏报不误伤正常文本。
 *
 * @module dsh-dream/mask
 */
/** 已知密钥/令牌模式。 */
export declare const SECRET_PATTERNS: Array<{
    re: RegExp;
    label: string;
}>;
/** 对文本做脱敏；无命中时原样返回。 */
export declare function maskSecrets(text: string): string;
