import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { 
  useEmployee, 
  useUpdateEmployee, 
  useEmployeeDepartments, 
  useEmployeePositions 
} from '../../hooks/useEmployees';
import toast from 'react-hot-toast';

const EditEmployeePage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form setup
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm();
  
  // Field array for bank accounts
  const { fields: bankAccountFields, append: appendBankAccount, remove: removeBankAccount } = useFieldArray({
    control,
    name: 'bankAccounts',
    rules: { maxLength: 2 }
  });
  
  // Queries and mutations
  const { data: employee, isLoading: employeeLoading, error } = useEmployee(id);
  const { data: departments } = useEmployeeDepartments();
  const { data: positions } = useEmployeePositions();
  const updateEmployeeMutation = useUpdateEmployee();
  
  // Initialize form with employee data
  useEffect(() => {
    if (employee) {
      const formData = {
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        nationalId: employee.nationalId || '',
        birthDate: employee.birthDate ? employee.birthDate.split('T')[0] : '',
        gender: employee.gender || '',
        address: employee.address || '',
        city: employee.city || '',
        district: employee.district || '',
        postalCode: employee.postalCode || '',
        departmentId: employee.departmentId || '',
        positionId: employee.positionId || '',
        salary: employee.salary || '',
        startDate: employee.startDate ? employee.startDate.split('T')[0] : '',
        employmentType: employee.employmentType || 'full_time',
        status: employee.status || 'active',
        bankAccounts: employee.bankAccounts && employee.bankAccounts.length > 0 
          ? employee.bankAccounts 
          : [{ iban: '', bankName: '', accountType: 'salary', isDefault: true }],
        emergencyContact: employee.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        },
        notes: employee.notes || ''
      };
      
      reset(formData);
    }
  }, [employee, reset]);
  
  // Form submission
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Clean up data
      const cleanedData = {
        ...data,
        id,
        salary: data.salary ? parseFloat(data.salary) : null,
        bankAccounts: data.bankAccounts.filter(account => account.iban.trim() !== ''),
        emergencyContact: Object.values(data.emergencyContact).some(val => val.trim() !== '') 
          ? data.emergencyContact 
          : null
      };
      
      await updateEmployeeMutation.mutateAsync(cleanedData);
      toast.success('Çalışan başarıyla güncellendi');
      navigate('/employees');
    } catch (error) {
      console.error('Update employee error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Add bank account
  const addBankAccount = () => {
    if (bankAccountFields.length < 2) {
      appendBankAccount({ 
        iban: '', 
        bankName: '', 
        accountType: 'expense', 
        isDefault: false 
      });
    }
  };
  
  // Remove bank account
  const removeBankAccountHandler = (index) => {
    if (bankAccountFields.length > 1) {
      removeBankAccount(index);
    }
  };
  
  // Set default bank account
  const setDefaultBankAccount = (index) => {
    bankAccountFields.forEach((_, i) => {
      setValue(`bankAccounts.${i}.isDefault`, i === index);
    });
  };
  
  // Format IBAN input
  const formatIban = (value) => {
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };
  
  const handleIbanChange = (index, value) => {
    const formatted = formatIban(value);
    setValue(`bankAccounts.${index}.iban`, formatted);
  };
  
  if (employeeLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Çalışan bilgileri yükleniyor...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h3>Hata Oluştu</h3>
        <p>{error.message}</p>
        <button onClick={() => navigate('/employees')} className="btn btn-primary">
          Çalışanlar Listesine Dön
        </button>
      </div>
    );
  }
  
  if (!employee) {
    return (
      <div className="error-container">
        <h3>Çalışan Bulunamadı</h3>
        <p>Aradığınız çalışan bulunamadı.</p>
        <button onClick={() => navigate('/employees')} className="btn btn-primary">
          Çalışanlar Listesine Dön
        </button>
      </div>
    );
  }
  
  return (
    <div className="edit-employee-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button 
            onClick={() => navigate('/employees')} 
            className="btn btn-outline btn-sm"
          >
            ← Geri
          </button>
          <h1>Çalışan Düzenle</h1>
          <p className="page-description">
            {employee.firstName} {employee.lastName} - ID: {employee.employeeId}
          </p>
        </div>
        <div className="header-actions">
          <button 
            type="button" 
            onClick={() => reset()} 
            className="btn btn-outline"
          >
            Değişiklikleri Geri Al
          </button>
          <button 
            type="submit" 
            form="employee-form"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
          </button>
        </div>
      </div>
      
      {/* Form */}
      <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="employee-form">
        <div className="form-sections">
          {/* Personal Information */}
          <div className="form-section">
            <h3>Kişisel Bilgiler</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="firstName">Ad *</label>
                <input
                  {...register('firstName', { 
                    required: 'Ad alanı zorunludur',
                    minLength: { value: 2, message: 'Ad en az 2 karakter olmalıdır' }
                  })}
                  type="text"
                  id="firstName"
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  placeholder="Adını girin"
                />
                {errors.firstName && (
                  <span className="error-message">{errors.firstName.message}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Soyad *</label>
                <input
                  {...register('lastName', { 
                    required: 'Soyad alanı zorunludur',
                    minLength: { value: 2, message: 'Soyad en az 2 karakter olmalıdır' }
                  })}
                  type="text"
                  id="lastName"
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  placeholder="Soyadını girin"
                />
                {errors.lastName && (
                  <span className="error-message">{errors.lastName.message}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email *</label>
                <input
                  {...register('email', { 
                    required: 'Email alanı zorunludur',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Geçerli bir email adresi girin'
                    }
                  })}
                  type="email"
                  id="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <span className="error-message">{errors.email.message}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Telefon</label>
                <input
                  {...register('phone', {
                    pattern: {
                      value: /^[0-9+\-\s()]+$/,
                      message: 'Geçerli bir telefon numarası girin'
                    }
                  })}
                  type="tel"
                  id="phone"
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="0555 123 45 67"
                />
                {errors.phone && (
                  <span className="error-message">{errors.phone.message}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="nationalId">TC Kimlik No</label>
                <input
                  {...register('nationalId', {
                    pattern: {
                      value: /^[0-9]{11}$/,
                      message: 'TC Kimlik No 11 haneli olmalıdır'
                    }
                  })}
                  type="text"
                  id="nationalId"
                  className={`form-input ${errors.nationalId ? 'error' : ''}`}
                  placeholder="12345678901"
                  maxLength={11}
                />
                {errors.nationalId && (
                  <span className="error-message">{errors.nationalId.message}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="birthDate">Doğum Tarihi</label>
                <input
                  {...register('birthDate')}
                  type="date"
                  id="birthDate"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="gender">Cinsiyet</label>
                <select
                  {...register('gender')}
                  id="gender"
                  className="form-select"
                >
                  <option value="">Seçiniz</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Work Information */}
          <div className="form-section">
            <h3>İş Bilgileri</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="departmentId">Departman *</label>
                <select
                  {...register('departmentId', { required: 'Departman seçimi zorunludur' })}
                  id="departmentId"
                  className={`form-select ${errors.departmentId ? 'error' : ''}`}
                >
                  <option value="">Departman Seçiniz</option>
                  {departments?.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                {errors.departmentId && (
                  <span className="error-message">{errors.departmentId.message}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="positionId">Pozisyon *</label>
                <select
                  {...register('positionId', { required: 'Pozisyon seçimi zorunludur' })}
                  id="positionId"
                  className={`form-select ${errors.positionId ? 'error' : ''}`}
                >
                  <option value="">Pozisyon Seçiniz</option>
                  {positions?.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
                {errors.positionId && (
                  <span className="error-message">{errors.positionId.message}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="salary">Maaş (TL)</label>
                <input
                  {...register('salary', {
                    min: { value: 0, message: 'Maaş 0\'dan büyük olmalıdır' }
                  })}
                  type="number"
                  id="salary"
                  className={`form-input ${errors.salary ? 'error' : ''}`}
                  placeholder="15000"
                  step="0.01"
                />
                {errors.salary && (
                  <span className="error-message">{errors.salary.message}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="startDate">İşe Başlama Tarihi *</label>
                <input
                  {...register('startDate', { required: 'İşe başlama tarihi zorunludur' })}
                  type="date"
                  id="startDate"
                  className={`form-input ${errors.startDate ? 'error' : ''}`}
                />
                {errors.startDate && (
                  <span className="error-message">{errors.startDate.message}</span>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="employmentType">Çalışma Tipi</label>
                <select
                  {...register('employmentType')}
                  id="employmentType"
                  className="form-select"
                >
                  <option value="full_time">Tam Zamanlı</option>
                  <option value="part_time">Yarı Zamanlı</option>
                  <option value="contract">Sözleşmeli</option>
                  <option value="intern">Stajyer</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Durum</label>
                <select
                  {...register('status')}
                  id="status"
                  className="form-select"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                  <option value="suspended">Askıda</option>
                  <option value="terminated">İşten Çıkarıldı</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Address Information */}
          <div className="form-section">
            <h3>Adres Bilgileri</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="address">Adres</label>
                <textarea
                  {...register('address')}
                  id="address"
                  className="form-textarea"
                  placeholder="Tam adres bilgisini girin"
                  rows={3}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="city">Şehir</label>
                <input
                  {...register('city')}
                  type="text"
                  id="city"
                  className="form-input"
                  placeholder="İstanbul"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="district">İlçe</label>
                <input
                  {...register('district')}
                  type="text"
                  id="district"
                  className="form-input"
                  placeholder="Kadıköy"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="postalCode">Posta Kodu</label>
                <input
                  {...register('postalCode')}
                  type="text"
                  id="postalCode"
                  className="form-input"
                  placeholder="34000"
                />
              </div>
            </div>
          </div>
          
          {/* Bank Information */}
          <div className="form-section">
            <h3>Banka Bilgileri</h3>
            <div className="bank-accounts-section">
              {bankAccountFields.map((field, index) => (
                <div key={field.id} className="bank-account-form">
                  <div className="bank-account-header">
                    <h4>Banka Hesabı {index + 1}</h4>
                    <div className="bank-account-actions">
                      <label className="checkbox-label">
                        <input
                          {...register(`bankAccounts.${index}.isDefault`)}
                          type="checkbox"
                          onChange={() => setDefaultBankAccount(index)}
                        />
                        Varsayılan Hesap
                      </label>
                      {bankAccountFields.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeBankAccountHandler(index)}
                          className="btn btn-sm btn-danger"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor={`bankAccounts.${index}.iban`}>IBAN *</label>
                      <input
                        {...register(`bankAccounts.${index}.iban`, {
                          required: index === 0 ? 'En az bir IBAN gereklidir' : false,
                          pattern: {
                            value: /^TR[0-9]{2}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}\s?[0-9]{2}$/,
                            message: 'Geçerli bir IBAN girin (TR ile başlamalı)'
                          }
                        })}
                        type="text"
                        id={`bankAccounts.${index}.iban`}
                        className={`form-input ${errors.bankAccounts?.[index]?.iban ? 'error' : ''}`}
                        placeholder="TR00 0000 0000 0000 0000 0000 00"
                        onChange={(e) => handleIbanChange(index, e.target.value)}
                        maxLength={32}
                      />
                      {errors.bankAccounts?.[index]?.iban && (
                        <span className="error-message">
                          {errors.bankAccounts[index].iban.message}
                        </span>
                      )}
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor={`bankAccounts.${index}.bankName`}>Banka Adı</label>
                      <input
                        {...register(`bankAccounts.${index}.bankName`)}
                        type="text"
                        id={`bankAccounts.${index}.bankName`}
                        className="form-input"
                        placeholder="Ziraat Bankası"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor={`bankAccounts.${index}.accountType`}>Hesap Türü</label>
                      <select
                        {...register(`bankAccounts.${index}.accountType`)}
                        id={`bankAccounts.${index}.accountType`}
                        className="form-select"
                      >
                        <option value="salary">Maaş Hesabı</option>
                        <option value="expense">Harcama Hesabı</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
              
              {bankAccountFields.length < 2 && (
                <button
                  type="button"
                  onClick={addBankAccount}
                  className="btn btn-outline add-bank-account"
                >
                  + İkinci IBAN Ekle
                </button>
              )}
            </div>
          </div>
          
          {/* Emergency Contact */}
          <div className="form-section">
            <h3>Acil Durum İletişim</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="emergencyContact.name">Ad Soyad</label>
                <input
                  {...register('emergencyContact.name')}
                  type="text"
                  id="emergencyContact.name"
                  className="form-input"
                  placeholder="Acil durum kişisinin adı"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="emergencyContact.relationship">Yakınlık</label>
                <select
                  {...register('emergencyContact.relationship')}
                  id="emergencyContact.relationship"
                  className="form-select"
                >
                  <option value="">Seçiniz</option>
                  <option value="spouse">Eş</option>
                  <option value="parent">Ebeveyn</option>
                  <option value="sibling">Kardeş</option>
                  <option value="child">Çocuk</option>
                  <option value="friend">Arkadaş</option>
                  <option value="other">Diğer</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="emergencyContact.phone">Telefon</label>
                <input
                  {...register('emergencyContact.phone')}
                  type="tel"
                  id="emergencyContact.phone"
                  className="form-input"
                  placeholder="0555 123 45 67"
                />
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="form-section">
            <h3>Notlar</h3>
            <div className="form-group full-width">
              <label htmlFor="notes">Ek Notlar</label>
              <textarea
                {...register('notes')}
                id="notes"
                className="form-textarea"
                placeholder="Çalışan hakkında ek bilgiler..."
                rows={4}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditEmployeePage;