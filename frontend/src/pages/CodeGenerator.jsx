import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Code, FileText, BookOpen, Loader2, Copy, Check, AlertCircle } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useAuth } from '../contexts/AuthContext';
import { generationAPI } from '../lib/api';

const CodeGenerator = () => {
  const [userInput, setUserInput] = useState('');
  const [languageCode, setLanguageCode] = useState('ta-IN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState({
    translatedPrompt: '',
    codeOutput: '',
    explanation: ''
  });
  const [isCopied, setIsCopied] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

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
    { code: 'pa-IN', name: 'Punjabi' },
    { code: 'en-US', name: 'English' } // Added English for completeness
  ];

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setError('Please enter a description for the code.');
      return;
    }
    setIsLoading(true);
    setError('');
    setResult({ translatedPrompt: '', codeOutput: '', explanation: '' });
    try {
      const response = await generationAPI.processGeneration({
        user_input: userInput,
        user_language_code: languageCode,
        choice: 'code'
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      setResult({
        translatedPrompt: response.translatedPrompt,
        codeOutput: response.codeOutput,
        explanation: response.explanation
      });
      
    } catch (err) {
      setError('Failed to generate code. Please try again or check your connection.');
      console.error('Error in handleGenerate:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (result.codeOutput) {
      navigator.clipboard.writeText(result.codeOutput);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const getLanguageName = (code) => {
    const lang = languages.find(lang => lang.code === code);
    return lang ? lang.name : 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Code Generator</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Input</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Select Your Language</label>
                <select
                  value={languageCode}
                  onChange={(e) => setLanguageCode(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Describe the code you want to generate</label>
                <textarea
                  rows="6"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Write a Python function to calculate Fibonacci sequence"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2" size={20} />
                    Generate Code
                  </>
                )}
              </button>
            </form>
            {error && (
              <p className="mt-4 text-sm text-red-600 flex items-center">
                <AlertCircle className="mr-2" size={16} />
                {error}
              </p>
            )}
          </div>

          {/* Output Section */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Output</h2>

            {/* Translated Prompt */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <FileText className="mr-2" size={20} />
                Translated Prompt
              </h3>
              <div className="bg-gray-100 p-4 rounded-lg text-gray-700 whitespace-pre-wrap break-words text-sm">
                {result.translatedPrompt || 'Your translated prompt will appear here...'}
              </div>
            </div>

            {/* Code Output */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <Code className="mr-2" size={20} />
                  Code Output
                </h3>
                {result.codeOutput && (
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {isCopied ? (
                      <>
                        <Check className="mr-1" size={16} />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1" size={16} />
                        Copy Code
                      </>
                    )}
                  </button>
                )}
              </div>
              {result.codeOutput ? (
                <div className="rounded-lg overflow-hidden">
                  <SyntaxHighlighter language="python" style={darcula}>
                    {result.codeOutput}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded-lg text-gray-700 text-sm">
                  Your generated code will appear here...
                </div>
              )}
            </div>

            {/* Explanation */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                <BookOpen className="mr-2" size={20} />
                Explanation (in {getLanguageName(languageCode)})
              </h3>
              <div className="bg-gray-100 p-4 rounded-lg text-gray-700 whitespace-pre-wrap break-words text-sm">
                {result.explanation || 'Explanation of the code will appear here...'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CodeGenerator;