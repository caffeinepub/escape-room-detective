import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import Desktop from "./components/Desktop";
import LockedDesktop from "./components/LockedDesktop";
import { useToggleTimer } from "./hooks/useQueries";

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showBootAnimation, setShowBootAnimation] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const toggleTimerMutation = useToggleTimer();

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

  const handleModeratorBypass = async () => {
    setShowBootAnimation(true);
    setTimeout(async () => {
      setIsUnlocked(true);

      // Start timer on unlock
      try {
        await toggleTimerMutation.mutateAsync();
      } catch (error) {
        console.error("Error starting timer:", error);
      }

      // Start background music after unlock
      audioRef.current?.play().catch((err) => {
        console.log("Audio autoplay prevented:", err);
      });
    }, 600);
  };

  const handleUnlock = async () => {
    setShowBootAnimation(true);
    setTimeout(async () => {
      setIsUnlocked(true);

      // Start timer on unlock
      try {
        await toggleTimerMutation.mutateAsync();
      } catch (error) {
        console.error("Error starting timer:", error);
      }

      // Start background music after unlock
      audioRef.current?.play().catch((err) => {
        console.log("Audio autoplay prevented:", err);
      });
    }, 600);
  };

  return (
    <div className="scanlines min-h-screen w-full dark">
      {!isUnlocked ? (
        <LockedDesktop
          onUnlock={handleUnlock}
          showBootAnimation={showBootAnimation}
        />
      ) : (
        <Desktop audioRef={audioRef} />
      )}
      <Toaster />

      {/* Background detective music - plays after unlock */}
      {/* biome-ignore lint/a11y/useMediaCaption: background music for escape room game */}
      <audio
        ref={audioRef}
        src="/assets/NoCopyright True Crime Tension Background Music.mp3"
        loop
        style={{ display: "none" }}
      />
    </div>
  );
}

export default App;
