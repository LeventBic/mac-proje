import React from 'react';
import { formatCurrency, formatDate } from '../../../utils/formatters';

const EmployeeDetailModal = ({ employee, onClose, onEdit }) => {
  if (!employee) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Aktif', class: 'badge-success' },
      inactive: { label: 'Pasif', class: 'badge-secondary' },
      suspended: { label: 'Askıda', class: 'badge-warning' },
      terminated: { label: 'İşten Çıkarıldı', class: 'badge-danger' }
    };
    
    const config = statusConfig[status] || { label: status, class: 'badge-secondary' };
    return <span className={`badge ${config.class}`}>{config.label}</span>;
  };

  const calculateWorkDuration = (startDate) => {
    if (!startDate) return '-';
    
    const start = new Date(startDate);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    let duration = '';
    if (years > 0) duration += `${years} yıl `;
    if (months > 0) duration += `${months} ay `;
    if (days > 0 && years === 0) duration += `${days} gün`;
    
    return duration.trim() || '1 günden az';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content employee-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Çalışan Detayları</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="modal-body">
          {/* Employee Header */}
          <div className="employee-header">
            <div className="employee-avatar-large">
              {employee.profileImage ? (
                <img src={employee.profileImage} alt={`${employee.firstName} ${employee.lastName}`} />
              ) : (
                <div className="avatar-placeholder-large">
                  {employee.firstName?.[0]}{employee.lastName?.[0]}
                </div>
              )}
            </div>
            <div className="employee-header-info">
              <h3>{employee.firstName} {employee.lastName}</h3>
              <p className="employee-id">Çalışan ID: {employee.employeeId}</p>
              <div className="employee-status">
                {getStatusBadge(employee.status)}
              </div>
            </div>
          </div>
          
          {/* Employee Details Grid */}
          <div className="employee-details-grid">
            {/* Personal Information */}
            <div className="detail-section">
              <h4>Kişisel Bilgiler</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Ad Soyad</label>
                  <span>{employee.firstName} {employee.lastName}</span>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <span>{employee.email || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Telefon</label>
                  <span>{employee.phone || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>TC Kimlik No</label>
                  <span>{employee.nationalId || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Doğum Tarihi</label>
                  <span>{employee.birthDate ? formatDate(employee.birthDate) : '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Cinsiyet</label>
                  <span>
                    {employee.gender === 'male' ? 'Erkek' : 
                     employee.gender === 'female' ? 'Kadın' : 
                     employee.gender === 'other' ? 'Diğer' : '-'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Work Information */}
            <div className="detail-section">
              <h4>İş Bilgileri</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Departman</label>
                  <span>{employee.department?.name || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Pozisyon</label>
                  <span>{employee.position?.name || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Maaş</label>
                  <span>
                    {employee.salary ? formatCurrency(employee.salary) : '-'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>İşe Başlama Tarihi</label>
                  <span>{employee.startDate ? formatDate(employee.startDate) : '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Çalışma Süresi</label>
                  <span>{calculateWorkDuration(employee.startDate)}</span>
                </div>
                <div className="detail-item">
                  <label>Çalışma Tipi</label>
                  <span>
                    {employee.employmentType === 'full_time' ? 'Tam Zamanlı' :
                     employee.employmentType === 'part_time' ? 'Yarı Zamanlı' :
                     employee.employmentType === 'contract' ? 'Sözleşmeli' :
                     employee.employmentType === 'intern' ? 'Stajyer' : '-'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Address Information */}
            <div className="detail-section">
              <h4>Adres Bilgileri</h4>
              <div className="detail-grid">
                <div className="detail-item full-width">
                  <label>Adres</label>
                  <span>{employee.address || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Şehir</label>
                  <span>{employee.city || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>İlçe</label>
                  <span>{employee.district || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Posta Kodu</label>
                  <span>{employee.postalCode || '-'}</span>
                </div>
              </div>
            </div>
            
            {/* Bank Information */}
            <div className="detail-section">
              <h4>Banka Bilgileri</h4>
              <div className="detail-grid">
                {employee.bankAccounts && employee.bankAccounts.length > 0 ? (
                  employee.bankAccounts.map((account, index) => (
                    <div key={index} className="bank-account-item">
                      <div className="detail-item">
                        <label>IBAN {index + 1}</label>
                        <span className="iban-display">{account.iban}</span>
                      </div>
                      <div className="detail-item">
                        <label>Banka Adı</label>
                        <span>{account.bankName || '-'}</span>
                      </div>
                      <div className="detail-item">
                        <label>Hesap Türü</label>
                        <span>
                          {account.accountType === 'salary' ? 'Maaş Hesabı' :
                           account.accountType === 'expense' ? 'Harcama Hesabı' :
                           account.accountType || '-'}
                        </span>
                      </div>
                      {account.isDefault && (
                        <div className="detail-item">
                          <span className="badge badge-primary">Varsayılan Hesap</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="detail-item full-width">
                    <span>Banka hesabı bilgisi bulunmuyor</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Emergency Contact */}
            {employee.emergencyContact && (
              <div className="detail-section">
                <h4>Acil Durum İletişim</h4>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Ad Soyad</label>
                    <span>{employee.emergencyContact.name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Yakınlık</label>
                    <span>{employee.emergencyContact.relationship || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Telefon</label>
                    <span>{employee.emergencyContact.phone || '-'}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notes */}
            {employee.notes && (
              <div className="detail-section">
                <h4>Notlar</h4>
                <div className="detail-item full-width">
                  <p className="employee-notes">{employee.notes}</p>
                </div>
              </div>
            )}
            
            {/* System Information */}
            <div className="detail-section">
              <h4>Sistem Bilgileri</h4>
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Oluşturulma Tarihi</label>
                  <span>{employee.createdAt ? formatDate(employee.createdAt) : '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Son Güncelleme</label>
                  <span>{employee.updatedAt ? formatDate(employee.updatedAt) : '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Oluşturan</label>
                  <span>{employee.createdBy?.name || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Güncelleyen</label>
                  <span>{employee.updatedBy?.name || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Kapat
          </button>
          <button className="btn btn-primary" onClick={onEdit}>
            Düzenle
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;