import { useState } from 'react';
import { Zap, Code, BookOpen, Loader2, ArrowRight } from 'lucide-react';

const WebsiteGenerator = () => {
  const [userInput, setUserInput] = useState('');
  const [languageCode, setLanguageCode] = useState('ta-IN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState({
    translatedPrompt: '',
    websiteHtml: '',
    explanation: ''
  });

  const languages = [
    { code: 'ta-IN', name: 'Tamil' },
    { code: 'hi-IN', name: 'Hindi' },
    { code: 'te-IN', name: 'Telugu' },
    { code: 'ml-IN', name: 'Malayalam' },
    { code: 'bn-IN', name: 'Bengali' },
    { code: 'gu-IN', name: 'Gujarati' },
    { code: 'kn-IN', name: 'Kannada' },
    { code: 'mr-IN', name: 'Marathi' },
    { code: 'od-IN', name: 'Odia' },
    { code: 'pa-IN', name: 'Punjabi' }
  ];

  const handleGenerate = async () => {
    if (!userInput.trim()) return;
    setIsLoading(true);
    setError('');
    setResult({ translatedPrompt: '', websiteHtml: '', explanation: '' });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5003/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_input: userInput,
          user_language_code: languageCode,
          choice: 'website'
        }),
      });
      const data = await response.json();
      if (!data.websiteHtml && !data.website_html) {
        setError('No website was generated. Please check your backend or try again.');
        setResult({ translatedPrompt: '', websiteHtml: '', explanation: '' });
      } else {
        setResult({
          translatedPrompt: data.translatedPrompt || data.translated_prompt || '',
          websiteHtml: data.websiteHtml || data.website_html || '',
          explanation: data.explanation || ''
        });
      }
    } catch (err) {
      setError('Failed to generate website. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Website Generator</h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input and Translation Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Left Side - Input */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Input</h2>
            <form onSubmit={e => { e.preventDefault(); handleGenerate(); }}>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Select Your Language</label>
                <select
                  value={languageCode}
                  onChange={e => setLanguageCode(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Describe the website you want to build</label>
                <textarea
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your idea in your native language..."
                />
              </div>
              {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
              <button
                type="submit"
                disabled={isLoading || !userInput.trim()}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Website'
                )}
              </button>
            </form>
          </div>

          {/* Right Side - Translation */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
              <ArrowRight className="w-5 h-5 text-blue-600 mr-2" /> Translation
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] border border-gray-200">
              {result.translatedPrompt ? (
                <p className="text-gray-700 whitespace-pre-line">{result.translatedPrompt}</p>
              ) : (
                <p className="text-gray-400 italic">Translation will appear here...</p>
              )}
            </div>
          </div>
        </div>

        {/* Website Output Section */}
        {(result.websiteHtml || result.explanation) && !error && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
              <Code className="w-5 h-5 text-blue-600 mr-2" /> Generated Website
            </h2>
            <div className="border rounded-lg overflow-hidden mb-4 bg-white border-gray-300">
              <iframe
                title="Generated Website"
                srcDoc={result.websiteHtml}
                className="w-full h-96 border-none"
              />
            </div>
            {result.explanation && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                <h3 className="font-semibold mb-2 text-gray-900 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-blue-600" />Explanation
                </h3>
                <p className="text-gray-700 whitespace-pre-line">{result.explanation}</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default WebsiteGenerator;