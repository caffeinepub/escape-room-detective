import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";



actor {
  type Photo = {
    id : Text;
    imageData : Text;
    timestamp : Time.Time;
  };

  type AttemptRecord = {
    codeEntered : Text;
    success : Bool;
    timestamp : Time.Time;
  };

  type TimerRecord = {
    startTime : Time.Time;
    remainingTimeAtLastStart : Nat;
    timestamp : Time.Time;
    isRunning : Bool;
  };

  type GamePhase = {
    #preGame;
    #gameStarted;
    #gameWon;
    #gameLost;
    #timerStopped;
  };

  let photosMap = Map.empty<Text, Photo>();
  let attemptsMap = Map.empty<Time.Time, AttemptRecord>();
  let timerRecords = List.empty<TimerRecord>();

  var currentGamePhase : GamePhase = #preGame;

  public shared ({ caller }) func storePhoto(id : Text, imageData : Text, timestamp : Time.Time) : async () {
    let photo : Photo = {
      id;
      imageData;
      timestamp;
    };
    photosMap.add(id, photo);
  };

  public query ({ caller }) func getAllPhotos() : async [Photo] {
    let sorted = photosMap.toArray().sort(
      func(a, b) {
        let photoA = a.1;
        let photoB = b.1;
        if (photoA.timestamp < photoB.timestamp) {
          return #greater;
        } else if (photoA.timestamp > photoB.timestamp) {
          return #less;
        } else {
          return #equal;
        };
      }
    );

    Array.tabulate(sorted.size(), func(i) { sorted[i].1 });
  };

  public shared ({ caller }) func deletePhoto(id : Text) : async () {
    switch (photosMap.get(id)) {
      case (null) {
        Runtime.trap("Photo with id " # id # " does not exist");
      };
      case (?_) {
        photosMap.remove(id);
      };
    };
  };

  public shared ({ caller }) func checkUnlockCode(codeEntered : Text) : async Bool {
    let timestamp = Time.now();
    let success = codeEntered == "031120";

    let newAttempt : AttemptRecord = {
      codeEntered;
      success;
      timestamp;
    };
    attemptsMap.add(timestamp, newAttempt);

    if (success) {
      currentGamePhase := #gameStarted;
    };
    success;
  };

  public query ({ caller }) func isTimerRunning() : async Bool {
    switch (getActiveTimer()) {
      case (null) { false };
      case (?activeTimer) { activeTimer.isRunning };
    };
  };

  public shared ({ caller }) func getRemainingSeconds() : async Nat {
    switch (getActiveTimer()) {
      case (null) { 0 };
      case (?activeTimer) {
        if (activeTimer.isRunning) {
          let elapsed = Time.now() - activeTimer.startTime;
          if (elapsed < 0) { return 0 };
          let remaining = if (elapsed >= 0) {
            let lostTime = Int.abs(elapsed) / 1_000_000_000;
            if (activeTimer.remainingTimeAtLastStart > lostTime) {
              activeTimer.remainingTimeAtLastStart - lostTime;
            } else {
              0;
            };
          } else { 0 };
          return Nat.min(remaining, 2400);
        } else {
          return activeTimer.remainingTimeAtLastStart;
        };
      };
    };
  };

  public shared ({ caller }) func addPenalty(penalty : Nat) : async () {
    let elapsed = getElapsedTime();
    let reward = if (elapsed <= 359) { 0 } else if (elapsed <= 719) { 30 } else { 60 };
    if (penalty == 300 and reward > 0) {
      switch (getActiveTimer()) {
        case (null) { () };
        case (?activeTimer) {
          let now = Time.now();
          let remainingAtAction = if (activeTimer.isRunning) {
            let elapsedSinceStart = now - activeTimer.startTime;
            if (elapsedSinceStart > 0) {
              let lostTime = Int.abs(elapsedSinceStart) / 1_000_000_000;
              if (activeTimer.remainingTimeAtLastStart > lostTime) {
                activeTimer.remainingTimeAtLastStart - lostTime;
              } else {
                0;
              };
            } else {
              activeTimer.remainingTimeAtLastStart;
            };
          } else {
            activeTimer.remainingTimeAtLastStart;
          };
          let newRemaining = Nat.min(2400, if (remainingAtAction + reward >= penalty) {
            remainingAtAction + reward - penalty;
          } else {
            0;
          });

          let newTimerRecord : TimerRecord = {
            startTime = now;
            remainingTimeAtLastStart = newRemaining;
            timestamp = now;
            isRunning = activeTimer.isRunning;
          };
          timerRecords.add(newTimerRecord);
        };
      };
    } else if (penalty > 0) {
      switch (getActiveTimer()) {
        case (null) { () };
        case (?activeTimer) {
          let now = Time.now();
          let remainingAtPenalty = if (activeTimer.isRunning) {
            let elapsed = now - activeTimer.startTime;
            if (elapsed > 0) {
              let lostTime = Int.abs(elapsed) / 1_000_000_000;
              if (activeTimer.remainingTimeAtLastStart > lostTime) {
                activeTimer.remainingTimeAtLastStart - lostTime;
              } else {
                0;
              };
            } else {
              activeTimer.remainingTimeAtLastStart;
            };
          } else {
            activeTimer.remainingTimeAtLastStart;
          };
          let newRemaining = if (remainingAtPenalty >= penalty) {
            remainingAtPenalty - penalty;
          } else {
            0;
          };

          let newTimerRecord : TimerRecord = {
            startTime = Time.now();
            remainingTimeAtLastStart = newRemaining;
            timestamp = now;
            isRunning = activeTimer.isRunning;
          };
          timerRecords.add(newTimerRecord);
        };
      };
    };
  };

  public shared ({ caller }) func toggleTimer() : async () {
    switch (getActiveTimer()) {
      case (null) { Runtime.trap("No active game found") };
      case (?activeTimer) {
        let currentStatus = activeTimer.isRunning;

        if (currentStatus) {
          let newTimerRecord : TimerRecord = {
            startTime = activeTimer.startTime;
            remainingTimeAtLastStart = await getRemainingSeconds();
            timestamp = Time.now();
            isRunning = false;
          };
          timerRecords.add(newTimerRecord);
        } else {
          let newTimerRecord : TimerRecord = {
            startTime = Time.now();
            remainingTimeAtLastStart = activeTimer.remainingTimeAtLastStart;
            timestamp = Time.now();
            isRunning = true;
          };
          timerRecords.add(newTimerRecord);
        };
      };
    };
  };

  public shared ({ caller }) func startNewGame() : async () {
    if (shouldStartGame()) {
      currentGamePhase := #gameStarted;
      resetTimer(false);
    };
  };

  public shared ({ caller }) func stopTimer() : async () {
    if (shouldStopTimer()) {
      currentGamePhase := #timerStopped;
      switch (getActiveTimer()) {
        case (null) { () };
        case (?lastTimerRecord) {
          let newTimerRecord : TimerRecord = {
            startTime = lastTimerRecord.startTime;
            remainingTimeAtLastStart = await getRemainingSeconds();
            timestamp = Time.now();
            isRunning = false;
          };
          timerRecords.add(newTimerRecord);
        };
      };
    };
  };

  func shouldStartGame() : Bool {
    isAllowedTransition(
      currentGamePhase,
      [#preGame, #gameLost, #timerStopped],
      #gameStarted,
    );
  };

  func shouldStopTimer() : Bool {
    isAllowedTransition(
      currentGamePhase,
      [#gameStarted],
      #timerStopped,
    );
  };

  func isAllowedTransition(current : GamePhase, allowedFromStates : [GamePhase], target : GamePhase) : Bool {
    if (Array.fromIter(allowedFromStates.values()).any(func(state) { state == current })) {
      current != target;
    } else {
      false;
    };
  };

  func resetTimer(keepRunning : Bool) {
    let newTimerRecord : TimerRecord = {
      startTime = Time.now();
      remainingTimeAtLastStart = 2400;
      timestamp = Time.now();
      isRunning = keepRunning;
    };
    timerRecords.add(newTimerRecord);
  };

  func getElapsedTime() : Nat {
    switch (getActiveTimer()) {
      case (null) { 0 };
      case (?activeTimer) {
        let spentTime : Nat = if (activeTimer.isRunning) {
          let elapsed = Time.now() - activeTimer.startTime;
          if (elapsed < 0) { return 0 };
          let lostTime = Int.abs(elapsed) / 1_000_000_000;
          if (activeTimer.remainingTimeAtLastStart > lostTime) {
            activeTimer.remainingTimeAtLastStart - lostTime;
          } else {
            0;
          };
        } else {
          activeTimer.remainingTimeAtLastStart;
        };

        if (spentTime >= 2400) { 2400 } else { 2400 - spentTime };
      };
    };
  };

  func getActiveTimer() : ?TimerRecord {
    timerRecords.reverse().find(func(timer) { timer.remainingTimeAtLastStart <= 2400 });
  };

  public query ({ caller }) func getGamePhase() : async Text {
    switch (currentGamePhase) {
      case (#preGame) { "preGame" };
      case (#gameStarted) { "gameStarted" };
      case (#gameWon) { "gameWon" };
      case (#gameLost) { "gameLost" };
      case (#timerStopped) { "timerStopped" };
    };
  };

  public query ({ caller }) func getAttempts() : async [AttemptRecord] {
    let sorted = attemptsMap.toArray().sort(
      func(a, b) {
        let attemptA = a.1;
        let attemptB = b.1;
        if (attemptA.timestamp < attemptB.timestamp) {
          return #less;
        } else if (attemptA.timestamp > attemptB.timestamp) {
          return #greater;
        } else {
          return #equal;
        };
      }
    );

    Array.tabulate(sorted.size(), func(i) { sorted[i].1 });
  };

  public shared ({ caller }) func checkSuspectGuess(name : Text) : async Bool {
    let isCorrect = Text.equal(name, "Jeff");
    if (not isCorrect) {
      let penalty : Nat = 300;
      await addPenalty(penalty);
    };
    isCorrect;
  };

  public query ({ caller }) func getSuspectList() : async [Text] {
    [ "Jeff", "Katie", "Alice", "Bob", "Charlie", "David", "Elena", "Frank", "Grace", "Hank", "Ivy", "Jack", "Karen", "Leo", "Mona", "Nate", "Olivia", "Paul", "Quincy", "Rachel", "Sam", "Tina", "Uma", "Vince" ];
  };
};
