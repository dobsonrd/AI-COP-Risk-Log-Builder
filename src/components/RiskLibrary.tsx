import { useState } from 'react';
import { riskTemplates } from '../data/riskTemplates';
import type { RiskTemplate } from '../types';
import Layout from './Layout';

interface Props {
  onBack: () => void;
}

function groupByModule(templates: RiskTemplate[]): Map<string, RiskTemplate[]> {
  const map = new Map<string, RiskTemplate[]>();
  for (const t of templates) {
    const group = map.get(t.riskModule) ?? [];
    group.push(t);
    map.set(t.riskModule, group);
  }
  return map;
}

function RiskCard({ risk }: { risk: RiskTemplate }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ borderBottom: '1px solid #d8dde0', paddingBottom: '16px', marginBottom: '16px' }}>
      <button
        type="button"
        className="nhsuk-link nhsuk-link--no-visited-state"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left', display: 'block' }}
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <span className="nhsuk-body-s nhsuk-u-secondary-text-color" style={{ display: 'block' }}>{risk.id}</span>
        <span className="nhsuk-body" style={{ fontWeight: 600 }}>{risk.riskTitle}</span>
        <span style={{ marginLeft: '8px', fontSize: '14px' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ marginTop: '12px' }}>
          <dl className="nhsuk-summary-list nhsuk-summary-list--no-border" style={{ marginBottom: 0 }}>
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key" style={{ width: '160px' }}>Risk area</dt>
              <dd className="nhsuk-summary-list__value">{risk.riskArea}</dd>
            </div>
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key" style={{ width: '160px' }}>Unwanted effect</dt>
              <dd className="nhsuk-summary-list__value">{risk.unwantedEffect}</dd>
            </div>
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key" style={{ width: '160px' }}>Cause</dt>
              <dd className="nhsuk-summary-list__value">{risk.cause}</dd>
            </div>
            <div className="nhsuk-summary-list__row">
              <dt className="nhsuk-summary-list__key" style={{ width: '160px' }}>Proposed mitigations</dt>
              <dd className="nhsuk-summary-list__value">{risk.proposedMitigations}</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

export default function RiskLibrary({ onBack }: Props) {
  const groups = groupByModule(riskTemplates);
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const toggleModule = (module: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      next.has(module) ? next.delete(module) : next.add(module);
      return next;
    });
  };

  return (
    <Layout breadcrumbs={[{ label: 'Home', onClick: onBack }, { label: 'Risk library' }]}>
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-two-thirds">
          <h1 className="nhsuk-heading-l">Risk library</h1>
          <p className="nhsuk-body nhsuk-u-secondary-text-color">
            All {riskTemplates.length} risks from the AIQ CoP framework, grouped by module. These are the source templates used to generate project risk logs.
          </p>
        </div>
      </div>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-full">
          {Array.from(groups.entries()).map(([module, risks]) => {
            const isOpen = openModules.has(module);
            return (
              <div key={module} style={{ marginBottom: '8px', border: '1px solid #d8dde0', borderRadius: '4px' }}>
                <button
                  type="button"
                  style={{
                    width: '100%',
                    background: isOpen ? '#f0f4f5' : '#fff',
                    border: 'none',
                    padding: '16px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderRadius: '4px',
                  }}
                  onClick={() => toggleModule(module)}
                  aria-expanded={isOpen}
                >
                  <span>
                    <span className="nhsuk-label nhsuk-u-margin-bottom-0" style={{ fontWeight: 700, display: 'block' }}>{module}</span>
                    <span className="nhsuk-body-s nhsuk-u-secondary-text-color">{risks.length} risk{risks.length !== 1 ? 's' : ''}</span>
                  </span>
                  <span style={{ fontSize: '18px', color: '#005eb8' }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 16px 8px' }}>
                    {risks.map(r => <RiskCard key={r.id} risk={r} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
