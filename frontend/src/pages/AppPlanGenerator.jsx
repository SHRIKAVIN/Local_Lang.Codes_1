import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Code, BookOpen, Loader2, ArrowRight, Clock, Globe, Terminal, AlertCircle, Copy } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import { useAuth } from '../contexts/AuthContext';
import { authenticatedFetch } from '../utils/api';
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
  const { user } = useAuth();
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
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Function to parse the markdown blueprint into sections
  const parseBlueprint = (markdown) => {
    if (!markdown) return [];
    const sections = [];
    let currentSection = null;

    const lines = markdown.split('\n');
    for (const line of lines) {
      // Check for both single (# ) and double (## ) hash headings
      const headingMatch = line.match(/##?\s*(.+)/);

      if (headingMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        // Use the matched heading text as the title
        currentSection = { title: headingMatch[1].trim(), content: [] };
      } else if (currentSection) {
        // Add non-heading lines to the current section's content
        currentSection.content.push(line);
      }
    }
    // Push the last section if it exists
    if (currentSection) {
      sections.push(currentSection);
    }

    // Filter out empty lines and potentially empty sections (optional, depending on desired output)
    return sections
      .map(section => ({...section, content: section.content.filter(line => line.trim() !== '').map(line => line.trim())}))
      .filter(section => section.title !== 'Introduction' || section.content.length > 0); // Keep non-empty Introduction or other sections
  };

  const handleGenerate = async () => {
    if (!userInput.trim()) return;
    setIsLoading(true);
    setError('');
    setResult({ translatedPrompt: '', appPlanOutput: '' });
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.GENERATE_APP_PLAN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        user_input: userInput,
        user_language_code: languageCode
        }),
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      setResult({
        translatedPrompt: response.translatedPrompt,
        appPlanOutput: response.appPlanOutput
      });
      
    } catch (err) {
      setError('Failed to generate app plan. Please try again.');
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

  const handleGenerateCode = async () => {
    if (!result.appPlanOutput) return;
    setIsGeneratingCode(true);
    setCodeGenerationError('');
    setGeneratedCodeResult({ codeOutput: '', explanation: '' });
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.GENERATE_CODE_FROM_PLAN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
        app_plan_text: result.appPlanOutput
        }),
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      setGeneratedCodeResult({
        codeOutput: response.codeOutput,
        explanation: 'Code generated from your app plan'
      });
      
    } catch (err) {
      setCodeGenerationError('Failed to generate code. Please try again.');
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

  const appPlanSections = parseBlueprint(result.appPlanOutput);
  console.log('App Plan Sections:', appPlanSections);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">App Plan Generator</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Input and Output Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  rows="6"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., A mobile app to track personal expenses"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
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
                    Building Plan...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2" size={20} />
                    Build App Plan
                  </>
                )}
              </button>
            </form>
            {error && (
              <p className="mt-4 text-sm text-red-600 flex items-center"><AlertCircle className="mr-2" size={16} />{error}</p>
            )}
          </div>

          {/* Right Side - Output */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Translation & Blueprint</h2>

            {/* Translated Prompt */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center"><ArrowRight className="mr-2" size={20} />Translated Prompt</h3>
              <div className="bg-gray-100 p-4 rounded-lg text-gray-700 whitespace-pre-wrap break-words text-sm">
                {result.translatedPrompt || 'Your translated prompt will appear here...'}
              </div>
            </div>

            {/* App Blueprint */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center"><BookOpen className="mr-2" size={20} />App Blueprint</h3>
              {result.appPlanOutput ? (
                <div className="space-y-4">
                  {appPlanSections.map((section, index) => (
                    <Disclosure as="div" key={index} className="mt-2">
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex w-full justify-between rounded-lg bg-blue-100 px-4 py-2 text-left text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                            <span>{section.title}</span>
                            <ChevronUpIcon
                              className={`${
                                open ? 'rotate-180 transform' : ''
                              } h-5 w-5 text-blue-500`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="px-4 pt-4 pb-2 text-sm text-gray-500">
                            {section.content.map((line, lineIndex) => (
                              <p key={lineIndex}>{line}</p>
                            ))}
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  ))}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4">
                    <button
                      onClick={handleGenerateCode}
                      className="w-full sm:w-auto flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center justify-center"
                      disabled={isGeneratingCode}
                    >
                       {isGeneratingCode ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={20} />
                          Generating Code...
                        </>
                      ) : (
                        <>
                          <Code className="mr-2" size={20} />
                          Generate Code for Plan
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCopyBlueprint}
                      className="w-full sm:w-auto flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center justify-center"
                    >
                      <Copy className="mr-2" size={20} />
                      Copy Blueprint
                    </button>
                    <button
                      onClick={handleExportPlan}
                      className="w-full sm:w-auto flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 flex items-center justify-center"
                    >
                      <Terminal className="mr-2" size={20} />
                      Export to ZIP
                    </button>
                  </div>
                  {codeGenerationError && (
                     <p className="mt-4 text-sm text-red-600 flex items-center"><AlertCircle className="mr-2" size={16} />{codeGenerationError}</p>
                   )}
                     {generatedCodeResult.codeOutput && (
                         <div className="mt-6">
                             <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center"><Code className="mr-2" size={20} />Generated Code</h3>
                             <div className="bg-gray-100 p-4 rounded-lg text-gray-700 whitespace-pre-wrap break-words text-sm">
                                 {generatedCodeResult.codeOutput}
                             </div>
                             {generatedCodeResult.explanation && (
                                 <div className="mt-4">
                                      <h4 className="text-md font-medium text-gray-800 mb-2 flex items-center"><BookOpen className="mr-2" size={18} />Explanation</h4>
                                     <div className="bg-gray-100 p-4 rounded-lg text-gray-700 whitespace-pre-wrap break-words text-sm">
                                         {generatedCodeResult.explanation}
                                     </div>
                                 </div>
                             )}
                         </div>
                     )}

                </div>
              ) : ( <div className="bg-gray-100 p-4 rounded-lg text-gray-700 text-sm">Your app blueprint will appear here...</div> )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppPlanGenerator;