export default function ComingSoon() {
  return (
    <div className="relative mb-8">
      {/* Main container with glow effect */}
      <div className="relative w-full max-w-80 h-80 mx-auto">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 rounded-2xl blur-xl"></div>

        {/* JSON Document container */}
        <div className="relative w-full h-full bg-gradient-to-br from-neutral-800/90 via-neutral-900/90 to-black/90 backdrop-blur-sm rounded-2xl border border-neutral-700/50 overflow-hidden p-6">
          {/* JSON Content */}
          <div className="h-full flex flex-col justify-center font-mono text-sm">
            <div className="text-yellow-400">{'{'}</div>
            <div className="ml-4 text-blue-400">
              &quot;status&quot;<span className="text-white">:</span>{' '}
              <span className="text-green-400">&quot;building&quot;</span>
              <span className="text-white">,</span>
            </div>
            <div className="ml-4 text-blue-400">
              &quot;progress&quot;<span className="text-white">:</span>{' '}
              <span className="text-orange-400">75</span>
              <span className="text-white">,</span>
            </div>
            <div className="ml-4 text-blue-400">
              &quot;architecture&quot;<span className="text-white">:</span>{' '}
              <span className="text-yellow-400">{'{'}</span>
            </div>
            <div className="ml-8 text-blue-400">
              &quot;layers&quot;<span className="text-white">:</span>{' '}
              <span className="text-yellow-400">[</span>
            </div>
            <div className="ml-12 text-green-400">
              &quot;DocumentDB API&quot;<span className="text-white">,</span>
            </div>
            <div className="ml-12 text-green-400">
              &quot;DocumentDB Core&quot;<span className="text-white">,</span>
            </div>
            <div className="ml-12 text-green-400">
              &quot;DocumentDB Gateway&quot;
            </div>
            <div className="ml-8 text-yellow-400">
              ]<span className="text-white">,</span>
            </div>
            <div className="ml-8 text-blue-400">
              &quot;coming_soon&quot;<span className="text-white">:</span>{' '}
              <span className="text-green-400">true</span>
            </div>
            <div className="ml-4 text-yellow-400">
              {'}'}
              <span className="text-white">,</span>
            </div>
            <div className="ml-4 text-blue-400">
              &quot;tools&quot;<span className="text-white">:</span>{' '}
              <span className="text-yellow-400">[</span>
              <span className="inline-block ml-2 animate-bounce">
                🔨
              </span>
              <span className="inline-block ml-1 animate-pulse">
                ⚙️
              </span>
              <span
                className="inline-block ml-1 animate-bounce"
                style={{ animationDelay: '0.5s' }}
              >
                🔧
              </span>
              <span className="text-yellow-400">]</span>
            </div>
            <div className="text-yellow-400">{'}'}</div>
          </div>

          {/* Construction helmet on JSON */}
          <div className="absolute top-4 right-6 text-2xl animate-bounce">
            👷‍♂️
          </div>

          {/* Construction cone */}
          <div className="absolute bottom-6 right-8 text-xl animate-pulse">
            🚧
          </div>

          {/* Blueprints */}
          <div
            className="absolute bottom-4 left-6 text-lg animate-pulse"
            style={{ animationDelay: '1s' }}
          >
            📐
          </div>

          {/* Floating construction particles */}
          <div className="absolute top-12 left-12 w-1 h-1 bg-orange-400 rounded-full animate-ping"></div>
          <div
            className="absolute top-20 right-16 w-1 h-1 bg-yellow-400 rounded-full animate-ping"
            style={{ animationDelay: '0.7s' }}
          ></div>
          <div
            className="absolute bottom-20 left-16 w-1 h-1 bg-orange-400 rounded-full animate-ping"
            style={{ animationDelay: '1.4s' }}
          ></div>

          {/* Progress indicator */}
          <div className="absolute top-4 left-4 flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
