import pbjs from "protobufjs/cli/pbjs";
import pbts from "protobufjs/cli/pbts";
import { resolve } from "path";
import { writeFile } from "fs/promises";
import axios from "axios";

const PROTO_URL = 'https://api.igdb.com/v4/igdbapi.proto';
const PROTO_PATH = resolve(__dirname, '..', 'proto', 'igdbapi.proto');
const COMPILED_TS_PATH = resolve(__dirname, '..', 'proto', 'compiled.d.ts');
const COMPILED_JS_PATH = resolve(__dirname, '..', 'proto', 'compiled.js');

axios.get(PROTO_URL).then(response => writeFile(PROTO_PATH, response.data)).then(() => {
  pbjs.main([ "--target", "static-module", "--force-number", "--keep-case", "--no-create", "--no-encode", "--no-decode", "--no-verify", "--no-convert", "--no-delimited", PROTO_PATH, "-o", COMPILED_JS_PATH ], function(err, output) {
    if (err)
      throw err;
    pbts.main([ "--no-comments", "--main", "-o", COMPILED_TS_PATH, COMPILED_JS_PATH ], function(err) {
      if (err)
        throw err;
      console.log('done');
    })
  });
});
