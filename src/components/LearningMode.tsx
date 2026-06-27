// Global Learning Mode toggle. When ON, plan-tree operators show a hover
// tooltip explaining the operator without requiring a click.

import { createContext, useContext, useState, type ReactNode } from "react";

interface Ctx {
  learning: boolean;
  setLearning: (v: boolean) => void;
}

const LearningModeContext = createContext<Ctx>({
  learning: false,
  setLearning: () => {},
});

export function LearningModeProvider({ children }: { children: ReactNode }) {
  const [learning, setLearning] = useState(false);
  return (
    <LearningModeContext.Provider value={{ learning, setLearning }}>
      {children}
    </LearningModeContext.Provider>
  );
}

export const useLearningMode = () => useContext(LearningModeContext);

export function LearningModeToggle() {
  const { learning, setLearning } = useLearningMode();
  return (
    <button
      type="button"
      onClick={() => setLearning(!learning)}
      aria-pressed={learning}
      className={`group inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md border transition ${
        learning
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      title="Hover any operator to see an educational popup"
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${learning ? "bg-primary animate-pulse" : "bg-muted-foreground"}`}
      />
      Learning Mode {learning ? "ON" : "OFF"}
    </button>
  );
}
