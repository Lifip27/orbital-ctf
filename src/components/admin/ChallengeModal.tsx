import React from 'react';
import { Challenge, NewChallenge, UnlockCondition, ChallengeFile, ApiError } from '@/types';
import { FaTrash } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';
import { toast } from 'react-hot-toast';
import { createChallenge, updateChallenge, uploadFile, deleteFile } from '@/utils/api';

interface ChallengeModalProps {
  title: string;
  challenge: Challenge | NewChallenge;
  setChallenge: React.Dispatch<React.SetStateAction<Challenge | NewChallenge>>;
  onClose: () => void;
  submitText: string;
  isEditing?: boolean;
  onDataRefresh?: () => Promise<void>;
  allChallenges: Pick<Challenge, 'id' | 'title'>[];
}

export default function ChallengeModal({
  title,
  challenge,
  setChallenge,
  onClose,
  submitText,
  isEditing = false,
  allChallenges,
  onDataRefresh
}: ChallengeModalProps) {
  const unlockConditions = challenge.unlockConditions || [];

  const handleFileDelete = async (file: ChallengeFile) => {
    try {
      await deleteFile(file.path);
      
      const updatedFiles = challenge.files.filter((f) => f.id !== file.id);
      setChallenge({ ...challenge, files: updatedFiles });
      if (onDataRefresh) await onDataRefresh();
    } catch (error) {
      const err = error as ApiError;
      console.error('Error deleting file:', err.error);
      toast.error(`Error deleting file: ${err.error}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <IoClose size={20} />
          </button>
        </div>
        <form 
          onSubmit={(e) => 
            handleChallengeSubmit(
              e, 
              challenge, 
              isEditing ? 'PATCH' : 'POST', 
              onDataRefresh, 
              onClose // Close modal on success
              // Pass an onError handler if needed
            )
          } 
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={challenge.title}
              onChange={(e) =>
                setChallenge({ ...challenge, title: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea
              value={challenge.description}
              onChange={(e) =>
                setChallenge({ ...challenge, description: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              rows={4}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Solution Explanation (Markdown supported)</label>
            <textarea
              value={challenge.solveExplanation || ''}
              onChange={(e) =>
                setChallenge({ ...challenge, solveExplanation: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              rows={4}
              placeholder="This explanation will be shown to users after they solve the challenge"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
            <input
              type="text"
              value={challenge.category}
              onChange={(e) =>
                setChallenge({ ...challenge, category: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Link (Optional)</label>
            <input
              type="url"
              value={challenge.link || ''}
              onChange={(e) =>
                setChallenge({ ...challenge, link: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              placeholder="https://example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Points</label>
            <input
              type="number"
              value={challenge.points}
              onChange={(e) =>
                setChallenge({ ...challenge, points: parseInt(e.target.value) })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="multipleFlags"
              checked={challenge.multipleFlags}
              onChange={(e) =>
                setChallenge({ ...challenge, multipleFlags: e.target.checked, flags: challenge.flags || [] })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600"
            />
            <label htmlFor="multipleFlags" className="ml-2 block text-sm text-gray-300">
              Multiple Flags
            </label>
          </div>
          
          {!challenge.multipleFlags ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Flag</label>
              <input
                type="text"
                value={challenge.flag || ''}
                onChange={(e) =>
                  setChallenge({ ...challenge, flag: e.target.value })
                }
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                required={!challenge.multipleFlags}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Flags</label>
              <div className="space-y-2">
                {(challenge.flags || []).map((flag, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={flag.flag}
                      onChange={(e) => {
                        const newFlags = [...(challenge.flags || [])];
                        newFlags[index] = { ...newFlags[index], flag: e.target.value };
                        setChallenge({ ...challenge, flags: newFlags });
                      }}
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded"
                      placeholder="Flag"
                      required
                    />
                    <input
                      type="number"
                      value={flag.points}
                      onChange={(e) => {
                        const newFlags = [...(challenge.flags || [])];
                        newFlags[index] = { ...newFlags[index], points: parseInt(e.target.value) };
                        setChallenge({ ...challenge, flags: newFlags });
                      }}
                      className="w-24 bg-gray-700 text-white px-3 py-2 rounded"
                      placeholder="Points"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFlags = [...(challenge.flags || [])];
                        newFlags.splice(index, 1);
                        setChallenge({ ...challenge, flags: newFlags });
                      }}
                      className="px-2 py-1 bg-red-600 text-white hover:bg-red-700 rounded"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setChallenge({
                      ...challenge,
                      flags: [...(challenge.flags || []), { flag: '', points: 0 }]
                    });
                  }}
                  className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
                >
                  Add Flag
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Difficulty</label>
            <select
              value={challenge.difficulty}
              onChange={(e) =>
                setChallenge({ ...challenge, difficulty: e.target.value })
              }
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              required
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          {isEditing && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={'isActive' in challenge ? challenge.isActive : false}
                onChange={(e) =>
                  setChallenge({ ...challenge, isActive: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-300">
                Active
              </label>
            </div>
          )}
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isLocked"
              checked={challenge.isLocked}
              onChange={(e) =>
                setChallenge({ ...challenge, isLocked: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600"
            />
            <label htmlFor="isLocked" className="ml-2 block text-sm text-gray-300">
              Lock Challenge
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Files</label>
            <input
              type="file"
              multiple
              onChange={async (e) => {
                const files = await Promise.all(
                  Array.from(e.target.files || []).map(async (file) => {
                    try {
                      if (!('id' in challenge)) {
                        throw new Error('Please save the challenge first before uploading files');
                      }
                      return await uploadFile(file, challenge.id);
                    } catch (error) {
                      const err = error as ApiError;
                      toast.error(`Error uploading file: ${err.error}`);
                      throw error;
                    }
                  })
                );
                
                setChallenge({ ...challenge, files: [...challenge.files, ...files] });
              }}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
            />
            {challenge.files && challenge.files.length > 0 && (
              <div className="mt-2 space-y-2">
                {challenge.files.map((file, index) => (
                  <div key={file.id || index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                    <span className="text-sm text-gray-300">{file.name}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleFileDelete(file);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Hints</label>
            <div className="space-y-2">
              {challenge.hints.map((hint, index) => (
                <div key={hint.id || index} className="flex space-x-2">
                  <input
                    type="text"
                    value={hint.content}
                    onChange={(e) => {
                      const newHints = [...challenge.hints];
                      newHints[index] = { ...newHints[index], content: e.target.value };
                      setChallenge({ ...challenge, hints: newHints });
                    }}
                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded"
                    placeholder="Hint content"
                  />
                  <input
                    type="number"
                    value={hint.cost}
                    onChange={(e) => {
                      const newHints = [...challenge.hints];
                      newHints[index] = { ...newHints[index], cost: parseInt(e.target.value) };
                      setChallenge({ ...challenge, hints: newHints });
                    }}
                    className="w-20 bg-gray-700 text-white px-3 py-2 rounded"
                    placeholder="Cost"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newHints = [...challenge.hints];
                      newHints.splice(index, 1);
                      setChallenge({ ...challenge, hints: newHints });
                    }}
                    className="px-2 py-1 bg-red-600 text-white hover:bg-red-700 rounded"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const challengeId = 'id' in challenge ? challenge.id : '';
                  setChallenge({
                    ...challenge,
                    hints: [...challenge.hints, { 
                      content: '', 
                      cost: 0, 
                      challengeId, 
                      id: '', 
                      createdAt: '', 
                      updatedAt: '' 
                    }]
                  });
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
              >
                Add Hint
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Unlock Conditions (Optional)</label>
            <p className="text-xs text-gray-400 mb-2">The challenge will unlock if ANY of these conditions are met.</p>
            <div className="space-y-3">
              {unlockConditions.map((condition, index) => (
                <div key={index} className="p-3 bg-gray-700 rounded border border-gray-600 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-300">Condition #{index + 1}</label>
                    <button
                      type="button"
                      onClick={() => {
                        const newConditions = [...unlockConditions];
                        newConditions.splice(index, 1);
                        setChallenge({ ...challenge, unlockConditions: newConditions });
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                    <select
                      value={condition.type}
                      onChange={(e) => {
                        const newConditions = [...unlockConditions];
                        newConditions[index] = { 
                          ...newConditions[index], 
                          type: e.target.value as UnlockCondition['type'],
                          requiredChallengeId: null, 
                          timeThresholdSeconds: null
                        };
                        setChallenge({ ...challenge, unlockConditions: newConditions });
                      }}
                      className="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm"
                    >
                      <option value="CHALLENGE_SOLVED">Challenge Solved</option>
                      <option value="TIME_REMAINDER">Time Remaining</option>
                    </select>
                  </div>
                  {condition.type === 'CHALLENGE_SOLVED' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Required Challenge</label>
                      <select
                        value={condition.requiredChallengeId || ''}
                        onChange={(e) => {
                          const newConditions = [...unlockConditions];
                          newConditions[index] = { ...newConditions[index], requiredChallengeId: e.target.value || null };
                          setChallenge({ ...challenge, unlockConditions: newConditions });
                        }}
                        className="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm"
                        required
                      >
                        <option value="">-- Select Challenge --</option>
                        {allChallenges
                          .filter(c => !isEditing || c.id !== (challenge as Challenge).id)
                          .map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                          ))}
                      </select>
                    </div>
                  )}
                  {condition.type === 'TIME_REMAINDER' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Time Threshold (Seconds Remaining)</label>
                      <input
                        type="number"
                        value={condition.timeThresholdSeconds || ''}
                        onChange={(e) => {
                          const newConditions = [...unlockConditions];
                          newConditions[index] = { ...newConditions[index], timeThresholdSeconds: e.target.value ? parseInt(e.target.value) : null };
                          setChallenge({ ...challenge, unlockConditions: newConditions });
                        }}
                        className="w-full bg-gray-600 text-white px-3 py-2 rounded text-sm"
                        placeholder="e.g., 3600 (for 1 hour)"
                        required
                      />
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  setChallenge({
                    ...challenge,
                    unlockConditions: [
                      ...unlockConditions,
                      { type: 'CHALLENGE_SOLVED', requiredChallengeId: null, timeThresholdSeconds: null }
                    ]
                  });
                }}
                className="w-full px-4 py-2 border border-dashed border-gray-500 text-gray-400 hover:bg-gray-700 hover:text-gray-300 rounded"
              >
                + Add Unlock Condition
              </button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const handleChallengeSubmit = async (
  e: React.FormEvent,
  challenge: Challenge | NewChallenge,
  apiMethod: 'POST' | 'PATCH',
  onDataRefresh?: () => Promise<void>,
  onSuccess?: () => void,
  onError?: (error: Error) => void
) => {
  e.preventDefault();

  try {
    if (apiMethod === 'POST') {
      await createChallenge(challenge as NewChallenge);
    } else {
      await updateChallenge(challenge as Challenge);
    }

    toast.success(`Challenge ${apiMethod === 'POST' ? 'created' : 'updated'} successfully!`);
    
    if (onDataRefresh) {
      await onDataRefresh();
    }

    if (onSuccess) {
      onSuccess();
    }

  } catch (err) {
    const error = err as ApiError;
    console.error(`Error ${apiMethod === 'POST' ? 'creating' : 'updating'} challenge:`, error);
    toast.error(`Error: ${error.error}`);
    if (onError) {
      onError(error);
    }
  }
};
