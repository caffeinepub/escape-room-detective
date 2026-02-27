import Time "mo:core/Time";
import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";

import Int "mo:core/Int";

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
  let _timerRecords = List.empty<TimerRecord>();

  type TimerState = {
    startTime : Time.Time;
    remainingTimeAtLastStart : Nat;
    isRunning : Bool;
  };

  var currentGamePhase : GamePhase = #preGame;
  var timer : ?TimerState = null;

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
      timer := ?{
        startTime = Time.now();
        remainingTimeAtLastStart = 2400;
        isRunning = false;
      };
    };
    success;
  };

  public query ({ caller }) func isTimerRunning() : async Bool {
    switch (timer) {
      case (null) { false };
      case (?t) { t.isRunning };
    };
  };

  func computeRemainingSeconds(t : TimerState) : Nat {
    if (t.isRunning) {
      let elapsed = Time.now() - t.startTime;
      switch (Int.compare(elapsed, 0)) {
        case (#less) { return 0 };
        case (#equal) { return t.remainingTimeAtLastStart };
        case (#greater) {
          let elapsedNat = elapsed.toNat();
          let lostTime = elapsedNat / 1_000_000_000;
          if (t.remainingTimeAtLastStart > lostTime) {
            let remaining = t.remainingTimeAtLastStart - lostTime;
            return Nat.min(remaining, 2400);
          } else {
            return 0;
          };
        };
      };
    } else {
      return t.remainingTimeAtLastStart;
    };
  };

  public shared ({ caller }) func getRemainingSeconds() : async Nat {
    switch (timer) {
      case (null) { 0 };
      case (?t) { computeRemainingSeconds(t) };
    };
  };

  public shared ({ caller }) func addPenalty(penalty : Nat) : async () {
    // Only allow penalty of 300 seconds.
    if (penalty == 300) {
      switch (timer) {
        case (null) { () };
        case (?t) {
          let now = Time.now();
          let remainingAtAction = computeRemainingSeconds(t);
          let newRemaining = if (remainingAtAction >= penalty) {
            Nat.min(2400, remainingAtAction - penalty);
          } else {
            0;
          };

          timer := ?{
            startTime = now;
            remainingTimeAtLastStart = newRemaining;
            isRunning = t.isRunning;
          };
        };
      };
    };
  };

  public shared ({ caller }) func toggleTimer() : async () {
    switch (timer) {
      case (null) { Runtime.trap("No active game found") };
      case (?t) {
        if (t.isRunning) {
          let newTimerState : TimerState = {
            startTime = t.startTime;
            remainingTimeAtLastStart = computeRemainingSeconds(t);
            isRunning = false;
          };
          timer := ?newTimerState;
        } else {
          let newTimerState : TimerState = {
            startTime = Time.now();
            remainingTimeAtLastStart = t.remainingTimeAtLastStart;
            isRunning = true;
          };
          timer := ?newTimerState;
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
      switch (timer) {
        case (null) { () };
        case (?lastTimerState) {
          let newTimerState : TimerState = {
            startTime = lastTimerState.startTime;
            remainingTimeAtLastStart = computeRemainingSeconds(lastTimerState);
            isRunning = false;
          };
          timer := ?newTimerState;
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
    if (allowedFromStates.values().any(func(state) { state == current })) {
      current != target;
    } else {
      false;
    };
  };

  func resetTimer(keepRunning : Bool) {
    timer := ?{
      startTime = Time.now();
      remainingTimeAtLastStart = 2400;
      isRunning = keepRunning;
    };
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
