import { $ } from "bun";
import { readdirSync } from "node:fs";

const files = readdirSync("./videos");

for (const file of files) {
  const fileName = file.split(".")[0];
  await $`ffmpeg -i ./videos/${file} -filter_complex "fps=30,scale=320:550" ./inputs/${fileName}.gif`;
}
