import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Migration "migration";

(with migration = Migration.run)
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

  let photosMap = Map.empty<Text, Photo>();
  let attemptsMap = Map.empty<Time.Time, AttemptRecord>();
  var unlockCode = "567123";

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
    let success = codeEntered == unlockCode;

    let newAttempt : AttemptRecord = {
      codeEntered;
      success;
      timestamp;
    };
    attemptsMap.add(timestamp, newAttempt);
    success;
  };

  public shared ({ caller }) func updateUnlockCode(newCode : Text) : async () {
    unlockCode := newCode;
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
};
