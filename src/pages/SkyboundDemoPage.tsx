import SkyboundStandalone from "@/components/study/SkyboundStandalone";

// Mock quiz data for demonstration
const MOCK_QUIZ = [
  {
    id: "q-0",
    question: "What does JIT stand for in Java?",
    options: ["Just-In-Time", "Java Interface Toolkit", "Java Integration Testing", "Java Internal Threading"],
    correctIndex: 0,
    topic: "Java Performance",
    explanation: "JIT stands for Just-In-Time compilation, which compiles bytecode to native machine code at runtime.",
  },
  {
    id: "q-1",
    question: "Which keyword is used to define a constant in JavaScript?",
    options: ["const", "let", "var", "static"],
    correctIndex: 0,
    topic: "JavaScript Fundamentals",
    explanation: "The 'const' keyword is used to declare a constant reference to a value.",
  },
  {
    id: "q-2",
    question: "What is the correct file extension for a TypeScript file?",
    options: [".ts", ".tsx", ".js", ".jsx"],
    correctIndex: 0,
    topic: "TypeScript Basics",
    explanation: "TypeScript files use the .ts extension, while .tsx is used for JSX in TypeScript.",
  },
  {
    id: "q-3",
    question: "Which HTTP status code indicates a successful request?",
    options: ["200 OK", "404 Not Found", "500 Internal Server Error", "301 Moved Permanently"],
    correctIndex: 0,
    topic: "HTTP Basics",
    explanation: "HTTP 200 OK is the standard response for successful HTTP requests.",
  },
  {
    id: "q-4",
    question: "What does CSS stand for?",
    options: ["Cascading Style Sheets", "Computer Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"],
    correctIndex: 0,
    topic: "Web Development",
    explanation: "CSS stands for Cascading Style Sheets, used for styling HTML documents.",
  },
];

// Mock game pairs for demonstration
const MOCK_GAME_PAIRS = [
  { id: "p-0", prompt: "React", answer: "JavaScript library for building user interfaces" },
  { id: "p-1", prompt: "Node.js", answer: "JavaScript runtime built on Chrome's V8 engine" },
  { id: "p-2", prompt: "GraphQL", answer: "Query language for APIs" },
  { id: "p-3", prompt: "Webpack", answer: "Module bundler for JavaScript applications" },
  { id: "p-4", prompt: "Babel", answer: "JavaScript compiler for transforming modern JS to backwards-compatible versions" },
];

export default function SkyboundDemoPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="w-full max-w-4xl space-y-8">
        <h1 className="text-3xl font-bold text-center text-slate-900">
          SKYBOUND Demo
        </h1>
        <p className="text-center text-slate-600 max-w-2xl mx-auto">
          Experience the fantasy endless runner that combines learning with adventure!
          Collect knowledge, dodge obstacles, and soar through the Meadow Isles.
        </p>
        <div className="w-full">
          <SkyboundStandalone quiz={MOCK_QUIZ} gamePairs={MOCK_GAME_PAIRS} />
        </div>
      </div>
    </div>
  );
}