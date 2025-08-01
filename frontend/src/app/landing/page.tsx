'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Clock, Shield, Database, Zap, ArrowRight, CheckCircle, Play, Users, Star, Gift } from 'lucide-react';

// Magic UI components that we'll need to implement
import { TextAnimate } from '@/components/ui/text-animate';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { NumberTicker } from '@/components/ui/number-ticker';
import DecryptedText from '@/components/ui/decrypted-text';
import Hyperspeed from '@/components/Hyperspeed';

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Animated Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-4/5 transform -translate-y-8">
            <Hyperspeed
              effectOptions={{
                speedUp: 1.5,
                fov: 120,
                carLightsFade: 0.6,
                totalSideLightSticks: 30,
                lightPairsPerRoadWay: 50,
              }}
            />
          </div>
        </div>
        
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-green-950/20 to-black/40" />
        
        <motion.div 
          className="relative z-10 text-center px-6 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Main Heading */}
          <div className="mb-6">
            <div className="text-6xl md:text-8xl font-bold leading-tight text-center">
              <DecryptedText
                text="Lock Your "
                animateOn="mount"
                sequential={true}
                revealDirection="start"
                speed={80}
                delay={500}
                className="text-white"
                encryptedClassName="text-green-400/70"
                parentClassName="inline-block"
              />
              <AnimatedGradientText
                colorFrom="#22c55e"
                colorTo="#16a34a"
                className="inline-block mx-2"
              >
                Memories
              </AnimatedGradientText>
              <DecryptedText
                text=" in Time"
                animateOn="mount"
                sequential={true}
                revealDirection="start"
                speed={80}
                delay={1200}
                className="text-white"
                encryptedClassName="text-green-400/70"
                parentClassName="inline-block"
              />
            </div>
          </div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Create encrypted time capsules that unlock at the perfect moment. 
            Built with quantum-resistant encryption and powered by blockchain technology.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link href="/create">
              <ShimmerButton
                shimmerColor="#22c55e"
                background="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                className="text-lg px-8 py-4 font-semibold"
              >
                Create Capsule
              </ShimmerButton>
            </Link>
            
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center text-lg px-8 py-4 border border-green-500/50 rounded-lg hover:bg-green-950/30 transition-all duration-300"
              >
                <Play className="mr-2 h-5 w-5" />
                View Dashboard
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
                <NumberTicker value={1024} />+
              </div>
              <div className="text-sm text-gray-400">Capsules Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
                <NumberTicker value={99.9} decimalPlaces={1} />%
              </div>
              <div className="text-sm text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">
                <NumberTicker value={256} />-bit
              </div>
              <div className="text-sm text-gray-400">Encryption</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-green-500/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-green-500 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-green-950/10 to-black" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Powered by </span>
              <AnimatedGradientText
                colorFrom="#22c55e"
                colorTo="#16a34a"
              >
                Advanced Technology
              </AnimatedGradientText>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              TimeStone combines cutting-edge cryptography with blockchain technology 
              to ensure your memories remain secure until their designated unlock time.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Shield,
                title: "Quantum-Safe Encryption",
                description: "Post-quantum cryptography ensures your capsules remain secure even against future quantum computers.",
                color: "from-green-400 to-emerald-500"
              },
              {
                icon: Clock,
                title: "Time-Lock Technology", 
                description: "Precisely timed release mechanisms powered by blockchain oracles for guaranteed unlocking.",
                color: "from-blue-400 to-cyan-500"
              },
              {
                icon: Database,
                title: "Decentralized Storage",
                description: "IPFS integration ensures your data is distributed and always accessible when needed.",
                color: "from-purple-400 to-pink-500"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Optimized smart contracts on Etherlink provide instant transactions and low fees.",
                color: "from-yellow-400 to-orange-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-300"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/20 to-black" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Simple </span>
              <AnimatedGradientText
                colorFrom="#22c55e"
                colorTo="#16a34a"
              >
                Three-Step
              </AnimatedGradientText>
              <span className="text-white"> Process</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Upload & Encrypt",
                description: "Upload your files, add a personal message, and set the unlock date. Our quantum-safe encryption secures everything.",
                icon: "📁"
              },
              {
                step: "02", 
                title: "Store on Blockchain",
                description: "Your encrypted capsule is stored on IPFS and registered on the blockchain with time-lock smart contracts.",
                icon: "⛓️"
              },
              {
                step: "03",
                title: "Automatic Unlock",
                description: "When the time comes, the capsule automatically unlocks and notifies the recipient with secure access.",
                icon: "🔓"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-4xl mb-4">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-black border-2 border-green-500 rounded-full w-12 h-12 flex items-center justify-center">
                    <span className="text-green-400 font-bold text-sm">{step.step}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">{step.title}</h3>
                <p className="text-gray-300 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-green-950/10 to-black" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Trusted by </span>
              <AnimatedGradientText
                colorFrom="#22c55e"
                colorTo="#16a34a"
              >
                Thousands
              </AnimatedGradientText>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                metric: "1000+",
                label: "Active Users",
                icon: Users
              },
              {
                metric: "5000+",
                label: "Capsules Created", 
                icon: Gift
              },
              {
                metric: "4.9/5",
                label: "User Rating",
                icon: Star
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8"
              >
                <stat.icon className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <div className="text-4xl font-bold text-white mb-2">{stat.metric}</div>
                <div className="text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 via-black to-green-950/30" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-8">
              <span className="text-white">Ready to Create Your </span>
              <AnimatedGradientText
                colorFrom="#22c55e"
                colorTo="#16a34a"
              >
                First Capsule?
              </AnimatedGradientText>
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join thousands of users who trust TimeStone to preserve their most precious memories 
              for the future. Start your journey today.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/create">
                <ShimmerButton
                  shimmerColor="#22c55e"
                  background="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                  className="text-lg px-10 py-5 font-semibold"
                >
                  Start Creating Now
                </ShimmerButton>
              </Link>
              
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-lg px-10 py-5 border border-green-500/50 rounded-lg hover:bg-green-950/30 transition-all duration-300"
                >
                  Explore Features
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2024 TimeStone. Building the future of digital time capsules.
          </p>
        </div>
      </footer>
    </div>
  );
}
