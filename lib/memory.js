/** A model recommendation or an old actor-less record is not human approval. */
export function isHumanAccepted(lesson) {
    return lesson.state === 'usable' && lesson.review.decision === 'accepted' && lesson.review.actor === 'human';
}
/** A retrieval deadline is not a verification result; feedback never renews it. */
export function reviewDeadline(lesson) {
    const explicit = lesson.reviewAfter ? Date.parse(lesson.reviewAfter) : NaN;
    const reviewed = Date.parse(lesson.review.at ?? lesson.lastValidatedAt ?? lesson.createdAt);
    const renewed = lesson.review.at ? Date.parse(lesson.review.at) : NaN;
    if (Number.isFinite(explicit) && (!Number.isFinite(renewed) || renewed <= explicit))
        return explicit;
    if (lesson.kind !== 'fact')
        return undefined;
    return Number.isFinite(reviewed) ? reviewed + 30 * 86400000 : undefined;
}
export function needsMemoryReview(lesson, now = Date.now()) {
    const deadline = reviewDeadline(lesson);
    return lesson.state === 'usable' && deadline !== undefined && deadline <= now;
}
/**
 * Advisory-only signal combining explicit usage feedback and DSH native observations.
 * Never mutates lesson state or overrides human review; highlights lessons needing re-check.
 */
export function needsObservationReview(lesson, observation) {
    const fbPos = lesson.feedback?.useful ?? 0;
    const fbNeg = lesson.feedback?.notApplicable ?? 0;
    const obsPos = observation?.positive ?? 0;
    const obsNeg = observation?.negative ?? 0;
    const corrections = observation?.corrections ?? 0;
    const positiveScore = fbPos + obsPos;
    const negativeScore = fbNeg + obsNeg + corrections;
    if (lesson.state !== 'usable')
        return { flagged: false, negativeScore, positiveScore };
    if (obsNeg >= 2 && obsNeg >= obsPos) {
        return { flagged: true, reason: 'native-negative-feedback', negativeScore, positiveScore };
    }
    if (fbNeg >= 2 && fbNeg > fbPos) {
        return { flagged: true, reason: 'repeated-not-applicable', negativeScore, positiveScore };
    }
    if (negativeScore >= 3 && negativeScore > positiveScore) {
        return { flagged: true, reason: 'negative-observation-trend', negativeScore, positiveScore };
    }
    return { flagged: false, negativeScore, positiveScore };
}
function normPath(value) {
    const slash = value.trim().replace(/\\/g, '/').replace(/\/+$/, '');
    return /^[a-zA-Z]:/.test(slash) || value.includes('\\') ? slash.toLowerCase() : slash;
}
function scopeMatchesProject(lesson, workspaceRoot, projectId) {
    if (lesson.scope.global === true)
        return true;
    if (projectId && lesson.scope.projectId === projectId)
        return true;
    if (workspaceRoot && lesson.scope.workspaceRoot && normPath(lesson.scope.workspaceRoot) === normPath(workspaceRoot))
        return true;
    return false;
}
/**
 * SIM-style optimizer directory for extraction / review / consolidation:
 * supplies existing accepted rules (with rationale, origin model, files) plus recent
 * rejected/stale attempts (negative memory) within a strict character budget.
 */
export function simDirectory(lessons, options = {}) {
    const maxChars = Math.max(400, Math.min(4000, options.maxChars ?? 2400));
    const now = options.now ?? Date.now();
    const scoped = lessons
        .filter((lesson) => scopeMatchesProject(lesson, options.workspaceRoot, options.projectId))
        .slice()
        .sort((a, b) => (a.updatedAt === b.updatedAt ? a.id.localeCompare(b.id) : b.updatedAt.localeCompare(a.updatedAt)));
    const usable = [];
    const history = [];
    let chars = 32;
    const clip = (text, max) => (text.length > max ? text.slice(0, max - 1) + '…' : text);
    for (const lesson of scoped) {
        if (usable.length >= 16)
            break;
        if (!isHumanAccepted(lesson) || needsMemoryReview(lesson, now))
            continue;
        const sig = needsObservationReview(lesson, options.observations?.[lesson.id]);
        const item = {
            id: lesson.id,
            kind: lesson.kind,
            title: clip(lesson.title, 120),
            when: clip(lesson.when, 100),
            ...(lesson.rationale ? { rationale: clip(lesson.rationale, 140) } : {}),
            ...(lesson.problemKey ? { problemKey: clip(lesson.problemKey, 60) } : {}),
            ...(lesson.origin?.model ? { originModel: lesson.origin.model } : {}),
            ...(lesson.files && lesson.files.length > 0 ? { files: lesson.files.slice(0, 4) } : {}),
            ...(sig.negativeScore > 0 ? { negSignals: sig.negativeScore } : {}),
        };
        const cost = JSON.stringify(item).length + 2;
        if (chars + cost > Math.floor(maxChars * 0.7))
            continue;
        usable.push(item);
        chars += cost;
    }
    for (const lesson of scoped) {
        if (history.length >= 10)
            break;
        if (lesson.state !== 'rejected' && lesson.state !== 'stale' && lesson.state !== 'disputed')
            continue;
        const reason = lesson.review.note ?? lesson.rationale;
        const item = {
            id: lesson.id,
            state: lesson.state,
            title: clip(lesson.title, 120),
            ...(reason ? { reason: clip(reason, 140) } : {}),
        };
        const cost = JSON.stringify(item).length + 2;
        if (chars + cost > maxChars)
            break;
        history.push(item);
        chars += cost;
    }
    return { usable, history };
}
/** Derived layers contain pointers; authoritative lessons and evidence remain untouched. */
export function memoryDirectory(lessons, evidence, now = Date.now()) {
    const byId = new Map(evidence.map(item => [item.id, item]));
    const accepted = new Set(lessons.filter(isHumanAccepted).map(item => item.id));
    const entries = lessons.filter(item => item.state !== 'rejected').map(item => ({
        lessonId: item.id, revision: item.revision, title: item.title, topic: item.kind, scope: item.scope,
        state: item.state, reviewDue: needsMemoryReview(item, now),
        reviewAfter: reviewDeadline(item) === undefined ? null : new Date(reviewDeadline(item)).toISOString(),
        sources: item.evidenceIds.slice(0, 3).flatMap(id => {
            const source = byId.get(id);
            return source ? [{ evidenceId: id, sessionId: source.sessionId, recordSeq: source.recordSeq, verification: source.verification }] : [];
        }),
    }));
    let chars = 0;
    const summary = entries.filter(item => item.state === 'usable' && !item.reviewDue
        && accepted.has(item.lessonId))
        .slice(0, 12).filter(item => { chars += item.title.length; return chars <= 2400; })
        .map(({ lessonId, title, scope }) => ({ lessonId, title, scope }));
    return { summary, entries };
}
