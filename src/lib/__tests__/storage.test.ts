import { describe, it, expect, beforeEach } from 'vitest'
import { getProjects, getProject, saveProject, deleteProject } from '../storage'
import type { Project } from '../../types'

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj-1',
  name: 'Test Project',
  organisation: 'NHS Test',
  description: '',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  questionnaire: { q1: 1, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0, q8: 0, q9: 0, q10: 0 },
  risks: [],
  ...overrides,
})

beforeEach(() => {
  localStorage.clear()
})

describe('getProjects', () => {
  it('returns empty array when storage is empty', () => {
    expect(getProjects()).toEqual([])
  })

  it('returns empty array when storage contains invalid JSON', () => {
    localStorage.setItem('nhs-ai-risk-log:projects', 'not-json')
    expect(getProjects()).toEqual([])
  })
})

describe('saveProject', () => {
  it('persists a new project', () => {
    const p = makeProject()
    saveProject(p)
    expect(getProjects()).toHaveLength(1)
    expect(getProjects()[0].id).toBe('proj-1')
  })

  it('updates an existing project without duplicating it', () => {
    const p = makeProject()
    saveProject(p)
    saveProject({ ...p, name: 'Updated' })
    const projects = getProjects()
    expect(projects).toHaveLength(1)
    expect(projects[0].name).toBe('Updated')
  })

  it('sets updatedAt on save', () => {
    const p = makeProject({ updatedAt: '2020-01-01T00:00:00.000Z' })
    saveProject(p)
    const saved = getProjects()[0]
    expect(saved.updatedAt).not.toBe('2020-01-01T00:00:00.000Z')
  })

  it('stores multiple projects independently', () => {
    saveProject(makeProject({ id: 'proj-1', name: 'First' }))
    saveProject(makeProject({ id: 'proj-2', name: 'Second' }))
    expect(getProjects()).toHaveLength(2)
  })
})

describe('getProject', () => {
  it('returns the matching project', () => {
    saveProject(makeProject({ id: 'proj-1', name: 'Found' }))
    expect(getProject('proj-1')?.name).toBe('Found')
  })

  it('returns null for an unknown id', () => {
    expect(getProject('does-not-exist')).toBeNull()
  })
})

describe('deleteProject', () => {
  it('removes the project', () => {
    saveProject(makeProject({ id: 'proj-1' }))
    deleteProject('proj-1')
    expect(getProjects()).toHaveLength(0)
  })

  it('only removes the specified project', () => {
    saveProject(makeProject({ id: 'proj-1' }))
    saveProject(makeProject({ id: 'proj-2' }))
    deleteProject('proj-1')
    const remaining = getProjects()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe('proj-2')
  })

  it('is a no-op for an unknown id', () => {
    saveProject(makeProject())
    deleteProject('does-not-exist')
    expect(getProjects()).toHaveLength(1)
  })
})
