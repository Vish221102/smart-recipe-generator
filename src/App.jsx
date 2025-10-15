import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { ChefHat, UserCircle, Sparkles, Camera, ArrowLeft, Clock, Flame, Star, X, CheckCircle, AlertCircle, Heart } from 'lucide-react';

// --- Firebase Configuration (kept for potential future use, but not actively used for users) ---
const firebaseConfig = {
    apiKey: "AIzaSyBH6kq7Umb8WqMCpRUgEfMRjK38PADhO4Q",
    authDomain: "recipe-generator-e89b5.firebaseapp.com",
    projectId: "recipe-generator-e89b5",
    storageBucket: "recipe-generator-e89b5.appspot.com",
    messagingSenderId: "949774327533",
    appId: "1:949774327533:web:879e56613352ebfe7136e4"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// --- Local Storage Favorites Functions ---
const loadFavoritesFromStorage = () => {
    try {
        const storedFavorites = localStorage.getItem('recipeFavorites');
        return storedFavorites ? JSON.parse(storedFavorites) : [];
    } catch (error) {
        console.error("Could not load favorites from local storage:", error);
        return [];
    }
};

const saveFavoritesToStorage = (favorites) => {
    try {
        localStorage.setItem('recipeFavorites', JSON.stringify(favorites));
    } catch (error) {
        console.error("Could not save favorites to local storage:", error);
    }
};


// --- Main App Component ---
export default function App() {
    const [view, setView] = useState('initial');
    const [recipes, setRecipes] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState('Your personal chef is thinking...');
    const [error, setError] = useState(null);

    useEffect(() => {
        setFavorites(loadFavoritesFromStorage());
    }, []);

    const showError = (message, type = 'error') => {
        setError({ message, type });
        setTimeout(() => setError(null), 5000);
    };

    const handleGenerate = async (ingredients, promptText) => {
        setView('loading');
        setLoadingMessage('Generating recipe ideas...');
        try {
            const fetchedRecipes = await getAIRecipes(ingredients, promptText);
            if (!fetchedRecipes || fetchedRecipes.length === 0) {
                showError("Could not generate recipes. The request may be off-topic or too specific.");
                setView('initial'); return;
            }
            setRecipes(fetchedRecipes);
            setView('results');
        } catch (error) {
            console.error("Error generating recipes:", error);
            showError("An error occurred while generating recipes.");
            setView('initial');
        }
    };
    
    const handleImageUpload = async (file) => {
        setView('loading');
        setLoadingMessage('Identifying your dish...');
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result.split(',')[1];
            try {
                const dishName = await getDishFromImage(base64Data);
                if (!dishName || dishName === "NOT_FOOD") {
                    showError("Could not identify a food dish from the image.");
                    setView('initial'); return;
                }
                const fetchedRecipes = await getAIRecipes(dishName, "provide the classic recipe, plus 4 popular variations.");
                 if (!fetchedRecipes || fetchedRecipes.length === 0) {
                    showError(`Could not find recipes for "${dishName}".`);
                    setView('initial'); return;
                }
                setRecipes(fetchedRecipes);
                setView('results');
            } catch (error) {
                console.error("Error in image processing flow:", error);
                showError("An error occurred processing the image.");
                setView('initial');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSelectRecipe = (recipe) => {
        setSelectedRecipe(recipe);
        setView('detail');
        window.scrollTo(0,0);
    };

    const toggleFavorite = (recipe) => {
        const isFavorited = favorites.some(fav => fav.title === recipe.title);
        let newFavorites;
        if (isFavorited) {
            newFavorites = favorites.filter(fav => fav.title !== recipe.title);
        } else {
            newFavorites = [...favorites, recipe];
        }
        setFavorites(newFavorites);
        saveFavoritesToStorage(newFavorites);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
            <Header onNavClick={setView} />
            {error && <ErrorToast message={error.message} type={error.type} onClose={() => setError(null)} />}
            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {view === 'initial' && <InitialView onGenerate={handleGenerate} onImageUpload={handleImageUpload} />}
                {view === 'loading' && <LoadingView message={loadingMessage} />}
                {view === 'results' && <ResultsView recipes={recipes} onSelectRecipe={handleSelectRecipe} favorites={favorites} onToggleFavorite={toggleFavorite} />}
                {view === 'favorites' && <FavoritesView favorites={favorites} onSelectRecipe={handleSelectRecipe} onToggleFavorite={toggleFavorite} />}
                {view === 'detail' && selectedRecipe && <RecipeDetailView recipe={selectedRecipe} onBack={() => setView(recipes.length > 0 ? 'results' : 'initial')} isFavorited={favorites.some(fav => fav.title === selectedRecipe.title)} onToggleFavorite={toggleFavorite} />}
            </main>
        </div>
    );
}

// --- Sub-Components ---
const Header = ({ onNavClick }) => (
     <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                    <ChefHat className="h-8 w-8 text-green-600" />
                    <span className="ml-2 text-2xl font-bold text-gray-800">Culinary AI</span>
                </div>
                <div>
                    <button onClick={() => onNavClick('initial')} className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">Home</button>
                    <button onClick={() => onNavClick('favorites')} className="text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium">Favorites</button>
                </div>
            </div>
        </nav>
    </header>
);

const ErrorToast = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = type === 'success' ? <CheckCircle className="mr-3" /> : <AlertCircle className="mr-3" />;
    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className={`error-toast ${bgColor} text-white font-bold p-4 rounded-lg shadow-lg flex items-center justify-between`}>
                <div className="flex items-center">
                    {icon}
                    <span>{message}</span>
                </div>
                <button onClick={onClose}><X className="h-5 w-5"/></button>
            </div>
        </div>
    );
};

const InitialView = ({ onGenerate, onImageUpload }) => {
    const [tab, setTab] = useState('prompt');
    const [ingredients, setIngredients] = useState('');
    const [promptText, setPromptText] = useState('');
    const [fileName, setFileName] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFileName(`Selected: ${file.name}`);
            onImageUpload(file);
        }
    };

    return (
        <section>
            <div className="relative hero-bg text-white rounded-2xl p-8 md:p-16 flex flex-col items-center justify-center text-center shadow-lg h-80">
                <div className="absolute inset-0 bg-black/40 rounded-2xl"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-green-300 to-lime-300 text-transparent bg-clip-text" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>Your Personal AI Chef</h1>
                    <p className="text-lg md:text-xl max-w-2xl" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>Describe the meal you want, or show me a photo of a dish you'd like to make!</p>
                </div>
            </div>
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-md">
                <div className="flex justify-center mb-6 border-b">
                    <button onClick={() => setTab('prompt')} className={`px-6 py-3 font-semibold ${tab === 'prompt' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}>Describe a Recipe</button>
                    <button onClick={() => setTab('image')} className={`px-6 py-3 font-semibold ${tab === 'image' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500'}`}>Upload a Photo</button>
                </div>
                {tab === 'prompt' ? (
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="ingredients-input" className="block text-lg font-semibold mb-2">1. What ingredients do you have?</label>
                                <input id="ingredients-input" type="text" value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="e.g., chicken, broccoli, rice" className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                            <div>
                                <label htmlFor="prompt-input" className="block text-lg font-semibold mb-2">2. What are your goals for this meal?</label>
                                <input id="prompt-input" type="text" value={promptText} onChange={e => setPromptText(e.target.value)} placeholder="e.g., under 500 calories, high protein" className="w-full p-3 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500" />
                            </div>
                        </div>
                        <div className="mt-6 text-center">
                            <button onClick={() => onGenerate(ingredients, promptText)} className="bg-green-600 text-white font-bold py-4 px-12 rounded-full hover:bg-green-700 transition duration-300 text-lg shadow-lg flex items-center justify-center mx-auto">
                                <Sparkles className="mr-2" /> Generate My Recipes
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <label htmlFor="image-upload-input" className="block text-lg font-semibold mb-4">Upload a photo of a dish to get the recipe!</label>
                        <input type="file" id="image-upload-input" onChange={handleImageChange} className="hidden" accept="image/*" />
                        <button onClick={() => document.getElementById('image-upload-input').click()} className="bg-blue-600 text-white font-bold py-4 px-12 rounded-full hover:bg-blue-700 transition duration-300 text-lg shadow-lg flex items-center justify-center mx-auto">
                            <Camera className="mr-2" /> Choose a Photo
                        </button>
                        <p className="mt-4 text-gray-500">{fileName}</p>
                    </div>
                )}
            </div>
        </section>
    );
};

const LoadingView = ({ message }) => (
    <section className="text-center py-16">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24 mx-auto"></div>
        <h2 className="text-2xl font-semibold mt-8 text-gray-600">{message}</h2>
        <p className="text-gray-500 mt-2">Please wait a moment...</p>
    </section>
);

const ResultsView = ({ recipes, onSelectRecipe, favorites, onToggleFavorite }) => (
    <section className="fade-in">
        <h2 className="text-3xl font-bold mb-6">Here are some ideas...</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {recipes.map((recipe, index) => (
                <RecipeCard key={recipe.title + index} recipe={recipe} onSelectRecipe={onSelectRecipe} isFavorited={favorites.some(fav => fav.title === recipe.title)} onToggleFavorite={onToggleFavorite} />
            ))}
        </div>
    </section>
);

const FavoritesView = ({ favorites, onSelectRecipe, onToggleFavorite }) => (
     <section className="fade-in">
        <h2 className="text-3xl font-bold mb-6">My Favorite Recipes</h2>
        {favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {favorites.map((recipe, index) => (
                    <RecipeCard key={recipe.title + index} recipe={recipe} onSelectRecipe={onSelectRecipe} isFavorited={true} onToggleFavorite={onToggleFavorite} />
                ))}
            </div>
        ) : (
             <div className="text-center py-16">
                <ChefHat className="h-24 w-24 mx-auto text-gray-300" />
                <h3 className="text-xl font-semibold mt-4 text-gray-600">No Favorites Yet</h3>
                <p className="text-gray-500 mt-2">Click the heart on any recipe to save it here!</p>
            </div>
        )}
    </section>
);

const RecipeCard = ({ recipe, onSelectRecipe, isFavorited, onToggleFavorite }) => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden transform hover:-translate-y-2 transition duration-300 group">
        <div className="relative">
            <img onClick={() => onSelectRecipe(recipe)} src={`https://placehold.co/600x400/a3e635/ffffff?text=${encodeURIComponent(recipe.title)}`} alt={recipe.title} className="w-full h-48 object-cover cursor-pointer" />
            <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(recipe); }} className="absolute top-2 right-2 bg-white/70 p-2 rounded-full text-gray-600 hover:text-red-500 hover:scale-110 transition-transform">
                <Heart className={`w-6 h-6 ${isFavorited ? 'text-red-500 fill-current' : ''}`} />
            </button>
        </div>
        <div className="p-6 cursor-pointer" onClick={() => onSelectRecipe(recipe)}>
            <h3 className="text-xl font-bold mb-2 h-14 overflow-hidden">{recipe.title}</h3>
            <p className="text-gray-600 mb-4 h-12 overflow-hidden text-sm">{recipe.description}</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-500 pt-2 border-t">
                <div>
                    <p className="font-bold text-sm text-gray-800">{recipe.nutrition?.calories || '?'}
                    </p>
                    <p>Calories</p>
                </div>
                <div>
                    <p className="font-bold text-sm text-gray-800">{recipe.nutrition?.protein || '?'}g</p>
                    <p>Protein</p>
                </div>
                 <div>
                    <p className="font-bold text-sm text-gray-800">{recipe.nutrition?.fats || '?'}g</p>
                    <p>Fats</p>
                </div>
            </div>
        </div>
    </div>
);


const RecipeDetailView = ({ recipe, onBack, isFavorited, onToggleFavorite }) => {
    return (
        <section className="max-w-4xl mx-auto bg-white p-8 rounded-2xl shadow-lg fade-in">
             <div className="flex justify-between items-start mb-6">
                <button onClick={onBack} className="flex items-center text-gray-600 hover:text-green-600 font-semibold">
                    <ArrowLeft className="mr-2" /> Back to Recipes
                </button>
                <button onClick={() => onToggleFavorite(recipe)} className="p-2 rounded-full text-gray-600 hover:text-red-500 hover:scale-110 transition-transform bg-gray-100">
                    <Heart className={`w-6 h-6 ${isFavorited ? 'text-red-500 fill-current' : ''}`} />
                </button>
            </div>
            
            <h1 className="text-4xl font-bold">{recipe.title || 'Untitled Recipe'}</h1>
            <p className="mt-4 text-lg text-gray-600">{recipe.description || 'No description available.'}</p>
            
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gray-100 p-4 rounded-lg"><h4 className="font-semibold text-sm text-gray-500">Time</h4><p className="text-lg font-bold">{recipe.time || 'N/A'}</p></div>
                <div className="bg-gray-100 p-4 rounded-lg"><h4 className="font-semibold text-sm text-gray-500">Difficulty</h4><p className="text-lg font-bold">{recipe.difficulty || 'N/A'}</p></div>
                <div className="bg-gray-100 p-4 rounded-lg"><h4 className="font-semibold text-sm text-gray-500">Calories</h4><p className="text-lg font-bold">{(recipe.nutrition && recipe.nutrition.calories) ? `${recipe.nutrition.calories} kcal` : '?'}</p></div>
                <div className="bg-gray-100 p-4 rounded-lg"><h4 className="font-semibold text-sm text-gray-500">Servings</h4><p className="text-lg font-bold">{recipe.servings || 'N/A'}</p></div>
            </div>

            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-x-12">
                <div>
                    <h3 className="text-2xl font-semibold mb-4">Ingredients</h3>
                    <ul className="list-disc list-inside space-y-2">
                        {Array.isArray(recipe.ingredients) ? recipe.ingredients.map((ing, i) => <li key={i} dangerouslySetInnerHTML={{ __html: typeof ing === 'object' ? `<strong>${ing.quantity || ''}</strong> ${ing.item}`: ing }}></li>) : <li>No ingredients.</li>}
                    </ul>
                </div>
                 <div>
                    <h3 className="text-2xl font-semibold mb-4">Instructions</h3>
                    <ol className="list-decimal list-inside space-y-3">
                        {Array.isArray(recipe.instructions) ? recipe.instructions.map((step, i) => <li key={i}>{step}</li>) : <li>No instructions.</li>}
                    </ol>
                </div>
            </div>
        </section>
    );
};

// --- API & Utility Functions ---
const GEMINI_API_KEY = "AIzaSyDGnQF39Rd4lVnI-UyTCyOCQG2CnoirROo";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

async function getAIRecipes(ingredients, fullPrompt) {
    const prompt = `You are a recipe generation assistant. Your ONLY function is to provide recipes. If the user's request is not about food (e.g., '1 kilometer', 'book a ticket'), return an empty JSON array []. Otherwise, based on these ingredients: "${ingredients}", and these goals: "${fullPrompt}", generate up to 5 common and popular recipes. Return as a valid JSON array. Each recipe object MUST include ALL of the following fields: title, description, difficulty, time, servings, budget, nutrition (as an object with calories, protein, carbs, and fats), ingredients (as an array of objects with quantity and item), and instructions (as an array of strings).`;
    
    const payload = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
    const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`API call failed with status: ${response.status}`);
    
    const result = await response.json();
    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    try {
        const parsed = JSON.parse(jsonText);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(r => r && typeof r === 'object' && r.title && Array.isArray(r.instructions) && r.instructions.length > 0);
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonText);
        return null;
    }
}

async function getDishFromImage(base64Data) {
    const payload = {
        contents: [{ parts: [{ text: "You are a food identification assistant. Is this an image of food? If yes, respond with ONLY the name of the dish. If no, or if you are unsure, you MUST respond with the single word 'NOT_FOOD'." }, { inlineData: { mimeType: "image/jpeg", data: base64Data } }] }]
    };
   const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    const result = await response.json();
    return result.candidates?.[0]?.content?.parts?.[0]?.text.trim();
}