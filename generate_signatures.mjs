import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";

/*
{
    "name": "FOLDER_NAME",
    "children": [
        SAME THING
    ],
    "hash": "HASH",
}
*/

function hashContent(content) {
    return crypto.createHash("sha1").update(content).digest("hex");
}

function generateFolderSignature(folderPath) {
    const folderName = path.basename(folderPath);
    const children = [];
    let folderHash = "";

    const items = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const item of items) {
        const itemPath = path.join(folderPath, item.name);
        if (item.isDirectory()) {
            const childSignature = generateFolderSignature(itemPath);
            children.push(childSignature);
        } else if (item.isFile()) {
            const fileContent = fs.readFileSync(itemPath);
            const fileHash = hashContent(fileContent);
            children.push({ name: item.name, hash: fileHash });
        }
    }

    const combinedHashes = children.map(child => child.hash).join("");
    folderHash = hashContent(combinedHashes);

    return { name: folderName, children, hash: folderHash };
}

// loop through all folders in the current directory
for(const folder of fs.readdirSync(".")) {
    const folderPath = path.join(".", folder);
    if (fs.statSync(folderPath).isDirectory()) {
        const folderSignature = generateFolderSignature(folderPath);

        fs.writeFileSync(
            path.join(folderPath, ".signature_v2"),
            JSON.stringify(folderSignature, null, 2)
        );
    }
}