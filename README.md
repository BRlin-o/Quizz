# Exam Quiz App

A modern, feature-rich quiz application designed for studying exam questions with multi-language support.

## Features

### 🌟 Core Quiz Experience
-   **Exam Dashboard**: View exam details, descriptions, and topics (parsed from `README.md`) before starting.
-   **Multi-Language Support**: 
    -   Seamlessly switch between **English**, **Chinese**, or **Split View** (both languages simultaneously) during the quiz.
    -   Smart merging of question content ensures progress is tracked across languages.
-   **Mixed Quizzes**: Select multiple question sets (variants) to create a custom quiz session (e.g., combine "Standard" and "Chinese" sets).
-   **Auto-Advance**: Optional setting to automatically move to the next question upon answering correctly.
-   **Seeded Shuffle**: 
    -   Shuffle questions with a specific **seed** for reproducible random order.
    -   "Dice" button to generate random seeds.
    -   Always view the **Original Question #** to track the source index.

### � Technical Highlights
-   **Next.js 14** (App Router) & **TypeScript**.
-   **Tailwind CSS** & **HeroUI** for a sleek, responsive design.
-   **Zustand** for state management (persisted quiz progress).
-   **Framer Motion** for smooth transitions and animations.
-   **Reduced Motion** support.
-   **Markdown Support**: Renders exam descriptions using `react-markdown`.

## 🏗 Architecture

### 1. Data Layer (`lib/quiz-data.ts`)
- **Source**: Reads JSON files from the sibling `../outputs` directory relative to the project root.
- **Normalization**: Adapts various raw JSON formats into a unified `Question` interface.
- **Server Actions**: `getQuizFiles` and `getQuizQuestions` run on the server to purely fetch data, ensuring secure file system access.

### 2. State Management (`store/useQuizStore.ts`)
- **Client-Side Store**: Uses Zustand to manage the active quiz session.
- **State**: Tracks `questions`, `currentIndex`, `answers`, `score`, and `quizTitle`.
- **Actions**:
  - `startQuiz`: Initializes store with loaded questions.
  - `answerQuestion`: Records user selection.
  - `jumpToQuestion`: Updates `currentIndex` for navigation.
  - `finishQuiz`: Computes final score.

### 3. UI Composition
- **Page Isolation**:
  - `app/page.tsx`: **Server Component**. Fetches list of quizzes.
  - `app/quiz/[slug]/page.tsx`: **Exam Dashboard**. Renders README and variant selector.
  - `app/quiz/[slug]/play/page.tsx`: **Play Page**. Handles query params and initializes quiz.
- **Quiz Interface**:
  - `components/QuizWrapper.tsx`: Hydrates the Zustand store with initial data.
  - `components/QuizInterface.tsx`: Main layout manager. Handles "Is Loading" and "Is Finished" states.
  - `components/LanguageSwitcher.tsx`: Toggle for EN/ZH/Split modes.
  - `components/QuizSettings.tsx`: Settings modal for preferences like Auto-Advance.
  - `components/QuestionNavigator.tsx`: Modal grid for visualizing progress.
  - `components/QuestionCard.tsx`: Displays content with split-view support.



## 📂 Project Structure

```bash
quiz-app/
├── app/
│   ├── layout.tsx         # Root layout with Providers and hydration suppression
│   ├── page.tsx           # Home page (Server Component)
│   └── quiz/[filename]/   # Dynamic route for individual quizzes
├── components/
│   ├── QuestionCard.tsx   # Core question UI
│   ├── QuestionNavigator.tsx # Grid navigation menu
│   ├── QuizInterface.tsx  # Main quiz view container
│   ├── QuizList.tsx       # Home page grid
│   ├── ResultView.tsx     # Score summary
│   └── ...
├── lib/
│   └── quiz-data.ts       # File system operations
├── store/
│   └── useQuizStore.ts    # Zustand store definition
├── types/
│   └── index.ts           # Shared TypeScript interfaces
└── tailwind.config.ts     # Configuration including HeroUI theme paths
```

## 🛠 Setup & Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    npm run start
    ```

## ⚠️ Important Notes

- **Tailwind Version**: The project is explicitly pinned to **Tailwind CSS v3.4** to ensure compatibility with the current version of `@heroui/react`.
- **Hydration**: `suppressHydrationWarning` is enabled on the `<html>` tag to prevent mismatch errors caused by browser extensions or localized date rendering.
