import React from 'react';
import { ProjectHistoryCard, CardTheme } from './ProjectHistoryCard';

interface Project {
  id: string;
  title: string;
  theme: CardTheme;
  dateRange: string;
  tags: string[];
  year: number;
}

const mockProjects: Project[] = [
  { id: '1', title: "My Last Week's Diary", theme: 'blue', dateRange: '2.13-2.16', tags: ['People', 'Emotion'], year: 2026 },
  { id: '2', title: "Logic of event occurrence", theme: 'yellow', dateRange: '9.13-9.16', tags: ['Event', 'Time'], year: 2026 },
  { id: '3', title: "N/A", theme: 'green', dateRange: '10.18-10.19', tags: ['Emotion', 'Workflow'], year: 2026 },
  { id: '4', title: "Daily Reflection", theme: 'purple', dateRange: '1.14-2.12', tags: ['Color', 'Event'], year: 2025 },
  { id: '5', title: "Decision Making", theme: 'red', dateRange: '3.23-3.27', tags: ['Event', 'Emotion'], year: 2025 },
];

export function ProjectHistoryList() {
  const groupedProjects = mockProjects.reduce((acc, project) => {
    if (!acc[project.year]) acc[project.year] = [];
    acc[project.year].push(project);
    return acc;
  }, {} as Record<number, Project[]>);

  const years = Object.keys(groupedProjects).map(Number).sort((a, b) => b - a);

  return (
    <div className="flex flex-col gap-10 p-8 pt-4">
      <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">MemoryLib History</h2>
      
      {years.map(year => (
        <div key={year} className="flex flex-col gap-6">
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white">{year}</h3>
          <div className="flex flex-wrap gap-8">
            {groupedProjects[year].map(project => (
              <ProjectHistoryCard
                key={project.id}
                title={project.title}
                theme={project.theme}
                dateRange={project.dateRange}
                tags={project.tags}
                isNew={project.title === 'Decision Making'} // Just for testing the new button overlay
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
