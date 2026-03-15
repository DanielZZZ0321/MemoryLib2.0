import { create } from 'zustand';
import { db } from '../db';
import type { Project, EventExtended } from '../types/event';

interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;

  // Actions
  loadProjects: () => Promise<void>;
  selectProject: (id: string | null) => void;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, changes: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addEventToProject: (projectId: string, eventId: string) => Promise<void>;
  removeEventFromProject: (projectId: string, eventId: string) => Promise<void>;
  getProjectEvents: (projectId: string) => Promise<EventExtended[]>;
}

class ProjectDB {
  private dbName = 'MemoryLibProjects';
  private storeName = 'projects';
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async getAll(): Promise<Project[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async get(id: string): Promise<Project | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put(project: Project): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(project);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const projectDB = new ProjectDB();

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProjectId: null,
  isLoading: false,

  loadProjects: async () => {
    set({ isLoading: true });
    try {
      const projects = await projectDB.getAll();
      // Sort by updatedAt descending
      projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      set({ projects, isLoading: false });
    } catch (error) {
      console.error('Failed to load projects:', error);
      set({ isLoading: false });
    }
  },

  selectProject: (id) => {
    set({ selectedProjectId: id });
  },

  createProject: async (name, description = '') => {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventIds: [],
      status: 'active',
    };

    await projectDB.put(project);
    set((state) => ({
      projects: [project, ...state.projects],
    }));

    return project;
  },

  updateProject: async (id, changes) => {
    const project = await projectDB.get(id);
    if (!project) return;

    const updatedProject = {
      ...project,
      ...changes,
      updatedAt: new Date().toISOString(),
    };

    await projectDB.put(updatedProject);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? updatedProject : p)),
    }));
  },

  deleteProject: async (id) => {
    await projectDB.delete(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      selectedProjectId: state.selectedProjectId === id ? null : state.selectedProjectId,
    }));
  },

  addEventToProject: async (projectId, eventId) => {
    const project = await projectDB.get(projectId);
    if (!project) return;

    if (!project.eventIds.includes(eventId)) {
      const updatedProject = {
        ...project,
        eventIds: [...project.eventIds, eventId],
        updatedAt: new Date().toISOString(),
      };

      await projectDB.put(updatedProject);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === projectId ? updatedProject : p)),
      }));
    }
  },

  removeEventFromProject: async (projectId, eventId) => {
    const project = await projectDB.get(projectId);
    if (!project) return;

    const updatedProject = {
      ...project,
      eventIds: project.eventIds.filter((id) => id !== eventId),
      updatedAt: new Date().toISOString(),
    };

    await projectDB.put(updatedProject);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === projectId ? updatedProject : p)),
    }));
  },

  getProjectEvents: async (projectId) => {
    const project = await projectDB.get(projectId);
    if (!project) return [];

    const events = await db.events.toArray();
    return events.filter((e) => project.eventIds.includes(e.id));
  },
}));