import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button"; // Make sure this path works in your setup

export default function ThankYouScreen() {
  const navigate = useNavigate();

  const handleRestart = () => {
    navigate(0); // Equivalent to router.refresh() in Next.js
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-6 max-w-md text-center relative">
      {/* Background decorative elements */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>

      {/* Main content */}
      <div className="relative z-10 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-green-100 to-emerald-100 bg-clip-text text-transparent">
            Thank You!
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mx-auto"></div>
        </div>

        <p className="text-gray-300 text-lg leading-relaxed max-w-sm mx-auto">
          Your meeting has ended. We hope you had a great experience.
        </p>

        <div className="grid grid-cols-3 gap-4 w-full max-w-md mt-8">
          <div className="bg-gradient-to-br from-[#1e2a3a] to-[#2a3441] p-4 rounded-xl flex flex-col items-center border border-white/10 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:border-blue-500/30">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg">
              <span className="text-xl">📊</span>
            </div>
            <p className="text-sm font-medium text-white">Meeting Stats</p>
          </div>
          <div className="bg-gradient-to-br from-[#1e2a3a] to-[#2a3441] p-4 rounded-xl flex flex-col items-center border border-white/10 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:border-green-500/30">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-3 shadow-lg">
              <span className="text-xl">📝</span>
            </div>
            <p className="text-sm font-medium text-white">Meeting Notes</p>
          </div>
          <div className="bg-gradient-to-br from-[#1e2a3a] to-[#2a3441] p-4 rounded-xl flex flex-col items-center border border-white/10 backdrop-blur-sm hover:scale-105 transition-all duration-300 hover:border-purple-500/30">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-3 shadow-lg">
              <span className="text-xl">🔄</span>
            </div>
            <p className="text-sm font-medium text-white">Schedule Next</p>
          </div>
        </div>

        <Button
          onClick={handleRestart}
          className="mt-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-10 py-4 text-lg rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 border border-blue-500/20 backdrop-blur-sm"
        >
          <span className="flex items-center gap-3">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            Start New Meeting
          </span>
        </Button>
      </div>
    </div>
  );
}
