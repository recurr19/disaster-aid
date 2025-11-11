import { X, Copy, Download } from 'lucide-react';
import { useState } from 'react';

const DispatcherCredentialsModal = ({ dispatchers, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const text = dispatchers.map(d => 
      `ID: ${d.dispatcherId}\nName: ${d.name}\nEmail: ${d.email}\nPassword: ${d.password}\n`
    ).join('\n---\n\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCredentials = () => {
    const text = `DISPATCHER CREDENTIALS\n${'='.repeat(50)}\n\n` +
      dispatchers.map(d => 
        `Dispatcher ID: ${d.dispatcherId}\nName: ${d.name}\nEmail: ${d.email}\nPassword: ${d.password}\n`
      ).join('\n' + '-'.repeat(50) + '\n\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dispatcher-credentials.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">🎉 Registration Successful!</h2>
            <p className="text-blue-100 text-sm mt-1">Your dispatcher accounts have been created</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Important: Save These Credentials</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>These passwords will not be shown again. Please save them securely and share with your dispatchers.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 flex gap-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy All'}
            </button>
            <button
              onClick={downloadCredentials}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download as Text
            </button>
          </div>

          <div className="space-y-4">
            {dispatchers.map((dispatcher, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg text-gray-900">Dispatcher #{index + 1}</h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                    {dispatcher.dispatcherId}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase">Name</label>
                    <p className="text-sm font-medium text-gray-900 mt-1">{dispatcher.name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 uppercase">Email</label>
                    <p className="text-sm font-mono text-gray-900 mt-1 bg-white px-2 py-1 rounded border">
                      {dispatcher.email}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-600 uppercase">Password</label>
                    <p className="text-sm font-mono text-gray-900 mt-1 bg-yellow-100 px-3 py-2 rounded border border-yellow-300 font-bold">
                      {dispatcher.password}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <h4 className="font-semibold text-blue-900 mb-2">📋 Next Steps</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Share these credentials securely with your dispatchers</li>
              <li>Dispatchers can login at the same login page using their email and password</li>
              <li>You can view all dispatcher credentials anytime in the "Dispatchers" tab</li>
              <li>Assign tickets to dispatchers from the "Tracking" tab</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Got it, Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default DispatcherCredentialsModal;
