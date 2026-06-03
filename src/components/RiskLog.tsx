import { useState, useEffect, useMemo } from 'react';
import { getProject } from '../lib/storage';
import { calcScore, calcDelta, scoreTagClass } from '../lib/scoring';
import type { Project, Risk } from '../types';
import Layout from './Layout';

interface Props {
  projectId: string;
  onBack: () => void;
  onEditProject: () => void;
  onSelectRisk: (riskId: string) => void;
}

type SortKey = 'id' | 'module' | 'preScore' | 'postScore' | 'delta' | 'status';
type SortDir = 'asc' | 'desc';
const ALL = 'All';

function ScoreTag({ score }: { score: number | null }) {
  return (
    <strong className={`nhsuk-tag app-score-tag ${scoreTagClass(score)}`}>
      {score ?? '—'}
    </strong>
  );
}

function MitigatedTag({ v }: { v: 'Y' | 'P' | 'N' }) {
  const cls = { Y: 'nhsuk-tag--green', P: 'nhsuk-tag--yellow', N: 'nhsuk-tag--grey' } as const;
  const lbl = { Y: 'Mitigated', P: 'Partial', N: 'Not yet' } as const;
  return <strong className={`nhsuk-tag ${cls[v]}`}>{lbl[v]}</strong>;
}

function StatusTag({ v }: { v: 'Open' | 'Closed' }) {
  return <strong className={`nhsuk-tag ${v === 'Open' ? '' : 'nhsuk-tag--grey'}`}>{v}</strong>;
}

export default function RiskLog({ projectId, onBack, onEditProject, onSelectRisk }: Props) {
  const [project, setProject] = useState<Project | null>(null);
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState(ALL);
  const [filterArea, setFilterArea] = useState(ALL);
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterMitigated, setFilterMitigated] = useState(ALL);
  const [filterScope, setFilterScope] = useState('Y');
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => { setProject(getProject(projectId)); }, [projectId]);

  const risks = project?.risks ?? [];
  const modules = useMemo(() => [ALL, ...Array.from(new Set(risks.map(r => r.riskModule))).sort()], [risks]);
  const areas = useMemo(() => [ALL, ...Array.from(new Set(risks.map(r => r.riskArea))).sort()], [risks]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return risks
      .filter(r => {
        if (filterScope !== ALL && r.inScope !== filterScope) return false;
        if (filterModule !== ALL && r.riskModule !== filterModule) return false;
        if (filterArea !== ALL && r.riskArea !== filterArea) return false;
        if (filterStatus !== ALL && r.status !== filterStatus) return false;
        if (filterMitigated !== ALL && r.mitigated !== filterMitigated) return false;
        if (q && !r.riskTitle.toLowerCase().includes(q) && !r.id.toLowerCase().includes(q) &&
            !r.unwantedEffect.toLowerCase().includes(q) && !r.cause.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const preA = calcScore(a.impactScore, a.preMitigationLikelihood) ?? -1;
        const preB = calcScore(b.impactScore, b.preMitigationLikelihood) ?? -1;
        const postA = calcScore(a.impactScore, a.postMitigationLikelihood) ?? -1;
        const postB = calcScore(b.impactScore, b.postMitigationLikelihood) ?? -1;
        const vals: Record<SortKey, [number | string, number | string]> = {
          id: [a.id, b.id],
          module: [a.riskModule, b.riskModule],
          preScore: [preA, preB],
          postScore: [postA, postB],
          delta: [calcDelta(preA < 0 ? null : preA, postA < 0 ? null : postA) ?? -999,
                  calcDelta(preB < 0 ? null : preB, postB < 0 ? null : postB) ?? -999],
          status: [a.status, b.status],
        };
        const [va, vb] = vals[sortKey];
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [risks, search, filterModule, filterArea, filterStatus, filterMitigated, filterScope, sortKey, sortDir]);

  const stats = useMemo(() => {
    const ins = risks.filter(r => r.inScope === 'Y');
    return {
      total: ins.length,
      open: ins.filter(r => r.status === 'Open').length,
      mitigatedY: ins.filter(r => r.mitigated === 'Y').length,
      mitigatedP: ins.filter(r => r.mitigated === 'P').length,
      mitigatedN: ins.filter(r => r.mitigated === 'N').length,
      assured: ins.filter(r => r.assuranceComplete === 'Y').length,
    };
  }, [risks]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortTh = ({ col, label, numeric }: { col: SortKey; label: string; numeric?: boolean }) => (
    <th
      scope="col"
      className={`nhsuk-table__header${numeric ? ' nhsuk-table__header--numeric' : ''}`}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      onClick={() => toggleSort(col)}
    >
      {label}
      <span style={{ marginLeft: '4px', color: sortKey === col ? '#005eb8' : '#aeb7bd', fontSize: '12px' }}>
        {sortKey === col ? (sortDir === 'asc' ? '▲' : '▼') : '▲▼'}
      </span>
    </th>
  );

  const handleExport = () => {
    if (!project) return;
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${project.name.replace(/\s+/g, '-')}-risk-log.json`;
    a.click();
  };

  const resetFilters = () => {
    setSearch(''); setFilterModule(ALL); setFilterArea(ALL);
    setFilterStatus(ALL); setFilterMitigated(ALL); setFilterScope('Y');
  };

  if (!project) return null;

  return (
    <Layout
      wide
      breadcrumbs={[{ label: 'Projects', onClick: onBack }, { label: project.name }]}
    >
      {/* Project header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="nhsuk-heading-l nhsuk-u-margin-bottom-1">{project.name}</h1>
          {project.organisation && <p className="nhsuk-body-s nhsuk-u-secondary-text-color nhsuk-u-margin-bottom-0">{project.organisation}</p>}
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="nhsuk-button nhsuk-button--secondary nhsuk-button--small nhsuk-u-margin-bottom-0" onClick={handleExport}>
            Export JSON
          </button>
          <button className="nhsuk-button nhsuk-button--secondary nhsuk-button--small nhsuk-u-margin-bottom-0" onClick={onEditProject}>
            Edit configuration
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="nhsuk-grid-row nhsuk-u-margin-bottom-4">
        {[
          { label: 'In scope', value: stats.total, tag: '' },
          { label: 'Open', value: stats.open, tag: 'nhsuk-tag--orange' },
          { label: 'Mitigated', value: stats.mitigatedY, tag: 'nhsuk-tag--green' },
          { label: 'Assured', value: stats.assured, tag: 'nhsuk-tag--aqua-green' },
        ].map(s => (
          <div key={s.label} className="nhsuk-grid-column-one-quarter">
            <div className="nhsuk-card" style={{ textAlign: 'center', padding: '16px 8px' }}>
              <div className="nhsuk-card__content nhsuk-u-padding-0">
                <p className="nhsuk-heading-l nhsuk-u-margin-bottom-1">{s.value}</p>
                <strong className={`nhsuk-tag ${s.tag}`}>{s.label}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mitigation progress bar */}
      {stats.total > 0 && (
        <div className="nhsuk-u-margin-bottom-6">
          <p className="nhsuk-body-s nhsuk-u-margin-bottom-2" style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Mitigation progress (in-scope risks)</span>
            <span>
              <strong style={{ color: '#007f3b' }}>{stats.mitigatedY} mitigated</strong>
              {' · '}<strong style={{ color: '#ffb81c' }}>{stats.mitigatedP} partial</strong>
              {' · '}<strong style={{ color: '#768692' }}>{stats.mitigatedN} not started</strong>
            </span>
          </p>
          <div className="app-progress-bar">
            <div className="app-progress-bar__segment" style={{ width: `${(stats.mitigatedY / stats.total) * 100}%`, backgroundColor: '#007f3b' }} />
            <div className="app-progress-bar__segment" style={{ width: `${(stats.mitigatedP / stats.total) * 100}%`, backgroundColor: '#ffb81c' }} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="nhsuk-card nhsuk-u-margin-bottom-4" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          <div className="nhsuk-form-group nhsuk-u-margin-bottom-0">
            <label className="nhsuk-label nhsuk-body-s nhsuk-u-margin-bottom-1" htmlFor="risk-search">Search</label>
            <input
              className="nhsuk-input"
              id="risk-search"
              type="search"
              style={{ width: '220px' }}
              placeholder="Title, ID, cause…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="nhsuk-form-group nhsuk-u-margin-bottom-0">
            <label className="nhsuk-label nhsuk-body-s nhsuk-u-margin-bottom-1" htmlFor="filter-scope">Scope</label>
            <select className="nhsuk-select" id="filter-scope" value={filterScope} onChange={e => setFilterScope(e.target.value)}>
              <option value="Y">In scope</option>
              <option value="N">Out of scope</option>
              <option value={ALL}>All</option>
            </select>
          </div>
          <div className="nhsuk-form-group nhsuk-u-margin-bottom-0">
            <label className="nhsuk-label nhsuk-body-s nhsuk-u-margin-bottom-1" htmlFor="filter-module">Module</label>
            <select className="nhsuk-select" id="filter-module" value={filterModule} onChange={e => setFilterModule(e.target.value)}>
              {modules.map(m => <option key={m} value={m}>{m === ALL ? 'All modules' : m}</option>)}
            </select>
          </div>
          <div className="nhsuk-form-group nhsuk-u-margin-bottom-0">
            <label className="nhsuk-label nhsuk-body-s nhsuk-u-margin-bottom-1" htmlFor="filter-area">Area</label>
            <select className="nhsuk-select" id="filter-area" value={filterArea} onChange={e => setFilterArea(e.target.value)}>
              {areas.map(a => <option key={a} value={a}>{a === ALL ? 'All areas' : a}</option>)}
            </select>
          </div>
          <div className="nhsuk-form-group nhsuk-u-margin-bottom-0">
            <label className="nhsuk-label nhsuk-body-s nhsuk-u-margin-bottom-1" htmlFor="filter-status">Status</label>
            <select className="nhsuk-select" id="filter-status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value={ALL}>All statuses</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div className="nhsuk-form-group nhsuk-u-margin-bottom-0">
            <label className="nhsuk-label nhsuk-body-s nhsuk-u-margin-bottom-1" htmlFor="filter-mitigated">Mitigated</label>
            <select className="nhsuk-select" id="filter-mitigated" value={filterMitigated} onChange={e => setFilterMitigated(e.target.value)}>
              <option value={ALL}>All</option>
              <option value="Y">Mitigated</option>
              <option value="P">Partial</option>
              <option value="N">Not yet</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', marginLeft: 'auto', paddingBottom: '2px' }}>
            <button className="nhsuk-button nhsuk-button--secondary nhsuk-button--small nhsuk-u-margin-bottom-0" onClick={resetFilters}>
              Reset filters
            </button>
            <span className="nhsuk-body-s nhsuk-u-secondary-text-color" style={{ whiteSpace: 'nowrap' }}>
              {filtered.length} of {risks.length}
            </span>
          </div>
        </div>
      </div>

      {/* Risk table */}
      <div style={{ overflowX: 'auto' }}>
        <table className="nhsuk-table app-table--dense" style={{ minWidth: '900px' }}>
          <caption className="nhsuk-table__caption nhsuk-u-visually-hidden">Risk log</caption>
          <thead className="nhsuk-table__head">
            <tr className="nhsuk-table__row">
              <th scope="col" className="nhsuk-table__header" style={{ whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }} onClick={() => toggleSort('id')}>
                Risk ID <span style={{ fontSize: '11px', color: sortKey === 'id' ? '#005eb8' : '#aeb7bd' }}>{sortKey === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : '▲▼'}</span>
              </th>
              <th scope="col" className="nhsuk-table__header">Title</th>
              <SortTh col="module" label="Module" />
              <th scope="col" className="nhsuk-table__header">Area</th>
              <th scope="col" className="nhsuk-table__header nhsuk-table__header--numeric" title="Impact (fixed)">I</th>
              <SortTh col="preScore" label="Pre" numeric />
              <SortTh col="postScore" label="Post" numeric />
              <SortTh col="delta" label="Δ%" numeric />
              <th scope="col" className="nhsuk-table__header">Mitigated</th>
              <SortTh col="status" label="Status" />
              <th scope="col" className="nhsuk-table__header nhsuk-u-visually-hidden">Action</th>
            </tr>
          </thead>
          <tbody className="nhsuk-table__body">
            {filtered.map((r: Risk) => {
              const pre = calcScore(r.impactScore, r.preMitigationLikelihood);
              const post = calcScore(r.impactScore, r.postMitigationLikelihood);
              const delta = calcDelta(pre, post);
              return (
                <tr
                  key={r.id}
                  className={`nhsuk-table__row app-table-row--clickable${r.inScope === 'N' ? ' app-table-row--faded' : ''}`}
                  onClick={() => onSelectRisk(r.id)}
                >
                  <td className="nhsuk-table__cell nhsuk-u-secondary-text-color" style={{ whiteSpace: 'nowrap' }}>
                    {r.id}
                  </td>
                  <td className="nhsuk-table__cell" style={{ maxWidth: '280px' }}>
                    <span style={{ fontWeight: 700, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.riskTitle}>
                      {r.riskTitle}
                    </span>
                    {r.systemElement && (
                      <span className="nhsuk-body-s nhsuk-u-secondary-text-color" style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {r.systemElement}
                      </span>
                    )}
                  </td>
                  <td className="nhsuk-table__cell nhsuk-u-secondary-text-color" style={{ whiteSpace: 'nowrap' }}>{r.riskModule}</td>
                  <td className="nhsuk-table__cell nhsuk-u-secondary-text-color" style={{ whiteSpace: 'nowrap' }}>{r.riskArea}</td>
                  <td className="nhsuk-table__cell nhsuk-table__cell--numeric" style={{ fontWeight: 700 }}>
                    {r.impactScore ?? <span style={{ color: '#aeb7bd' }}>—</span>}
                  </td>
                  <td className="nhsuk-table__cell nhsuk-table__cell--numeric"><ScoreTag score={pre} /></td>
                  <td className="nhsuk-table__cell nhsuk-table__cell--numeric"><ScoreTag score={post} /></td>
                  <td className="nhsuk-table__cell nhsuk-table__cell--numeric" style={{ fontWeight: 700 }}>
                    {delta !== null ? (
                      <span style={{ color: delta < 0 ? '#007f3b' : delta > 0 ? '#d5281b' : '#4c6272' }}>
                        {delta > 0 ? '+' : ''}{delta}%
                      </span>
                    ) : <span style={{ color: '#aeb7bd' }}>—</span>}
                  </td>
                  <td className="nhsuk-table__cell"><MitigatedTag v={r.mitigated} /></td>
                  <td className="nhsuk-table__cell"><StatusTag v={r.status} /></td>
                  <td className="nhsuk-table__cell" style={{ whiteSpace: 'nowrap' }}>
                    <a className="nhsuk-link nhsuk-link--no-visited-state" href="#" onClick={e => { e.preventDefault(); onSelectRisk(r.id); }}>
                      Edit <span className="nhsuk-u-visually-hidden">{r.riskTitle}</span>
                    </a>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr className="nhsuk-table__row">
                <td className="nhsuk-table__cell" colSpan={11} style={{ textAlign: 'center', padding: '40px 16px', color: '#4c6272' }}>
                  No risks match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Score legend */}
      <p className="nhsuk-body-s nhsuk-u-secondary-text-color nhsuk-u-margin-top-3">
        <strong>Score bands:</strong>
        {[['green', 'Low (≤4)'], ['yellow', 'Medium (5–9)'], ['orange', 'High (10–16)'], ['red', 'Critical (17–25)']].map(([colour, label]) => (
          <strong key={label} className={`nhsuk-tag nhsuk-tag--${colour}`} style={{ marginLeft: '8px', fontSize: '13px' }}>{label}</strong>
        ))}
        <span style={{ marginLeft: '16px' }}><strong>I</strong> = Impact score (fixed, not reduced by mitigation)</span>
      </p>
    </Layout>
  );
}
