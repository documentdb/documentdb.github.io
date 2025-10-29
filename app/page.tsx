export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-r from-neutral-800 via-neutral-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              DocumentDB
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              A powerful, scalable, MongoDB compatible open-source document database built for modern applications
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://github.com/documentdb/documentdb" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-black bg-white hover:bg-gray-100 transition-colors duration-200"
              >
                Get Started
              </a>
              <a 
                href="/packages"
                className="inline-flex items-center px-8 py-3 border-2 border-blue-500 text-base font-medium rounded-md text-white bg-blue-500/10 hover:bg-blue-500 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Packages
              </a>
              <a 
                href="/docs"
                className="inline-flex items-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-black transition-colors duration-200"
              >
                View Docs
              </a>
            </div>
          </div>
        </div>
      </section>
      {/* Mission Statement Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Our Mission
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Built on the principles of transparency, developer freedom, and
              standardization, our mission is to build a MongoDB compatible open
              source document database based on PostgreSQL
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-neutral-800 rounded-full shadow-lg p-8 hover:shadow-xl hover:bg-neutral-700 transition-all duration-300 text-center aspect-square flex flex-col justify-center border border-neutral-700">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Transparency</h3>
              <p className="text-gray-400">
                We want to ensure developers have full transparency into the underlying architecture of the engine
              </p>
            </div>

            <div className="bg-neutral-800 rounded-full shadow-lg p-8 hover:shadow-xl hover:bg-neutral-700 transition-all duration-300 text-center aspect-square flex flex-col justify-center border border-neutral-700">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Developer Freedom</h3>
              <p className="text-gray-400">
                With the MIT license, users have complete freedom to use the project as they please with no restrictions
              </p>
            </div>

            <div className="bg-neutral-800 rounded-full shadow-lg p-8 hover:shadow-xl hover:bg-neutral-700 transition-all duration-300 text-center aspect-square flex flex-col justify-center border border-neutral-700">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Open Standard</h3>
              <p className="text-gray-400">
                Eventually, we want to create an open standard for document databases for a universally accepted implementation standard
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* In the Press Section */}
      <section className="py-20 bg-neutral-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              In the Press
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              What the industry is saying about DocumentDB
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* The Register Article */}
            <a
              href="https://www.theregister.com/2025/01/27/microsoft_builds_open_source_document/"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-neutral-800 rounded-lg shadow-lg p-4 hover:shadow-xl hover:bg-neutral-700 transition-all duration-300 border border-neutral-700 h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mb-4">
                    <img
                      src="/images/The Register Logo v2.png"
                      alt="The Register"
                      className="w-12 h-4 group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-600/20 text-red-500 mb-3">
                    The Register
                  </span>
                  <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-red-500 transition-colors line-clamp-3">
                    Microsoft builds open source document database
                  </h3>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                    PostgreSQL-powered platform
                  </p>
                  <div className="flex items-center text-red-500 group-hover:text-red-400 transition-colors mt-auto">
                    <span className="text-xs font-medium">Read</span>
                    <svg
                      className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </a>

            {/* Hacker News Discussion */}
            <a
              href="https://news.ycombinator.com/item?id=42807210"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-neutral-800 rounded-lg shadow-lg p-4 hover:shadow-xl hover:bg-neutral-700 transition-all duration-300 border border-neutral-700 h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
                      <rect width="24" height="24" fill="#FF6600" rx="2" />
                      <text
                        x="12"
                        y="16"
                        fontFamily="Verdana, sans-serif"
                        fontSize="12"
                        fontWeight="bold"
                        fill="white"
                        textAnchor="middle"
                      >
                        Y
                      </text>
                    </svg>
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 mb-3">
                    Hacker News
                  </span>
                  <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-3">
                    DocumentDB Open-Source Discussion
                  </h3>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                    Community discussion
                  </p>
                  <div className="flex items-center text-orange-400 group-hover:text-orange-300 transition-colors mt-auto">
                    <span className="text-xs font-medium">Join</span>
                    <svg
                      className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </a>

            {/* Phoronix Article */}
            <a
              href="https://www.phoronix.com/news/Microsoft-OpenSource-DocumentDB"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-neutral-800 rounded-lg shadow-lg p-4 hover:shadow-xl hover:bg-neutral-700 transition-all duration-300 border border-neutral-700 h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-800 rounded-lg flex items-center justify-center mb-4">
                    <img
                      src="/images/Phoronix Logo.jpg"
                      alt="Phoronix"
                      className="w-7 h-6 group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 mb-3">
                    Phoronix
                  </span>
                  <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-green-400 transition-colors line-clamp-3">
                    Microsoft Announces Open-Source DocumentDB
                  </h3>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                    NoSQL database on PostgreSQL
                  </p>
                  <div className="flex items-center text-green-400 group-hover:text-green-300 transition-colors mt-auto">
                    <span className="text-xs font-medium">Read</span>
                    <svg
                      className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </a>

            {/* Business Wire Article */}
            <a
              href="https://www.businesswire.com/news/home/20250520124276/en/YugabyteDB-Extends-Support-for-Document-Databases-With-Postgres-Extension-DocumentDB"
              target="_blank"
              rel="noopener noreferrer"
              className="group"
            >
              <div className="bg-neutral-800 rounded-lg shadow-lg p-4 hover:shadow-xl hover:bg-neutral-700 transition-all duration-300 border border-neutral-700 h-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center mb-4">
                    <img
                      src="/images/BusinessWire.png"
                      alt="Business Wire"
                      className="w-9 h-7 group-hover:scale-110 transition-transform"
                    />
                  </div>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-400 mb-3">
                    Business Wire
                  </span>
                  <h3 className="text-sm font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors line-clamp-3">
                    YugabyteDB Extends Support for DocumentDB
                  </h3>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                    PostgreSQL extension integration
                  </p>
                  <div className="flex items-center text-indigo-400 group-hover:text-indigo-300 transition-colors mt-auto">
                    <span className="text-xs font-medium">Read</span>
                    <svg
                      className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Our Trusted Partners Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Artistic background elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-black"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-green-500 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent mb-4">
              Our Contributors
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Collaborating with industry leaders to advance the document
              database ecosystem
            </p>
            <div className="mt-6 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5 gap-4 items-center">
            {/* Microsoft Azure */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center justify-center p-8 bg-neutral-800/80 backdrop-blur-sm rounded-xl border border-neutral-700/50 hover:border-blue-500/50 transition-all duration-300 group-hover:transform group-hover:scale-105">
                <div className="w-20 h-20 flex items-center justify-center mb-4">
                  <img
                    src="/images/AzureLogo.png"
                    alt="Microsoft Azure"
                    className="w-12 h-12 group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors mb-1">
                    Microsoft
                  </h3>
                </div>
              </div>
            </div>

            {/* Amazon DocumentDB */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center justify-center p-8 bg-neutral-800/80 backdrop-blur-sm rounded-xl border border-neutral-700/50 hover:border-orange-500/50 transition-all duration-300 group-hover:transform group-hover:scale-105">
                <div className="w-20 h-20 flex items-center justify-center mb-4">
                  <img
                    src="/images/AWS Logo.png"
                    alt="Amazon Web Services"
                    className="w-12 h-12 group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-300 transition-colors mb-1">
                    Amazon
                  </h3>
                </div>
              </div>
            </div>

            {/* Rippling */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center justify-center p-8 bg-neutral-800/80 backdrop-blur-sm rounded-xl border border-neutral-700/50 hover:border-blue-500/50 transition-all duration-300 group-hover:transform group-hover:scale-105">
                <div className="w-60 h-20 flex items-center justify-center mb-4">
                  <img
                    src="/images/Rippling Logo no background.png"
                    alt="Rippling"
                    className="w-12 h-12 group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors mb-1">
                    Rippling
                  </h3>
                </div>
              </div>
            </div>

            {/* YugabyteDB */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center justify-center p-8 bg-neutral-800/80 backdrop-blur-sm rounded-xl border border-neutral-700/50 hover:border-blue-500/50 transition-all duration-300 group-hover:transform group-hover:scale-105">
                <div className="w-20 h-20 flex items-center justify-center mb-4">
                  <img
                    src="/images/YugabyteLogo.png"
                    alt="YugabyteDB"
                    className="w-9 h-9 group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors mb-1">
                    YugabyteDB
                  </h3>
                </div>
              </div>
            </div>

            {/* AB InBev */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
              <div className="relative flex flex-col items-center justify-center p-8 bg-neutral-800/80 backdrop-blur-sm rounded-xl border border-neutral-700/50 hover:border-blue-500/50 transition-all duration-300 group-hover:transform group-hover:scale-105">
                <div className="w-21 h-20 flex items-center justify-center mb-4">
                  <img
                    src="/images/AB InBev transparent logo.png"
                    alt="AB InBev"
                    className="w-15 h-12 group-hover:scale-110 transition-transform"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors mb-1">
                    AB InBev
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Artistic connection lines */}
          <div className="hidden lg:block absolute inset-0 pointer-events-none">
            <svg className="w-full h-full opacity-20" viewBox="0 0 800 400">
              <path
                d="M150 200 Q400 100 650 200"
                stroke="url(#gradient1)"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M150 200 Q400 300 650 200"
                stroke="url(#gradient2)"
                strokeWidth="1"
                fill="none"
              />
              <defs>
                <linearGradient
                  id="gradient1"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                  id="gradient2"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0" />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity="1" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Join us as we build the future of document databases together
          </p>
          <a 
            href="https://github.com/documentdb/documentdb" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-black bg-white hover:bg-gray-100 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
            View on GitHub
          </a>
        </div>
      </section>

    </div>
  )
}
