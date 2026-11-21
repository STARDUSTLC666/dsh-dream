import type { Evidence, Lesson } from './knowledge.js';
import type { LessonObservation } from './automatic-state.js';
/** A model recommendation or an old actor-less record is not human approval. */
export declare function isHumanAccepted(lesson: Lesson): boolean;
/** A retrieval deadline is not a verification result; feedback never renews it. */
export declare function reviewDeadline(lesson: Lesson): number | undefined;
export declare function needsMemoryReview(lesson: Lesson, now?: number): boolean;
export interface ObservationReviewSignal {
    flagged: boolean;
    reason?: string;
    negativeScore: number;
    positiveScore: number;
}
/**
 * Advisory-only signal combining explicit usage feedback and DSH native observations.
 * Never mutates lesson state or overrides human review; highlights lessons needing re-check.
 */
export declare function needsObservationReview(lesson: Pick<Lesson, 'state' | 'feedback'>, observation?: LessonObservation): ObservationReviewSignal;
export interface SimDirectoryUsableItem {
    id: string;
    kind: Lesson['kind'];
    title: string;
    when: string;
    rationale?: string;
    problemKey?: string;
    originModel?: string;
    files?: string[];
    negSignals?: number;
}
export interface SimDirectoryHistoryItem {
    id: string;
    state: 'rejected' | 'stale' | 'disputed';
    title: string;
    reason?: string;
}
export interface SimDirectory {
    usable: SimDirectoryUsableItem[];
    history: SimDirectoryHistoryItem[];
}
/**
 * SIM-style optimizer directory for extraction / review / consolidation:
 * supplies existing accepted rules (with rationale, origin model, files) plus recent
 * rejected/stale attempts (negative memory) within a strict character budget.
 */
export declare function simDirectory(lessons: Lesson[], options?: {
    workspaceRoot?: string;
    projectId?: string;
    observations?: Record<string, LessonObservation>;
    maxChars?: number;
    now?: number;
}): SimDirectory;
/** Derived layers contain pointers; authoritative lessons and evidence remain untouched. */
export declare function memoryDirectory(lessons: Lesson[], evidence: Evidence[], now?: number): {
    summary: {
        lessonId: string;
        title: string;
        scope: {
            projectId?: string;
            workspaceRoot?: string;
            global: boolean;
        };
    }[];
    entries: {
        lessonId: string;
        revision: number;
        title: string;
        topic: import("./knowledge.js").LessonKind;
        scope: {
            projectId?: string;
            workspaceRoot?: string;
            global: boolean;
        };
        state: import("./knowledge.js").LessonState;
        reviewDue: boolean;
        reviewAfter: string | null;
        sources: {
            evidenceId: string;
            sessionId: string | undefined;
            recordSeq: string | number | undefined;
            verification: "read" | "claimed";
        }[];
    }[];
};
