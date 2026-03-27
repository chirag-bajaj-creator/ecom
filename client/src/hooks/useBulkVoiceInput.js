import { useState, useRef, useCallback } from 'react';

const FIELD_ORDER = ['name', 'category', 'subcategory', 'price', 'stock', 'description'];
const FIELD_LABELS = {
  name: 'Product Names',
  category: 'Categories',
  subcategory: 'Subcategories',
  price: 'Prices',
  stock: 'Stock Values',
  description: 'Descriptions',
};

const useBulkVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [isSupported] = useState(() =>
    typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  );
  const recognitionRef = useRef(null);

  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [fieldValues, setFieldValues] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    stock: '',
    description: '',
  });
  const [interimText, setInterimText] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [itemCount, setItemCount] = useState(0);
  const shouldRestartRef = useRef(false);

  const currentField = FIELD_ORDER[currentFieldIndex];

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }
    setError('');
    setInterimText('');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let lastProcessedIndex = 0;
    shouldRestartRef.current = true;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = lastProcessedIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          lastProcessedIndex = i + 1;
          if (text) {
            const separated = text.replace(/\bnext\b/gi, ',');
            setFieldValues(prev => {
              const field = FIELD_ORDER[currentFieldIndex];
              const existing = prev[field];
              const updated = existing ? existing + ', ' + separated.trim() : separated.trim();
              // Update item count from the updated value
              const count = updated.split(',').filter(item => item.trim().length > 0).length;
              setItemCount(count);
              return { ...prev, [field]: updated };
            });
          }
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInterimText(interim);
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' && shouldRestartRef.current) {
        // Auto-restart on no-speech timeout
        try { recognition.start(); } catch(e) {}
        return;
      }
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if user hasn't manually stopped
      if (shouldRestartRef.current) {
        try {
          lastProcessedIndex = 0;
          recognition.start();
        } catch(e) {
          setIsListening(false);
        }
        return;
      }
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported, currentFieldIndex]);

  const stopListening = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const goToNextField = useCallback(() => {
    if (isListening) {
      shouldRestartRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    }
    if (currentFieldIndex < FIELD_ORDER.length - 1) {
      setCurrentFieldIndex(prev => prev + 1);
      setValidationError('');
    }
  }, [isListening, currentFieldIndex]);

  const goToPrevField = useCallback(() => {
    if (isListening) {
      shouldRestartRef.current = false;
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setInterimText('');
    }
    if (currentFieldIndex > 0) {
      setCurrentFieldIndex(prev => prev - 1);
      setValidationError('');
    }
  }, [isListening, currentFieldIndex]);

  const parseField = (rawText) => {
    if (!rawText.trim()) return [];
    return rawText.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  const validateAndBuild = useCallback(() => {
    const parsed = {};
    const counts = {};

    for (const field of FIELD_ORDER) {
      parsed[field] = parseField(fieldValues[field]);
      counts[field] = parsed[field].length;
    }

    // Check if all fields have same count
    const countValues = Object.values(counts);
    const firstCount = countValues[0];

    if (firstCount === 0) {
      setValidationError('No items found. Please speak at least one value for each field.');
      return null;
    }

    const mismatch = FIELD_ORDER.filter(f => counts[f] !== firstCount);
    if (mismatch.length > 0) {
      const details = FIELD_ORDER.map(f => `${FIELD_LABELS[f]}: ${counts[f]} items`).join(', ');
      setValidationError(`Count mismatch! All fields must have the same number of items. ${details}`);
      return null;
    }

    // Build products by positional matching
    const products = [];
    for (let i = 0; i < firstCount; i++) {
      products.push({
        name: parsed.name[i] || '',
        category: parsed.category[i] || '',
        subcategory: parsed.subcategory[i] || '',
        price: parsed.price[i] || '',
        stock: parsed.stock[i] || '',
        description: parsed.description[i] || '',
        image: '',
      });
    }

    setValidationError('');
    setIsDone(true);
    return products;
  }, [fieldValues]);

  const resetAll = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
    setInterimText('');
    setError('');
    setCurrentFieldIndex(0);
    setFieldValues({
      name: '',
      category: '',
      subcategory: '',
      price: '',
      stock: '',
      description: '',
    });
    setIsDone(false);
    setValidationError('');
    setItemCount(0);
  }, []);

  const clearCurrentField = useCallback(() => {
    const field = FIELD_ORDER[currentFieldIndex];
    setFieldValues(prev => ({ ...prev, [field]: '' }));
  }, [currentFieldIndex]);

  return {
    isListening,
    error,
    isSupported,
    startListening,
    stopListening,
    currentFieldIndex,
    currentField,
    fieldValues,
    setFieldValues,
    interimText,
    isDone,
    validationError,
    goToNextField,
    goToPrevField,
    validateAndBuild,
    resetAll,
    clearCurrentField,
    parseField,
    itemCount,
    FIELD_ORDER,
    FIELD_LABELS,
  };
};

export default useBulkVoiceInput;
