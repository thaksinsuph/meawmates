import { Link } from "react-router-dom"

export default function Landing() {
  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-80px)] bg-gradient-to-br from-pink-50 via-white to-indigo-50">
      {/* background pattern */}
      <img
        src="/images/bg-paws.png"
        alt=""
        className="absolute opacity-10 w-full h-full object-cover pointer-events-none"
      />

      {/* main container */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-16 flex flex-col lg:flex-row items-center gap-12">
        
        {/* Left text */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-800 leading-tight">
            Welcome to <span className="text-pink-500">Meow Mates</span> 
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-xl mx-auto lg:mx-0">
            Find a home, match, or new friend for your lovely cats.
            Join the community of cat lovers and make every meow count!
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              to="/home"
              className="px-6 py-3 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 shadow flex items-center gap-2"
            >
              <img
                src="/images/home.png" 
                alt="home icon" 
                className="w-6 h-6 object-contain"
             />
             Explore Posts
            </Link>
            <Link
              to="/matching"
              className="px-6 py-3 rounded-xl bg-pink-500 text-white font-semibold hover:bg-pink-600 shadow flex items-center gap-2"
            >
              <img 
                src="/images/love.png" 
                alt="love icon"
                className="w-6 h-6 object-contain"
              />
              Try Matching
            </Link>
          </div>
        </div>

        {/* Right image */}
        <div className="flex-1 flex justify-center lg:justify-end relative">
          <img
            src="/images/cat-hero.png"
            alt="Cute cat"
            className="w-[340px] sm:w-[420px] drop-shadow-xl rounded-3xl"
          />
          <div className="absolute -bottom-10 -left-6 rotate-[-8deg]">
            <img
              src="/images/paw-decor.png"
              alt=""
              className="w-28 opacity-60"
            />
          </div>
        </div>
      </div>

      {/* features section */}
      <div className="bg-white py-16 border-t border-pink-100">
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8 px-6 text-center">
          <div className="bg-pink-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <img src="/images/cat1.png" alt="Adopt" className="w-40 h-30 mx-auto" />
            <h3 className="text-lg font-semibold mt-3 text-slate-700">Adopt & Rehome</h3>
            <p className="text-slate-500 text-sm mt-1">
              Find loving homes for cats or adopt your new furry family member.
            </p>
          </div>
          <div className="bg-pink-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <img src="/images/cat2.png" alt="Match" className="w-40 h-30 mx-auto" />
            <h3 className="text-lg font-semibold mt-3 text-slate-700">Match & Breed</h3>
            <p className="text-slate-500 text-sm mt-1">
              Connect with nearby cat owners to find a perfect mate.
            </p>
          </div>
          <div className="bg-pink-50 p-6 rounded-2xl shadow-sm hover:shadow-md transition">
            <img src="/images/cat3.png" alt="Chat" className="w-40 h-30 mx-auto" />
            <h3 className="text-lg font-semibold mt-3 text-slate-700">Chat & Share</h3>
            <p className="text-slate-500 text-sm mt-1">
              Join conversations, share stories, and get cat care tips from others.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
