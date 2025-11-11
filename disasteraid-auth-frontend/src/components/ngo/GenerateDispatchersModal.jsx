import { useState } from 'react';
import { X, Users, AlertCircle } from 'lucide-react';

const GenerateDispatchersModal = ({ onClose, onGenerate }) => {
  const [count, setCount] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numCount = parseInt(count);
    if (!count || isNaN(numCount)) {
      setError('Please enter a valid number');
      return;
    }
    if (numCount < 1 || numCount > 50) {
      setError('Number must be between 1 and 50');
      return;
    }

    setLoading(true);
    try {
      await onGenerate(numCount);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to generate dispatchers');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Generate Dispatchers</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many dispatchers do you want to create?
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={count}
              onChange={(e) => {
                setCount(e.target.value);
                setError('');
              }}
              placeholder="Enter number (1-50)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-2">
              Each dispatcher will get a unique email and password
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
            <h4 className="font-semibold text-blue-900 mb-2 text-sm">📋 What happens next?</h4>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Unique email addresses will be auto-generated</li>
              <li>Secure passwords will be created for each dispatcher</li>
              <li>Credentials will be displayed for you to save</li>
              <li>You can view credentials anytime in the Dispatchers tab</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={loading || !count}
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateDispatchersModal;
