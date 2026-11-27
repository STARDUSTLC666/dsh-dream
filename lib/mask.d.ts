/**
 * 隐私脱敏：梦原料与经验入库前对密钥/令牌/凭据打码。
 * 覆盖常见半角与全角绕过写法、Bearer 头、PEM 私钥块与连接串凭据，
 * 宁可保守避免误伤正常文本与 Dream 引用 ID。
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
/** 供测试或审计检查的两宽词字符集导出（内部辅助）。 */
export declare const MASK_WORD_CHARS = "A-Za-z0-9\uFF21-\uFF3A\uFF41-\uFF5A\uFF10-\uFF19";
/** 只认可插件生成的引用形状；不得把任意 *Id / *Hash 字段当作脱敏豁免。 */
export declare function isDreamReference(value: string): boolean;
/** 提取文本中的合法 Dream 公共引用 ID，供显式调用方传入 `maskSecrets(text, refs)` 避免误伤。 */
export declare function extractDreamReferences(text: string): string[];
