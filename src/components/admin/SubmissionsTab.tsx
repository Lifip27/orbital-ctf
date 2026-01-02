import { useState, useEffect, useCallback } from 'react';
import { AdminSubmission, ApiError } from '@/types';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { fetchAdminSubmissions, deleteAdminSubmission, deleteAdminSolve } from '@/utils/api';
import { toast } from 'react-hot-toast';

export default function SubmissionsTab() {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAdminSubmissions();
      setSubmissions(data);
    } catch (err) {
      const error = err as ApiError;
      setError(error.error);
      console.error('Error fetching submissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  const handleDelete = async (submission: AdminSubmission) => {
    const label = submission.isCorrect ? 'delete this solve' : 'delete this submission';
    if (!window.confirm(`Are you sure you want to ${label}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      if (submission.isCorrect) {
        await deleteAdminSolve(submission.challenge.id, submission.team.id);
        toast.success('Solve deleted');
      } else {
        await deleteAdminSubmission(submission.id);
        toast.success('Submission deleted');
      }
      await fetchSubmissions();
    } catch (deleteError) {
      const err = deleteError as ApiError;
      toast.error(err.error || err.message || 'Failed to delete');
      console.error('Error deleting submission/solve:', deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-400">Error loading submissions: {error}</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Submissions</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700 text-sm">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Team</th>
              <th className="px-4 py-2 text-left">User</th>
              <th className="px-4 py-2 text-left">Challenge</th>
              <th className="px-4 py-2 text-left">Flag</th>
              <th className="px-4 py-2 text-left">Correct</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {submissions.map(sub => (
              <tr key={sub.id} className="border-t border-gray-700 hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-2 whitespace-nowrap">{new Date(sub.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 whitespace-nowrap" style={{ color: sub.team.color || undefined }}>
                  {sub.team.name}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">{sub.user.alias}</td>
                <td className="px-4 py-2 whitespace-nowrap">{sub.challenge.title}</td>
                <td className="px-4 py-2 whitespace-nowrap font-mono break-all">{sub.flag}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs ${sub.isCorrect ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}> 
                    {sub.isCorrect ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right">
                  <button
                    onClick={() => handleDelete(sub)}
                    disabled={isDeleting}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      sub.isCorrect
                        ? 'bg-red-900 text-red-300 hover:bg-red-800'
                        : 'bg-red-800 text-red-200 hover:bg-red-700'
                    } disabled:opacity-50`}
                  >
                    {sub.isCorrect ? 'Delete Solve' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
