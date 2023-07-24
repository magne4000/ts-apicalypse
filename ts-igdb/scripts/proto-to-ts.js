import { dirname, resolve } from "node:path";
import { readFile, writeFile } from "fs/promises";
import axios from "axios";
import { promisify } from "node:util";
import { createRequire } from "node:module";
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const pbjs = require("protobufjs-cli/pbjs");
const pbts = require("protobufjs-cli/pbts");

const PROTO_URL = 'https://api.igdb.com/v4/igdbapi.proto';
const PROTO_PATH = resolve(__dirname, '..', 'proto', 'igdbapi.proto');
const COMPILED_TS_PATH = resolve(__dirname, '..', 'proto', 'compiled.d.ts');
const COMPILED_JS_PATH = resolve(__dirname, '..', 'proto', 'compiled.js');

axios.get(PROTO_URL).then(response => writeFile(PROTO_PATH, response.data)).then(async () => {
  await promisify(pbjs.main)([
    "--target", "static-module", "--force-number", "--keep-case", "--no-create", "--no-encode",
    "--no-decode", "--no-verify", "--no-convert", "--no-delimited", PROTO_PATH, "-o", COMPILED_JS_PATH
  ]);

  // Transform google.protobuf.ITimestamp to number
  const data = await readFile(COMPILED_JS_PATH, 'utf8');
  const result = data.replace(/google\.protobuf\.ITimestamp/gmu, 'number');
  await writeFile(COMPILED_JS_PATH, result, 'utf8');

  await promisify(pbts.main)(["--no-comments", "--main", "-o", COMPILED_TS_PATH, COMPILED_JS_PATH]);
});
