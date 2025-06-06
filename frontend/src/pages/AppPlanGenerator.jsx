import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Code, BookOpen, Loader2, ArrowRight, Clock, Globe, Terminal } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import { API_ENDPOINTS } from '../config';

const AppPlanGenerator = () => {
  const [userInput, setUserInput] = useState('');
  const [languageCode, setLanguageCode] = useState('ta-IN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState({
    translatedPrompt: '',
    appPlanOutput: ''
  });
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [appPlanResult, setAppPlanResult] = useState('');
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [codeGenerationError, setCodeGenerationError] = useState('');
  const [generatedCodeResult, setGeneratedCodeResult] = useState({
    codeOutput: '',
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

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  // Function to parse the markdown blueprint into sections
  const parseAppBlueprint = (markdown) => {
    const sections = [];
    const lines = markdown.split('\n');
    let currentSection = null;

    for (const line of lines) {
      const headingMatch = line.match(/##?\s*(.+)/); // Match ## or # headings
      const boldTitleMatch = line.match(/\*\*(.+):\*\*/); // Match bold titles like **Title:**

      if (headingMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: headingMatch[1].trim(), content: [] };
      } else if (boldTitleMatch) {
        if (currentSection) {
           // If there's an existing section, push it first if it has content
           if (currentSection.content.length > 0) {
               sections.push(currentSection);
           }
           // Start a new section with the bold title
           currentSection = { title: boldTitleMatch[1].trim() + ':', content: [] };
        } else {
          // If no current section, start one with the bold title
          currentSection = { title: boldTitleMatch[1].trim() + ':', content: [] };
        }
        // Add the rest of the line after the bold title to content
        const remainingContent = line.substring(boldTitleMatch[0].length).trim();
        if (remainingContent) {
            currentSection.content.push(remainingContent);
        }
      } else if (currentSection) {
        currentSection.content.push(line);
      } else {
        // If there's no current section and it's not a heading, treat as introductory content
        if (sections.length === 0) {
             sections.push({ title: 'Introduction', content: [line] });
        } else {
             // Add to the content of the last section if it exists
             sections[sections.length - 1].content.push(line);
        }
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    // Clean up empty content arrays and trim content lines
    return sections
      .map(section => ({...section, content: section.content.filter(line => line.trim() !== '').map(line => line.trim())}))
      .filter(section => section.title !== 'Introduction' || section.content.length > 0);
  };

  const handleGenerate = async () => {
    if (!userInput.trim()) return;
    setIsLoading(true);
    setError('');
    setResult({ translatedPrompt: '', appPlanOutput: '' });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.GENERATE_APP_PLAN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_input: userInput,
          user_language_code: languageCode,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setError(data.error);
        setResult({ translatedPrompt: '', appPlanOutput: '' });
      } else if (data.appPlanOutput) {
        setResult({ translatedPrompt: data.translatedPrompt, appPlanOutput: data.appPlanOutput });
      } else {
        setError('Failed to generate app plan.');
      }
    } catch (err) {
      console.error('App plan generation error:', err);
      setError('Failed to connect to backend or an unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPlan = async () => {
    if (!result.appPlanOutput) return;

    const zip = new JSZip();
    const fileName = 'app_blueprint.md';
    const fileContent = result.appPlanOutput;

    zip.file(fileName, fileContent);

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'app_blueprint.zip');
    } catch (err) {
      console.error('Error creating or saving zip file:', err);
      alert('Failed to export app blueprint.');
    }
  };

  const handleGenerateCodeForPlan = async () => {
    if (!result.appPlanOutput) return;
    setIsGeneratingCode(true);
    setCodeGenerationError('');
    setGeneratedCodeResult({ codeOutput: '', explanation: '' });
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_ENDPOINTS.GENERATE_CODE_FROM_PLAN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          app_plan_text: result.appPlanOutput,
        }),
      });
      const data = await response.json();
      if (data.error) {
        setCodeGenerationError(data.error);
        setGeneratedCodeResult({ codeOutput: '', explanation: '' });
      } else if (data.codeOutput) {
        setGeneratedCodeResult({ codeOutput: data.codeOutput, explanation: data.explanation || '' });
      } else {
        setCodeGenerationError('Failed to generate code from plan.');
      }
    } catch (err) {
      console.error('Code generation from plan error:', err);
      setCodeGenerationError('Failed to connect to backend or an unexpected error occurred during code generation.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyBlueprint = async () => {
    if (!result.appPlanOutput) return;
    try {
      await navigator.clipboard.writeText(result.appPlanOutput);
      alert('Blueprint copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy blueprint:', err);
      alert('Failed to copy blueprint.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <h1 className="text-2xl font-bold text-gray-900">App Plan Generator</h1>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <label className="block text-gray-700 font-medium mb-2">Describe what app you want to build</label>
                <textarea
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  rows={8}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your app idea in your native language..."
                />
              </div>
              {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
              <button
                type="submit"
                disabled={isLoading || !userInput.trim()} // Use isLoading for consistency
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center blue-button"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Building Plan...
                  </>
                ) : (
                  <>
                    <Terminal className="w-5 h-5 mr-2" /> Build App Plan
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Side - Translation and Output */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
              <ArrowRight className="w-5 h-5 text-blue-600 mr-2" /> Translation & Blueprint
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] border border-gray-200 mb-4">
              <h3 className="font-semibold mb-2 text-gray-900">Translated Prompt</h3>
              {result.translatedPrompt ? (
                <p className="text-gray-700 whitespace-pre-line">{result.translatedPrompt}</p>
              ) : (
                <p className="text-gray-400 italic">Translation will appear here...</p>
              )}
            </div>

            {result.appPlanOutput && (
              <div className="mt-8 p-6 bg-gray-100 rounded-lg border border-gray-300">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-blue-600" /> App Blueprint
                </h3>
                <div className="space-y-2">
                  {parseAppBlueprint(result.appPlanOutput).map((section, index) => (
                    <Disclosure key={index}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex justify-between w-full px-4 py-2 text-sm font-medium text-left text-blue-900 bg-blue-100 rounded-lg hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                            <span>{section.title}</span>
                            <ChevronUpIcon
                              className={`${
                                open ? 'transform rotate-180' : ''
                              } w-5 h-5 text-blue-500`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500 bg-white rounded-b-lg border border-t-0 border-gray-200">
                            {section.content.map((line, lineIndex) => (
                              <p key={lineIndex} className="mb-1 last:mb-0">{line}</p>
                            ))}
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  ))}
                </div>
                <div className="flex space-x-4 mt-6 justify-end">
                  <button
                    onClick={handleGenerateCodeForPlan}
                    disabled={isGeneratingCode}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingCode ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating Code...
                      </>
                    ) : (
                      'Generate Code for Plan'
                    )}
                  </button>
                  <button
                    onClick={handleCopyBlueprint}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Copy Blueprint
                  </button>
                  <button
                    onClick={handleExportPlan}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    📦 Export to ZIP
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Generated Code from Plan Section */}
      {generatedCodeResult.codeOutput && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
              <Code className="w-5 h-5 text-blue-600 mr-2" /> Generated Code for Plan
            </h2>
            {codeGenerationError && <div className="mb-4 text-red-600 text-sm">{codeGenerationError}</div>}
            <pre className="bg-gray-100 rounded-lg p-4 overflow-x-auto text-sm text-gray-800 mb-4 border border-gray-300">
              {generatedCodeResult.codeOutput}
            </pre>
            {generatedCodeResult.explanation && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                <h3 className="font-semibold mb-2 text-gray-900 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2 text-blue-600" />Explanation
                </h3>
                <p className="text-gray-700 whitespace-pre-line">{generatedCodeResult.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppPlanGenerator; 