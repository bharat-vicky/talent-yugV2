export function badgeAttachment(dataUri: string) {
  // jsPDF includes a filename parameter; never use that supplied name as a path.
  const match = /^data:(application\/pdf|image\/png)(?:;filename=[^;,\r\n]*)?;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUri);
  if (!match || match[2].length > 7 * 1024 * 1024) throw new Error("Invalid badge attachment");
  const content = Buffer.from(match[2], "base64");
  const pdf = match[1] === "application/pdf";
  if (pdf ? content.subarray(0, 5).toString() !== "%PDF-" : !content.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    throw new Error("Invalid badge attachment");
  }
  return { filename: pdf ? "Badge.pdf" : "Badge.png", content, contentType: match[1] };
}
