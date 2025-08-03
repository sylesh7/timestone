'use client';
import { DecorativeBeam } from "@/components/ui/decorative-beam";
import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Clock, Shield, Database, Zap, ArrowRight, CheckCircle, Play, Users, Star, Gift, Upload, Link as LinkIcon, Unlock } from 'lucide-react';

// Magic UI components that we'll need to implement
import { TextAnimate } from '@/components/ui/text-animate';
import { AnimatedGradientText } from '@/components/ui/animated-gradient-text';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import EncryptedButton from '@/components/ui/encrypted-button';
import { NumberTicker } from '@/components/ui/number-ticker';
import DecryptedText from '@/components/ui/decrypted-text';
import ContinuousHyperspeed from '@/components/ContinuousHyperspeed';
import IsolatedTitleComponent from '@/components/IsolatedTitleComponent';
import { MagicCard } from '@/components/ui/magic-card';
import TextType from '@/components/ui/text-type';
import { AnimatedBeam } from '@/components/ui/animated-beam';
import Ripple from '@/components/ui/ripple';
import { RainbowButton } from '@/components/ui/rainbow-button';



export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* TimeStone Title - Top Left - Completely Isolated */}
      <IsolatedTitleComponent />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Animated Background */}
        <ContinuousHyperspeed />
        
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            <TextType
              text="Create encrypted time capsules that unlock at the perfect moment. Built with quantum-resistant encryption and powered by blockchain technology."
              typingSpeed={30}
              initialDelay={2000}
              showCursor={true}
              cursorCharacter="_"
              cursorClassName="text-green-400 font-bold"
              loop={false}
              textColors={["#22c55e"]}
              className="text-xl md:text-2xl leading-relaxed font-bold"
            />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <Link href="/create">
              <EncryptedButton>
                Create Capsule
              </EncryptedButton>
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
                title: "Quantum-Safe Encryption",
                description: "Post-quantum cryptography ensures your capsules remain secure even against future quantum computers."
              },
              {
                title: "Time-Lock Technology", 
                description: "Precisely timed release mechanisms powered by blockchain oracles for guaranteed unlocking."
              },
              {
                title: "Decentralized Storage",
                description: "IPFS integration ensures your data is distributed and always accessible when needed and they can unlock."
              },
              {
                title: "Lightning Fast Transactions ",
                description: "Optimized smart contracts on Etherlink provide instant transactions with blockchain interaction and low fees."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                className="group"
              >
                <MagicCard 
                  className="bg-black/70 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-green-500/20"
                  gradientColor="rgba(34, 197, 94, 0.15)"
                  gradientSize={300}
                >
                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-green-400 transition-colors duration-300">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">{feature.description}</p>
                </MagicCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/20 to-black" />
        <Ripple />
        
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

          <div className="relative grid md:grid-cols-3 gap-12">
            {/* Decorative Beams */}
            <div className="hidden md:block absolute top-1/2 left-1/3 w-1/3 h-1 -translate-y-1/2">
              <DecorativeBeam delay={1} />
            </div>
            <div className="hidden md:block absolute top-1/2 left-2/3 w-1/3 h-1 -translate-y-1/2">
              <DecorativeBeam delay={2} />
            </div>

            {[
              {
                step: "01",
                title: "Upload & Encrypt",
                description: "Upload your files, add a personal message, and set the unlock date. Our quantum-safe encryption secures everything.",
                icon: Upload
              },
              {
                step: "02", 
                title: "Store on Blockchain",
                description: "Your encrypted capsule is stored on IPFS and registered on the blockchain with time-lock smart contracts.",
                icon: LinkIcon
              },
              {
                step: "03",
                title: "Automatic Unlock",
                description: "When the time comes, the capsule automatically unlocks and notifies the recipient with secure access.",
                icon: Unlock
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="relative z-10"
              >
                <MagicCard className="p-8 text-center bg-black/40 border-green-500/20 hover:border-green-500/40 transition-all duration-500">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-500/25">
                      <step.icon className="h-12 w-12 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-8 bg-black border-2 border-green-500 rounded-full w-12 h-12 flex items-center justify-center shadow-lg shadow-green-500/50">
                      <span className="text-green-400 font-bold text-sm">{step.step}</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-white">{step.title}</h3>
                  <p className="text-gray-300 leading-relaxed group-hover:text-gray-200 transition-colors duration-300">{step.description}</p>
                </MagicCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-green-950/30 via-black to-green-950/30" />
        
        <div className="relative z-10 max-w-6xl mx-auto text-center px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-5xl md:text-7xl font-bold mb-8">
              <span className="text-white">Your </span>
              <AnimatedGradientText
                colorFrom="#22c55e"
                colorTo="#16a34a"
              >
                Digital Legacy
              </AnimatedGradientText>
              <span className="text-white"> Awaits</span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed">
              Transform your most valuable memories into quantum-secured time capsules. 
              When the moment is right, your legacy unlocks automatically through blockchain technology.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  <NumberTicker value={256} />-bit
                </div>
                <p className="text-gray-400">Quantum-Resistant Encryption</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  <NumberTicker value={99.99} decimalPlaces={2} />%
                </div>
                <p className="text-gray-400">Immutable Storage Guarantee</p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">
                  Infinite
                </div>
                <p className="text-gray-400">Preservation Timeline</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/create">
                <ShimmerButton
                  shimmerColor="#22c55e"
                  background="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                  className="text-lg px-12 py-6 font-bold"
                >
                  Begin Your Legacy
                </ShimmerButton>
              </Link>
              
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(34, 197, 94, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="text-lg px-12 py-6 border-2 border-green-500/70 rounded-lg hover:bg-green-950/30 transition-all duration-300 font-semibold"
                >
                  Explore the Vault
                </motion.button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <motion.div 
              className="mt-16 flex flex-col md:flex-row justify-center items-center gap-8 text-sm text-gray-400"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                <span>Blockchain Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-green-400" />
                <span>Decentralized Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-400" />
                <span>Instant Deployment</span>
              </div>
            </motion.div>
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
