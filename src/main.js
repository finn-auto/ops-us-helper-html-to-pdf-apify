import { Actor } from "apify";
import { launchPuppeteer, log } from "crawlee";

await Actor.init();

log.info("Fetching input...");
const input = await Actor.getInput();
if (!input || typeof input.url !== "string") {
  throw new Error('Input must be an object with the "url" property');
}

log.info("Launching headless Chrome...");
const launchContext = {
  useChrome: true,
  launchOptions: {
    pipe: true,
    headless: true,
    args: ['--some-flag'],
  }
}
const browser = await launchPuppeteer(launchContext);
const page = await browser.newPage();

log.info(`Loading page (url: ${input.url})...`);
await page.goto(input.url, { waitUntil: "networkidle0" });
await page.emulateMediaType("screen");

if (input.sleepMillis > 0) {
  log.info(`Sleeping ${input.sleepMillis} millis...`);
  await new Promise((resolve) => setTimeout(resolve, input.sleepMillis));
}

// Modified code starts here: Removing the element with specified id from the DOM
if (input.htmlIdToExclude) {
  log.info(`Removing the element with id '${input.htmlIdToExclude}'...`);
  await page.evaluate((htmlId) => {
      const element = document.querySelector(`#${htmlId}`);
      if (element) {
          element.remove();
      }
  }, input.htmlIdToExclude);
}
// Modified code ends here

const opts = input.pdfOptions || {};
delete opts.path; // Don't store to file
log.info(`Printing to PDF (options: ${JSON.stringify(opts)})...`);
const pdfBuffer = await page.pdf(opts);

log.info(`Saving PDF (size: ${pdfBuffer.length} bytes) to output...`);
await Actor.setValue("OUTPUT", pdfBuffer, { contentType: "application/pdf" });

const storeId = process.env.APIFY_DEFAULT_KEY_VALUE_STORE_ID;

log.info("PDF file has been stored to:");
log.info(
  `https://api.apify.com/v2/key-value-stores/${storeId}/records/OUTPUT?disableRedirect=1`
);

await Actor.exit();
