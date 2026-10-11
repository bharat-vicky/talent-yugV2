import { getFontEmbedCSS, toPng } from "html-to-image";
import jsPDF from "jspdf";

export async function badgePdf(element: HTMLElement) {
  await document.fonts.ready;
  const fontEmbedCSS = await getFontEmbedCSS(element, { preferredFontFormat: "woff2" });
  const rootStyle = getComputedStyle(document.documentElement);
  const fontVariables = Object.fromEntries(
    ["--font-body", "--font-display", "--font-geist-mono", "--font-sans", "--font-heading", "--font-mono"].map(name => [name, rootStyle.getPropertyValue(name)]),
  );
  const image = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    preferredFontFormat: "woff2",
    fontEmbedCSS,
    // The font shorthand can override the resolved family in an SVG clone.
    includeStyleProperties: Array.from(rootStyle).filter(name => name !== "font"),
    backgroundColor: "#ffffff",
    style: {
      fontFamily: getComputedStyle(element).fontFamily,
      ...fontVariables,
      transform: "none",
      transformOrigin: "top left",
    },
  });
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [101.6, 152.4] });
  pdf.addImage(image, "PNG", 0, 0, 101.6, 152.4);
  return pdf;
}
