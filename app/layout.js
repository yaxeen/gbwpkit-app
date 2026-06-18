export const metadata = {
  title: "GBWPKit — HTML to GenerateBlocks",
  description:
    "Paste any HTML, get clean GenerateBlocks V2 block markup for WordPress. Free rule-based converter, plus optional AI mode (Claude Sonnet).",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
