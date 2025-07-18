import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Globe, Bell, Shield, Save, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const { user, loading, updateProfile } = useAuth();
  const [settings, setSettings] = useState({
    defaultLanguage: 'English',
    emailNotifications: true,
    darkMode: false,
    autoSave: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
  }, [user, loading, navigate]);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    // Simulate API call
    try {
       // In a real application, you would send settings to your backend here
       console.log('Saving settings:', settings);
       await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
       // Check for a condition that might cause an error for demonstration
       if (settings.defaultLanguage === 'Klingon') {
           throw new Error('Klingon is not a supported language for settings yet!');
       }
       
       // Update user profile with new settings
       const { error: updateError } = await updateProfile({
         settings: settings
       });
       
       if (updateError) {
         throw updateError;
       }
       
       setSuccess('Settings saved successfully!');
    } catch (err) {
        setError(err.message);
    } finally {
       setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-8">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">Settings</h1>

            {error && (
                <div className="flex items-center p-4 mb-6 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50" role="alert">
                    <AlertCircle className="flex-shrink-0 inline w-4 h-4 me-3" />
                    <div><span className="font-medium">Error:</span> {error}</div>
                </div>
            )}
            {success && (
              <div className="flex items-center p-4 mb-6 text-sm text-green-800 border border-green-300 rounded-lg bg-green-50" role="alert">
                <AlertCircle className="flex-shrink-0 inline w-4 h-4 me-3" />
                <div><span className="font-medium">Success:</span> {success}</div>
              </div>
            )}

            {/* Account Settings */}
            <div className="space-y-6 mb-8">
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Account Settings
                </h2>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="defaultLanguage" className="block text-sm font-medium text-gray-700">
                      Default Language
                    </label>
                    <select
                      id="defaultLanguage"
                      value={settings.defaultLanguage}
                      onChange={(e) => handleSettingChange('defaultLanguage', e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option>English</option>
                      <option>Tamil</option>
                      <option>Hindi</option>
                      <option>Telugu</option>
                      <option>Malayalam</option>
                      <option>Klingon</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-blue-600" />
                  Notifications
                </h2>
                <div className="flex items-center justify-between">
                  <label htmlFor="emailNotifications" className="flex-grow text-sm font-medium text-gray-700 mr-4">Email Notifications</label>
                   <input
                     id="emailNotifications"
                     type="checkbox"
                     checked={settings.emailNotifications}
                     onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                     className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                   />
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="border-b border-gray-200 pb-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Privacy & Security
                </h2>
                 <div className="flex items-center justify-between">
                  <label htmlFor="autoSave" className="flex-grow text-sm font-medium text-gray-700 mr-4">Enable Auto Save</label>
                   <input
                     id="autoSave"
                     type="checkbox"
                     checked={settings.autoSave}
                     onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                     className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                   />
                </div>
              </div>

              {/* Appearance */}
              <div>
                 <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                   <Globe className="h-5 w-5 mr-2 text-blue-600" />
                   Appearance
                 </h2>
                 <div className="flex items-center justify-between">
                   <label htmlFor="darkMode" className="flex-grow text-sm font-medium text-gray-700 mr-4">Dark Mode</label>
                    <input
                      id="darkMode"
                      type="checkbox"
                      checked={settings.darkMode}
                      onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                 </div>
              </div>
            </div>

            {/* Save Button */}
            <div>
              <button
                onClick={handleSave}
                className="w-full md:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Saving...
                  </>
                ) : (
                  <>
                     <Save className="mr-2" size={20} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 