import { useState } from 'react';
import SentenceCollector from './components/SentenceCollector';
import AIChecker from './components/AIChecker';

type Page = 'collector' | 'checker';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('collector');
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' ||
        (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('darkMode', String(!darkMode));
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📚</span>
              <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden sm:block">
                English Studio
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage('collector')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === 'collector'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="hidden sm:inline">📝 Sentences</span>
                <span className="sm:hidden">📝</span>
              </button>
              <button
                onClick={() => setCurrentPage('checker')}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentPage === 'checker'
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="hidden sm:inline">🤖 AI Checker</span>
                <span className="sm:hidden">🤖</span>
              </button>
              
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        </nav>

        {/* Content */}
        <main className="pb-12">
          {currentPage === 'collector' && <SentenceCollector />}
          {currentPage === 'checker' && <AIChecker />}
        </main>

        {/* Footer */}
        <footer className="text-center py-4 text-sm text-gray-400 dark:text-gray-600">
          English Sentence Studio — Learn & Improve ✨
        </footer>
      </div>
    </div>
  );
}

export default App;
