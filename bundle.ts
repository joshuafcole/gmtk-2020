#! /usr/bin/env ts-node

import * as fs from "mz/fs";
import * as path from "path";

let arg = process.argv[2];

bundle(arg);

async function bundle(folder_name: string) {
  let folder_path = path.resolve(process.cwd(), "ugc", folder_name);

  console.log("Bundling: ", folder_path);
  let files = await fs.readdir(folder_path);
  let map = folder_name === "scripts" ?
    await flat_map(folder_path, files) :
    await shallow_map(folder_path, files);

  console.log(">", path.resolve(process.cwd(), "ugc", folder_name + ".bundle.json"));
  let out = path.resolve(process.cwd(), "ugc", folder_name + ".bundle.json");
  await fs.writeFile(out, JSON.stringify(map, null, "\t"));
}

async function flat_map(root: string, files: string[], ext = ".txt", depth = 0) {
  let map: { [name: string]: string } = {};
  for (let file of files) {
    let name = path.basename(file, ext);
    console.log("  ".repeat(depth), "-", file);
    map[name] = await fs.readFile(path.resolve(root, file), {
      encoding: "utf-8"
    });
  }
  return map;
}

async function shallow_map(root: string, folders: string[]) {
  let map: { [name: string]: { [kind: string]: string } } = {};
  for (let sub of folders) {
    let sub_root = path.resolve(root, sub);
    let files = await fs.readdir(sub_root);
    console.log("-", sub, files);
    map[sub] = await flat_map(sub_root, files, ".json", 1);
    for (let key in map[sub]) {
      map[sub][key] = JSON.parse(map[sub][key]);
    }
  }
  return map;
}
