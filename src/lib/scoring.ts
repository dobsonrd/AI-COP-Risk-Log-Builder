export function calcScore(impact: number | null, likelihood: number | null): number | null {
  if (!impact || !likelihood) return null;
  return impact * likelihood;
}

export function calcDelta(pre: number | null, post: number | null): number | null {
  if (!pre || post === null) return null;
  return Math.round(((post - pre) / pre) * 100);
}

export function scoreTagClass(score: number | null): string {
  if (score === null) return 'nhsuk-tag--grey';
  if (score <= 4) return 'nhsuk-tag--green';
  if (score <= 9) return 'nhsuk-tag--yellow';
  if (score <= 16) return 'nhsuk-tag--orange';
  return 'nhsuk-tag--red';
}

export function scoreLabel(score: number | null): string {
  if (score === null) return 'Not scored';
  if (score <= 4) return 'Low';
  if (score <= 9) return 'Medium';
  if (score <= 16) return 'High';
  return 'Critical';
}
