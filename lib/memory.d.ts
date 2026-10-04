import type { Evidence, Lesson } from './knowledge.js';
/** A retrieval deadline is not a verification result; feedback never renews it. */
export declare function reviewDeadline(lesson: Lesson): number | undefined;
export declare function needsMemoryReview(lesson: Lesson, now?: number): boolean;
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
