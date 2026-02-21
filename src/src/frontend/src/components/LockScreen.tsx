import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Delete } from "lucide-react";
import { useCheckUnlockCode } from "../hooks/useQueries";
import { toast } from "sonner";

interface LockScreenProps {
  onUnlock: () => void;
  showBootAnimation: boolean;
}

const CODE_LENGTH = 6;

export default function LockScreen({ onUnlock, showBootAnimation }: LockScreenProps) {
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const checkCodeMutation = useCheckUnlockCode();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleDigitClick = (digit: string) => {
    if (focusedIndex < CODE_LENGTH) {
      const newCode = [...code];
      newCode[focusedIndex] = digit;
      setCode(newCode);
      
      if (focusedIndex < CODE_LENGTH - 1) {
        setFocusedIndex(focusedIndex + 1);
        inputRefs.current[focusedIndex + 1]?.focus();
      } else {
        inputRefs.current[focusedIndex]?.blur();
      }
    }
  };

  const handleClear = () => {
    setCode(Array(CODE_LENGTH).fill(""));
    setFocusedIndex(0);
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = async () => {
    const enteredCode = code.join("");
    
    if (enteredCode.length !== CODE_LENGTH) {
      toast.error("Please enter all 6 digits");
      return;
    }

    try {
      const isCorrect = await checkCodeMutation.mutateAsync(enteredCode);
      
      if (isCorrect) {
        toast.success("Access Granted", {
          description: "Welcome, Detective.",
        });
        onUnlock();
      } else {
        setShake(true);
        toast.error("Access Denied", {
          description: "Incorrect code. Try again.",
        });
        setTimeout(() => {
          setShake(false);
          handleClear();
        }, 400);
      }
    } catch (error) {
      toast.error("System Error", {
        description: "Failed to verify code. Please try again.",
      });
      console.error("Error checking code:", error);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const digit = value.slice(-1);
    if (/^\d*$/.test(digit)) {
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);
      
      if (digit && index < CODE_LENGTH - 1) {
        setFocusedIndex(index + 1);
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleInputKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      setFocusedIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleInputFocus = (index: number) => {
    setFocusedIndex(index);
  };

  if (showBootAnimation) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-boot text-success font-mono text-lg space-y-2">
          <div className="terminal-cursor">SYSTEM INITIALIZING</div>
          <div className="text-success/60">Loading desktop environment...</div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <header className="text-center space-y-3">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 relative">
                <img 
                  src="/assets/generated/detective-badge.dim_400x400.png" 
                  alt="Detective Badge"
                  className="w-full h-full object-contain animate-glow"
                />
              </div>
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            </div>
          </div>
          <h1 className="font-display text-6xl tracking-wider text-primary">
            CASE FILES
          </h1>
          <p className="font-mono text-sm text-muted-foreground tracking-wide">
            RESTRICTED ACCESS • ENTER 6-DIGIT CODE
          </p>
        </header>

        {/* Code Input */}
        <section 
          className={`space-y-6 ${shake ? "animate-shake" : ""}`}
          aria-label="Code input"
        >
          <div className="flex justify-center gap-3">
            {Array.from({ length: CODE_LENGTH }).map((_, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={code[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleInputKeyDown(index, e)}
                onFocus={() => handleInputFocus(index)}
                className={`
                  w-12 h-16 text-center text-2xl font-mono font-bold
                  bg-card border-2 rounded
                  text-primary
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
                  ${focusedIndex === index ? "border-primary scale-105" : "border-border"}
                  ${code[index] ? "animate-glow" : ""}
                `}
                aria-label={`Digit ${index + 1}`}
              />
            ))}
          </div>

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <Button
                key={digit}
                variant="outline"
                size="lg"
                onClick={() => handleDigitClick(digit.toString())}
                className="h-14 text-xl font-mono font-bold hover:bg-primary/20 hover:text-primary hover:border-primary transition-all"
                disabled={checkCodeMutation.isPending}
              >
                {digit}
              </Button>
            ))}
            <Button
              variant="outline"
              size="lg"
              onClick={handleClear}
              className="h-14 hover:bg-destructive/20 hover:text-destructive hover:border-destructive transition-all"
              disabled={checkCodeMutation.isPending}
            >
              <Delete className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleDigitClick("0")}
              className="h-14 text-xl font-mono font-bold hover:bg-primary/20 hover:text-primary hover:border-primary transition-all"
              disabled={checkCodeMutation.isPending}
            >
              0
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleSubmit}
              className="h-14 bg-primary text-primary-foreground hover:bg-primary/90 font-display text-lg tracking-wider"
              disabled={checkCodeMutation.isPending}
            >
              {checkCodeMutation.isPending ? "..." : "ENTER"}
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-xs font-mono text-muted-foreground pt-8">
          <p>DETECTIVE BUREAU • CONFIDENTIAL</p>
          <p className="mt-1">UNAUTHORIZED ACCESS IS PROHIBITED</p>
        </footer>
      </div>
    </main>
  );
}
