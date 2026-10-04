import type { Evidence, Lesson } from './knowledge.js'

/** A retrieval deadline is not a verification result; feedback never renews it. */
export function reviewDeadline(lesson: Lesson): number | undefined {
  const explicit = lesson.reviewAfter ? Date.parse(lesson.reviewAfter) : NaN
  const reviewed = Date.parse(lesson.review.at ?? lesson.lastValidatedAt ?? lesson.createdAt)
  const renewed = lesson.review.at ? Date.parse(lesson.review.at) : NaN
  if (Number.isFinite(explicit) && (!Number.isFinite(renewed) || renewed <= explicit)) return explicit
  if (lesson.kind !== 'fact') return undefined
  return Number.isFinite(reviewed) ? reviewed + 30 * 86400000 : undefined
}

export function needsMemoryReview(lesson: Lesson, now = Date.now()): boolean {
  const deadline = reviewDeadline(lesson)
  return lesson.state === 'usable' && deadline !== undefined && deadline <= now
}

/** Derived layers contain pointers; authoritative lessons and evidence remain untouched. */
export function memoryDirectory(lessons: Lesson[], evidence: Evidence[], now = Date.now()) {
  const byId = new Map(evidence.map(item => [item.id, item]))
  const accepted = new Set(lessons.filter(item => item.review.decision === 'accepted').map(item => item.id))
  const entries = lessons.filter(item => item.state !== 'rejected').map(item => ({
    lessonId: item.id, revision: item.revision, title: item.title, topic: item.kind, scope: item.scope,
    state: item.state, reviewDue: needsMemoryReview(item, now),
    reviewAfter: reviewDeadline(item) === undefined ? null : new Date(reviewDeadline(item)!).toISOString(),
    sources: item.evidenceIds.slice(0, 3).flatMap(id => {
      const source = byId.get(id)
      return source ? [{ evidenceId: id, sessionId: source.sessionId, recordSeq: source.recordSeq, verification: source.verification }] : []
    }),
  }))
  let chars = 0
  const summary = entries.filter(item => item.state === 'usable' && !item.reviewDue
    && accepted.has(item.lessonId))
    .slice(0, 12).filter(item => { chars += item.title.length; return chars <= 2400 })
    .map(({ lessonId, title, scope }) => ({ lessonId, title, scope }))
  return { summary, entries }
}
