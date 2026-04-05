import React, { useState, useEffect } from 'react';
import { Mail, Save, AlertCircle, CheckCircle, Info, ChevronRight } from 'lucide-react';
import { adminService } from '../../services/adminService';
import './EmailSettings.css';

const EmailSettings = () => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' or 'customer'
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminService.getEmailSettings();
      setSettings(data);
    } catch (err) {
      console.error('Error fetching email settings:', err);
      setStatus({ type: 'error', message: 'Không thể tải cài đặt email.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setStatus({ type: '', message: '' });
      await adminService.updateEmailSettings(settings);
      setStatus({ type: 'success', message: 'Đã lưu thay đổi thành công!' });
      setTimeout(() => setStatus({ type: '', message: '' }), 3000);
    } catch (err) {
      console.error('Error saving email settings:', err);
      setStatus({ type: 'error', message: 'Lỗi khi lưu cài đặt.' });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (tab, field, value) => {
    setSettings(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value
      }
    }));
  };

  if (loading) return <div className="email-settings-loading">Đang tải cấu hình...</div>;

  const currentSettings = activeTab === 'admin' ? settings.admin_notice : settings.customer_invoice;

  return (
    <div className="email-settings-container animate-in">
      <div className="settings-header">
        <div className="header-info">
          <h2>Cấu Hình Thông Báo Email</h2>
          <p>Tùy chỉnh nội dung email gửi cho Admin và Khách hàng khi có đơn hàng mới.</p>
        </div>
        <button 
          className="save-btn" 
          onClick={handleSave} 
          disabled={saving}
        >
          {saving ? <div className="spinner-small" /> : <Save size={18} />}
          <span>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</span>
        </button>
      </div>

      {status.message && (
        <div className={`status-alert ${status.type}`}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{status.message}</span>
        </div>
      )}

      <div className="settings-tabs">
        <button 
          className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <Mail size={18} />
          Thông báo Admin
        </button>
        <button 
          className={`tab-btn ${activeTab === 'customer' ? 'active' : ''}`}
          onClick={() => setActiveTab('customer')}
        >
          <Info size={18} />
          Hóa đơn Khách hàng
        </button>
      </div>

      <div className="settings-content card">
        <div className="form-section">
          <div className="form-toggle">
            <label className="switch">
              <input 
                type="checkbox" 
                checked={currentSettings.enabled} 
                onChange={(e) => updateField(activeTab === 'admin' ? 'admin_notice' : 'customer_invoice', 'enabled', e.target.checked)}
              />
              <span className="slider round"></span>
            </label>
            <span>Kích hoạt gửi email này</span>
          </div>

          {activeTab === 'admin' && (
            <div className="form-group">
              <label>Email Admin nhận thông báo</label>
              <input 
                type="email" 
                value={settings.admin_notice.recipient} 
                onChange={(e) => updateField('admin_notice', 'recipient', e.target.value)}
                placeholder="admin@chinhastore.com"
              />
            </div>
          )}

          <div className="form-group">
            <label>Tiêu đề Email</label>
            <input 
              type="text" 
              value={currentSettings.subject} 
              onChange={(e) => updateField(activeTab === 'admin' ? 'admin_notice' : 'customer_invoice', 'subject', e.target.value)}
              placeholder="Nhập tiêu đề email..."
            />
          </div>

          <div className="form-group">
            <label>Nội dung Email</label>
            <textarea 
              rows="12"
              value={currentSettings.body} 
              onChange={(e) => updateField(activeTab === 'admin' ? 'admin_notice' : 'customer_invoice', 'body', e.target.value)}
              placeholder="Nhập nội dung email..."
            />
            <div className="placeholder-guide">
              <p>Có thể sử dụng các biến: <code>{`{{customer_name}}`}</code>, <code>{`{{product_name}}`}</code>, <code>{`{{start_date}}`}</code>, <code>{`{{total_price}}`}</code></p>
            </div>
          </div>
        </div>

        <div className="preview-section">
          <h3>Xem trước</h3>
          <div className="email-preview-box">
            <div className="preview-header">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <div className="preview-content">
              <div className="subject-line">
                <strong>Subject:</strong> {currentSettings.subject.replace(/{{.*?}}/g, '(Dữ liệu)')}
              </div>
              <div className="body-content">
                {currentSettings.body.split('\n').map((line, i) => (
                  <p key={i}>{line.replace(/{{.*?}}/g, '(Dữ liệu)')}</p>
                ))}
              </div>
            </div>
          </div>
          
          <div className="integration-hint">
            <Info size={16} />
            <p>Để bắt đầu gửi email thực tế, hãy kết nối API của <strong>Resend</strong> hoặc <strong>SendGrid</strong> trong file <code>adminService.js</code>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;
