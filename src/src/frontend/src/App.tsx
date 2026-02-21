import { useState, useEffect } from "react";
import LockScreen from "./components/LockScreen";
import Desktop from "./components/Desktop";
import { Toaster } from "@/components/ui/sonner";

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showBootAnimation, setShowBootAnimation] = useState(false);

  useEffect(() => {
    // Listen for moderator bypass: Win+Shift+X+T
    const pressedKeys = new Set<string>();

    const handleKeyDown = (e: KeyboardEvent) => {
      pressedKeys.add(e.key.toLowerCase());
      
      // Check for Win+Shift+X+T combination
      if (
        (e.metaKey || e.key === "Meta") &&
        e.shiftKey &&
        pressedKeys.has("x") &&
        pressedKeys.has("t")
      ) {
        e.preventDefault();
        handleModeratorBypass();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const handleModeratorBypass = () => {
    setShowBootAnimation(true);
    setTimeout(() => {
      setIsUnlocked(true);
    }, 600);
  };

  const handleUnlock = () => {
    setShowBootAnimation(true);
    setTimeout(() => {
      setIsUnlocked(true);
    }, 600);
  };

  return (
    <div className="scanlines min-h-screen w-full dark">
      {!isUnlocked ? (
        <LockScreen 
          onUnlock={handleUnlock} 
          showBootAnimation={showBootAnimation}
        />
      ) : (
        <Desktop />
      )}
      <Toaster />
    </div>
  );
}

export default App;
