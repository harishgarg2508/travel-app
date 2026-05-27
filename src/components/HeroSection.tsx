'use client';

export default function HeroSection() {
  return (
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-orange-400 rounded-full blur-[128px]" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-[128px]" />
        </div>
      </div>

      {/* Overlay Pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/10">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-white/80">Explore India with ease</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
          All India
          <br />
          <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
            Tour & Travel
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
          Book safe and comfortable intercity trips across India. Buses, cars, tempo travelers — we've got you covered.
        </p>

        {/* Premium Call to Action */}
        <div className="mt-8">
          <a
            href="#trips"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-2xl hover:from-orange-600 hover:to-orange-700 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-orange-500/25 group"
          >
            Explore Trips
            <svg
              className="w-5 h-5 transform group-hover:translate-y-1 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              suppressHydrationWarning
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
