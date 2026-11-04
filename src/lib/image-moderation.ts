// On-device photo screening for post images (NSFW check).
//
// Uses the open-source nsfwjs model. The library and model are loaded
// lazily from a CDN the first time a photo is picked, so the app bundle
// itself stays small and the feed is never slowed down by it. The model
// runs entirely in the student's browser — the photo is never sent to
// any outside service, which keeps Campora free and private.
//
// Policy: block when the model is confident the photo is pornographic
// (Porn or Hentai >= 0.5) or clearly sexualised (Sexy >= 0.85). Ordinary
// campus photos score near zero on these, so false blocks should be
// rare. If the library cannot load (offline, CDN hiccup), the check
// fails OPEN and the photo is allowed — the admin delete tools remain
// the backstop rather than every photo being blocked on an error.

type NsfwPrediction = { className: string; probability: number };
type NsfwModel = { classify: (img: HTMLImageElement) => Promise<NsfwPrediction[]> };
type NsfwGlobal = { load: () => Promise<NsfwModel> };

const TFJS_URL = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";
const NSFWJS_URL = "https://cdn.jsdelivr.net/npm/nsfwjs@4.2.1/dist/nsfwjs.min.js";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") resolve();
      else {
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error("Script failed.")));
      }
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error("Script failed."));
    document.head.appendChild(script);
  });
}

let modelPromise: Promise<NsfwModel> | null = null;

function loadModel(): Promise<NsfwModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      await loadScript(TFJS_URL);
      await loadScript(NSFWJS_URL);
      const nsfw = (window as unknown as { nsfwjs?: NsfwGlobal }).nsfwjs;
      if (!nsfw) throw new Error("NSFW library unavailable.");
      return nsfw.load();
    })();
    // If loading fails, clear the cache so a later pick can retry.
    modelPromise.catch(() => {
      modelPromise = null;
    });
  }
  return modelPromise;
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the image."));
    img.src = url;
  });
}

/** True when the photo looks inappropriate for a campus feed. */
export async function imageLooksInappropriate(file: File): Promise<boolean> {
  const url = URL.createObjectURL(file);
  try {
    const model = await loadModel();
    const img = await loadImageElement(url);
    const predictions = await model.classify(img);
    const score = (name: string) =>
      predictions.find((p) => p.className === name)?.probability ?? 0;
    return score("Porn") >= 0.5 || score("Hentai") >= 0.5 || score("Sexy") >= 0.85;
  } catch {
    // Screening unavailable — allow the photo (admin moderation is the
    // safety net) rather than blocking every photo on a network hiccup.
    return false;
  } finally {
    URL.revokeObjectURL(url);
  }
}
