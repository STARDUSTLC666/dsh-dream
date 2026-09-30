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
export declare function maskSecrets(text: string, publicReferences?: readonly string[]): string;
/** 只认可插件生成的引用形状；不得把任意 *Id / *Hash 字段当作脱敏豁免。 */
export declare function isDreamReference(value: string): boolean;
