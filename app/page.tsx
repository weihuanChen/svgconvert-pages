export const metadata = {
  title: 'SVG Converter',
  description: 'Fast, Free SVG Conversion Tool with Cloudflare',
}

export default function RootPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-5xl font-bold text-black dark:text-white mb-4 font-mono">SVG CONVERTER</h1>
        <p className="text-xl text-black dark:text-white mb-8 font-mono">Select your language:</p>
        <div className="space-y-3">
          <div className="border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] bg-white dark:bg-gray-800 p-4 hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#fff] transition-all">
            <a href="/ja" className="text-lg font-bold text-black dark:text-white font-mono">日本語 (Japanese)</a>
          </div>
          <div className="border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] bg-white dark:bg-gray-800 p-4 hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#fff] transition-all">
            <a href="/en" className="text-lg font-bold text-black dark:text-white font-mono">English</a>
          </div>
          <div className="border-4 border-black dark:border-white shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] bg-white dark:bg-gray-800 p-4 hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#fff] transition-all">
            <a href="/zh" className="text-lg font-bold text-black dark:text-white font-mono">中文 (Chinese)</a>
          </div>
        </div>
      </div>
    </div>
  )
}

