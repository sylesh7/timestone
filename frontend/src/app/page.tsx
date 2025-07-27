import Link from "next/link";
import { FileIcon, LockIcon, ClockIcon, ShieldIcon } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-blue-500 rounded-lg flex items-center justify-center">
              <LockIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">TimeStone</h1>
          </div>
          <nav className="hidden md:flex space-x-6">
            <Link href="/create" className="text-gray-300 hover:text-white transition-colors">
              Create Capsule
            </Link>
            <Link href="/unlock" className="text-gray-300 hover:text-white transition-colors">
              Unlock Capsule
            </Link>
            <Link href="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Quantum-Resistant
            <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
              {" "}Time Capsules
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Securely encrypt and time-lock your precious memories, photos, videos, and documents 
            using post-quantum cryptography. Your files are protected on IPFS until the moment you choose.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/create"
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
            >
              Create Time Capsule
            </Link>
            <Link
              href="/unlock"
              className="border border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200"
            >
              Unlock Capsule
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg flex items-center justify-center mb-4">
              <ShieldIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Quantum-Resistant Encryption</h3>
            <p className="text-gray-300">
              Protected with Kyber post-quantum cryptography, ensuring your data remains secure even against future quantum computers.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-lg flex items-center justify-center mb-4">
              <ClockIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Time-Locked Security</h3>
            <p className="text-gray-300">
              Set precise unlock dates and times. Your capsules remain sealed and inaccessible until the exact moment you specify.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-500 rounded-lg flex items-center justify-center mb-4">
              <FileIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Any File Type</h3>
            <p className="text-gray-300">
              Store photos, videos, audio files, documents, or any digital content up to 100MB. All file types are supported.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4 mx-auto">
                1
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Upload Files</h3>
              <p className="text-gray-300 text-sm">Choose your photos, videos, or documents to preserve</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4 mx-auto">
                2
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Set Time Lock</h3>
              <p className="text-gray-300 text-sm">Choose when your capsule should unlock in the future</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4 mx-auto">
                3
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Encrypt & Store</h3>
              <p className="text-gray-300 text-sm">Files are encrypted and stored securely on IPFS</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4 mx-auto">
                4
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Unlock & Enjoy</h3>
              <p className="text-gray-300 text-sm">Access your memories when the time comes</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl p-8 border border-purple-500/30">
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Create Your First Time Capsule?</h2>
          <p className="text-gray-300 mb-6">
            Preserve your most precious memories with quantum-resistant security
          </p>
          <Link
            href="/create"
            className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 inline-block"
          >
            Get Started Now
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-16">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 TimeStone. Secured with post-quantum cryptography.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
