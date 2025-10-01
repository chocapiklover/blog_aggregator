import { readConfig, setUser } from "./config.js";

function main() {
    setUser("alex")
    console.log(readConfig())
}
main();