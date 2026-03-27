import { useState, useRef, useCallback } from 'react';

const FIELD_ORDER = ['name', 'category', 'subcategory', 'price', 'stock', 'description'];
const FIELD_LABELS = {
  name: 'Product Name',
  category: 'Category',
  subcategory: 'Subcategory',
  price: 'Price',
  stock: 'Stock',
  description: 'Description',
};

// Trigger keywords to advance to next field
const NEXT_FIELD_KEYWORDS = /\b(next field|next)\b/i;
// Trigger keywords to start a new product
const NEXT_PRODUCT_KEYWORDS = /\b(next product|new product)\b/i;
// Trigger keywords to finish
const DONE_KEYWORDS = /\b(done|stop|finish)\b/i;

function createEmptyProduct() {
  return { name: '', category: '', subcategory: '', price: '', stock: '', description: '', image: '' };
}

const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isSupported] = useState(() =>
    typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  );
  const recognitionRef = useRef(null);

  // State machine for field-by-field input
  const [products, setProducts] = useState([createEmptyProduct()]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [interimText, setInterimText] = useState('');
  const [isDone, setIsDone] = useState(false);

  // Refs to track processed results
  const processedUpToRef = useRef(0);

  const currentField = FIELD_ORDER[currentFieldIndex] || 'name';

  const commitCurrentField = useCallback((text, prodIdx, fieldIdx) => {
    if (!text.trim()) return;
    const field = FIELD_ORDER[fieldIdx];
    setProducts(prev => {
      const updated = [...prev];
      const product = { ...updated[prodIdx] };
      // For price/stock, extract numbers
      if (field === 'price' || field === 'stock') {
        const nums = text.match(/[\d,]+/);
        product[field] = nums ? nums[0].replace(/,/g, '') : text.trim();
      } else {
        // Capitalize first letter
        const val = text.trim();
        product[field] = val.charAt(0).toUpperCase() + val.slice(1);
      }
      updated[prodIdx] = product;
      return updated;
    });
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }
    setError('');
    setIsDone(false);
    processedUpToRef.current = 0;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // We need refs for the mutable state inside the callback
    let localFieldIndex = 0;
    let localProductIndex = 0;
    let localProducts = [createEmptyProduct()];
    let lastProcessedIndex = 0;

    const commitField = (text, prodIdx, fieldIdx) => {
      if (!text.trim()) return;
      const field = FIELD_ORDER[fieldIdx];
      const product = { ...localProducts[prodIdx] };
      if (field === 'price' || field === 'stock') {
        const nums = text.match(/[\d,]+/);
        product[field] = nums ? nums[0].replace(/,/g, '') : text.trim();
      } else {
        const val = text.trim();
        product[field] = val.charAt(0).toUpperCase() + val.slice(1);
      }
      localProducts[prodIdx] = product;
      setProducts([...localProducts]);
    };

    recognition.onresult = (event) => {
      // Only process newly finalized results
      for (let i = lastProcessedIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          lastProcessedIndex = i + 1;

          // Check for "done"
          if (DONE_KEYWORDS.test(text)) {
            // Commit any remaining text before the done keyword
            const beforeDone = text.replace(DONE_KEYWORDS, '').trim();
            if (beforeDone) {
              commitField(beforeDone, localProductIndex, localFieldIndex);
            }
            setIsDone(true);
            recognition.stop();
            return;
          }

          // Check for "next product"
          if (NEXT_PRODUCT_KEYWORDS.test(text)) {
            const beforeKeyword = text.replace(NEXT_PRODUCT_KEYWORDS, '').trim();
            if (beforeKeyword) {
              commitField(beforeKeyword, localProductIndex, localFieldIndex);
            }
            // Start new product
            localProducts.push(createEmptyProduct());
            localProductIndex = localProducts.length - 1;
            localFieldIndex = 0;
            setProducts([...localProducts]);
            setCurrentProductIndex(localProductIndex);
            setCurrentFieldIndex(0);
            setInterimText('');
            setTranscript(prev => prev + '\n--- New Product ---\n');
            continue;
          }

          // Check for "next field"
          if (NEXT_FIELD_KEYWORDS.test(text)) {
            const beforeKeyword = text.replace(NEXT_FIELD_KEYWORDS, '').trim();
            if (beforeKeyword) {
              commitField(beforeKeyword, localProductIndex, localFieldIndex);
            }
            // Advance field
            if (localFieldIndex < FIELD_ORDER.length - 1) {
              localFieldIndex++;
              setCurrentFieldIndex(localFieldIndex);
              setInterimText('');
              setTranscript(prev => prev + '\n');
            }
            continue;
          }

          // Normal speech — commit to current field
          commitField(text, localProductIndex, localFieldIndex);
          setTranscript(prev => (prev ? prev + ' ' : '') + text);
          setInterimText('');
        } else {
          // Interim result — show as preview
          setInterimText(event.results[i][0].transcript);
        }
      }
    };

    recognition.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const resetAll = useCallback(() => {
    setTranscript('');
    setError('');
    setProducts([createEmptyProduct()]);
    setCurrentProductIndex(0);
    setCurrentFieldIndex(0);
    setInterimText('');
    setIsDone(false);
    processedUpToRef.current = 0;
  }, []);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript: resetAll,
    setTranscript,
    // New state-machine fields
    products,
    setProducts,
    currentProductIndex,
    currentFieldIndex,
    currentField,
    interimText,
    isDone,
    FIELD_ORDER,
    FIELD_LABELS,
  };
};

export default useVoiceInput;
