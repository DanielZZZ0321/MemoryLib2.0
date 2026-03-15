import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  MoreVertical,
  Trash2,
  Edit3,
  Archive,
  CheckCircle,
  Clock,
  Calendar,
  Tag,
  ChevronRight,
  X,
  Search,
  Filter,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useEventStore } from '@/stores/eventStore';
import type { Project, EventExtended } from '@/types/event';

export function ProjectManagement() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'completed'>('all');

  const projects = useProjectStore((state) => state.projects);
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const deleteProject = useProjectStore((state) => state.deleteProject);
  const selectedProjectId = useProjectStore((state) => state.selectedProjectId);
  const selectProject = useProjectStore((state) => state.selectProject);

  const events = useEventStore((state) => state.events);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteProject = async (id: string) => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      await deleteProject(id);
    }
  };

  const getProjectEvents = (project: Project): EventExtended[] => {
    return events.filter((e) => project.eventIds.includes(e.id));
  };

  const getTotalDuration = (projectEvents: EventExtended[]): string => {
    const totalSeconds = projectEvents.reduce((sum, e) => sum + (e.endSec - e.startSec), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="h-full flex">
      {/* Project List */}
      <div className="w-80 border-r border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-900">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Projects
            </h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-1">
            {(['all', 'active', 'archived', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Project List */}
        <div className="flex-1 overflow-y-auto">
          {filteredProjects.length === 0 ? (
            <div className="p-4 text-center text-zinc-500 dark:text-zinc-400">
              {searchQuery || statusFilter !== 'all' ? (
                <p className="text-sm">No projects found</p>
              ) : (
                <div className="py-8">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm mb-2">No projects yet</p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="text-blue-500 hover:text-blue-600 text-sm"
                  >
                    Create your first project
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredProjects.map((project) => {
                const projectEvents = getProjectEvents(project);
                const isSelected = selectedProjectId === project.id;

                return (
                  <motion.div
                    key={project.id}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                    onClick={() => selectProject(project.id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                            {project.name}
                          </h3>
                          <StatusBadge status={project.status} />
                        </div>
                        {project.description && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3" />
                            {project.eventIds.length} events
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {getTotalDuration(projectEvents)}
                          </span>
                        </div>
                      </div>

                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Show dropdown menu
                          }}
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-zinc-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Project Detail View */}
      <div className="flex-1 flex flex-col">
        {selectedProjectId ? (
          <ProjectDetail
            project={projects.find((p) => p.id === selectedProjectId)!}
            events={getProjectEvents(projects.find((p) => p.id === selectedProjectId)!)}
            onEdit={() => setEditingProject(projects.find((p) => p.id === selectedProjectId)!)}
            onDelete={() => handleDeleteProject(selectedProjectId)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
            <div className="text-center">
              <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a project</p>
              <p className="text-sm mt-1">or create a new one to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreateModal || editingProject) && (
          <ProjectForm
            project={editingProject}
            onClose={() => {
              setShowCreateModal(false);
              setEditingProject(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: Project['status'] }) {
  const config = {
    active: { bg: 'bg-green-500/10', text: 'text-green-500', icon: Clock },
    archived: { bg: 'bg-zinc-500/10', text: 'text-zinc-500', icon: Archive },
    completed: { bg: 'bg-blue-500/10', text: 'text-blue-500', icon: CheckCircle },
  };

  const { bg, text, icon: Icon } = config[status];

  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${bg} ${text}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

// Project Detail Component
function ProjectDetail({
  project,
  events,
  onEdit,
  onDelete,
}: {
  project: Project;
  events: EventExtended[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const removeEventFromProject = useProjectStore((state) => state.removeEventFromProject);
  const selectEvent = useEventStore((state) => state.selectEvent);

  const handleRemoveEvent = async (eventId: string) => {
    await removeEventFromProject(project.id, eventId);
  };

  return (
    <>
      {/* Header */}
      <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            {project.description && (
              <p className="text-zinc-600 dark:text-zinc-400 mt-2">{project.description}</p>
            )}
            <div className="flex items-center gap-6 mt-4 text-sm text-zinc-500">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Updated {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={onDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Events ({events.length})
        </h2>

        {events.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 dark:text-zinc-400">
            <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No events in this project yet</p>
            <p className="text-sm mt-1">Drag events from the panel to add them</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => selectEvent(event.id)}
                  >
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {event.userTitle || event.title}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {event.userSummary || event.summary}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400">
                      <span>{event.startHms} - {event.endHms}</span>
                      {event.tags.length > 0 && (
                        <div className="flex gap-1">
                          {event.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveEvent(event.id)}
                    className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// Project Form Modal
function ProjectForm({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState<Project['status']>(project?.status || 'active');

  const createProject = useProjectStore((state) => state.createProject);
  const updateProject = useProjectStore((state) => state.updateProject);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (project) {
      await updateProject(project.id, { name, description, status });
    } else {
      await createProject(name, description);
    }

    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {project ? 'Edit Project' : 'Create New Project'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter project name..."
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-blue-500/50 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                rows={3}
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-blue-500/50 rounded-lg px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Status
              </label>
              <div className="flex gap-2">
                {(['active', 'archived', 'completed'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      status === s
                        ? 'bg-blue-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {project ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}