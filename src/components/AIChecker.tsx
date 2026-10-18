import { useState, useEffect, useRef } from 'react';
import { AISentence, AICorrection, AIOutputFormat } from '../types';

const AI_INSTRUCTION = `Please check the following English sentences for grammar, spelling, word choice, and natural expression errors. For each sentence, provide corrections and explanations. Return your response in the exact JSON format specified below.`;

const AI_RESPONSE_FORMAT = `{
  "results": [
    {
      "id": "sentence-id",
      "correctedText": "the corrected version of the sentence",
      "errors": [
        {
          "original": "the wrong part",
          "correction": "the correct version",
          "type": "grammar|spelling|word_choice|naturalness",
          "explanation": "why this is wrong and how to fix it"
        }
      ],
      "suggestions": ["additional suggestions for improvement"],
      "score": 85
    }
  ]
}`;

export default function AIChecker() {
  const [sentences, setSentences] = useState<AISentence[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [corrections, setCorrections] = useState<Record<string, AICorrection>>({});
  const [showJsonOutput, setShowJsonOutput] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'results'>('write');
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const responseFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ai-sentences');
    if (saved) setSentences(JSON.parse(saved));
    const savedCorrections = localStorage.getItem('ai-corrections');
    if (savedCorrections) setCorrections(JSON.parse(savedCorrections));
  }, []);

  useEffect(() => {
    localStorage.setItem('ai-sentences', JSON.stringify(sentences));
  }, [sentences]);

  useEffect(() => {
    localStorage.setItem('ai-corrections', JSON.stringify(corrections));
  }, [corrections]);

  const handleAddSentence = () => {
    if (!currentText.trim()) return;
    const newSentence: AISentence = {
      id: `sent-${Date.now()}`,
      originalText: currentText.trim(),
      createdAt: Date.now(),
    };
    setSentences([...sentences, newSentence]);
    setCurrentText('');
  };

  const handleDeleteSentence = (id: string) => {
    setSentences(sentences.filter(s => s.id !== id));
    const newCorrections = { ...corrections };
    delete newCorrections[id];
    setCorrections(newCorrections);
  };

  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all sentences?')) {
      setSentences([]);
      setCorrections({});
      setAiResponse('');
    }
  };

  const handleClearCorrections = () => {
    if (confirm('Are you sure you want to clear all corrections?')) {
      setCorrections({});
      setAiResponse('');
    }
  };

  const generateJsonOutput = (): AIOutputFormat => {
    return {
      sentences: sentences.map(s => ({
        id: s.id,
        originalText: s.originalText,
      })),
      instruction: AI_INSTRUCTION,
      expectedResponseFormat: AI_RESPONSE_FORMAT,
    };
  };

  const generatePromptText = (): string => {
    const jsonOutput = generateJsonOutput();
    return `Please check the following English sentences for grammar, spelling, word choice, and natural expression errors.

Sentences to check:
${jsonOutput.sentences.map((s, i) => `${i + 1}. [ID: ${s.id}] ${s.originalText}`).join('\n')}

Please return your response in EXACTLY this JSON format:
${AI_RESPONSE_FORMAT}

Make sure each result has the matching "id" from the sentences above.`;
  };

  const handleCopyJson = () => {
    const json = JSON.stringify(generateJsonOutput(), null, 2);
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyPrompt = () => {
    const prompt = generatePromptText();
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const processAIResponseData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.results && Array.isArray(parsed.results)) {
        const newCorrections: Record<string, AICorrection> = { ...corrections };
        parsed.results.forEach((result: any) => {
          newCorrections[result.id] = {
            correctedText: result.correctedText || '',
            errors: result.errors || [],
            suggestions: result.suggestions || [],
            score: result.score,
          };
        });
        setCorrections(newCorrections);
        setActiveTab('results');
        return true;
      } else {
        alert('فرمت نامعتبر! مطمئن شوید JSON شامل آرایه "results" است.');
        return false;
      }
    } catch {
      alert('JSON نامعتبر! لطفاً فرمت را بررسی کنید.');
      return false;
    }
  };

  const handleProcessAIResponse = () => {
    processAIResponseData(aiResponse);
  };

  const handleImportResponseFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setAiResponse(content);
      processAIResponseData(content);
    };
    reader.readAsText(file);
    if (responseFileRef.current) responseFileRef.current.value = '';
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResults(newExpanded);
  };

  const expandAll = () => {
    const allIds = sentences.filter(s => corrections[s.id]).map(s => s.id);
    setExpandedResults(new Set(allIds));
  };

  const collapseAll = () => {
    setExpandedResults(new Set());
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300';
    return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🌟';
    if (score >= 70) return '👍';
    if (score >= 50) return '⚠️';
    return '❌';
  };

  const getErrorTypeColor = (type: string) => {
    switch (type) {
      case 'grammar': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'spelling': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'word_choice': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'naturalness': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getErrorTypeEmoji = (type: string) => {
    switch (type) {
      case 'grammar': return '📝';
      case 'spelling': return '🔤';
      case 'word_choice': return '🎯';
      case 'naturalness': return '💬';
      default: return '⚡';
    }
  };

  const uncorrectedCount = sentences.filter(s => !corrections[s.id]).length;
  const correctedSentences = sentences.filter(s => corrections[s.id]);
  const avgScore = correctedSentences.length > 0
    ? Math.round(correctedSentences.reduce((sum, s) => sum + (corrections[s.id]?.score || 0), 0) / correctedSentences.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          🤖 AI Sentence Checker
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          جملات خود را بنویسید، خروجی JSON/Prompt بگیرید و پاسخ AI را اینجا پردازش کنید
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('write')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'write'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          ✍️ Write & Export
          {sentences.length > 0 && (
            <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
              {sentences.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'results'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          📋 Results
          {Object.keys(corrections).length > 0 && (
            <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded-full text-xs">
              {Object.keys(corrections).length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'write' && (
        <div className="space-y-6">
          {/* Input */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              جمله خود را بنویسید:
            </label>
            <div className="flex gap-3">
              <textarea
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="Write your English sentence to check..."
                className="flex-1 p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl
                           focus:border-purple-500 dark:focus:border-purple-400 focus:ring-2 focus:ring-purple-200
                           outline-none transition-all resize-none
                           bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddSentence();
                  }
                }}
              />
              <button
                onClick={handleAddSentence}
                disabled={!currentText.trim()}
                className="self-end px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400
                           text-white rounded-lg font-medium transition-all shadow-md"
              >
                ➕ Add
              </button>
            </div>
          </div>

          {/* Saved Sentences */}
          {sentences.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 dark:text-white">
                  Saved Sentences ({sentences.length})
                  {uncorrectedCount > 0 && (
                    <span className="ml-2 text-sm text-orange-500">
                      ({uncorrectedCount} unchecked)
                    </span>
                  )}
                </h3>
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  🗑️ Clear All
                </button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                {sentences.map((sentence, index) => (
                  <div
                    key={sentence.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <span className="text-sm text-gray-400 w-6">{index + 1}.</span>
                    <p className="flex-1 text-gray-800 dark:text-white text-sm">
                      {sentence.originalText}
                    </p>
                    {corrections[sentence.id] ? (
                      <span className="text-green-500 text-xs" title="Checked">✅</span>
                    ) : (
                      <span className="text-orange-500 text-xs" title="Pending">⏳</span>
                    )}
                    <button
                      onClick={() => handleDeleteSentence(sentence.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Section */}
          {sentences.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                📤 Output for AI
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                یکی از خروجی‌های زیر را کپی کنید و به هوش مصنوعی بدهید تا جملات شما را بررسی کند
              </p>
              
              {/* Copy Prompt Button */}
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={handleCopyPrompt}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700
                             text-white rounded-lg font-medium transition-all shadow-md text-sm"
                >
                  {copiedPrompt ? '✅ Copied Prompt!' : '📋 Copy as Prompt (Recommended)'}
                </button>
                <button
                  onClick={() => setShowJsonOutput(!showJsonOutput)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 
                             rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm"
                >
                  {showJsonOutput ? '🙈 Hide JSON' : '👁️ Show JSON Format'}
                </button>
              </div>

              {showJsonOutput && (
                <div className="relative mb-4">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-xl overflow-x-auto text-sm max-h-80 overflow-y-auto scrollbar-thin">
                    {JSON.stringify(generateJsonOutput(), null, 2)}
                  </pre>
                  <button
                    onClick={handleCopyJson}
                    className="absolute top-2 right-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 
                               text-white rounded-lg text-xs transition-all"
                  >
                    {copied ? '✅ Copied!' : '📋 Copy JSON'}
                  </button>
                </div>
              )}

              {/* AI Response Input */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                  📥 Paste AI Response (JSON):
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  پاسخ هوش مصنوعی را اینجا پیست کنید یا فایل JSON را آپلود کنید
                </p>
                <textarea
                  value={aiResponse}
                  onChange={(e) => setAiResponse(e.target.value)}
                  placeholder='Paste the JSON response from AI here...\n{\n  "results": [...]\n}'
                  className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl
                             focus:border-green-500 dark:focus:border-green-400 focus:ring-2 focus:ring-green-200
                             outline-none transition-all resize-none font-mono text-sm
                             bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white"
                  rows={8}
                />
                <div className="flex flex-wrap gap-3 mt-3">
                  <button
                    onClick={handleProcessAIResponse}
                    disabled={!aiResponse.trim()}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400
                               text-white rounded-lg font-medium transition-all shadow-md"
                  >
                    🔄 Process Corrections
                  </button>
                  <label className="px-4 py-2 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 
                             rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-all text-sm font-medium cursor-pointer">
                    📁 Import JSON File
                    <input
                      ref={responseFileRef}
                      type="file"
                      accept=".json,.txt"
                      onChange={handleImportResponseFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">
          {/* Results Header */}
          {Object.keys(corrections).length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 border border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-600">{correctedSentences.length}</p>
                  <p className="text-xs text-gray-500">Checked</p>
                </div>
                {avgScore > 0 && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-purple-600">{getScoreEmoji(avgScore)} {avgScore}%</p>
                    <p className="text-xs text-gray-500">Avg Score</p>
                  </div>
                )}
                <div className="text-center">
                  <p className="text-lg font-bold text-red-600">
                    {correctedSentences.reduce((sum, s) => sum + (corrections[s.id]?.errors?.length || 0), 0)}
                  </p>
                  <p className="text-xs text-gray-500">Total Errors</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={expandAll} className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                  📖 Expand All
                </button>
                <button onClick={collapseAll} className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                  📕 Collapse All
                </button>
                <button onClick={handleClearCorrections} className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50">
                  🗑️ Clear
                </button>
              </div>
            </div>
          )}

          {Object.keys(corrections).length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-4">🔍</p>
              <p>No corrections yet. Add sentences and process AI response first.</p>
            </div>
          ) : (
            sentences.filter(s => corrections[s.id]).map(sentence => {
              const correction = corrections[sentence.id];
              const isExpanded = expandedResults.has(sentence.id);
              return (
                <div
                  key={sentence.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  {/* Collapsible Header */}
                  <div 
                    className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    onClick={() => toggleExpanded(sentence.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-gray-800 dark:text-white font-medium text-sm mb-1">
                          {sentence.originalText}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {correction.errors.length > 0 && (
                            <span className="text-xs text-red-500">
                              {correction.errors.length} error{correction.errors.length > 1 ? 's' : ''}
                            </span>
                          )}
                          {correction.errors.length === 0 && (
                            <span className="text-xs text-green-500">✨ Perfect!</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {correction.score !== undefined && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getScoreColor(correction.score)}`}>
                            {correction.score}%
                          </span>
                        )}
                        <span className="text-gray-400 text-sm">
                          {isExpanded ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-gray-100 dark:border-gray-700 pt-4">
                      {/* Corrected Text */}
                      {correction.correctedText && (
                        <>
                          <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2 text-sm">
                            ✅ Corrected:
                          </h4>
                          <p className="text-green-800 dark:text-green-300 mb-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-sm">
                            {correction.correctedText}
                          </p>
                        </>
                      )}

                      {/* Errors */}
                      {correction.errors.length > 0 && (
                        <>
                          <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 text-sm">
                            ❌ Errors Found ({correction.errors.length}):
                          </h4>
                          <div className="space-y-3 mb-4">
                            {correction.errors.map((error, idx) => (
                              <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getErrorTypeColor(error.type)}`}>
                                    {getErrorTypeEmoji(error.type)} {error.type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm mb-1">
                                  <span className="text-red-600 dark:text-red-400 line-through">{error.original}</span>
                                  <span className="text-gray-400">→</span>
                                  <span className="text-green-600 dark:text-green-400 font-medium">{error.correction}</span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  💡 {error.explanation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {/* Suggestions */}
                      {correction.suggestions.length > 0 && (
                        <>
                          <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2 text-sm">
                            💡 Suggestions:
                          </h4>
                          <ul className="space-y-1">
                            {correction.suggestions.map((suggestion, idx) => (
                              <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                                <span className="text-blue-500 mt-0.5">•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
