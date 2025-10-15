Live Application: https://bright-caramel-fa6a9a.netlify.app/

Culinary AI is a sophisticated, AI-powered recipe generation application built with a modern React frontend. It allows users to discover recipes by listing ingredients, describing dietary goals, or uploading a photo of a dish.

Core Features:
Advanced AI Integration: Leverages the Google Gemini API for both text-based recipe generation and image recognition, providing creative and contextually relevant results.

Dual Input Methods:

(i)Text-Based Search: Users can input ingredients and natural language goals (e.g., "high-protein, low-carb meal") to get tailored recipe suggestions.

(ii)Image Recognition: Users can upload a photo of a dish. The application uses the Gemini Vision model to identify the food and then generates relevant recipes.

Robust Error Handling: The application is architected to gracefully handle invalid or off-topic inputs. Strict AI prompting ensures that non-food images (e.g., a car) or irrelevant text prompts (e.g., "book a ticket") result in a user-friendly error message rather than a crash or incorrect output.

Persistent Favorites System: A robust "Favorites" feature allows users to save recipes. Data is stored in the browser's local storage, providing a seamless and persistent experience across sessions without requiring a user login.

Dynamic Nutritional Information: Recipe cards and detail pages are dynamically populated with key nutritional data fetched from the AI, including calories, protein, and fats.

Modern & Responsive UI: Built with a professional React architecture and styled with Tailwind CSS for a clean, intuitive, and mobile-first user interface that works beautifully on any device.

Technical Architecture
Frontend Framework: React (Vite) for a fast, modern, and component-based development experience.

Styling: Tailwind CSS for a utility-first, responsive, and highly maintainable design system.

AI Engine: Google Gemini API for all language and vision-based tasks. The application uses a single, robust API call per search to fetch and validate complete recipe data, ensuring a reliable user experience.

State Management: Core React Hooks (useState, useEffect) are used for efficient and predictable state management across the application.

Deployment: Hosted on Netlify via a continuous deployment pipeline from a Git repository, demonstrating modern DevOps practices.
