import Time "mo:core/Time";
import Map "mo:core/Map";
import Text "mo:core/Text";

module {
  type AttemptRecord = {
    codeEntered : Text;
    success : Bool;
    timestamp : Time.Time;
  };

  type OldActor = {
    unLockAttempts : Map.Map<Time.Time, AttemptRecord>;
    unlockCode : Text;
  };

  type NewActor = {};

  public func run(_old : OldActor) : NewActor {
    {};
  };
};
