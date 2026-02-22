# Escape Room Detective Game

## Current State

The escape room detective application currently has:

### Timer System
- GameTimer component displays remaining time in fixed top-right corner
- Timer shows MM:SS format but positioned separately from the header
- Timer starts when the correct passcode (031120) is entered
- Timer queries backend every second for remaining time
- Red gradient animation when < 5 minutes remain

### Game Solution System
- CaseSolutionModal component allows suspect selection from 24 names
- Correct answer is "Jeff" (hidden in backend logic)
- Wrong guesses add 5-minute penalty via backend mutation
- Wrong attempts are tracked locally in component state with red styling
- Wrong attempts remain clickable and can be selected multiple times

### Victory/Defeat Screens
- VictoryScreen shows "SLUČAJ RIJEŠEN!" with remaining time
- DefeatScreen shows "TIME'S UP" with "CASE FAILED" message
- Both screens are full-screen overlays
- Music continues playing in both victory and defeat states
- Screens are triggered by gamePhase query ("won" or "lost")

### Audio System
- Background detective music starts playing after unlock
- Audio element in App.tsx with loop enabled
- No mechanism to stop music when game ends

## Requested Changes (Diff)

### Modify

#### Timer Display Position
- **Current**: Timer floating in top-right corner, separate from header
- **New**: Timer integrated into header next to "DETECTIVE WORKSTATION" text
- Display format: "DETECTIVE WORKSTATION | MM:SS"
- Same visual styling (red gradient, pulse animation when < 5 minutes)
- Timer should be clearly visible and larger for easy reading

#### Wrong Suspect Selection Behavior
- **Current**: Wrong attempts tracked but buttons remain enabled and can be clicked again
- **New**: Wrong suspect buttons become permanently RED and DISABLED after first wrong click
- Red buttons should be visually distinct (red background, red border, red text)
- Clicking red button should not trigger any action (disabled state)
- Only unselected suspects remain clickable

#### Victory Screen
- **Current**: Shows "SLUČAJ RIJEŠEN!" with time, music continues
- **New**: Full-screen overlay with "SLUČAJ RIJEŠEN!" in large text covering entire screen
- Display remaining time below the main text
- **STOP background music immediately** when victory screen appears
- Dramatic fade-in animation
- Game interaction completely frozen

#### Defeat Screen  
- **Current**: Shows "TIME'S UP" with "CASE FAILED", music continues
- **New**: Full-screen overlay with "SLUČAJ IZGUBLJEN!" in large text covering entire screen
- Should appear when timer reaches 0:00 (either naturally or due to penalties)
- **STOP background music immediately** when defeat screen appears
- Dramatic fade-in animation
- Game interaction completely frozen

### Add

#### Audio Control System
- Add ref/control mechanism to stop background music from Desktop or child components
- Victory and Defeat screens must be able to pause/stop the audio
- Consider passing audio ref down through props or using context/global state

#### Game Over Penalty Check
- When wrong suspect is selected and penalty is applied, check if time drops to 0 or below
- If time ≤ 0 after penalty, immediately trigger defeat screen
- This prevents players from continuing after fatal penalties

## Implementation Plan

### Frontend Changes (TypeScript/React)

1. **App.tsx modifications**:
   - Expose audio control (pause/stop method) to child components
   - Pass audio ref or control function to Desktop component via props or context
   - Consider using React Context for audio control if prop drilling becomes complex

2. **Desktop.tsx modifications**:
   - Integrate timer display into header section next to "DETECTIVE WORKSTATION"
   - Move GameTimer component inside header layout instead of fixed positioning
   - Pass audio control down to VictoryScreen and DefeatScreen components
   - Update header styling to accommodate timer display

3. **GameTimer.tsx modifications**:
   - Change from fixed positioning to inline display within header
   - Adjust styling to fit next to "DETECTIVE WORKSTATION" text
   - Keep red gradient and pulse animation for low time warning
   - Increase font size for better visibility

4. **CaseSolutionModal.tsx modifications**:
   - Track wrong attempts in state (already exists)
   - Permanently disable buttons after wrong click by adding them to wrongAttempts set
   - Update button styling to show red background/border/text for wrong attempts
   - Prevent re-clicking of wrong suspects with disabled attribute
   - After penalty mutation, check remaining time and trigger defeat if ≤ 0

5. **VictoryScreen.tsx modifications**:
   - Accept audio control function as prop
   - Call audio.pause() in useEffect when component mounts
   - Increase text size for "SLUČAJ RIJEŠEN!" to cover more screen
   - Ensure full-screen coverage with backdrop
   - Keep time display but make it secondary visual element

6. **DefeatScreen.tsx modifications**:
   - Accept audio control function as prop  
   - Call audio.pause() in useEffect when component mounts
   - Change main text from "TIME'S UP" to "SLUČAJ IZGUBLJEN!"
   - Increase text size to cover more screen
   - Ensure full-screen coverage with backdrop
   - Keep "CASE FAILED" subtitle

### Backend Changes
- No backend changes required (timer logic and game phase detection already implemented)

## UX Notes

### Timer Integration
- Timer should be prominent in header but not overshadow main "DETECTIVE WORKSTATION" branding
- Use separator (vertical bar or similar) between workstation name and timer
- Timer should maintain visibility throughout game without blocking desktop items

### Suspect Selection Flow
1. Player clicks suspect name
2. If correct (Jeff): Victory screen appears immediately, music stops, game ends
3. If wrong: Button turns red, becomes disabled, -5 min penalty applied, timer updates
4. If penalty causes time to hit 0: Defeat screen appears immediately, music stops
5. If time remains: Player can continue selecting other suspects

### End Game States
- Both victory and defeat should feel final and dramatic
- Music stopping reinforces game completion
- Full-screen overlays prevent any further interaction
- Text should be large enough to read from across the room (escape room context)

### Visual Hierarchy
1. Primary: "SLUČAJ RIJEŠEN!" or "SLUČAJ IZGUBLJEN!" text (huge, centered)
2. Secondary: Time remaining or elapsed (medium, below main text)
3. Tertiary: Additional flavor text (small, if any)
