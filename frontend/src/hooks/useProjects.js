import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ProjectService from '../services/projectService';
import toast from 'react-hot-toast';

// Query Keys
export const PROJECT_QUERY_KEYS = {
  all: ['projects'],
  lists: () => [...PROJECT_QUERY_KEYS.all, 'list'],
  list: (filters) => [...PROJECT_QUERY_KEYS.lists(), filters],
  details: () => [...PROJECT_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...PROJECT_QUERY_KEYS.details(), id],
  tasks: (projectId) => [...PROJECT_QUERY_KEYS.all, 'tasks', projectId],
  timeline: (projectId) => [...PROJECT_QUERY_KEYS.all, 'timeline', projectId],
  analytics: () => [...PROJECT_QUERY_KEYS.all, 'analytics'],
  reports: (projectId) => [...PROJECT_QUERY_KEYS.all, 'reports', projectId],
};

// Get all projects
export const useProjects = (params = {}) => {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.list(params),
    queryFn: () => ProjectService.getAll(params),
    keepPreviousData: true,
  });
};

// Get single project
export const useProject = (id) => {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.detail(id),
    queryFn: () => ProjectService.getById(id),
    enabled: !!id,
  });
};

// Create project mutation
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ProjectService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
      toast.success('Proje başarıyla oluşturuldu');
    },
  });
};

// Update project mutation
export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => ProjectService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(variables.id) });
      toast.success('Proje başarıyla güncellendi');
    },
  });
};

// Delete project mutation
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ProjectService.delete,
    onSuccess: (data, projectId) => {
      queryClient.removeQueries({ queryKey: PROJECT_QUERY_KEYS.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
      toast.success('Proje başarıyla silindi');
    },
  });
};

// Update project status
export const useUpdateProjectStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => ProjectService.updateStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(variables.id) });
      toast.success('Proje durumu güncellendi');
    },
  });
};

// Project Tasks Hooks
export const useProjectTasks = (projectId, params = {}) => {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.tasks(projectId),
    queryFn: () => ProjectService.getTasks(projectId, params),
    enabled: !!projectId,
  });
};

export const useCreateProjectTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, data }) => ProjectService.createTask(projectId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.tasks(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(variables.projectId) });
      toast.success('Görev başarıyla oluşturuldu');
    },
  });
};

export const useUpdateProjectTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, taskId, data }) => ProjectService.updateTask(projectId, taskId, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.tasks(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(variables.projectId) });
      toast.success('Görev başarıyla güncellendi');
    },
  });
};

export const useDeleteProjectTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ projectId, taskId }) => ProjectService.deleteTask(projectId, taskId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.tasks(variables.projectId) });
      queryClient.invalidateQueries({ queryKey: PROJECT_QUERY_KEYS.detail(variables.projectId) });
      toast.success('Görev başarıyla silindi');
    },
  });
};

// Project Timeline
export const useProjectTimeline = (projectId) => {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.timeline(projectId),
    queryFn: () => ProjectService.getTimeline(projectId),
    enabled: !!projectId,
  });
};

// Project Analytics
export const useProjectAnalytics = (params = {}) => {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.analytics(),
    queryFn: () => ProjectService.getProjectAnalytics(params),
  });
};

// Project Reports
export const useProjectReport = (projectId) => {
  return useQuery({
    queryKey: PROJECT_QUERY_KEYS.reports(projectId),
    queryFn: () => ProjectService.getProjectReport(projectId),
    enabled: !!projectId,
  });
};

export const useExportProject = () => {
  return useMutation({
    mutationFn: ({ id, format }) => ProjectService.exportProject(id, format),
    onSuccess: (response, variables) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project-${variables.id}.${variables.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Proje başarıyla dışa aktarıldı');
    },
  });
};