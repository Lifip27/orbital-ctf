import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { fetchSiteConfigurations, updateSiteConfiguration } from '@/utils/api';
import { ApiError, SiteConfiguration } from '@/types';

export default function SiteConfigurationTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const configKeys = [
    'site_title',
    'homepage_title',
    'homepage_subtitle',
    'rules_text',
  ];

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const data = await fetchSiteConfigurations();
      setFormData(
        data.reduce((acc: Record<string, string>, config: SiteConfiguration) => {
          acc[config.key] = config.value;
          return acc;
        }, {})
      );
      setIsLoading(false);
    } catch (fetchError) {
      const message = getErrorMessage(fetchError);
      toast.error(`Error fetching configurations: ${message}`);
      console.error('Error fetching configs:', fetchError);
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updates = Object.entries(formData).map(([key, value]) => 
        updateSiteConfiguration(key, value)
      );
      
      await Promise.all(updates);
      toast.success('All configurations updated successfully');
      fetchConfigs();
    } catch (updateError) {
      const message = getErrorMessage(updateError);
      toast.error(`Error updating configurations: ${message}`);
      console.error('Error updating configs:', updateError);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div className="">
        <h2 className="text-2xl font-semibold mb-6">Site Configuration</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {configKeys.map((key) => (
            <div key={key} className="space-y-2">
              <label htmlFor={key} className="block text-sm font-medium text-gray-300">
                {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </label>
              {key === 'rules_text' ? (
                <textarea
                  id={key}
                  value={formData[key] || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  rows={8}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 rounded text-white focus:border-blue-500 focus:ring-blue-500 p-2"
                />
              ) : (
                <input
                  type="text"
                  id={key}
                  value={formData[key] || ''}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="mt-1 block w-full bg-gray-700 border-gray-600 rounded text-white focus:border-blue-500 focus:ring-blue-500 p-2"
                />
              )}
              <p className="mt-1 text-sm text-gray-400">
                {getConfigDescription(key)}
              </p>
            </div>
          ))}
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Save All Configuration
          </button>
        </form>
      </div>
    </div>
  );
}

function getConfigDescription(key: string): string {
  const descriptions: Record<string, string> = {
    site_title: 'Appears in browser tab and main navigation',
    homepage_title: 'Main title displayed on the homepage',
    homepage_subtitle: 'Subtitle shown below the main title',
    rules_text: 'Competition rules and guidelines (supports Markdown)'
  };
  return descriptions[key] || '';
}

function getErrorMessage(error: unknown): string {
  const err = error as ApiError;
  if (err?.error) return err.error;
  if (error instanceof Error && error.message) return error.message;
  return 'Unknown error';
}
