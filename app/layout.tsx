import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "SwiftLogix | Delivering More, Faster.",
    template: "%s | SwiftLogix",
  },
  description: "Book deliveries, track shipments in real time and manage riders and fleets across Nigeria with SwiftLogix.",
};

export const viewport: Viewport = {
  themeColor: "#142C45",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>
        {children}
        <Toaster position="top-right" richColors closeButton toastOptions={{ style: { fontFamily: "var(--font-sans)" } }} />
      </body>
    </html>
  );
}
