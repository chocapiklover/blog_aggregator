import fs from "fs";
import os, { homedir } from "os";
import path from "path";

export type Config = {
    dbUrl: string
    currentUserName: string
}

function getConfigFilePath(): string {
    const homedir = os.homedir()
    return path.join(homedir, ".gatorconfig.json")
}

export function readConfig() {
   const configContents = fs.readFileSync(getConfigFilePath(), {encoding: "utf-8" });
   const raw = JSON.parse(configContents);
   return validateConfig(raw);
}

function validateConfig(rawConfig: any) {
    if (!rawConfig || typeof rawConfig !== "object") {
        throw new Error("invalid config");
    }
    if (typeof rawConfig.db_url !== "string") {
        throw new Error("db_url must be a string")  
    }

    const currentUserName = typeof rawConfig.current_user_name === 'string' ? rawConfig.current_user_name : "";
    return {
            dbUrl: rawConfig.db_url,
            currentUserName,
        }
}

function writeConfig(cfg: Config): void {
    const config = {
        db_url: cfg.dbUrl,
        current_user_name: cfg.currentUserName,
    }
    fs.writeFileSync(getConfigFilePath(), JSON.stringify(config, null,2), { encoding: "utf-8" })
}

export async function setUser(name: string): Promise<void> {
    const configOnDisk = readConfig()
    const updatedConfig: Config = {...configOnDisk, currentUserName: name}
    writeConfig(updatedConfig)
}   