import type { Project } from '../types';

const KEY = 'nhs-ai-risk-log:projects';

export function getProjects(): Project[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getProject(id: string): Project | null {
  return getProjects().find(p => p.id === id) ?? null;
}

export function saveProject(project: Project): void {
  const projects = getProjects();
  const idx = projects.findIndex(p => p.id === project.id);
  const updated = { ...project, updatedAt: new Date().toISOString() };
  if (idx >= 0) projects[idx] = updated;
  else projects.push(updated);
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter(p => p.id !== id);
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function importProject(raw: unknown): Project {
  const p = raw as Project;
  if (!p || typeof p !== 'object' || !p.name || !Array.isArray(p.risks)) {
    throw new Error('Invalid project file — missing required fields.');
  }
  const existing = getProjects();
  const idTaken = existing.some(e => e.id === p.id);
  const project: Project = {
    ...p,
    id: idTaken ? `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` : p.id,
    name: idTaken ? `${p.name} (imported)` : p.name,
    updatedAt: new Date().toISOString(),
  };
  existing.push(project);
  localStorage.setItem(KEY, JSON.stringify(existing));
  return project;
}
