import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  ColdStartConfig,
  ActivePanel,
  Notification,
  ZoomLevel,
  PanelFilter,
  LayoutType,
} from '../types/global';

interface UIState {
  // Authentication
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;

  // Cold Start
  coldStartCompleted: boolean;
  coldStartConfig: ColdStartConfig | null;

  // UI State
  activePanel: ActivePanel;
  sidebarCollapsed: boolean;
  rightPanelWidth: number;
  leftPanelWidth: number;

  // Panel State
  panelZoomLevel: ZoomLevel;
  panelLayout: LayoutType;
  panelFilter: PanelFilter;

  // Notifications
  notifications: Notification[];

  // Actions - Auth
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;

  // Actions - Cold Start
  completeColdStart: (config: ColdStartConfig) => void;
  resetColdStart: () => void;

  // Actions - UI
  setActivePanel: (panel: ActivePanel) => void;
  toggleSidebar: () => void;
  setRightPanelWidth: (width: number) => void;
  setLeftPanelWidth: (width: number) => void;

  // Actions - Panel
  setPanelZoomLevel: (level: ZoomLevel) => void;
  setPanelLayout: (layout: LayoutType) => void;
  setPanelFilter: (filter: Partial<PanelFilter>) => void;
  resetPanelFilter: () => void;

  // Actions - Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

const DEFAULT_PANEL_FILTER: PanelFilter = {
  timeRange: { start: null, end: null },
  eventTypes: [],
  emotions: [],
  people: [],
  locations: [],
  keywords: [],
};

export const useUIStore = create<UIState>()(
  persist(
    (set, _get) => ({
      // Auth
      isAuthenticated: false,
      user: null,
      isLoading: false,

      // Cold Start
      coldStartCompleted: false,
      coldStartConfig: null,

      // UI
      activePanel: 'panel',
      sidebarCollapsed: false,
      rightPanelWidth: 320,
      leftPanelWidth: 320,

      // Panel
      panelZoomLevel: 1,
      panelLayout: 'graph',
      panelFilter: DEFAULT_PANEL_FILTER,

      // Notifications
      notifications: [],

      // Auth Actions
      login: (user) => {
        set({
          isAuthenticated: true,
          user,
          isLoading: false,
        });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          coldStartCompleted: false,
          coldStartConfig: null,
        });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      // Cold Start Actions
      completeColdStart: (config) => {
        set({
          coldStartCompleted: true,
          coldStartConfig: config,
        });
      },

      resetColdStart: () => {
        set({
          coldStartCompleted: false,
          coldStartConfig: null,
        });
      },

      // UI Actions
      setActivePanel: (panel) => {
        set({ activePanel: panel });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setRightPanelWidth: (width) => {
        set({ rightPanelWidth: Math.max(280, Math.min(600, width)) });
      },

      setLeftPanelWidth: (width) => {
        set({ leftPanelWidth: Math.max(280, Math.min(600, width)) });
      },

      // Panel Actions
      setPanelZoomLevel: (level) => {
        set({ panelZoomLevel: level });
      },

      setPanelLayout: (layout) => {
        set({ panelLayout: layout });
      },

      setPanelFilter: (filter) => {
        set((state) => ({
          panelFilter: { ...state.panelFilter, ...filter },
        }));
      },

      resetPanelFilter: () => {
        set({ panelFilter: DEFAULT_PANEL_FILTER });
      },

      // Notification Actions
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: crypto.randomUUID(),
          timestamp: new Date(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'memorylib-ui-storage',
      partialize: (state) => ({
        // Only persist these fields
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        coldStartCompleted: state.coldStartCompleted,
        coldStartConfig: state.coldStartConfig,
        rightPanelWidth: state.rightPanelWidth,
        leftPanelWidth: state.leftPanelWidth,
        panelLayout: state.panelLayout,
      }),
    }
  )
);

// Selectors
export const selectIsAuthenticated = (state: UIState) => state.isAuthenticated;
export const selectUser = (state: UIState) => state.user;
export const selectColdStartCompleted = (state: UIState) => state.coldStartCompleted;
export const selectActivePanel = (state: UIState) => state.activePanel;
export const selectPanelZoomLevel = (state: UIState) => state.panelZoomLevel;
export const selectPanelFilter = (state: UIState) => state.panelFilter;
