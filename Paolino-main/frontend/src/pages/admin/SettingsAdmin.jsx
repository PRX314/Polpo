import { useState } from 'react';
import { 
  Save, 
  Settings, 
  Shield,
  Mail,
  Globe,
  CreditCard,
  Truck,
  Bell
} from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsAdmin = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);

  const tabs = [
    { id: 'general', label: 'Generali', icon: Settings },
    { id: 'security', label: 'Sicurezza', icon: Shield },
    { id: 'notifications', label: 'Notifiche', icon: Bell },
    { id: 'payments', label: 'Pagamenti', icon: CreditCard },
    { id: 'shipping', label: 'Spedizioni', icon: Truck }
  ];

  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'Paolino E-commerce',
    siteDescription: 'Il tuo negozio online per magliette e abbigliamento di qualità',
    contactEmail: 'info@paolino.com',
    supportEmail: 'support@paolino.com',
    currency: 'EUR',
    timezone: 'Europe/Rome',
    language: 'it',
    
    // Security Settings
    twoFactorAuth: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 6,
    
    // Notification Settings
    emailNotifications: true,
    orderNotifications: true,
    inventoryAlerts: true,
    promotionEmails: false,
    
    // Payment Settings
    stripeEnabled: true,
    paypalEnabled: false,
    bankTransferEnabled: false,
    taxRate: 22,
    
    // Shipping Settings
    freeShippingThreshold: 50,
    defaultShippingCost: 5.99,
    maxShippingDays: 7,
    shippingZones: ['Italia', 'Europa', 'Mondiale']
  });

  const handleInputChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Impostazioni salvate con successo');
    } catch (error) {
      toast.error('Errore nel salvataggio delle impostazioni');
    } finally {
      setLoading(false);
    }
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Nome del Sito
          </label>
          <input
            type="text"
            value={settings.siteName}
            onChange={(e) => handleInputChange('general', 'siteName', e.target.value)}
            className="input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Email di Contatto
          </label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => handleInputChange('general', 'contactEmail', e.target.value)}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-700 mb-2">
          Descrizione del Sito
        </label>
        <textarea
          rows={3}
          value={settings.siteDescription}
          onChange={(e) => handleInputChange('general', 'siteDescription', e.target.value)}
          className="input"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Valuta
          </label>
          <select
            value={settings.currency}
            onChange={(e) => handleInputChange('general', 'currency', e.target.value)}
            className="input"
          >
            <option value="EUR">Euro (€)</option>
            <option value="USD">Dollaro ($)</option>
            <option value="GBP">Sterlina (£)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Fuso Orario
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
            className="input"
          >
            <option value="Europe/Rome">Roma (GMT+1)</option>
            <option value="Europe/London">Londra (GMT+0)</option>
            <option value="America/New_York">New York (GMT-5)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Lingua
          </label>
          <select
            value={settings.language}
            onChange={(e) => handleInputChange('general', 'language', e.target.value)}
            className="input"
          >
            <option value="it">Italiano</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
        <div>
          <h3 className="font-medium text-primary-900">Autenticazione a Due Fattori</h3>
          <p className="text-sm text-primary-600">Aggiungi un livello extra di sicurezza</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.twoFactorAuth}
            onChange={(e) => handleInputChange('security', 'twoFactorAuth', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Timeout Sessione (minuti)
          </label>
          <input
            type="number"
            min="5"
            max="120"
            value={settings.sessionTimeout}
            onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
            className="input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Tentativi Login Max
          </label>
          <input
            type="number"
            min="3"
            max="10"
            value={settings.maxLoginAttempts}
            onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-700 mb-2">
          Lunghezza Minima Password
        </label>
        <input
          type="number"
          min="6"
          max="20"
          value={settings.passwordMinLength}
          onChange={(e) => handleInputChange('security', 'passwordMinLength', parseInt(e.target.value))}
          className="input w-full md:w-48"
        />
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {[
        { key: 'emailNotifications', label: 'Notifiche Email Generali', description: 'Ricevi aggiornamenti via email' },
        { key: 'orderNotifications', label: 'Notifiche Ordini', description: 'Alert per nuovi ordini e cambi di stato' },
        { key: 'inventoryAlerts', label: 'Alert Inventario', description: 'Avvisi quando i prodotti sono in esaurimento' },
        { key: 'promotionEmails', label: 'Email Promozionali', description: 'Invia email di marketing ai clienti' }
      ].map((setting) => (
        <div key={setting.key} className="flex items-center justify-between p-4 bg-primary-50 rounded-lg">
          <div>
            <h3 className="font-medium text-primary-900">{setting.label}</h3>
            <p className="text-sm text-primary-600">{setting.description}</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings[setting.key]}
              onChange={(e) => handleInputChange('notifications', setting.key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        </div>
      ))}
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-primary-900">Metodi di Pagamento</h3>
        
        {[
          { key: 'stripeEnabled', label: 'Stripe', description: 'Pagamenti con carta di credito' },
          { key: 'paypalEnabled', label: 'PayPal', description: 'Pagamenti PayPal' },
          { key: 'bankTransferEnabled', label: 'Bonifico Bancario', description: 'Pagamenti tramite bonifico' }
        ].map((method) => (
          <div key={method.key} className="flex items-center justify-between p-4 border border-primary-200 rounded-lg">
            <div>
              <h4 className="font-medium text-primary-900">{method.label}</h4>
              <p className="text-sm text-primary-600">{method.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings[method.key]}
                onChange={(e) => handleInputChange('payments', method.key, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
            </label>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-700 mb-2">
          Aliquota IVA (%)
        </label>
        <input
          type="number"
          min="0"
          max="30"
          step="0.1"
          value={settings.taxRate}
          onChange={(e) => handleInputChange('payments', 'taxRate', parseFloat(e.target.value))}
          className="input w-full md:w-48"
        />
      </div>
    </div>
  );

  const renderShippingSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Soglia Spedizione Gratuita (€)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={settings.freeShippingThreshold}
            onChange={(e) => handleInputChange('shipping', 'freeShippingThreshold', parseFloat(e.target.value))}
            className="input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-2">
            Costo Spedizione Standard (€)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={settings.defaultShippingCost}
            onChange={(e) => handleInputChange('shipping', 'defaultShippingCost', parseFloat(e.target.value))}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-700 mb-2">
          Giorni Massimi per la Spedizione
        </label>
        <input
          type="number"
          min="1"
          max="30"
          value={settings.maxShippingDays}
          onChange={(e) => handleInputChange('shipping', 'maxShippingDays', parseInt(e.target.value))}
          className="input w-full md:w-48"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-primary-700 mb-2">
          Zone di Spedizione
        </label>
        <div className="space-y-2">
          {settings.shippingZones.map((zone, index) => (
            <div key={index} className="flex items-center space-x-2">
              <input
                type="text"
                value={zone}
                onChange={(e) => {
                  const newZones = [...settings.shippingZones];
                  newZones[index] = e.target.value;
                  handleInputChange('shipping', 'shippingZones', newZones);
                }}
                className="input"
              />
              <button
                type="button"
                onClick={() => {
                  const newZones = settings.shippingZones.filter((_, i) => i !== index);
                  handleInputChange('shipping', 'shippingZones', newZones);
                }}
                className="btn-danger px-3 py-2"
              >
                Rimuovi
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              handleInputChange('shipping', 'shippingZones', [...settings.shippingZones, '']);
            }}
            className="btn-secondary"
          >
            Aggiungi Zona
          </button>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'payments':
        return renderPaymentSettings();
      case 'shipping':
        return renderShippingSettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary-900">Impostazioni</h1>
          <p className="text-primary-600 mt-1">
            Configura le impostazioni del tuo negozio
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={loading}
          className={`btn-primary flex items-center space-x-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Save size={16} />
          <span>{loading ? 'Salvataggio...' : 'Salva Modifiche'}</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs Navigation */}
        <div className="lg:w-64">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-primary-600 hover:bg-primary-50 hover:text-primary-900'
                  }`}
                >
                  <Icon size={18} className="mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          <div className="card p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsAdmin;