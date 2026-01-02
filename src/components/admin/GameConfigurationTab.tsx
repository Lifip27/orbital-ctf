import { useState, useEffect } from 'react';
import { ApiError, GameConfig } from '@/types';
import { fetchGameConfig, updateGameConfig } from '@/utils/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

export default function GameConfigurationTab() {
  const [gameConfig, setGameConfig] = useState<GameConfig>({
    startTime: new Date(Date.now() + 3600000),
    endTime: new Date(Date.now() + 86400000),
    isActive: false
  });
  const [hasEndTime, setHasEndTime] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGameConfig = async () => {
      try {
        const data = await fetchGameConfig();
        if (data.id) {
          setGameConfig(data);
          setHasEndTime(data.hasEndTime !== false);
        }
      } catch (error) {
        const message = getErrorMessage(error);
        console.error('Error fetching game config:', message);
        toast.error(`Error fetching game config: ${message}`);
      } finally {
        setLoading(false);
      }
    };

    loadGameConfig();
  }, []);

  const handleGameConfigUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedConfig = {
        ...gameConfig,
        hasEndTime,
        startTime: gameConfig.startTime ? new Date(gameConfig.startTime).toISOString() : null,
        endTime: hasEndTime && gameConfig.endTime ? new Date(gameConfig.endTime).toISOString() : null
      };

      const data = await updateGameConfig(updatedConfig);
      
      setGameConfig({
        ...data,
        startTime: data.startTime ? new Date(data.startTime).toISOString() : null,
        endTime: data.endTime ? new Date(data.endTime).toISOString() : null,
      });
      setHasEndTime(data.hasEndTime !== false);
      toast.success('Game time settings updated successfully!');
    } catch (error) { 
      const message = getErrorMessage(error);
      console.error('Error updating game config:', message);
      toast.error(`Error updating game time settings: ${message}`);
    }
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    console.log(`Setting ${field} to:`, value);
    const localDate = new Date(value);
    setGameConfig(prev => ({
      ...prev,
      [field]: localDate.toISOString()
    }));
  };

  const formatDateForInput = (date: Date | string | null) => {
    if (!date) return '';
    const d = new Date(date);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
    return localISOTime;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      <div className="">
        <h2 className="text-2xl font-semibold mb-6">Game Time Settings</h2>
        <form onSubmit={handleGameConfigUpdate} className="space-y-6">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-300">
              Start Time
            </label>
            <input
              type="datetime-local"
              id="startTime"
              value={formatDateForInput(gameConfig.startTime)}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded text-white focus:border-blue-500 focus:ring-blue-500 p-2"
              required
            />
            <p className="mt-1 text-sm text-gray-400">Challenges will be visible and submissions allowed after this time</p>
          </div>
          
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="hasEndTime"
              checked={hasEndTime}
              onChange={(e) => setHasEndTime(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded"
            />
            <label htmlFor="hasEndTime" className="ml-2 block text-sm text-gray-300">
              Set end time (uncheck for infinite competition)
            </label>
          </div>
          
          {hasEndTime && (
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-300">
                End Time
              </label>
              <input
                type="datetime-local"
                id="endTime"
                value={formatDateForInput(gameConfig.endTime)}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded text-white focus:border-blue-500 focus:ring-blue-500 p-2"
                required={hasEndTime}
              />
              <p className="mt-1 text-sm text-gray-400">Submissions will be blocked after this time</p>
            </div>
          )}
          
          {!hasEndTime && (
            <div className="bg-purple-900/30 p-4 rounded-md border border-purple-800">
              <h3 className="text-md font-medium text-purple-300 mb-2">Infinite Competition</h3>
              <p className="text-sm text-gray-300">
                The competition will run indefinitely until you manually stop it or set an end time. 
                Submissions will be accepted as long as the game is active.
              </p>
            </div>
          )}
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={gameConfig.isActive}
              onChange={(e) => setGameConfig({ ...gameConfig, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 bg-gray-700 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
              Game Active
            </label>
          </div>
          <div className="bg-blue-900/30 p-4 rounded-md border border-blue-800">
            <h3 className="text-lg font-medium text-blue-300 mb-2">Game Time Rules</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
              <li>Before start time: Challenges are hidden and submissions are blocked</li>
              <li>During game: Challenges are visible and submissions are allowed</li>
              {hasEndTime ? (
                <li>After end time: Challenges remain visible but submissions are blocked</li>
              ) : (
                <li>Infinite mode: Competition continues until manually stopped</li>
              )}
            </ul>
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Save Game Time Settings
          </button>
        </form>
      </div>
    </div>
  );
}

function getErrorMessage(error: unknown): string {
  const err = error as ApiError;
  if (err?.error) return err.error;
  if (error instanceof Error && error.message) return error.message;
  return 'Unknown error';
}
