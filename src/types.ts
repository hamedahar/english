export interface Sentence {
  id: string;
  text: string;
  highlightedWords: string[];
  createdAt: number;
  category?: string;
}

export interface AISentence {
  id: string;
  originalText: string;
  createdAt: number;
  corrections?: AICorrection;
}

export interface AICorrection {
  correctedText: string;
  errors: AIError[];
  suggestions: string[];
  score?: number;
}

export interface AIError {
  original: string;
  correction: string;
  type: string;
  explanation: string;
}

export interface AIOutputFormat {
  sentences: {
    id: string;
    originalText: string;
  }[];
  instruction: string;
  expectedResponseFormat: string;
}
