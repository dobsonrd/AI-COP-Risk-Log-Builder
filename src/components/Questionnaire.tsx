import { useState, useEffect } from 'react';
import { getProject, saveProject } from '../lib/storage';
import { buildRiskLog } from '../lib/riskBuilder';
import { questions, risksPerModule, mandatoryModules } from '../data/questions';
import type { QuestionnaireAnswers } from '../types';
import Layout from './Layout';

interface Props {
  projectId: string | null;
  onComplete: (id: string) => void;
  onCancel: () => void;
}

const DEFAULTS: QuestionnaireAnswers = { q1: 1, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0, q10: 0 };

function genId() { return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

const STEPS = ['Project details', 'Technology profile', 'Review & generate'];

export default function Questionnaire({ projectId, onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [desc, setDesc] = useState('');
  const [answers, setAnswers] = useState<QuestionnaireAnswers>(DEFAULTS);
  const isEditing = !!projectId;

  useEffect(() => {
    if (projectId) {
      const p = getProject(projectId);
      if (p) { setName(p.name); setOrg(p.organisation); setDesc(p.description); setAnswers(p.questionnaire); }
    }
  }, [projectId]);

  const set = (key: keyof QuestionnaireAnswers, val: number) =>
    setAnswers(a => ({ ...a, [key]: val }));

  const totalRisks = questions.reduce((s, q) => {
    const n = answers[q.key as keyof QuestionnaireAnswers] as number;
    return s + n * (risksPerModule[q.module] ?? 0);
  }, 0) + mandatoryModules.reduce((s, m) => s + m.risks, 0);

  const handleGenerate = () => {
    const id = projectId ?? genId();
    const existing = projectId ? (getProject(projectId)?.risks ?? []) : [];
    const risks = buildRiskLog(answers, existing);
    saveProject({
      id,
      name: name.trim() || 'Unnamed Project',
      organisation: org.trim(),
      description: desc.trim(),
      createdAt: getProject(id)?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questionnaire: answers,
      risks,
    });
    onComplete(id);
  };

  const breadcrumbs = [
    { label: 'Projects', onClick: onCancel },
    { label: isEditing ? 'Edit project' : 'New project' },
  ];

  return (
    <Layout breadcrumbs={breadcrumbs}>
      {/* Step indicator */}
      <ol className="app-step-list" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li
            key={i}
            className={`app-step-list__item${i < step ? ' app-step-list__item--done' : ''}${i === step ? ' app-step-list__item--current' : ''}`}
            aria-current={i === step ? 'step' : undefined}
          >
            <span className="app-step-list__number">{i < step ? '✓' : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      {/* ── Step 0: Project details ── */}
      {step === 0 && (
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-two-thirds">
            <h1 className="nhsuk-heading-l">Project details</h1>
            <p className="nhsuk-lede-text nhsuk-u-margin-bottom-6">
              Tell us about the AI product being assessed for risk.
            </p>

            <div className="nhsuk-form-group">
              <label className="nhsuk-label nhsuk-label--m" htmlFor="project-name">
                Project name <span aria-hidden="true" style={{ color: '#d5281b' }}>*</span>
              </label>
              <div className="nhsuk-hint" id="project-name-hint">
                For example: "Triage Copilot — Emergency Department"
              </div>
              <input
                className="nhsuk-input nhsuk-u-width-full"
                id="project-name"
                name="project-name"
                type="text"
                aria-describedby="project-name-hint"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="nhsuk-form-group">
              <label className="nhsuk-label nhsuk-label--m" htmlFor="organisation">
                Organisation
              </label>
              <div className="nhsuk-hint" id="org-hint">For example: "NHS Greater Manchester"</div>
              <input
                className="nhsuk-input nhsuk-u-width-full"
                id="organisation"
                name="organisation"
                type="text"
                aria-describedby="org-hint"
                value={org}
                onChange={e => setOrg(e.target.value)}
              />
            </div>

            <div className="nhsuk-form-group nhsuk-u-margin-bottom-6">
              <label className="nhsuk-label nhsuk-label--m" htmlFor="description">
                Description <span className="nhsuk-u-secondary-text-color" style={{ fontWeight: 400 }}>(optional)</span>
              </label>
              <div className="nhsuk-hint" id="desc-hint">
                Brief summary of the product and its purpose.
              </div>
              <textarea
                className="nhsuk-textarea"
                id="description"
                name="description"
                rows={3}
                aria-describedby="desc-hint"
                value={desc}
                onChange={e => setDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button
                className="nhsuk-button nhsuk-u-margin-bottom-0"
                onClick={() => setStep(1)}
                disabled={!name.trim()}
              >
                Continue
              </button>
              <button className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-bottom-0" onClick={onCancel}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Technology profile ── */}
      {step === 1 && (
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-full">
            <h1 className="nhsuk-heading-l">Technology profile</h1>
            <p className="nhsuk-body nhsuk-u-margin-bottom-6">
              Your answers determine which risk modules are included. Be precise — under- or over-counting creates gaps or unnecessary duplication.
            </p>
          </div>

          <div className="nhsuk-grid-column-two-thirds">
            {questions.map(q => {
              const val = answers[q.key as keyof QuestionnaireAnswers] as number;
              const options = Array.from({ length: q.max - q.min + 1 }, (_, i) => q.min + i);
              return (
                <div key={q.key} className="nhsuk-form-group" style={{ borderLeft: '4px solid #aeb7bd', paddingLeft: '16px', marginBottom: '32px' }}>
                  <fieldset className="nhsuk-fieldset">
                    <legend className="nhsuk-fieldset__legend nhsuk-fieldset__legend--s">
                      <span style={{ color: '#4c6272', fontSize: '14px', fontWeight: 700, display: 'block', marginBottom: '2px' }}>
                        Q{q.number} · {q.module}
                        {q.mandatory && (
                          <strong className="nhsuk-tag nhsuk-tag--blue nhsuk-u-margin-left-2" style={{ fontSize: '12px', verticalAlign: 'middle' }}>
                            Mandatory
                          </strong>
                        )}
                      </span>
                      <h3 className="nhsuk-fieldset__heading" style={{ marginBottom: '4px' }}>{q.text}</h3>
                    </legend>
                    <div className="nhsuk-hint nhsuk-u-margin-bottom-3">{q.guidance}</div>

                    {q.max === 1 ? (
                      /* Checkbox for yes/no (0 or 1) */
                      <div className="nhsuk-checkboxes">
                        <div className="nhsuk-checkboxes__item">
                          <input
                            className="nhsuk-checkboxes__input"
                            id={`${q.key}-yes`}
                            name={q.key}
                            type="checkbox"
                            checked={val === 1}
                            onChange={() => set(q.key as keyof QuestionnaireAnswers, val === 1 ? 0 : 1)}
                          />
                          <label className="nhsuk-label nhsuk-checkboxes__label" htmlFor={`${q.key}-yes`}>
                            Yes, the product uses this
                          </label>
                        </div>
                      </div>
                    ) : (
                      /* Inline radios for 0/1/2/3 */
                      <div className="nhsuk-radios nhsuk-radios--inline" style={{ marginBottom: '8px' }}>
                        {options.map(n => (
                          <div key={n} className="nhsuk-radios__item">
                            <input
                              className="nhsuk-radios__input"
                              id={`${q.key}-${n}`}
                              name={q.key}
                              type="radio"
                              value={n}
                              checked={val === n}
                              onChange={() => set(q.key as keyof QuestionnaireAnswers, n)}
                            />
                            <label className="nhsuk-label nhsuk-radios__label" htmlFor={`${q.key}-${n}`}>
                              {n}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    {val > 0 && (
                      <p className="nhsuk-body-s nhsuk-u-margin-bottom-0" style={{ marginTop: '8px' }}>
                        <strong className="nhsuk-tag nhsuk-tag--green" style={{ marginRight: '8px' }}>
                          {val} {val === 1 ? 'instance' : 'instances'}
                        </strong>
                        {val} × {risksPerModule[q.module]} = <strong>{val * risksPerModule[q.module]}</strong> risks
                      </p>
                    )}
                  </fieldset>
                </div>
              );
            })}

            {/* Mandatory modules */}
            <div className="nhsuk-inset-text nhsuk-u-margin-bottom-6">
              <span className="nhsuk-u-visually-hidden">Information: </span>
              <h3 className="nhsuk-heading-s nhsuk-u-margin-bottom-2">Always included</h3>
              {mandatoryModules.map(m => (
                <p key={m.module} className="nhsuk-body-s nhsuk-u-margin-bottom-1">
                  <strong className="nhsuk-tag nhsuk-tag--green" style={{ marginRight: '8px' }}>{m.risks} risks</strong>
                  {m.module}
                </p>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button className="nhsuk-button nhsuk-u-margin-bottom-0" onClick={() => setStep(2)}>
                Continue
              </button>
              <button className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-bottom-0" onClick={() => setStep(0)}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Review ── */}
      {step === 2 && (
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-two-thirds">
            <h1 className="nhsuk-heading-l">Review and generate</h1>
            <p className="nhsuk-body nhsuk-u-margin-bottom-6">
              Check your configuration below.
              {isEditing && ' Existing mitigation data will be preserved for matching risk IDs.'}
            </p>

            {/* Project summary */}
            <dl className="nhsuk-summary-list nhsuk-u-margin-bottom-6">
              <div className="nhsuk-summary-list__row">
                <dt className="nhsuk-summary-list__key">Project name</dt>
                <dd className="nhsuk-summary-list__value">{name}</dd>
                <dd className="nhsuk-summary-list__actions">
                  <a className="nhsuk-link" href="#" onClick={e => { e.preventDefault(); setStep(0); }}>
                    Change<span className="nhsuk-u-visually-hidden"> project name</span>
                  </a>
                </dd>
              </div>
              {org && (
                <div className="nhsuk-summary-list__row">
                  <dt className="nhsuk-summary-list__key">Organisation</dt>
                  <dd className="nhsuk-summary-list__value">{org}</dd>
                </div>
              )}
              {desc && (
                <div className="nhsuk-summary-list__row">
                  <dt className="nhsuk-summary-list__key">Description</dt>
                  <dd className="nhsuk-summary-list__value">{desc}</dd>
                </div>
              )}
            </dl>

            {/* Module summary */}
            <h2 className="nhsuk-heading-m">Risk modules selected</h2>
            <table className="nhsuk-table nhsuk-u-margin-bottom-6">
              <caption className="nhsuk-table__caption nhsuk-u-visually-hidden">Risk modules and counts</caption>
              <thead className="nhsuk-table__head">
                <tr className="nhsuk-table__row">
                  <th scope="col" className="nhsuk-table__header">Module</th>
                  <th scope="col" className="nhsuk-table__header nhsuk-table__header--numeric">Instances</th>
                  <th scope="col" className="nhsuk-table__header nhsuk-table__header--numeric">Risks</th>
                </tr>
              </thead>
              <tbody className="nhsuk-table__body">
                {questions.map(q => {
                  const n = answers[q.key as keyof QuestionnaireAnswers] as number;
                  if (n === 0) return null;
                  return (
                    <tr key={q.key} className="nhsuk-table__row">
                      <td className="nhsuk-table__cell">{q.module}</td>
                      <td className="nhsuk-table__cell nhsuk-table__cell--numeric">{n}</td>
                      <td className="nhsuk-table__cell nhsuk-table__cell--numeric">
                        <strong>{n * risksPerModule[q.module]}</strong>
                      </td>
                    </tr>
                  );
                })}
                {mandatoryModules.map(m => (
                  <tr key={m.module} className="nhsuk-table__row">
                    <td className="nhsuk-table__cell">
                      {m.module}
                      <strong className="nhsuk-tag nhsuk-tag--blue nhsuk-u-margin-left-2" style={{ fontSize: '12px', verticalAlign: 'middle' }}>
                        Mandatory
                      </strong>
                    </td>
                    <td className="nhsuk-table__cell nhsuk-table__cell--numeric">1</td>
                    <td className="nhsuk-table__cell nhsuk-table__cell--numeric"><strong>{m.risks}</strong></td>
                  </tr>
                ))}
                <tr className="nhsuk-table__row" style={{ backgroundColor: '#f0f4f5' }}>
                  <td className="nhsuk-table__cell"><strong>Total</strong></td>
                  <td className="nhsuk-table__cell nhsuk-table__cell--numeric">—</td>
                  <td className="nhsuk-table__cell nhsuk-table__cell--numeric">
                    <strong className="nhsuk-tag nhsuk-tag--blue" style={{ fontSize: '16px', padding: '4px 10px' }}>{totalRisks}</strong>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button className="nhsuk-button nhsuk-u-margin-bottom-0" onClick={handleGenerate}>
                {isEditing ? 'Regenerate risk log' : 'Generate risk log'}
              </button>
              <button className="nhsuk-button nhsuk-button--secondary nhsuk-u-margin-bottom-0" onClick={() => setStep(1)}>
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
