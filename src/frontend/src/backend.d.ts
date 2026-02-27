import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface AttemptRecord {
    codeEntered: string;
    timestamp: Time;
    success: boolean;
}
export interface Photo {
    id: string;
    imageData: string;
    timestamp: Time;
}
export interface backendInterface {
    addPenalty(penalty: bigint): Promise<void>;
    checkSuspectGuess(name: string): Promise<boolean>;
    checkUnlockCode(codeEntered: string): Promise<boolean>;
    deletePhoto(id: string): Promise<void>;
    getAllPhotos(): Promise<Array<Photo>>;
    getAttempts(): Promise<Array<AttemptRecord>>;
    getGamePhase(): Promise<string>;
    getRemainingSeconds(): Promise<bigint>;
    getSuspectList(): Promise<Array<string>>;
    isTimerRunning(): Promise<boolean>;
    startNewGame(): Promise<void>;
    stopTimer(): Promise<void>;
    storePhoto(id: string, imageData: string, timestamp: Time): Promise<void>;
    toggleTimer(): Promise<void>;
}
