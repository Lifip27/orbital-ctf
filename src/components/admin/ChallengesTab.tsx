import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaDownload, FaUpload } from "react-icons/fa";
import { Challenge, NewChallenge, ApiError } from '@/types';
import ChallengeModal from './ChallengeModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { fetchAdminChallenges, deleteChallenge, exportChallenges, importChallenges, deleteAdminSolve } from '@/utils/api';

export default function ChallengesTab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setIsEditModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingSolves, setViewingSolves] = useState<Challenge | null>(null);
  const [newChallenge, setNewChallenge] = useState<NewChallenge>({
    title: '',
    description: '',
    category: '',
    points: 0,
    flag: '',
    multipleFlags: false,
    flags: [],
    files: [],
    hints: [],
    difficulty: 'easy',
    isActive: true,
    isLocked: false,
    unlockConditions: [],
    link: ''
  });

  const fetchChallenges = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminChallenges();
      setChallenges(data);
    } catch (err) {
      const error = err as ApiError;
      setError(error.error);
      console.error('Error fetching challenges:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleDelete = async (id: string) => {
    try {
      await deleteChallenge(id);
      setChallengeToDelete(null);
      await fetchChallenges();
    } catch (error) {
      const err = error as ApiError;
      console.error('Error deleting challenge:', err);
      toast.error(err.error || 'Failed to delete challenge');
    }
  };

  const handleDeleteSolve = async (challengeId: string, teamId: string) => {
    if (!window.confirm('Delete this team solve?')) {
      return;
    }

    try {
      await deleteAdminSolve(challengeId, teamId);
      toast.success('Solve deleted');
      setViewingSolves((current) => {
        if (!current) return current;
        return {
          ...current,
          solvedBy: current.solvedBy?.filter(team => team.id !== teamId)
        };
      });
      await fetchChallenges();
    } catch (error) {
      const err = error as ApiError;
      console.error('Error deleting solve:', err.error);
      toast.error(err.error || 'Failed to delete solve');
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setIsEditModalOpen(true);
  };

  const handleExportChallenges = async () => {
    try {
      const challenges = await exportChallenges();
      
      // Create and download file
      const blob = new Blob([JSON.stringify(challenges, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'challenges-export.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      const err = error as ApiError;
      console.error('Error exporting challenges:', err.error);
      toast.error(`Error exporting challenges: ${err.error}`);
    }
  };

  const handleImportChallenges = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    try {
      const file = e.target.files[0];
      const content = await file.text();
      const challenges = JSON.parse(content);

      await importChallenges(challenges);
      await fetchChallenges();
    } catch (error) {
      const err = error as ApiError;
      console.error('Error importing challenges:', err.error);
      toast.error(`Error importing challenges: ${err.error}`);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-400">Error loading challenges: {error}</div>;
  }

  return (
    <div className="">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-semibold mb-6">Challenges</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
          >
            <FaPlus className="h-5 w-5 mr-2" />
            Add Challenge
          </button>
          
          <button
            onClick={handleExportChallenges}
            className="flex items-center px-4 py-2 bg-green-600 text-white hover:bg-green-700"
          >
            <FaDownload className="h-5 w-5 mr-2" />
            Export All
          </button>

          <label className="flex items-center px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 cursor-pointer">
            <FaUpload className="h-5 w-5 mr-2" />
            Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportChallenges}
              className="hidden"
            />
          </label>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-gray-300">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Points</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Solves</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {challenges.map((challenge) => (
              <tr key={challenge.id} className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{challenge.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{challenge.category}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {challenge.multipleFlags ? (
                    <div className="flex flex-col gap-1">
                      {challenge.flags.map((flag, index) => (
                        <span key={flag.id || index} className="text-sm">
                          {flag.points} pts
                        </span>
                      ))}
                      <span className="text-xs text-gray-500">
                        Total: {challenge.flags.reduce((sum, flag) => sum + flag.points, 0)} pts
                      </span>
                    </div>
                  ) : (
                    challenge.points
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setViewingSolves(challenge)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    {challenge.solvedBy?.length || 0} solves
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`max-w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      challenge.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {challenge.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {challenge.isLocked && (
                      <span className="max-w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Locked
                      </span>
                    )}
                    {challenge.multipleFlags && (
                      <span className="max-w-fit inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Multiple Flags
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-row gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(challenge)}
                      className="bg-blue-900 text-blue-300 px-3 py-1 rounded hover:bg-blue-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => challengeToDelete?.id === challenge.id
                        ? handleDelete(challenge.id)
                        : setChallengeToDelete(challenge)
                      }
                      onMouseLeave={() => setChallengeToDelete(null)}
                      className={`px-3 py-1 rounded transition-colors ${
                        challengeToDelete?.id === challenge.id
                          ? 'bg-red-700 text-red-200 hover:bg-red-600'
                          : 'bg-red-900 text-red-300 hover:bg-red-800'
                      }`}
                    >
                      {challengeToDelete?.id === challenge.id ? 'Confirm?' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Challenge Modal */}
      {isModalOpen && (
        <ChallengeModal
          title="Create New Challenge"
          challenge={newChallenge}
          allChallenges={challenges}
          setChallenge={setNewChallenge}
          onDataRefresh={fetchChallenges}
          onClose={() => setIsModalOpen(false)}
          submitText="Create Challenge"
        />
      )}

      {/* Edit Challenge Modal */}
      {editingChallenge && (
        <ChallengeModal
          title="Edit Challenge"
          challenge={editingChallenge}
          allChallenges={challenges}
          setChallenge={setEditingChallenge as React.Dispatch<React.SetStateAction<Challenge | NewChallenge>>}
          onDataRefresh={fetchChallenges}
          onClose={() => setEditingChallenge(null)}
          submitText="Save Changes"
          isEditing={true}
        />
      )}

      {/* Solves Modal */}
      {viewingSolves && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">
                Solves for {viewingSolves.title}
              </h3>
              <button
                onClick={() => setViewingSolves(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {viewingSolves.solvedBy && viewingSolves.solvedBy.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {viewingSolves.solvedBy.map(team => (
                    <div
                      key={team.id}
                      className="flex items-center justify-between gap-3 px-3 py-2 rounded"
                      style={{ backgroundColor: team.color || '#333' }}
                    >
                      <span className="text-sm">{team.name}</span>
                      <button
                        onClick={() => handleDeleteSolve(viewingSolves.id, team.id)}
                        className="text-xs px-2 py-1 rounded bg-black/40 text-red-200 hover:bg-black/60"
                      >
                        Delete Solve
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400">No solves yet</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
