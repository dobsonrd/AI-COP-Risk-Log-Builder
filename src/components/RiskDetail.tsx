import { useState, useEffect } from 'react';
import { getProject, saveProject } from '../lib/storage';
import { calcScore, calcDelta, scoreTagClass, scoreLabel } from '../lib/scoring';
import type { Risk, Project, InScope, MitigatedStatus, AssuranceStatus, RiskStatus } from '../types';
import Layout from './Layout';

interface Props {
  projectId: string;
  riskId: string;
  onBack: () => void;
}

interface ScoreSelectorProps {
  label: string;
  name: string;
  hint?: string;
  value: number | null;
  onChange: (v: number | null) => void;
}

function ScoreSelector({ label, name, hint, value, onChange }: ScoreSelectorProps) {
  return (
    <div className="nhsuk-form-group">
      <fieldset className="nhsuk-fieldset">
        <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--s">
          <h3 className="nhsuk-fieldset__heading">{label}</h3>
        </legend>
        {hint && <div className="nhsuk-hint">{hint}</div>}
        <div className="nhsuk-radios nhsuk-radios--inline" style={{ gap: '0' }}>
          {[1, 2, 3, 4, 5].map(n => (
            <div key={n} className="nhsuk-radios__item">
              <input
                className="nhsuk-radios__input"
                id={`${name}-${n}`}
                name={name}
                type="radio"
                value={n}
                checked={value === n}
                onChange={() => onChange(value === n ? null : n)}
              />
              <label className="nhsuk-label nhsuk-radios__label" htmlFor={`${name}-${n}`}>
                {n}
              </label>
            </div>
          ))}
        </div>
        {value !== null && (
          <button
            type="button"
            className="nhsuk-button nhsuk-button--secondary nhsuk-button--small nhsuk-u-margin-top-2 nhsuk-u-margin-bottom-0"
            onClick={() => onChange(null)}
          >
            Clear selection
          </button>
        )}
      </fieldset>
    </div>
  );
}

interface RadioGroupProps<T extends string> {
  label: string;
  name: string;
  hint?: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}

function RadioGroup<T extends string>({ label, name, hint, value, onChange, options }: RadioGroupProps<T>) {
  return (
    <div className="nhsuk-form-group">
      <fieldset className="nhsuk-fieldset">
        <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--s">
          <h3 className="nhsuk-fieldset__heading">{label}</h3>
        </legend>
        {hint && <div className="nhsuk-hint">{hint}</div>}
        <div className="nhsuk-radios nhsuk-radios--inline">
          {options.map(o => (
            <div key={o.value} className="nhsuk-radios__item">
              <input
                className="nhsuk-radios__input"
                id={`${name}-${o.value}`}
                name={name}
                type="radio"
                value={o.value}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
              />
              <label className="nhsuk-label nhsuk-radios__label" htmlFor={`${name}-${o.value}`}>
                {o.label}
              </label>
            </div>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export default function RiskDetail({ projectId, riskId, onBack }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const p = getProject(projectId);
    setProject(p);
    setRisk(p?.risks.find(r => r.id === riskId) ?? null);
    setSaved(false);
  }, [projectId, riskId]);

  if (!project || !risk) return null;

  const update = (patch: Partial<Risk>) => {
    setRisk(r => r ? { ...r, ...patch } : r);
    setSaved(false);
  };

  const handleSave = () => {
    if (!project || !risk) return;
    const updated = { ...project, risks: project.risks.map(r => r.id === risk.id ? risk : r) };
    saveProject(updated);
    setProject(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const pre = calcScore(risk.impactScore, risk.preMitigationLikelihood);
  const post = calcScore(risk.impactScore, risk.postMitigationLikelihood);
  const delta = calcDelta(pre, post);

  const riskIdx = project.risks.findIndex(r => r.id === riskId);
  const prevRisk = riskIdx > 0 ? project.risks[riskIdx - 1] : null;
  const nextRisk = riskIdx < project.risks.length - 1 ? project.risks[riskIdx + 1] : null;

  const breadcrumbs = [
    { label: 'Projects', onClick: () => { handleSave(); onBack(); } },
    { label: project.name, onClick: () => { handleSave(); onBack(); } },
    { label: risk.id },
  ];

  return (
    <Layout breadcrumbs={breadcrumbs}>
      {/* Risk header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
          <code style={{ fontSize: '14px', color: '#4c6272', background: '#f0f4f5', padding: '2px 8px', borderRadius: '4px' }}>
            {risk.id}
          </code>
          <strong className="nhsuk-tag nhsuk-tag--blue">{risk.riskModule}</strong>
          <strong className="nhsuk-tag nhsuk-tag--grey">{risk.riskArea}</strong>
          {risk.inScope === 'N' && <strong className="nhsuk-tag nhsuk-tag--red">Out of scope</strong>}
          {risk.assuranceComplete === 'Y' && <strong className="nhsuk-tag nhsuk-tag--aqua-green">Assured</strong>}
        </div>
        <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-1">{risk.riskTitle}</h1>

        {/* System element — inline editable */}
        <div className="nhsuk-form-group nhsuk-u-margin-bottom-0" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <label className="nhsuk-label nhsuk-u-margin-bottom-0 nhsuk-body-s nhsuk-u-secondary-text-color" htmlFor="system-element">
            System element:
          </label>
          <input
            className="nhsuk-input nhsuk-input--width-20"
            id="system-element"
            type="text"
            value={risk.systemElement}
            onChange={e => update({ systemElement: e.target.value })}
            placeholder="e.g. System 1"
          />
        </div>
      </div>

      {saved && (
        <div className="nhsuk-notification-banner nhsuk-notification-banner--success nhsuk-u-margin-bottom-4" role="alert">
          <div className="nhsuk-notification-banner__header">
            <h2 className="nhsuk-notification-banner__title">Success</h2>
          </div>
          <div className="nhsuk-notification-banner__content">
            <p className="nhsuk-body nhsuk-u-margin-bottom-0">Risk saved successfully.</p>
          </div>
        </div>
      )}

      {/* ── Section 1: Risk information ── */}
      <div className="app-section-divider">
        <h2 className="nhsuk-heading-m nhsuk-u-margin-bottom-4">Risk information</h2>
      </div>
      <div className="nhsuk-grid-row nhsuk-u-margin-bottom-2">
        <div className="nhsuk-grid-column-two-thirds">
          <h3 className="nhsuk-heading-s">Unwanted effect</h3>
          <p className="nhsuk-body">{risk.unwantedEffect || '—'}</p>
          <h3 className="nhsuk-heading-s">Cause</h3>
          <p className="nhsuk-body nhsuk-u-margin-bottom-0">{risk.cause || '—'}</p>
        </div>
        <div className="nhsuk-grid-column-one-third">
          <div className="nhsuk-inset-text">
            <span className="nhsuk-u-visually-hidden">Proposed mitigation guidance: </span>
            <h3 className="nhsuk-heading-s nhsuk-u-margin-bottom-1">Proposed mitigations</h3>
            <p className="nhsuk-body-s nhsuk-u-margin-bottom-0">{risk.proposedMitigations || '—'}</p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Pre-mitigation scoring ── */}
      <div className="app-section-divider">
        <h2 className="nhsuk-heading-m nhsuk-u-margin-bottom-4">Pre-mitigation scoring</h2>
      </div>
      <div className="nhsuk-grid-row nhsuk-u-margin-bottom-2">
        <div className="nhsuk-grid-column-one-third">
          <ScoreSelector
            label="Impact score (1–5)"
            name={`impact-${risk.id}`}
            hint="Fixed — not reduced by mitigation. 1 = negligible, 5 = catastrophic."
            value={risk.impactScore}
            onChange={v => update({ impactScore: v })}
          />
        </div>
        <div className="nhsuk-grid-column-one-third">
          <ScoreSelector
            label="Pre-mitigation likelihood (1–5)"
            name={`pre-${risk.id}`}
            hint="Likelihood before any mitigations are applied. 1 = very unlikely, 5 = certain."
            value={risk.preMitigationLikelihood}
            onChange={v => update({ preMitigationLikelihood: v })}
          />
        </div>
        <div className="nhsuk-grid-column-one-third">
          <div className="nhsuk-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div className="nhsuk-card__content nhsuk-u-padding-0">
              <p className="nhsuk-body-s nhsuk-u-secondary-text-color nhsuk-u-margin-bottom-2">Pre-mitigation risk score</p>
              <strong className={`nhsuk-tag ${scoreTagClass(pre)}`} style={{ fontSize: '36px', padding: '10px 20px', display: 'inline-block', marginBottom: '8px' }}>
                {pre ?? '—'}
              </strong>
              <p className="nhsuk-body nhsuk-u-margin-top-2 nhsuk-u-margin-bottom-0" style={{ fontWeight: 700 }}>{scoreLabel(pre)}</p>
              {pre !== null && <p className="nhsuk-body-s nhsuk-u-secondary-text-color nhsuk-u-margin-bottom-0">= {risk.impactScore} × {risk.preMitigationLikelihood}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Mitigations ── */}
      <div className="app-section-divider">
        <h2 className="nhsuk-heading-m nhsuk-u-margin-bottom-4">Mitigations</h2>
      </div>
      <div className="nhsuk-grid-row nhsuk-u-margin-bottom-4">
        <div className="nhsuk-grid-column-one-half">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label nhsuk-label--s" htmlFor="mitigations-in-place">Mitigations in place</label>
            <div className="nhsuk-hint" id="mitigations-hint">Describe what has actually been done to address this risk. Reference supporting evidence where applicable.</div>
            <textarea
              className="nhsuk-textarea"
              id="mitigations-in-place"
              name="mitigations-in-place"
              rows={6}
              aria-describedby="mitigations-hint"
              value={risk.mitigationsInPlace}
              onChange={e => update({ mitigationsInPlace: e.target.value })}
            />
          </div>
        </div>
        <div className="nhsuk-grid-column-one-half">
          <div className="nhsuk-form-group">
            <label className="nhsuk-label nhsuk-label--s" htmlFor="mitigation-review">Mitigation review</label>
            <div className="nhsuk-hint" id="review-hint">Outcome of reviewing the evidence. State whether mitigations are sufficient and note any caveats.</div>
            <textarea
              className="nhsuk-textarea"
              id="mitigation-review"
              name="mitigation-review"
              rows={6}
              aria-describedby="review-hint"
              value={risk.mitigationReview}
              onChange={e => update({ mitigationReview: e.target.value })}
            />
          </div>
        </div>
      </div>
      <div className="nhsuk-grid-row nhsuk-u-margin-bottom-6">
        <div className="nhsuk-grid-column-one-third">
          <ScoreSelector
            label="Post-mitigation likelihood (1–5)"
            name={`post-${risk.id}`}
            hint="Re-assessed likelihood after all mitigations are applied."
            value={risk.postMitigationLikelihood}
            onChange={v => update({ postMitigationLikelihood: v })}
          />
        </div>
        <div className="nhsuk-grid-column-one-third">
          <div className="nhsuk-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div className="nhsuk-card__content nhsuk-u-padding-0">
              <p className="nhsuk-body-s nhsuk-u-secondary-text-color nhsuk-u-margin-bottom-2">Post-mitigation score</p>
              <strong className={`nhsuk-tag ${scoreTagClass(post)}`} style={{ fontSize: '36px', padding: '10px 20px', display: 'inline-block', marginBottom: '8px' }}>
                {post ?? '—'}
              </strong>
              <p className="nhsuk-body nhsuk-u-margin-top-2 nhsuk-u-margin-bottom-0" style={{ fontWeight: 700 }}>{scoreLabel(post)}</p>
              {post !== null && <p className="nhsuk-body-s nhsuk-u-secondary-text-color nhsuk-u-margin-bottom-0">= {risk.impactScore} × {risk.postMitigationLikelihood}</p>}
            </div>
          </div>
        </div>
        <div className="nhsuk-grid-column-one-third">
          {delta !== null ? (
            <div className="nhsuk-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <div className="nhsuk-card__content nhsuk-u-padding-0">
                <p className="nhsuk-body-s nhsuk-u-secondary-text-color nhsuk-u-margin-bottom-2">Score delta</p>
                <strong
                  className={`nhsuk-tag ${delta < 0 ? 'nhsuk-tag--green' : delta > 0 ? 'nhsuk-tag--red' : 'nhsuk-tag--grey'}`}
                  style={{ fontSize: '36px', padding: '10px 20px', display: 'inline-block', marginBottom: '8px' }}
                >
                  {delta > 0 ? '+' : ''}{delta}%
                </strong>
                <p className="nhsuk-body nhsuk-u-margin-top-2 nhsuk-u-margin-bottom-0" style={{ fontWeight: 700 }}>
                  {delta < 0 ? 'Reduction' : delta > 0 ? 'Increase' : 'No change'}
                </p>
              </div>
            </div>
          ) : (
            <p className="nhsuk-body-s nhsuk-u-secondary-text-color" style={{ paddingTop: '8px' }}>
              Score delta will appear once both pre- and post-mitigation likelihoods are set.
            </p>
          )}
        </div>
      </div>

      {/* ── Section 4: Assurance & status ── */}
      <div className="app-section-divider">
        <h2 className="nhsuk-heading-m nhsuk-u-margin-bottom-4">Assurance &amp; status</h2>
      </div>
      <div className="nhsuk-grid-row nhsuk-u-margin-bottom-2">
        <div className="nhsuk-grid-column-one-quarter">
          <RadioGroup<InScope>
            label="Risk in scope?"
            name={`scope-${risk.id}`}
            value={risk.inScope}
            onChange={v => update({ inScope: v })}
            options={[
              { value: 'Y', label: 'Yes — in scope' },
              { value: 'N', label: 'No — descoped' },
            ]}
          />
        </div>
        <div className="nhsuk-grid-column-one-quarter">
          <RadioGroup<MitigatedStatus>
            label="Risk mitigated?"
            name={`mitigated-${risk.id}`}
            value={risk.mitigated}
            onChange={v => update({ mitigated: v })}
            options={[
              { value: 'Y', label: 'Yes' },
              { value: 'P', label: 'Partial' },
              { value: 'N', label: 'No' },
            ]}
          />
        </div>
        <div className="nhsuk-grid-column-one-quarter">
          <RadioGroup<AssuranceStatus>
            label="Assurance complete?"
            name={`assured-${risk.id}`}
            value={risk.assuranceComplete}
            onChange={v => update({ assuranceComplete: v })}
            options={[
              { value: 'Y', label: 'Yes' },
              { value: 'N', label: 'No' },
            ]}
          />
        </div>
        <div className="nhsuk-grid-column-one-quarter">
          <RadioGroup<RiskStatus>
            label="Status"
            name={`status-${risk.id}`}
            value={risk.status}
            onChange={v => update({ status: v })}
            options={[
              { value: 'Open', label: 'Open' },
              { value: 'Closed', label: 'Closed' },
            ]}
          />
        </div>
      </div>
      {risk.inScope === 'N' && (
        <div className="nhsuk-warning-callout nhsuk-u-margin-bottom-4">
          <h3 className="nhsuk-warning-callout__label">
            <span role="text">
              <span className="nhsuk-u-visually-hidden">Important: </span>
              Descoping guidance
            </span>
          </h3>
          <p className="nhsuk-body-s nhsuk-u-margin-bottom-0">
            Only descope a risk if it genuinely does not apply to this product. Risks that exist but cannot be mitigated must remain in scope as Open — they inform stakeholder decision-making.
          </p>
        </div>
      )}
      <details className="nhsuk-details nhsuk-u-margin-bottom-6">
        <summary className="nhsuk-details__summary">
          <span className="nhsuk-details__summary-text">Common valid status combinations</span>
        </summary>
        <div className="nhsuk-details__text">
          <dl className="nhsuk-summary-list" style={{ fontSize: '13px' }}>
            {[
              ['Y / N / N / Open', 'In scope, work ongoing'],
              ['Y / P / N / Open', 'Partially mitigated'],
              ['Y / Y / Y / Closed', 'Fully assured — complete'],
              ['N / N / N / Closed', 'Descoped — not applicable'],
            ].map(([combo, desc]) => (
              <div key={combo} className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key" style={{ fontFamily: 'monospace', fontSize: '12px' }}>{combo}</dt>
                <dd className="nhsuk-summary-list__value">{desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '32px' }}>
        <button
          className="nhsuk-button nhsuk-u-margin-bottom-0"
          onClick={handleSave}
          style={{ backgroundColor: saved ? '#007f3b' : undefined }}
        >
          {saved ? '✓ Saved' : 'Save changes'}
        </button>
        <button className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-bottom-0" onClick={onBack}>
          Back to risk log
        </button>
      </div>

      {/* Pagination — prev/next risk */}
      {(prevRisk || nextRisk) && (
        <nav className="nhsuk-pagination nhsuk-u-margin-top-6" role="navigation" aria-label="Navigate between risks">
          <ul className="nhsuk-list nhsuk-pagination__list">
            {prevRisk && (
              <li className="nhsuk-pagination-item--previous">
                <a
                  className="nhsuk-pagination__link nhsuk-pagination__link--prev"
                  href="#"
                  onClick={e => { e.preventDefault(); handleSave(); setRisk(prevRisk); setSaved(false); }}
                >
                  <span className="nhsuk-pagination__title">Previous<span className="nhsuk-u-visually-hidden"> risk</span></span>
                  <span className="nhsuk-u-visually-hidden">:</span>
                  <span className="nhsuk-pagination__page">{prevRisk.id} — {prevRisk.riskTitle}</span>
                  <svg className="nhsuk-icon nhsuk-icon--arrow-left" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" focusable="false" aria-hidden="true">
                    <path d="M10.7 6.3c.4.4.4 1 0 1.4L7.4 11H19a1 1 0 0 1 0 2H7.4l3.3 3.3c.4.4.4 1 0 1.4a1 1 0 0 1-1.4 0l-5-5A1 1 0 0 1 4 12c0-.3.1-.5.3-.7l5-5a1 1 0 0 1 1.4 0Z"/>
                  </svg>
                </a>
              </li>
            )}
            {nextRisk && (
              <li className="nhsuk-pagination-item--next">
                <a
                  className="nhsuk-pagination__link nhsuk-pagination__link--next"
                  href="#"
                  onClick={e => { e.preventDefault(); handleSave(); setRisk(nextRisk); setSaved(false); }}
                >
                  <span className="nhsuk-pagination__title">Next<span className="nhsuk-u-visually-hidden"> risk</span></span>
                  <span className="nhsuk-u-visually-hidden">:</span>
                  <span className="nhsuk-pagination__page">{nextRisk.id} — {nextRisk.riskTitle}</span>
                  <svg className="nhsuk-icon nhsuk-icon--arrow-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" focusable="false" aria-hidden="true">
                    <path d="m14.7 6.3 5 5c.2.2.3.4.3.7 0 .3-.1.5-.3.7l-5 5a1 1 0 0 1-1.4-1.4l3.3-3.3H5a1 1 0 0 1 0-2h11.6l-3.3-3.3a1 1 0 1 1 1.4-1.4Z"/>
                  </svg>
                </a>
              </li>
            )}
          </ul>
        </nav>
      )}
    </Layout>
  );
}
