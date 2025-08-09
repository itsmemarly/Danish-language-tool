// --- OOP JavaScript Refactor ---

/**
 * Manages all vocabulary data and retrieval.
 * This approach is efficient as it loads all data once and provides
 * quick access without repeated processing.
 */

// Import the vocabulary object from the separate file
import vocabulary from './vocabulary.js'; // Ensure this path is correct for your setup

class VocabularyManager {
    constructor() {
        // Assign the imported vocabulary object to the class property.
        this.vocabulary = vocabulary; 
        
        this.allWordsCache = null;
        this.allVerbsCache = null;
        this.allNounsCache = null;
        this.allAdjectivesCache = null;
    }

    /**
     * Retrieves all vocabulary for a specific level.
     * @param {string} level - The vocabulary level (e.g., 'A1', 'B2').
     * @returns {object} An object containing categorized words for the specified level.
     */
    getWordsForLevel(level) {
        return this.vocabulary[level] || {};
    }

    /**
     * Gets a comprehensive map of all Danish words across all levels and categories.
     * Caches the result for performance.
     * The map key is the Danish word (infinitive for verbs, base form for others),
     * and the value includes all its data, category, and level.
     * For verbs, it also includes the 'conjugations' object.
     * For adjectives, it also includes 'et_form' if available.
     * @returns {Map<string, object>} A Map of all words.
     */
    getAllWords() {
        if (this.allWordsCache) {
            return this.allWordsCache;
        }

        const allWords = new Map();
        for (const level in this.vocabulary) {
            for (const category in this.vocabulary[level]) {
                for (const word in this.vocabulary[level][category]) {
                    // Store the word data directly from the vocabulary object
                    const wordData = {
                        ...this.vocabulary[level][category][word],
                        category: category,
                        level: level
                    };
                    allWords.set(word, wordData);

                    // If it's a verb, also add its conjugated forms to the map for easier lookup
                    if (category === 'verbs' && wordData.conjugations) {
                        for (const conjType in wordData.conjugations) {
                            const conjugatedForm = wordData.conjugations[conjType];
                            // Only add if the conjugated form is different from the infinitive
                            // and not already in the map (to prevent overwriting if a conjugation is also an infinitive)
                            if (conjugatedForm !== word && !allWords.has(conjugatedForm)) {
                                allWords.set(conjugatedForm, {
                                    root: word, // Link back to the infinitive
                                    category: 'verbs', // Mark as verb
                                    conjugatedForm: conjugatedForm, // Store the specific form
                                    baseEn: wordData.en, // Base English translation from infinitive
                                    level: level // Retain level info
                                });
                            }
                        }
                    }
                     // If it's an adjective, also add its 'et' form if present
                    if (category === 'adjectives' && wordData.et_form && wordData.et_form !== word) {
                        allWords.set(wordData.et_form, {
                            root: word, // Link back to the base adjective
                            category: 'adjectives',
                            et_form: wordData.et_form, // Store the 'et' form
                            baseEn: wordData.en, // Base English translation
                            level: level
                        });
                    }
                }
            }
        }
        this.allWordsCache = allWords;
        return this.allWordsCache;
    }
    
    /**
     * Gets a Set of all infinitive verbs across all levels.
     * Caches the result for performance.
     * @returns {Set<string>} A Set of infinitive verbs.
     */
    getAllVerbs() {
        if (this.allVerbsCache) {
            return this.allVerbsCache;
        }
        
        const allVerbs = new Set();
        for (const level in this.vocabulary) {
            if (this.vocabulary[level].verbs) {
                for (const verbInfinitive in this.vocabulary[level].verbs) {
                    allVerbs.add(verbInfinitive);
                }
            }
        }
        this.allVerbsCache = allVerbs;
        return this.allVerbsCache;
    }

    /**
     * Gets a Set of all nouns across all levels.
     * Caches the result for performance.
     * @returns {Set<string>} A Set of nouns.
     */
    getAllNouns() {
        if (this.allNounsCache) {
            return this.allNounsCache;
        }
        
        const allNouns = new Set();
        for (const level in this.vocabulary) {
            if (this.vocabulary[level].nouns) {
                for (const noun in this.vocabulary[level].nouns) {
                    allNouns.add(noun);
                }
            }
        }
        this.allNounsCache = allNouns;
        return allNouns;
    }

    /**
     * Gets a Set of all adjectives across all levels (base form).
     * Caches the result for performance.
     * @returns {Set<string>} A Set of adjectives.
     */
    getAllAdjectives() { 
        if (this.allAdjectivesCache) {
            return this.allAdjectivesCache;
        }
        
        const allAdjectives = new Set();
        for (const level in this.vocabulary) {
            if (this.vocabulary[level].adjectives) {
                for (const adjective in this.vocabulary[level].adjectives) {
                    allAdjectives.add(adjective);
                }
            }
        }
        this.allAdjectivesCache = allAdjectives;
        return allAdjectives;
    }

    /**
     * Retrieves detailed data for a specific word, including its category and level.
     * This will return data for both infinitive verbs and their conjugated forms,
     * as well as base nouns/adjectives and their 'et' forms.
     * @param {string} word - The Danish word to look up.
     * @returns {object | undefined} The word data or undefined if not found.
     */
    getWordData(word) {
        const allWords = this.getAllWords();
        return allWords.get(word);
    }
}

/**
 * Handles all UI manipulations and user input.
 * Keeps the main app logic clean by separating UI concerns.
 */
class UIManager {
    constructor() {
        // Find all necessary HTML elements
        this.mentorTextEl = document.getElementById('mentor-text');
        this.wordBankEl = document.getElementById('word-bank');
        this.sentenceInputEl = document.getElementById('sentence-input');
        this.vocabListEl = document.getElementById('vocab-list');
        this.levelSelectEl = document.getElementById('level-select');
        
        this.checkGrammarBtn = document.getElementById('check-grammar-btn');
        this.getSuggestionBtn = document.getElementById('get-suggestion-btn');
        this.translateBtn = document.getElementById('translate-btn');
        this.clearBtn = document.getElementById('clear-btn');
    }

    /**
     * Gets the currently selected vocabulary level from the UI.
     * @returns {string} The selected level (e.g., 'A1').
     */
    getCurrentLevel() {
        return this.levelSelectEl.value;
    }

    /**
     * Gets the trimmed sentence input from the text area.
     * @returns {string} The user's input sentence.
     */
    getSentence() {
        return this.sentenceInputEl.value.trim();
    }

    /**
     * Clears the sentence input text area.
     */
    clearSentence() {
        this.sentenceInputEl.value = '';
    }

    /**
     * Updates the text displayed in the mentor feedback area.
     * @param {string} text - The text to display.
     */
    updateMentorText(text) {
        this.mentorTextEl.innerHTML = text;
    }
    
    /**
     * Populates the word bank with a shuffled subset of words for the current level.
     * @param {object} levelVocab - The vocabulary object for the current level.
     */
    populateWordBank(levelVocab) {
        this.wordBankEl.innerHTML = '';
        const allWords = [];
        for (const category in levelVocab) {
            // For verbs, add the present tense to the word bank
            if (category === 'verbs') {
                for (const infinitive in levelVocab[category]) {
                    if (levelVocab[category][infinitive].conjugations && levelVocab[category][infinitive].conjugations.present) {
                         allWords.push(levelVocab[category][infinitive].conjugations.present);
                    } else {
                        allWords.push(infinitive); // Fallback to infinitive if no present tense
                    }
                }
            } else {
                for (const word in levelVocab[category]) {
                    allWords.push(word);
                }
            }
        }
        // Shuffle and display words
        this.shuffleArray(allWords).slice(0, 15).forEach(word => {
            const button = document.createElement('button');
            button.textContent = word;
            button.classList.add('cute-button', 'word-bank-word', 'bg-purple-200', 'text-purple-800', 'font-bold', 'py-1', 'px-3', 'rounded-full');
            this.wordBankEl.appendChild(button);
        });
    }
    
    /**
     * Fisher-Yates (Knuth) Shuffle algorithm for arrays.
     * @param {Array} array - The array to shuffle.
     * @returns {Array} The shuffled array.
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Populates the vocabulary list displayed on the page.
     * Shows Danish word, English translation, and highlights articles for nouns.
     * @param {object} levelVocab - The vocabulary object for the current level.
     */
    populateVocabList(levelVocab) {
        this.vocabListEl.innerHTML = '';
        
        for (const category in levelVocab) {
            const categoryTitle = document.createElement('h4');
            categoryTitle.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)}:`;
            categoryTitle.classList.add('text-lg', 'font-bold', 'mt-4', 'mb-2', 'text-indigo-600');
            this.vocabListEl.appendChild(categoryTitle);

            const ul = document.createElement('ul');
            ul.classList.add('list-disc', 'list-inside', 'ml-4', 'space-y-1');

            for (const danishWordKey in levelVocab[category]) {
                const data = levelVocab[category][danishWordKey];
                const li = document.createElement('li');
                
                li.dataset.danishWord = danishWordKey; // Store the infinitive/base form
                li.dataset.example = data.example;

                let displayWord = `<strong>${danishWordKey}</strong>`;
                let englishTranslation = data.en || data.et || 'translation not found';

                if (category === 'nouns') {
                    const article = data.hasOwnProperty('en') ? 'en ' : (data.hasOwnProperty('et') ? 'et ' : '');
                    displayWord = `${article}<strong>${danishWordKey}</strong>`;
                } else if (category === 'verbs' && data.conjugations && data.conjugations.present) {
                    // For verbs, display infinitive (present tense) for clarity
                    displayWord = `<strong>${danishWordKey}</strong> (present: ${data.conjugations.present})`;
                }
                
                li.innerHTML = `${displayWord} - ${englishTranslation}`;
                ul.appendChild(li);
            }
            this.vocabListEl.appendChild(ul);
        }
    }
}

/**
 * Main application logic. Orchestrates the interaction between
 * the VocabularyManager and the UIManager.
 */
class App {
    constructor() {
        this.vocabManager = new VocabularyManager();
        this.uiManager = new UIManager();

        this.setupEventListeners();
        this.initialize();
    }

    /**
     * Initializes the app by populating word bank and vocab list for the current level.
     */
    initialize() {
        const currentLevel = this.uiManager.getCurrentLevel();
        const levelVocab = this.vocabManager.getWordsForLevel(currentLevel);
        this.uiManager.populateWordBank(levelVocab);
        this.uiManager.populateVocabList(levelVocab);
    }

    /**
     * Sets up all necessary event listeners for UI interactions.
     */
    setupEventListeners() {
        this.uiManager.levelSelectEl.addEventListener('change', () => {
            this.initialize();
            this.uiManager.updateMentorText("Let's practice with some new words!");
        });

        this.uiManager.checkGrammarBtn.addEventListener('click', () => this.checkGrammar());
        this.uiManager.getSuggestionBtn.addEventListener('click', () => this.getSuggestion());
        this.uiManager.translateBtn.addEventListener('click', () => this.translateSentence());
        this.uiManager.clearBtn.addEventListener('click', () => this.uiManager.clearSentence());

        this.uiManager.wordBankEl.addEventListener('click', (event) => {
            if (event.target.classList.contains('word-bank-word')) {
                const word = event.target.textContent;
                this.uiManager.sentenceInputEl.value += word + ' ';
                this.uiManager.sentenceInputEl.focus();
            }
        });

        this.uiManager.vocabListEl.addEventListener('click', (event) => {
            const li = event.target.closest('li');
            if (li && li.dataset.example) {
                const danishWord = li.dataset.danishWord; // This is the infinitive/base form
                const exampleSentence = li.dataset.example;
                
                const translatedExample = this.translateSentenceWords(exampleSentence);

                this.uiManager.updateMentorText(`"${exampleSentence}" (${translatedExample}) Here is an example of how to use the word '${danishWord}'.`);
            }
        });
    }
    
    /**
     * Translates a Danish sentence word by word, attempting to use vocabulary data.
     * Improves translation of verbs and articles.
     * @param {string} sentence - The Danish sentence to translate.
     * @returns {string} The translated English sentence.
     */
    translateSentenceWords(sentence) {
        const allWords = this.vocabManager.getAllWords();
        
        // First, check if the full sentence is in our vocabulary as an example.
        for (const wordData of allWords.values()) {
            if (wordData.example && wordData.example.toLowerCase() === sentence.toLowerCase()) {
                return wordData.translated;
            }
        }

        // If no full sentence match is found, proceed with word-by-word translation.
        const words = sentence.toLowerCase().replace(/[.,?!;]/g, '').split(/\s+/).filter(word => word.length > 0);
        const translatedWords = [];

        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            let foundTranslation = false;

            // Try to match the word directly (including conjugated forms or 'et' adjectives)
            let wordData = allWords.get(word);

            if (wordData) {
                if (wordData.category === 'verbs') {
                    // If it's a conjugated verb, use its base English translation
                    translatedWords.push(wordData.baseEn || wordData.en); 
                } else if (wordData.category === 'nouns') {
                    // For nouns, handle the article 'en' or 'et' as part of the translation context
                    // This logic is simplified; actual Danish articles are complex.
                    translatedWords.push(wordData.en || wordData.et);
                } else if (wordData.category === 'adjectives') {
                    // For adjectives, use the base English translation
                    translatedWords.push(wordData.baseEn || wordData.en);
                } else {
                    translatedWords.push(wordData.en || wordData.et || word);
                }
                foundTranslation = true;
            } else {
                // If not found directly, try to find a root by stripping common endings
                let rootFound = false;
                for (const level in this.vocabManager.vocabulary) {
                    const levelVocab = this.vocabManager.vocabulary[level];
                    for (const category in levelVocab) {
                        for (const danishWordKey in levelVocab[category]) {
                            const data = levelVocab[category][danishWordKey];

                            // Check for verb conjugations
                            if (category === 'verbs' && data.conjugations) {
                                for (const conjType in data.conjugations) {
                                    if (data.conjugations[conjType] === word) {
                                        translatedWords.push(data.en);
                                        rootFound = true;
                                        break;
                                    }
                                }
                            }
                            // Check for adjective 'et' form
                            if (category === 'adjectives' && data.et_form === word) {
                                translatedWords.push(data.en);
                                rootFound = true;
                                break;
                            }
                            if (rootFound) break;
                        }
                        if (rootFound) break;
                    }
                    if (rootFound) break;
                }
                if (!rootFound) {
                    translatedWords.push(word); // If all else fails, just use the word itself
                }
                foundTranslation = true;
            }
        }
        
        // Final pass for more natural English phrasing (simplified)
        // This is a very basic attempt and won't handle all grammar nuances.
        let finalTranslation = translatedWords.join(' ');
        
        // Replace 'to eat' with 'eat' if it seems like a present tense usage after subject
        finalTranslation = finalTranslation.replace(/(\b\w+\b) to (eat|read|see|have|be|call|come|live|can|will|must|may|know|take|give|find|speak|understand|love|drive|work|visit|make|buy|think\/find|help|sell|ask|answer|study|develop|discuss|explain|suggest|decide|analyze|argue|contribute|consider|criticize|conclude|abstract|articulate|legitimize|synthesize|decipher|internalize|proliferate|illuminate|evaluate|imply|reflect|specify|emphasize)\b/g, (match, p1, p2) => {
            // Very simplistic: assumes 'Pigen to eat...' should be 'The girl eats...'
            // This needs a proper NLP library for real accuracy.
            if (!p1.toLowerCase().includes('to')) { // Avoids "to to eat"
                // If the preceding word is a pronoun or noun that could be a subject, remove "to"
                const commonSubjects = ['jeg', 'du', 'han', 'hun', 'vi', 'de', 'pigen', 'drengen', 'huset', 'bilen']; // Add more as needed
                if (commonSubjects.includes(p1.toLowerCase())) {
                    return `${p1} ${p2}s`; // Simplistic - add 's' for third person singular
                }
            }
            return match;
        });

        // Convert simple present to continuous for 'eating', 'reading', etc., if the context suggests it
        // This requires more sophisticated analysis than a simple string replace.
        // For 'spiser' -> 'is eating'
        finalTranslation = finalTranslation.replace(/(\b(eat|read|see|have|be|call|come|live|can|will|must|may|know|take|give|find|speak|understand|love|drive|work|visit|make|buy|think\/find|help|sell|ask|answer|study|develop|discuss|explain|suggest|decide|analyze|argue|contribute|consider|criticize|conclude|abstract|articulate|legitimize|synthesize|decipher|internalize|proliferate|illuminate|evaluate|imply|reflect|specify|emphasize))s?\b/g, (match, p1, p2) => {
            if (p2 === 'be') return 'is'; // Special case for 'er'
            if (p2 === 'can' || p2 === 'will' || p2 === 'must' || p2 === 'may') return match; // Modals usually don't get -ing
            return `is ${p2}ing`;
        });
        
        // Handle definite articles "the" and indefinite "a/an"
        finalTranslation = finalTranslation.replace(/ the (an?)\b/g, ' the '); // Fix "the an apple" -> "the apple"
        finalTranslation = finalTranslation.replace(/ an? (an?)\b/g, ' $1'); // Fix "a an apple" -> "an apple"
        finalTranslation = finalTranslation.replace(/\s+a\s+an\s+/, ' a ').replace(/\s+an\s+a\s+/, ' an '); // Cleanup

        return finalTranslation;
    }

    /**
     * Performs a basic grammar check on the user's input sentence.
     * Provides feedback based on vocabulary recognition, V2 rule, and noun/adjective agreement.
     */
    checkGrammar() {
        const sentence = this.uiManager.getSentence().toLowerCase();
        const allWordsMap = this.vocabManager.getAllWords(); // Use the map for comprehensive lookups
        const allVerbsSet = this.vocabManager.getAllVerbs(); // Set of infinitives
        const allNounsSet = this.vocabManager.getAllNouns(); // Set of base nouns
        const allAdjectivesSet = this.vocabManager.getAllAdjectives(); // Set of base adjectives
        let feedback = [];

        if (!sentence || sentence.trim().length === 0) {
            this.uiManager.updateMentorText("Write a sentence first!");
            return;
        }

        const words = sentence.split(/\s+/).map(word => word.replace(/[.,?!;]$/, '')).filter(word => word.length > 0);

        if (words.length === 0) {
            this.uiManager.updateMentorText("Write a sentence first!");
            return;
        }

        const knownWordsInfo = new Map(); // Store {word, rootWord, category, originalWordData}

        // Step 1: Comprehensive word recognition and root finding
        for (let i = 0; i < words.length; i++) {
            let word = words[i];
            let found = false;
            let rootWord = word;
            let category = 'unknown';
            let originalWordData = null;

            // 1. Check for exact match in the comprehensive allWordsMap
            if (allWordsMap.has(word)) {
                originalWordData = allWordsMap.get(word);
                // If the found word is a conjugated form, its root is stored in 'root'
                rootWord = originalWordData.root || word; 
                category = originalWordData.category;
                found = true;
            } else {
                // 2. If no direct match, try to find a root among verbs (infinitive) or adjectives (base form)
                // This step is more robust because getAllWords now includes conjugated forms.
                // However, we can still try to derive roots for unrecognized words that are potentially derived forms.

                // Simplified root-stripping for common endings to find base word for a *possible* lookup
                // This is a heuristic and might not catch all cases or be perfectly accurate.
                const possibleRoots = [word];
                if (word.endsWith('er') && word.length > 2) possibleRoots.push(word.slice(0, -2)); // e.g., spiser -> spis
                if (word.endsWith('ede') && word.length > 3) possibleRoots.push(word.slice(0, -3)); // e.g., arbejdede -> arbejd
                if (word.endsWith('te') && word.length > 2) possibleRoots.push(word.slice(0, -2)); // e.g., kørte -> kør
                if (word.endsWith('et') && word.length > 2) possibleRoots.push(word.slice(0, -2)); // e.g., stort -> stor (adjective) / huset -> hus (noun)
                if (word.endsWith('t') && word.length > 1) possibleRoots.push(word.slice(0, -1)); // for adjectives ending in t

                for (const tempRoot of possibleRoots) {
                    const tempWordData = allWordsMap.get(tempRoot);
                    if (tempWordData) {
                        originalWordData = tempWordData;
                        rootWord = tempRoot; // The key in vocabulary is the root
                        category = tempWordData.category;
                        found = true;
                        break;
                    }
                }
            }
            
            if (found) {
                knownWordsInfo.set(i, { word, rootWord, category, originalWordData });
            } else {
                feedback.push(`I don't recognize the word '${word}'. Are you sure it's correct?`);
                knownWordsInfo.set(i, { word, rootWord: null, category: 'unknown', originalWordData: null });
            }
        }

        // Step 2: V2 Rule check
        let verbFound = false;
        let verbPosition = -1;

        for (let [pos, data] of knownWordsInfo) {
            // Check if the recognized word's original data or derived category is 'verbs'
            // And if its root (infinitive) is in the allVerbsSet
            if (data.category === 'verbs' && allVerbsSet.has(data.rootWord)) {
                verbFound = true;
                verbPosition = pos;
                break;
            }
        }
        
        // V2 rule: Verb should generally be in the second position in main clauses.
        // This is a simplification and doesn't cover all sentence types.
        if (words.length > 1 && verbFound && verbPosition !== 1) {
            feedback.push("Hmm, try to place the verb in the second position of your sentence. That's a classic Danish rule for main clauses!");
        } else if (!verbFound) {
            feedback.push("I can't find a verb in your sentence. A sentence usually needs one!");
        }
        
        // NEW: Step 2.5: Basic Verb Conjugation Check (simplistic: assumes present tense for most subjects)
        if (verbFound) {
            const verbWord = words[verbPosition]; // The actual verb form used in the sentence
            const verbInfo = knownWordsInfo.get(verbPosition); // Get the stored info for the verb
            // Get the full data for the infinitive, not just the cached conjugated form data
            const verbRootData = this.vocabManager.getWordData(verbInfo.root || verbWord); 

            if (verbRootData && verbRootData.category === 'verbs' && verbRootData.conjugations) {
                const expectedPresentForm = verbRootData.conjugations.present;

                // For simplicity, we assume 'jeg', 'du', 'han', 'hun', 'vi', 'de' all use the present tense form.
                // A more advanced system would check for specific subject-verb agreement rules.
                if (verbWord !== expectedPresentForm) {
                    // Check if it's an infinitive being used where a conjugated form is expected
                    if (verbWord === verbRootData.root) { // If the user used the infinitive directly
                         feedback.push(`The verb '${verbWord}' is in its infinitive form. For this sentence, you likely need the present tense form: '${expectedPresentForm}'.`);
                    } else {
                        // This case handles situations where a wrong conjugation is used.
                        // Example: "jeg spiste" (past tense) instead of "jeg spiser" (present tense)
                        feedback.push(`The verb '${verbWord}' might be conjugated incorrectly. The present tense form is '${expectedPresentForm}'.`);
                    }
                }
            }
        }
        
        // Step 3: Noun/Adjective Agreement check (en/et)
        for (let i = 0; i < words.length; i++) {
            const wordInfo = knownWordsInfo.get(i);
            if (!wordInfo || wordInfo.category === 'unknown') continue;

            // Check if the word is an article
            if (wordInfo.word === 'en' || wordInfo.word === 'et') {
                const nextWordInfo = knownWordsInfo.get(i + 1);
                
                if (nextWordInfo && nextWordInfo.category === 'nouns' && nextWordInfo.originalWordData) {
                    // Direct noun agreement
                    const nounData = this.vocabManager.getWordData(nextWordInfo.rootWord);
                    if (nounData) { // Ensure nounData is found for its article property
                        if (wordInfo.word === 'en' && nounData.hasOwnProperty('et')) {
                            feedback.push(`The noun '${nextWordInfo.rootWord}' should typically use 'et', not 'en'.`);
                        } else if (wordInfo.word === 'et' && nounData.hasOwnProperty('en')) {
                            feedback.push(`The noun '${nextWordInfo.rootWord}' should typically use 'en', not 'et'.`);
                        }
                    }
                } else if (nextWordInfo && nextWordInfo.category === 'adjectives' && nextWordInfo.originalWordData) {
                    const followingNounInfo = knownWordsInfo.get(i + 2);
                    
                    if (followingNounInfo && followingNounInfo.category === 'nouns' && followingNounInfo.originalWordData) {
                        const nounData = this.vocabManager.getWordData(followingNounInfo.rootWord);

                        if (nounData) {
                            // Check article-noun agreement (e.g., 'en' for 'en-words', 'et' for 'et-words')
                            if (wordInfo.word === 'en' && nounData.hasOwnProperty('et')) {
                                feedback.push(`The noun '${followingNounInfo.rootWord}' (following adjective '${nextWordInfo.rootWord}') should use 'et', not 'en'.`);
                            } else if (wordInfo.word === 'et' && nounData.hasOwnProperty('en')) {
                                feedback.push(`The noun '${followingNounInfo.rootWord}' (following adjective '${nextWordInfo.rootWord}') should use 'en', not 'et'.`);
                            }

                            // Check adjective form agreement with article
                            const adjectiveRootData = this.vocabManager.getWordData(nextWordInfo.rootWord);
                            if (adjectiveRootData && adjectiveRootData.category === 'adjectives') {
                                // Adjectives with 'et_form'
                                if (adjectiveRootData.et_form) {
                                    if (wordInfo.word === 'et' && nextWordInfo.word !== adjectiveRootData.et_form) {
                                        feedback.push(`The adjective '${nextWordInfo.rootWord}' (form: '${nextWordInfo.word}') should be its 'et-form' ('${adjectiveRootData.et_form}') when used with 'et'.`);
                                    } else if (wordInfo.word === 'en' && nextWordInfo.word !== adjectiveRootData.root) { 
                                        feedback.push(`The adjective '${nextWordInfo.rootWord}' (form: '${nextWordInfo.word}') should be its base form ('${adjectiveRootData.root}') when used with 'en'.`);
                                    }
                                } else { // Adjectives without a specific 'et_form' (remain same)
                                    if (wordInfo.word === 'et' && nextWordInfo.word !== adjectiveRootData.root) {
                                        feedback.push(`The adjective '${nextWordInfo.rootWord}' (form: '${nextWordInfo.word}') should be its base form ('${adjectiveRootData.root}') when used with 'et'.`);
                                    } else if (wordInfo.word === 'en' && nextWordInfo.word !== adjectiveRootData.root) {
                                        feedback.push(`The adjective '${nextWordInfo.rootWord}' (form: '${nextWordInfo.word}') should be its base form ('${adjectiveRootData.root}') when used with 'en'.`);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Step 4: Final feedback message
        if (feedback.length === 0) {
            this.uiManager.updateMentorText("Fantastisk! Your sentence looks good to me. Keep up the great work! 🎉");
        } else {
            this.uiManager.updateMentorText("I found a few things to work on: " + feedback.join(' '));
        }
    }

    /**
     * Provides a suggestion for a sentence based on the current level's vocabulary.
     */
    getSuggestion() {
        const currentLevel = this.uiManager.getCurrentLevel();
        const levelVocab = this.vocabManager.getWordsForLevel(currentLevel);
        const nouns = Object.keys(levelVocab.nouns || {});
        const verbs = Object.keys(levelVocab.verbs || {});
        
        if (nouns.length > 0 && verbs.length > 0) {
            const randomNoun = this.uiManager.shuffleArray(nouns)[0];
            const randomVerbInfinitive = this.uiManager.shuffleArray(verbs)[0];
            
            const nounData = levelVocab.nouns[randomNoun];
            const verbData = levelVocab.verbs[randomVerbInfinitive];

            let suggestedSentence;
            // Prefer existing example sentences
            if (nounData && nounData.example) {
                suggestedSentence = nounData.example;
            } else if (verbData && verbData.example) {
                suggestedSentence = verbData.example;
            } else {
                // Fallback to constructing a simple sentence
                const verbPresent = (verbData && verbData.conjugations && verbData.conjugations.present) ? verbData.conjugations.present : randomVerbInfinitive;
                const nounArticle = nounData && nounData.hasOwnProperty('en') ? 'en' : (nounData && nounData.hasOwnProperty('et') ? 'et' : '');
                
                suggestedSentence = `Try to create a sentence using '${nounArticle} ${randomNoun}' and '${verbPresent}'.`;
            }

            this.uiManager.updateMentorText(`Suggestion: "${suggestedSentence}"`);
        } else {
            this.uiManager.updateMentorText("I need more words in this level to give you a good suggestion!");
        }
    }
    
    /**
     * Translates the user's input sentence.
     */
    translateSentence() {
        const sentence = this.uiManager.getSentence().toLowerCase();
        if (sentence.length === 0) {
            this.uiManager.updateMentorText("Write a sentence first to translate!");
            return;
        }
        
        const translatedText = this.translateSentenceWords(sentence);
        this.uiManager.updateMentorText(`Translation: "${translatedText}"`);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
