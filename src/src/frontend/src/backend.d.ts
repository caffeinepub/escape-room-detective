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
    checkUnlockCode(codeEntered: string): Promise<boolean>;
    deletePhoto(id: string): Promise<void>;
    getAllPhotos(): Promise<Array<Photo>>;
    getAttempts(): Promise<Array<AttemptRecord>>;
    storePhoto(id: string, imageData: string, timestamp: Time): Promise<void>;
    updateUnlockCode(newCode: string): Promise<void>;
}
