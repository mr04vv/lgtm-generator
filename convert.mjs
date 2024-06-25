import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

const __dirname = path.resolve();
const inputPath = path.join(__dirname, "inputs");
const outputPath = path.join(__dirname, "outputs");

async function getInputFilesPath() {
  try {
    const inputFileNames = await fs.readdir(inputPath);
    return inputFileNames.map((file) => path.join(inputPath, file));
  } catch (err) {
    console.error("Error reading Dir1 folder:", err);
  }
}

/**
 * @param {sharp.Sharp} sharp
 */
const compositeImage = async (sharp) => {
  const metadata = await sharp.metadata();
  const width = metadata.width;
  const height = metadata.height;

  const gravity = calculateGravity(width, height, metadata.orientation);
  const input = calculateCompositeFileName(width, height, metadata.orientation);
  return sharp.composite([
    {
      input: path.join(__dirname, input),
      gravity,
    },
  ]);
};

const calculateGravity = (width, height, orientation) => {
  if (orientation > 4) {
    return width > height ? "south" : "southeast";
  }
  return width > height ? "southeast" : "south";
};

const calculateCompositeFileName = (width, height, orientation) => {
  if (orientation > 4) {
    return width > height ? "lgtm-v2.png" : "lgtm-v.png";
  }
  return width > height ? "lgtm-v.png" : "lgtm-v2.png";
};

/**
 * @param {sharp.Sharp} sharp
 */
const compositeVideo = async (sharp) => {
  const metadata = await sharp.metadata();
  const width = metadata.width;
  const height = metadata.height;
  const gravity = width > height ? "southeast" : "south";
  return sharp.composite([
    {
      input: path.join(__dirname, "lgtm-gif.png"),
      gravity,
      tile: true,
    },
  ]);
};

/**
 * @param {sharp.Sharp} sharp
 */
const resizeImage = async (sharp) => {
  const metadata = await sharp.metadata();
  const width = metadata.orientation > 4 ? metadata.height : metadata.width;
  const height = metadata.orientation > 4 ? metadata.width : metadata.height;
  if (width > height) {
    if (width > 1080) {
      return sharp.resize(1080, null);
    }
  } else {
    if (height > 1080) {
      return sharp.resize(null, 1080);
    }
  }
};

/**
 * @param {sharp.Sharp} sharp
 */
const rotateImage = async (sharp) => {
  const metadata = await sharp.metadata();
  if (metadata.orientation > 4) {
    return sharp.rotate();
  }
  return sharp;
};

/**
 * @param {string} file
 */
const convertImage = async (file) => {
  const fileNameWithoutExtension = path.basename(file, path.extname(file));
  const sharpImage = sharp(file);
  const rotatedImage = await rotateImage(sharpImage);
  const resizedImage = await resizeImage(rotatedImage);
  const convertedImage = await compositeImage(resizedImage);
  convertedImage
    .toFormat("webp")
    .webp()
    .toFile(path.join(outputPath, `${fileNameWithoutExtension}.webp`));
};

/**
 *
 * @param {string} file
 */
const convertMovie = async (file) => {
  const fileNameWithoutExtension = path.basename(file, path.extname(file));
  const sharpImage = sharp(file, { animated: true });
  const compositedImage = await compositeVideo(sharpImage);
  compositedImage
    .toFormat("webp")
    .webp({
      loop: 0,
    })
    .toFile(path.join(outputPath, `${fileNameWithoutExtension}.webp`));
};

try {
  const inputFiles = await getInputFilesPath();
  inputFiles.forEach(async (file) => {
    const extname = path.extname(file);
    if (extname.toLowerCase() === ".gif") {
      convertMovie(file);
      return;
    }
    convertImage(file);
  });
} catch (err) {
  console.error("Error reading Dir1 folder:", err);
}
