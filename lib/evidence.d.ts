import type { EvidenceInput } from './knowledge.js';
export interface EvidenceClaim extends EvidenceInput {
    /** 摘要为转述时，另给原文片段以便核验；不持久化原文。 */
    quote?: string;
    artifactPath?: string;
}
export interface EvidenceContext {
    sessionsRoot: string;
    projectId?: string;
    workspaceRoot?: string;
    /** 本地文件只在宿主执行上下文的工作区内读取。 */
    cwd?: string;
}
/** 核验失败保留 claimed 和原因；永远不以模型提供的 hash、verification 或用户角色为准。 */
export declare function verifyEvidence(claim: EvidenceClaim, context: EvidenceContext): EvidenceInput;
