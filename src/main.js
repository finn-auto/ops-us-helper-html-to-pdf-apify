import { Actor } from "apify";
import { launchPuppeteer, log } from "crawlee";
// Original source code: https://apify.com/jancurn/url-to-pdf/source-code
// This is an optimization for printing with waitUntil option

await Actor.init();

log.info("Fetching input...");
const input = await Actor.getInput();
if (!input || typeof input.url !== "string") {
  throw new Error('Input must be an object with the "url" property');
}

log.info("Launching headless Chrome...");
const browser = await launchPuppeteer();
const page = await browser.newPage();
await page.setDefaultNavigationTimeout(0)

log.info(`Loading page (url: ${input.url})...`);
await page.goto(input.url, { waitUntil: "networkidle0" });
await page.emulateMediaType("screen");

if (input.sleepMillis > 0) {
  log.info(`Sleeping ${input.sleepMillis} millis...`);
  await new Promise((resolve) => setTimeout(resolve, input.sleepMillis));
}

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
