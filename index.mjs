import {promises as fs} from "fs";
import {exec} from "./assfuck-core.mjs";

const fname = process.argv[2];
if(!fname){
    console.log("Please provide the filename to be executed.");
    process.exit(1);
}

await exec(""+await fs.readFile(fname));


