import { useState, useEffect } from 'react';
import { Sentence } from '../types';

export default function SentenceCollector() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const saved = localStorage.getItem('sentences');
    if (saved) {
      setSentences(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('sentences', JSON.stringify(sentences));
  }, [sentences]);

  const handleWordClick = (word: string) => {
    const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
    if (!cleanWord) return;
    
    if (highlightedWords.includes(cleanWord)) {
      setHighlightedWords(highlightedWords.filter(w => w !== cleanWord));
    } else {
      setHighlightedWords([...highlightedWords, cleanWord]);
    }
  };

  const handleSave = () => {
    if (!currentText.trim()) return;
    
    const newSentence: Sentence = {
      id: Date.now().toString(),
      text: currentText.trim(),
      highlightedWords,
      createdAt: Date.now(),
      category: category || 'general',
    };
    
    setSentences([newSentence, ...sentences]);
    setCurrentText('');
    setHighlightedWords([]);
    setCategory('');
  };

  const handleDelete = (id: string) => {
    setSentences(sentences.filter(s => s.id !== id));
  };

  const renderTextWithHighlights = (text: string, highlights: string[]) => {
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
      const isHighlighted = highlights.includes(cleanWord);
      return (
        <span
          key={index}
          className={isHighlighted ? 'bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded font-semibold' : ''}
        >
          {word}
        </span>
      );
    });
  };

  const renderEditableText = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((word, index) => {
      const cleanWord = word.replace(/[.,!?;:'"()]/g, '');
      const isHighlighted = highlightedWords.includes(cleanWord);
      if (!cleanWord) return <span key={index}>{word}</span>;
      return (
        <span
          key={index}
          onClick={() => handleWordClick(word)}
          className={`cursor-pointer transition-all duration-200 rounded px-0.5 ${
            isHighlighted
              ? 'bg-yellow-300 dark:bg-yellow-600 font-semibold shadow-sm'
              : 'hover:bg-blue-100 dark:hover:bg-blue-900'
          }`}
        >
          {word}
        </span>
      );
    });
  };

  const categories = [...new Set(sentences.map(s => s.category || 'general'))];
  
  const filteredSentences = sentences.filter(s => {
    const matchesSearch = s.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.highlightedWords.some(w => w.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === 'all' || s.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          📝 Sentence Collector
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          جملات انگلیسی بنویسید و روی کلمات مهم کلیک کنید تا هایلایت شوند
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border border-gray-100 dark:border-gray-700">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            جمله انگلیسی را بنویسید:
          </label>
          <textarea
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder="Type your English sentence here..."
            className="w-full p-4 border-2 border-gray-200 dark:border-gray-600 rounded-xl 
                       focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 
                       dark:focus:ring-blue-800 outline-none transition-all resize-none
                       bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white text-lg"
            rows={3}
          />
        </div>

        {/* Clickable Words Preview */}
        {currentText && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              روی کلمات مهم کلیک کنید (👆 Click important words):
            </label>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-lg leading-relaxed text-gray-800 dark:text-white min-h-[60px]">
              {renderEditableText(currentText)}
            </div>
            {highlightedWords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Highlighted:</span>
                {highlightedWords.map(w => (
                  <span key={w} className="bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full text-xs font-medium">
                    {w}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category & Save */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category (optional)"
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                       bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white
                       focus:border-blue-500 outline-none"
          />
          <button
            onClick={handleSave}
            disabled={!currentText.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                       text-white rounded-lg font-medium transition-all shadow-md 
                       hover:shadow-lg disabled:shadow-none"
          >
            💾 Save Sentence
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Search sentences or vocabulary..."
            className="w-full px-4 py-2 pl-10 border border-gray-200 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-800 dark:text-white
                       focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Sentences List */}
      <div className="space-y-4">
        {filteredSentences.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-4">📭</p>
            <p>No sentences yet. Start writing!</p>
          </div>
        ) : (
          filteredSentences.map(sentence => (
            <div
              key={sentence.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 border border-gray-100 dark:border-gray-700
                         hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                  {sentence.category || 'general'}
                </span>
                <button
                  onClick={() => handleDelete(sentence.id)}
                  className="text-red-400 hover:text-red-600 transition-colors text-sm"
                >
                  🗑️ Delete
                </button>
              </div>
              <p className="text-lg text-gray-800 dark:text-white leading-relaxed mb-3">
                {renderTextWithHighlights(sentence.text, sentence.highlightedWords)}
              </p>
              {sentence.highlightedWords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sentence.highlightedWords.map(w => (
                    <span
                      key={w}
                      className="bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-200 px-2 py-0.5 rounded text-sm"
                    >
                      {w}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {new Date(sentence.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow border border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-blue-600">{sentences.length}</p>
          <p className="text-sm text-gray-500">Total Sentences</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow border border-gray-100 dark:border-gray-700">
          <p className="text-2xl font-bold text-yellow-600">
            {new Set(sentences.flatMap(s => s.highlightedWords)).size}
          </p>
          <p className="text-sm text-gray-500">Unique Words</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center shadow border border-gray-100 dark:border-gray-700 col-span-2 md:col-span-1">
          <p className="text-2xl font-bold text-green-600">{categories.length}</p>
          <p className="text-sm text-gray-500">Categories</p>
        </div>
      </div>
    </div>
  );
}
