import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiCheck, FiX, FiLock } from 'react-icons/fi';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import {
  useUsers,
  useCreateUser,
  useDeleteUser,
  useUpdateUserStatus,
  useChangeUserPassword,
} from '../../hooks/useUsers';
import toast from 'react-hot-toast';
import DeleteButton from '../../components/DeleteButton';

const UsersPage = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const { user: currentUser } = useSelector(state => state.auth);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Şifre değiştirme formu için
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm();

  // React Query hooks
  const { data: usersData, isLoading } = useUsers();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  const updateUserStatusMutation = useUpdateUserStatus();
  const changePasswordMutation = useChangeUserPassword();

  const users = usersData?.users || [];

  const handleCreateUser = async data => {
    try {
      await createUserMutation.mutateAsync(data);
      setShowCreateModal(false);
      reset();
    } catch (error) {
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(err.msg);
        });
      }
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await updateUserStatusMutation.mutateAsync({
        id: userId,
        status: !currentStatus,
      });
    } catch (error) {
      toast.error('Kullanıcı durumu güncellenirken hata oluştu');
    }
  };

  const handleDeleteClick = user => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      await deleteUserMutation.mutateAsync(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Kullanıcı silinirken hata oluştu'
      );
    }
  };

  const handlePasswordChangeClick = () => {
    setShowPasswordModal(true);
    setPasswordError('');
    resetPasswordForm();
  };

  const handleChangePassword = async data => {
    setPasswordError('');
    try {
      await changePasswordMutation.mutateAsync({ id: currentUser.id, data });
      setShowPasswordModal(false);
      resetPasswordForm();
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || 'Şifre değiştirilirken hata oluştu'
      );
    }
  };

  const getRoleBadgeClass = role => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'operator':
        return 'bg-orange-100 text-orange-800';
      case 'viewer':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleText = role => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'operator':
        return 'Operatör';
      case 'viewer':
        return 'Görüntüleyici';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Kullanıcı Yönetimi
          </h1>
          <p className="text-secondary-600">
            Sistem kullanıcılarını yönetin (Sadece Admin)
          </p>
        </div>
        <div className="card">
          <div className="animate-pulse py-12">
            <div className="text-center">
              <div className="mx-auto h-4 w-32 rounded bg-secondary-200"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">
            Kullanıcı Yönetimi
          </h1>
          <p className="text-secondary-600">
            Sistem kullanıcılarını yönetin (Sadece Admin)
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <FiPlus className="mr-2 h-4 w-4" />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200">
            <thead className="bg-secondary-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                  E-posta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                  Oluşturma Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-secondary-500">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 bg-white">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-secondary-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                        <span className="text-sm font-medium text-primary-600">
                          {user.firstName?.charAt(0)}
                          {user.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-secondary-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-secondary-500">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-900">
                    {user.email}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeClass(user.role)}`}
                    >
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        user.isActive
                          ? 'bg-success-100 text-success-800'
                          : 'bg-error-100 text-error-800'
                      }`}
                    >
                      {user.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-secondary-500">
                    {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          handleToggleUserStatus(user.id, user.isActive)
                        }
                        className={`${
                          user.isActive
                            ? 'text-warning-600 hover:text-warning-900'
                            : 'text-success-600 hover:text-success-900'
                        }`}
                        title={
                          user.isActive
                            ? 'Kullanıcıyı Pasifleştir'
                            : 'Kullanıcıyı Aktifleştir'
                        }
                      >
                        {user.isActive ? (
                          <FiX className="h-4 w-4" />
                        ) : (
                          <FiCheck className="h-4 w-4" />
                        )}
                      </button>

                      {currentUser?.id !== user.id && (
                        <DeleteButton
                          onClick={() => handleDeleteClick(user)}
                          isLoading={deleteUserMutation.isLoading}
                          size="sm"
                          variant="outline"
                          className="p-1"
                        />
                      )}
                      {currentUser?.id === user.id && (
                        <button
                          onClick={handlePasswordChangeClick}
                          className="text-primary-600 hover:text-primary-900"
                          title="Şifre Değiştir"
                        >
                          <FiLock className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-secondary-900">
                Yeni Kullanıcı Oluştur
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  reset();
                }}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit(handleCreateUser)}
              className="space-y-4"
            >
              {/* Username */}
              <div className="form-group">
                <label className="form-label">Kullanıcı Adı</label>
                <input
                  {...register('username', {
                    required: 'Kullanıcı adı gereklidir',
                    minLength: {
                      value: 3,
                      message: 'En az 3 karakter olmalıdır',
                    },
                  })}
                  type="text"
                  className={`form-input ${errors.username ? 'border-error-300' : ''}`}
                  placeholder="kullanici_adi"
                />
                {errors.username && (
                  <p className="form-error">{errors.username.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">E-posta</label>
                <input
                  {...register('email', {
                    required: 'E-posta gereklidir',
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: 'Geçerli bir e-posta adresi giriniz',
                    },
                  })}
                  type="email"
                  className={`form-input ${errors.email ? 'border-error-300' : ''}`}
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="form-error">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Şifre</label>
                <input
                  {...register('password', {
                    required: 'Şifre gereklidir',
                    minLength: {
                      value: 6,
                      message: 'En az 6 karakter olmalıdır',
                    },
                  })}
                  type="password"
                  className={`form-input ${errors.password ? 'border-error-300' : ''}`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              {/* First Name */}
              <div className="form-group">
                <label className="form-label">Ad</label>
                <input
                  {...register('firstName', {
                    required: 'Ad gereklidir',
                    minLength: {
                      value: 2,
                      message: 'En az 2 karakter olmalıdır',
                    },
                  })}
                  type="text"
                  className={`form-input ${errors.firstName ? 'border-error-300' : ''}`}
                  placeholder="Ad"
                />
                {errors.firstName && (
                  <p className="form-error">{errors.firstName.message}</p>
                )}
              </div>

              {/* Last Name */}
              <div className="form-group">
                <label className="form-label">Soyad</label>
                <input
                  {...register('lastName', {
                    required: 'Soyad gereklidir',
                    minLength: {
                      value: 2,
                      message: 'En az 2 karakter olmalıdır',
                    },
                  })}
                  type="text"
                  className={`form-input ${errors.lastName ? 'border-error-300' : ''}`}
                  placeholder="Soyad"
                />
                {errors.lastName && (
                  <p className="form-error">{errors.lastName.message}</p>
                )}
              </div>

              {/* Role */}
              <div className="form-group">
                <label className="form-label">Rol</label>
                <select
                  {...register('role', { required: 'Rol seçimi gereklidir' })}
                  className={`form-input ${errors.role ? 'border-error-300' : ''}`}
                >
                  <option value="">Rol seçiniz</option>
                  <option value="admin">Admin</option>
                  <option value="operator">Operatör</option>
                  <option value="viewer">Görüntüleyici</option>
                </select>
                {errors.role && (
                  <p className="form-error">{errors.role.message}</p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    reset();
                  }}
                  className="btn-secondary"
                  disabled={createUserMutation.isLoading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createUserMutation.isLoading}
                >
                  {createUserMutation.isLoading
                    ? 'Oluşturuluyor...'
                    : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-secondary-900">
                Kullanıcıyı Sil
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="text-secondary-400 hover:text-secondary-600"
                disabled={deleteUserMutation.isLoading}
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="mb-4 flex items-center">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-error-100">
                  <FiTrash2 className="h-6 w-6 text-error-600" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-medium text-secondary-900">
                    Kullanıcıyı silmek istediğinizden emin misiniz?
                  </h4>
                  <p className="mt-1 text-sm text-secondary-600">
                    Bu işlem geri alınamaz.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-secondary-50 p-4">
                <div className="flex items-center">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                    <span className="text-sm font-medium text-primary-600">
                      {userToDelete.firstName?.charAt(0)}
                      {userToDelete.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-secondary-900">
                      {userToDelete.firstName} {userToDelete.lastName}
                    </div>
                    <div className="text-sm text-secondary-500">
                      @{userToDelete.username} • {userToDelete.email}
                    </div>
                    <div className="text-xs text-secondary-400">
                      {getRoleText(userToDelete.role)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="btn-secondary"
                disabled={deleteUserMutation.isLoading}
              >
                İptal
              </button>
              <button
                onClick={handleDeleteUser}
                className="rounded-lg bg-error-600 px-4 py-2 font-medium text-white hover:bg-error-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={deleteUserMutation.isLoading}
              >
                {deleteUserMutation.isLoading ? (
                  <div className="flex items-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    Siliniyor...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <FiTrash2 className="mr-2 h-4 w-4" />
                    Kullanıcıyı Sil
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Şifre Değiştir Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-secondary-900">
                Şifre Değiştir
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  resetPasswordForm();
                }}
                className="text-secondary-400 hover:text-secondary-600"
                disabled={changePasswordMutation.isLoading}
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <form
              onSubmit={handlePasswordSubmit(handleChangePassword)}
              className="space-y-4"
            >
              <div className="form-group">
                <label className="form-label">Mevcut Şifre</label>
                <input
                  {...registerPassword('oldPassword', {
                    required: 'Mevcut şifre gereklidir',
                  })}
                  type="password"
                  className={`form-input ${passwordErrors.oldPassword ? 'border-error-300' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                {passwordErrors.oldPassword && (
                  <p className="form-error">
                    {passwordErrors.oldPassword.message}
                  </p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Yeni Şifre</label>
                <input
                  {...registerPassword('newPassword', {
                    required: 'Yeni şifre gereklidir',
                    minLength: {
                      value: 6,
                      message: 'En az 6 karakter olmalıdır',
                    },
                  })}
                  type="password"
                  className={`form-input ${passwordErrors.newPassword ? 'border-error-300' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {passwordErrors.newPassword && (
                  <p className="form-error">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>
              {passwordError && (
                <p className="form-error text-center">{passwordError}</p>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    resetPasswordForm();
                  }}
                  className="btn-secondary"
                  disabled={changePasswordMutation.isLoading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={changePasswordMutation.isLoading}
                >
                  {changePasswordMutation.isLoading
                    ? 'Kaydediliyor...'
                    : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
