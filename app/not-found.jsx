import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center">

      {/* Glitch number */}
      <div className="relative mb-8 select-none">
        <p className="text-[9rem] font-black leading-none text-gray-100 tracking-tight">404</p>
        <p className="absolute inset-0 text-[9rem] font-black leading-none tracking-tight text-teal-400 opacity-40 blur-sm">404</p>
      </div>

      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-6">
        <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>

      <h1 className="text-2xl font-black text-gray-900 mb-2">This pitch doesn't exist</h1>
      <p className="text-gray-400 max-w-sm mb-10 leading-relaxed">
        The link may have expired, been moved, or never existed. Let's get you back on track.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition"
        >
          Back to home
        </Link>
        <Link
          href="/dashboard"
          className="px-6 py-3 border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-bold rounded-xl transition"
        >
          Go to dashboard
        </Link>
      </div>

    </div>
  );
}
