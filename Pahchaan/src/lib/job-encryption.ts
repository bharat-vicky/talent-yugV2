import crypto from "node:crypto";
import {authSecret} from "./auth-secret";
export function jobEncryptionKey(){
 const configured=process.env.JOB_ENCRYPTION_KEY;
 if(configured){const bytes=Buffer.from(configured,"base64");if(bytes.length!==32)throw new Error("JOB_ENCRYPTION_KEY must encode 32 bytes");return bytes;}
 if (!authSecret) throw new Error("An authentication secret is required");
 return crypto.createHash("sha256").update(`identity-job-payload:${authSecret}`).digest();
}
export function encryptJobPayload(value:unknown){const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv("aes-256-gcm",jobEncryptionKey(),iv);const data=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);return {version:1,iv:iv.toString("base64"),tag:cipher.getAuthTag().toString("base64"),data:data.toString("base64")};}
export function decryptJobPayload(value:unknown):unknown {
 if(!value || typeof value!=="object")throw new Error("Invalid encrypted job payload");
 const envelope=value as {version:number;iv:string;tag:string;data:string};if(envelope.version!==1)throw new Error("Unsupported job payload version");
 const decipher=crypto.createDecipheriv("aes-256-gcm",jobEncryptionKey(),Buffer.from(envelope.iv,"base64"));decipher.setAuthTag(Buffer.from(envelope.tag,"base64"));return JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data,"base64")),decipher.final()]).toString("utf8"));
}
