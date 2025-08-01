import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import UserService from '../services/userAPI';
import toast from 'react-hot-toast';

// Query Keys
export const USER_QUERY_KEYS = {
  all: ['users'],
  lists: () => [...USER_QUERY_KEYS.all, 'list'],
  list: (filters) => [...USER_QUERY_KEYS.lists(), filters],
  details: () => [...USER_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...USER_QUERY_KEYS.details(), id],
  roles: () => ['roles'],
  permissions: (id) => [...USER_QUERY_KEYS.all, 'permissions', id],
  activity: (id) => [...USER_QUERY_KEYS.all, 'activity', id],
  statistics: () => [...USER_QUERY_KEYS.all, 'statistics'],
  search: (query) => [...USER_QUERY_KEYS.all, 'search', query],
};

// Get all users
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.list(params),
    queryFn: () => UserService.getAll(params),
    keepPreviousData: true,
  });
};

// Get single user
export const useUser = (id) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.detail(id),
    queryFn: () => UserService.getById(id),
    enabled: !!id,
  });
};

// Create user mutation
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: UserService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.statistics() });
      toast.success('Kullanıcı başarıyla oluşturuldu');
    },
  });
};

// Update user mutation
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }) => UserService.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(variables.id) });
      toast.success('Kullanıcı başarıyla güncellendi');
    },
  });
};

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: UserService.delete,
    onSuccess: (data, userId) => {
      queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.detail(userId) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.statistics() });
      toast.success('Kullanıcı başarıyla silindi');
    },
  });
};

// Update user status
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }) => UserService.updateStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(variables.id) });
      toast.success('Kullanıcı durumu güncellendi');
    },
  });
};

// Change user password
export const useChangeUserPassword = () => {
  return useMutation({
    mutationFn: ({ id, data }) => UserService.changePassword(id, data),
    onSuccess: () => {
      toast.success('Kullanıcı şifresi başarıyla değiştirildi');
    },
  });
};

// Reset user password
export const useResetUserPassword = () => {
  return useMutation({
    mutationFn: UserService.resetPassword,
    onSuccess: () => {
      toast.success('Kullanıcı şifresi sıfırlandı');
    },
  });
};

// Get user roles
export const useUserRoles = () => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.roles(),
    queryFn: UserService.getRoles,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Get user permissions
export const useUserPermissions = (id) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.permissions(id),
    queryFn: () => UserService.getPermissions(id),
    enabled: !!id,
  });
};

// Update user permissions
export const useUpdateUserPermissions = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, permissions }) => UserService.updatePermissions(id, permissions),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.permissions(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(variables.id) });
      toast.success('Kullanıcı yetkileri güncellendi');
    },
  });
};

// Assign role to user
export const useAssignUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, roleId }) => UserService.assignRole(id, roleId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      toast.success('Rol başarıyla atandı');
    },
  });
};

// Remove role from user
export const useRemoveUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, roleId }) => UserService.removeRole(id, roleId),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      toast.success('Rol başarıyla kaldırıldı');
    },
  });
};

// Get user activity log
export const useUserActivity = (id, params = {}) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.activity(id),
    queryFn: () => UserService.getActivityLog(id, params),
    enabled: !!id,
  });
};

// Bulk operations
export const useBulkDeleteUsers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: UserService.bulkDelete,
    onSuccess: (data, userIds) => {
      userIds.forEach(id => {
        queryClient.removeQueries({ queryKey: USER_QUERY_KEYS.detail(id) });
      });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.statistics() });
      toast.success(`${userIds.length} kullanıcı başarıyla silindi`);
    },
  });
};

export const useBulkUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ids, status }) => UserService.bulkUpdateStatus(ids, status),
    onSuccess: (data, variables) => {
      variables.ids.forEach(id => {
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.detail(id) });
      });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      toast.success(`${variables.ids.length} kullanıcı durumu güncellendi`);
    },
  });
};

// Search users
export const useUserSearch = (query, params = {}) => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.search(query),
    queryFn: () => UserService.search(query, params),
    enabled: !!query && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Get user statistics
export const useUserStatistics = () => {
  return useQuery({
    queryKey: USER_QUERY_KEYS.statistics(),
    queryFn: UserService.getStatistics,
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

// Export users
export const useExportUsers = () => {
  return useMutation({
    mutationFn: ({ format, filters }) => UserService.export(format, filters),
    onSuccess: (response, variables) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `users.${variables.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Kullanıcılar başarıyla dışa aktarıldı');
    },
  });
};

// Import users
export const useImportUsers = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: UserService.import,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEYS.statistics() });
      toast.success('Kullanıcılar başarıyla içe aktarıldı');
    },
  });
};