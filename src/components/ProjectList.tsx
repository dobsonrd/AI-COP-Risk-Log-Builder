import { useState, useEffect, useRef } from 'react';
import { getProjects, deleteProject, importProject } from '../lib/storage';
import type { Project } from '../types';
import Layout from './Layout';

interface Props {
  onNewProject: () => void;
  onOpenProject: (id: string) => void;
  onViewLibrary: () => void;
}

export default function ProjectList({ onNewProject, onOpenProject, onViewLibrary }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setProjects(getProjects()); }, []);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!fileInputRef.current) return;
    fileInputRef.current.value = '';
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        importProject(parsed);
        setProjects(getProjects());
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Could not read file.');
      }
    };
    reader.readAsText(file);
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Delete "${name}"? All risk log data will be permanently lost.`)) {
      deleteProject(id);
      setProjects(getProjects());
    }
  };

  const scopedCount = (p: Project) => p.risks.filter(r => r.inScope === 'Y').length;
  const openCount = (p: Project) => p.risks.filter(r => r.status === 'Open' && r.inScope === 'Y').length;
  const mitigatedCount = (p: Project) => p.risks.filter(r => r.mitigated === 'Y').length;

  return (
    <Layout>
      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-two-thirds">
          <h1 className="nhsuk-heading-l">AI Risk Log Projects</h1>
          <p className="nhsuk-body nhsuk-u-secondary-text-color">
            Browser-based risk log builder for NHS AI assurance — powered by the AIQ CoP framework.
          </p>
        </div>
      </div>

      <div className="nhsuk-grid-row">
        <div className="nhsuk-grid-column-full">
          <button className="nhsuk-button" onClick={onNewProject}>
            Create new project
          </button>
          <button
            className="nhsuk-button nhsuk-button--secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{ marginLeft: '16px' }}
          >
            Import project
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
          />
          <button
            className="nhsuk-button nhsuk-button--secondary"
            onClick={onViewLibrary}
            style={{ marginLeft: '16px' }}
          >
            View risk library
          </button>
        </div>
      </div>

      {importError && (
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-two-thirds">
            <div className="nhsuk-error-summary" aria-labelledby="import-error-title" role="alert">
              <h2 className="nhsuk-error-summary__title" id="import-error-title">Import failed</h2>
              <div className="nhsuk-error-summary__body">
                <p className="nhsuk-body">{importError}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="nhsuk-grid-row">
          <div className="nhsuk-grid-column-two-thirds">
            <div className="nhsuk-inset-text">
              <span className="nhsuk-u-visually-hidden">Information: </span>
              <p className="nhsuk-body nhsuk-u-margin-bottom-0">
                Answer a short questionnaire about your AI product and the builder will generate a tailored risk log from the AIQ CoP framework — covering design, data, development, deployment, and due diligence risks.
              </p>
            </div>
            <p className="nhsuk-body-s nhsuk-u-secondary-text-color">
              All data is stored in your browser's local storage only. No information is sent to any server.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="nhsuk-grid-row">
            <div className="nhsuk-grid-column-full">
              <table className="nhsuk-table">
                <caption className="nhsuk-table__caption nhsuk-u-visually-hidden">Risk log projects</caption>
                <thead className="nhsuk-table__head">
                  <tr className="nhsuk-table__row">
                    <th scope="col" className="nhsuk-table__header">Project</th>
                    <th scope="col" className="nhsuk-table__header">Organisation</th>
                    <th scope="col" className="nhsuk-table__header nhsuk-table__header--numeric">In scope</th>
                    <th scope="col" className="nhsuk-table__header nhsuk-table__header--numeric">Open</th>
                    <th scope="col" className="nhsuk-table__header nhsuk-table__header--numeric">Mitigated</th>
                    <th scope="col" className="nhsuk-table__header">Last updated</th>
                    <th scope="col" className="nhsuk-table__header nhsuk-u-visually-hidden">Actions</th>
                  </tr>
                </thead>
                <tbody className="nhsuk-table__body">
                  {projects.map(p => (
                    <tr
                      key={p.id}
                      className="nhsuk-table__row app-table-row--clickable"
                      onClick={() => onOpenProject(p.id)}
                    >
                      <td className="nhsuk-table__cell">
                        <a
                          className="nhsuk-link nhsuk-link--no-visited-state"
                          onClick={e => { e.preventDefault(); onOpenProject(p.id); }}
                          href="#"
                        >
                          {p.name}
                        </a>
                        {p.description && (
                          <div>
                            <span className="nhsuk-body-s nhsuk-u-secondary-text-color" style={{ display: 'block', marginTop: '4px' }}>
                              {p.description}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="nhsuk-table__cell">{p.organisation || '—'}</td>
                      <td className="nhsuk-table__cell nhsuk-table__cell--numeric">
                        <strong className="nhsuk-tag">{scopedCount(p)}</strong>
                      </td>
                      <td className="nhsuk-table__cell nhsuk-table__cell--numeric">
                        <strong className="nhsuk-tag nhsuk-tag--orange">{openCount(p)}</strong>
                      </td>
                      <td className="nhsuk-table__cell nhsuk-table__cell--numeric">
                        <strong className="nhsuk-tag nhsuk-tag--green">{mitigatedCount(p)}</strong>
                      </td>
                      <td className="nhsuk-table__cell">
                        {new Date(p.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="nhsuk-table__cell" style={{ whiteSpace: 'nowrap' }}>
                        <button
                          className="nhsuk-button nhsuk-button--secondary nhsuk-button--small nhsuk-u-margin-bottom-0"
                          onClick={e => handleDelete(e, p.id, p.name)}
                          style={{ marginRight: '8px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}
    </Layout>
  );
}
