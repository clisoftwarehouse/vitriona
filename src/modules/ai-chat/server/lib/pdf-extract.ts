export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { PDFParse } = await import('pdf-parse');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parser = new PDFParse({ data: new Uint8Array(buffer) }) as any;
  await parser.load();
  const result = await parser.getText();
  await parser.destroy();

  // result is TextResult { pages: [{text, num}], text (getter) }
  const text: string = typeof result === 'string' ? result : (result.text ?? '');
  return text.trim();
}
