import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { useCreateEmployee, useEmployeeDepartments, useEmployeePositions } from '../../hooks/useEmployees';
import { FiArrowLeft, FiUser, FiBriefcase, FiMapPin, FiCreditCard, FiPhone, FiFileText, FiPlus, FiTrash2, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const NewEmployeePage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  const steps = [
    { id: 1, title: 'Kişisel Bilgiler', icon: FiUser },
    { id: 2, title: 'Adres Bilgileri', icon: FiMapPin },
    { id: 3, title: 'İş Bilgileri', icon: FiBriefcase },
    { id: 4, title: 'Banka Bilgileri', icon: FiCreditCard },
    { id: 5, title: 'İletişim & Notlar', icon: FiPhone }
  ];
  
  // Form setup
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nationalId: '',
      birthDate: '',
      gender: '',
      address: '',
      city: '',
      district: '',
      postalCode: '',
      departmentId: '',
      positionId: '',
      salary: '',
      startDate: '',
      employmentType: 'full_time',
      status: 'active',
      bankAccounts: [
        { iban: '', bankName: '', accountType: 'salary', isDefault: true }
      ],
      emergencyContact: {
        name: '',
        relationship: '',
        phone: ''
      },
      notes: ''
    }
  });
  
  // Field array for bank accounts
  const { fields: bankAccountFields, append: appendBankAccount, remove: removeBankAccount } = useFieldArray({
    control,
    name: 'bankAccounts',
    rules: { maxLength: 2 }
  });
  
  // Queries and mutations
  const { data: departments } = useEmployeeDepartments();
  const { data: positions } = useEmployeePositions();
  const createEmployeeMutation = useCreateEmployee();
  
  // Form submission
  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      // Clean up data
      const cleanedData = {
        ...data,
        salary: data.salary ? parseFloat(data.salary) : null,
        bankAccounts: data.bankAccounts.filter(account => account.iban.trim() !== ''),
        emergencyContact: Object.values(data.emergencyContact).some(val => val.trim() !== '') 
          ? data.emergencyContact 
          : null
      };
      
      await createEmployeeMutation.mutateAsync(cleanedData);
      toast.success('Çalışan başarıyla oluşturuldu');
      navigate('/employees');
    } catch (error) {
      console.error('Create employee error:', error);
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
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    // Add spaces every 4 characters
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };
  
  const handleIbanChange = (index, value) => {
    const formatted = formatIban(value);
    setValue(`bankAccounts.${index}.iban`, formatted);
  };
  
  // Step navigation
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const goToStep = (step) => {
    setCurrentStep(step);
  };
  
  return (
    <div className="min-h-screen bg-secondary-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button 
              onClick={() => navigate('/employees')} 
              className="btn-secondary inline-flex items-center"
            >
              <FiArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </button>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Yeni Çalışan Ekle</h1>
              <p className="text-secondary-600 mt-1">
                Adım {currentStep} / {totalSteps}: {steps[currentStep - 1].title}
              </p>
            </div>
          </div>
          
          {/* Stepper */}
          <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const isClickable = true; // Allow clicking on any step
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => isClickable ? goToStep(step.id) : null}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isCompleted 
                            ? 'bg-success-500 text-white' 
                            : isActive 
                            ? 'bg-primary-500 text-white' 
                            : 'bg-secondary-200 text-secondary-500'
                        } ${isClickable ? 'hover:opacity-80 cursor-pointer' : 'cursor-default'}`}
                        disabled={!isClickable}
                      >
                        {isCompleted ? (
                          <FiCheck className="w-5 h-5" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </button>
                      <span className={`text-xs mt-2 text-center ${
                        isActive ? 'text-primary-600 font-medium' : 'text-secondary-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? 'bg-success-500' : 'bg-secondary-200'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Form */}
        <form id="employee-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FiUser className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-secondary-900">Kişisel Bilgiler</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label htmlFor="firstName" className="block text-sm font-medium text-secondary-700">Ad *</label>
                  <input
                    {...register('firstName', { 
                      required: 'Ad alanı zorunludur',
                      minLength: { value: 2, message: 'Ad en az 2 karakter olmalıdır' }
                    })}
                    type="text"
                    id="firstName"
                    className={`form-input ${errors.firstName ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Adını girin"
                  />
                  {errors.firstName && (
                    <span className="text-sm text-error-600">{errors.firstName.message}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="lastName" className="block text-sm font-medium text-secondary-700">Soyad *</label>
                  <input
                    {...register('lastName', { 
                      required: 'Soyad alanı zorunludur',
                      minLength: { value: 2, message: 'Soyad en az 2 karakter olmalıdır' }
                    })}
                    type="text"
                    id="lastName"
                    className={`form-input ${errors.lastName ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="Soyadını girin"
                  />
                  {errors.lastName && (
                    <span className="text-sm text-error-600">{errors.lastName.message}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700">Email *</label>
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
                    className={`form-input ${errors.email ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="email@example.com"
                  />
                  {errors.email && (
                    <span className="text-sm text-error-600">{errors.email.message}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="phone" className="block text-sm font-medium text-secondary-700">Telefon</label>
                  <input
                    {...register('phone', {
                      pattern: {
                        value: /^[0-9+\-\s()]+$/,
                        message: 'Geçerli bir telefon numarası girin'
                      }
                    })}
                    type="tel"
                    id="phone"
                    className={`form-input ${errors.phone ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="0555 123 45 67"
                  />
                  {errors.phone && (
                    <span className="text-sm text-error-600">{errors.phone.message}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="nationalId" className="block text-sm font-medium text-secondary-700">TC Kimlik No</label>
                  <input
                    {...register('nationalId', {
                      pattern: {
                        value: /^[0-9]{11}$/,
                        message: 'TC Kimlik No 11 haneli olmalıdır'
                      }
                    })}
                    type="text"
                    id="nationalId"
                    className={`form-input ${errors.nationalId ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="12345678901"
                    maxLength={11}
                  />
                  {errors.nationalId && (
                    <span className="text-sm text-error-600">{errors.nationalId.message}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="birthDate" className="block text-sm font-medium text-secondary-700">Doğum Tarihi</label>
                  <input
                    {...register('birthDate')}
                    type="date"
                    id="birthDate"
                    className="form-input"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="gender" className="block text-sm font-medium text-secondary-700">Cinsiyet</label>
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
          )}
          
          {/* Step 2: Address Information */}
          {currentStep === 2 && (
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FiMapPin className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-secondary-900">Adres Bilgileri</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1 md:col-span-2 lg:col-span-3">
                  <label htmlFor="address" className="block text-sm font-medium text-secondary-700">Adres</label>
                  <textarea
                    {...register('address')}
                    id="address"
                    className="form-textarea"
                    placeholder="Tam adres bilgisini girin"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="city" className="block text-sm font-medium text-secondary-700">Şehir</label>
                  <input
                    {...register('city')}
                    type="text"
                    id="city"
                    className="form-input"
                    placeholder="İstanbul"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="district" className="block text-sm font-medium text-secondary-700">İlçe</label>
                  <input
                    {...register('district')}
                    type="text"
                    id="district"
                    className="form-input"
                    placeholder="Kadıköy"
                  />
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="postalCode" className="block text-sm font-medium text-secondary-700">Posta Kodu</label>
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
          )}
          
          {/* Step 3: Work Information */}
          {currentStep === 3 && (
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FiBriefcase className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-secondary-900">İş Bilgileri</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label htmlFor="departmentId" className="block text-sm font-medium text-secondary-700">Departman *</label>
                  <select
                    {...register('departmentId', { required: 'Departman seçimi zorunludur' })}
                    id="departmentId"
                    className={`form-select ${errors.departmentId ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                  >
                    <option value="">Departman Seçiniz</option>
                    {departments?.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  {errors.departmentId && (
                    <span className="text-sm text-error-600">{errors.departmentId.message}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="positionId" className="block text-sm font-medium text-secondary-700">Pozisyon *</label>
                  <select
                    {...register('positionId', { required: 'Pozisyon seçimi zorunludur' })}
                    id="positionId"
                    className={`form-select ${errors.positionId ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                  >
                    <option value="">Pozisyon Seçiniz</option>
                    {positions?.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                  {errors.positionId && (
                    <span className="text-sm text-error-600">{errors.positionId.message}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="startDate" className="block text-sm font-medium text-secondary-700">İşe Başlama Tarihi *</label>
                  <input
                    {...register('startDate', { required: 'İşe başlama tarihi zorunludur' })}
                    type="date"
                    id="startDate"
                    className={`form-input ${errors.startDate ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                  />
                  {errors.startDate && (
                    <span className="text-sm text-error-600">{errors.startDate.message}</span>
                  )}
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="employmentType" className="block text-sm font-medium text-secondary-700">Çalışma Tipi</label>
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
                
                <div className="space-y-1">
                  <label htmlFor="status" className="block text-sm font-medium text-secondary-700">Durum</label>
                  <select
                    {...register('status')}
                    id="status"
                    className="form-select"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                    <option value="suspended">Askıda</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label htmlFor="salary" className="block text-sm font-medium text-secondary-700">Maaş (TL) *</label>
                  <input
                    {...register('salary', {
                      required: 'Maaş gereklidir',
                      min: { value: 0, message: 'Maaş 0\'dan büyük olmalıdır' }
                    })}
                    type="number"
                    id="salary"
                    className={`form-input ${errors.salary ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                    placeholder="15000"
                    step="0.01"
                  />
                  {errors.salary && (
                    <span className="text-sm text-error-600">
                      {errors.salary.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Bank Information */}
          {currentStep === 4 && (
            <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <FiCreditCard className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-secondary-900">Banka Bilgileri</h3>
              </div>
              <div className="space-y-6">
                {bankAccountFields.map((field, index) => (
                  <div key={field.id} className="border border-secondary-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-medium text-secondary-900">Banka Hesabı {index + 1}</h4>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            {...register(`bankAccounts.${index}.isDefault`)}
                            type="checkbox"
                            onChange={() => setDefaultBankAccount(index)}
                            className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-secondary-700">Varsayılan Hesap</span>
                        </label>
                        {bankAccountFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeBankAccountHandler(index)}
                            className="text-error-600 hover:text-error-700 p-1 rounded transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-10 gap-4">
                        <div className="space-y-1 md:col-span-5">
                          <label htmlFor={`bankAccounts.${index}.iban`} className="block text-sm font-medium text-secondary-700">IBAN *</label>
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
                            className={`form-input ${errors.bankAccounts?.[index]?.iban ? 'border-error-500 focus:ring-error-500 focus:border-error-500' : ''}`}
                            placeholder="TR00 0000 0000 0000 0000 0000 00"
                            onChange={(e) => handleIbanChange(index, e.target.value)}
                            maxLength={32}
                          />
                          {errors.bankAccounts?.[index]?.iban && (
                            <span className="text-sm text-error-600">
                              {errors.bankAccounts[index].iban.message}
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-1 md:col-span-3">
                          <label htmlFor={`bankAccounts.${index}.bankName`} className="block text-sm font-medium text-secondary-700">Banka Adı</label>
                          <select
                            {...register(`bankAccounts.${index}.bankName`)}
                            id={`bankAccounts.${index}.bankName`}
                            className="form-select"
                          >
                            <option value="">Banka Seçiniz</option>
                            <option value="Türkiye Cumhuriyet Merkez Bankası">Türkiye Cumhuriyet Merkez Bankası</option>
                            <option value="Türkiye Garanti Bankası A.Ş.">Türkiye Garanti Bankası A.Ş.</option>
                            <option value="Türkiye İş Bankası A.Ş.">Türkiye İş Bankası A.Ş.</option>
                            <option value="Yapı ve Kredi Bankası A.Ş.">Yapı ve Kredi Bankası A.Ş.</option>
                            <option value="Akbank T.A.Ş.">Akbank T.A.Ş.</option>
                            <option value="Türkiye Halk Bankası A.Ş.">Türkiye Halk Bankası A.Ş.</option>
                            <option value="Türkiye Ziraat Bankası A.Ş.">Türkiye Ziraat Bankası A.Ş.</option>
                            <option value="Türkiye Vakıflar Bankası T.A.O.">Türkiye Vakıflar Bankası T.A.O.</option>
                            <option value="QNB Finansbank A.Ş.">QNB Finansbank A.Ş.</option>
                            <option value="DenizBank A.Ş.">DenizBank A.Ş.</option>
                            <option value="HSBC Bank A.Ş.">HSBC Bank A.Ş.</option>
                            <option value="ING Bank A.Ş.">ING Bank A.Ş.</option>
                            <option value="Şekerbank T.A.Ş.">Şekerbank T.A.Ş.</option>
                            <option value="Turkish Bank A.Ş.">Turkish Bank A.Ş.</option>
                            <option value="Alternatifbank A.Ş.">Alternatifbank A.Ş.</option>
                            <option value="Anadolubank A.Ş.">Anadolubank A.Ş.</option>
                            <option value="Fibabanka A.Ş.">Fibabanka A.Ş.</option>
                            <option value="Odeabank A.Ş.">Odeabank A.Ş.</option>
                            <option value="Türk Ekonomi Bankası A.Ş.">Türk Ekonomi Bankası A.Ş.</option>
                            <option value="Türkiye Finans Katılım Bankası A.Ş.">Türkiye Finans Katılım Bankası A.Ş.</option>
                            <option value="Kuveyt Türk Katılım Bankası A.Ş.">Kuveyt Türk Katılım Bankası A.Ş.</option>
                            <option value="Albaraka Türk Katılım Bankası A.Ş.">Albaraka Türk Katılım Bankası A.Ş.</option>
                            <option value="Ziraat Katılım Bankası A.Ş.">Ziraat Katılım Bankası A.Ş.</option>
                            <option value="Vakıf Katılım Bankası A.Ş.">Vakıf Katılım Bankası A.Ş.</option>
                            <option value="Emlak Katılım Bankası A.Ş.">Emlak Katılım Bankası A.Ş.</option>
                          </select>
                        </div>
                        
                        <div className="space-y-1 md:col-span-2">
                          <label htmlFor={`bankAccounts.${index}.accountType`} className="block text-sm font-medium text-secondary-700">Hesap Türü</label>
                          <select
                            {...register(`bankAccounts.${index}.accountType`)}
                            id={`bankAccounts.${index}.accountType`}
                            className="form-select"
                          >
                            <option value="expense">Harcama Hesabı</option>
                            <option value="credit_card">Kredi Kartı</option>
                            <option value="salary">Maaş Hesabı</option>
                          </select>
                        </div>
                    </div>
                  </div>
                ))}
                
                {bankAccountFields.length < 2 && (
                  <button
                    type="button"
                    onClick={addBankAccount}
                    className="btn-secondary inline-flex items-center"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    İkinci IBAN Ekle
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Step 5: Emergency Contact & Notes */}
          {currentStep === 5 && (
            <div className="space-y-8">
              {/* Emergency Contact */}
              <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <FiPhone className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-secondary-900">Acil Durum İletişim</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-secondary-700">Ad Soyad</label>
                    <input
                      {...register('emergencyContact.name')}
                      type="text"
                      id="emergencyContact.name"
                      className="form-input"
                      placeholder="Acil durum kişisinin adı"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-secondary-700">Yakınlık</label>
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
                  
                  <div className="space-y-1">
                    <label htmlFor="emergencyContact.phone" className="block text-sm font-medium text-secondary-700">Telefon</label>
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
              <div className="bg-white rounded-xl shadow-sm border border-secondary-200 p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <FiFileText className="w-5 h-5 text-primary-600" />
                  <h3 className="text-lg font-semibold text-secondary-900">Notlar</h3>
                </div>
                <div className="space-y-1">
                  <label htmlFor="notes" className="block text-sm font-medium text-secondary-700">Ek Notlar</label>
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
          )}
          
          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="btn-secondary inline-flex items-center"
                >
                  <FiChevronLeft className="w-4 h-4 mr-2" />
                  Önceki
                </button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button 
                type="button" 
                onClick={() => reset()} 
                className="btn-secondary inline-flex items-center justify-center"
              >
                Temizle
              </button>
              
              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="btn-primary inline-flex items-center"
                >
                  Sonraki
                  <FiChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button 
                  type="submit" 
                  className="btn-primary inline-flex items-center justify-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewEmployeePage;