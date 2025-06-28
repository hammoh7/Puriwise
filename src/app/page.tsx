"use client";

import FeatureCard from "@/components/landing/FeaturesCard";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import ProcessStep from "@/components/landing/ProcessStep";
import PuriwiseVisualization from "@/components/landing/Visualization";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/utils/firebaseConfig";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FaMapMarkedAlt,
  FaUserMd,
  FaRoute,
  FaGlobeAmericas,
  FaBrain,
} from "react-icons/fa";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-16 md:py-24 bg-gradient-to-b from-primary to-primary-light">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 mb-12 lg:mb-0 animate-fade-in">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-playfair font-bold leading-tight mb-6">
              Breathe Clean, <span className="text-accent">Live Healthy</span>
            </h1>
            <p className="text-xl text-text-light mb-8 max-w-xl">
              Puriwise empowers you to make healthier outdoor decisions with
              real-time air quality insights and AI-driven personalized health
              tips.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="bg-transparent border-2 border-accent text-accent hover:bg-accent/10 py-3 px-8 rounded-full font-medium transition-colors text-lg">
                Learn More
              </button>
            </div>
          </div>
          <div className="lg:w-1/2 flex justify-center animate-fade-in delay-100">
            <div className="w-full max-w-xl h-96 md:h-[450px] rounded-2xl overflow-hidden">
              <PuriwiseVisualization />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4 inline-block relative pb-2">
              Clean Air Solutions
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-accent"></span>
            </h2>
            <p className="text-text-light max-w-2xl mx-auto">
              Puriwise combines cutting-edge technology with health expertise to
              empower your outdoor decisions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FaMapMarkedAlt />}
              title="Real time AQI Monitoring"
              description="Automatically detect the Air Quality Index at your exact location"
            />
            <FeatureCard
              icon={<FaUserMd />}
              title="AI‑Personalized Health Coach"
              description="Get daily, bite‑sized ‘Breathing Plans’ tailored to your age, conditions, and current AQI—powered by Google Cloud’s Vertex AI."
            />
            <FeatureCard
              icon={<FaRoute />}
              title="Clean‑Air Routing"
              description="Discover walking or cycling paths optimized to minimize pollution exposure, using our custom routing algorithm and AQI data."
            />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-16 bg-primary-light">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-playfair font-bold mb-4 inline-block relative pb-2">
              How Puriwise Works
              <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-accent"></span>
            </h2>
            <p className="text-text-light max-w-2xl mx-auto">
              Our technology integrates multiple data sources to provide you
              with the most accurate air quality insights
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProcessStep
              number={1}
              icon={<FaGlobeAmericas />}
              title="Data Collection"
              description="We gather air quality data from thousands of sensors worldwide, combined with satellite imagery and meteorological data."
            />
            <ProcessStep
              number={2}
              icon={<FaBrain />}
              title="AI Analysis"
              description="Our algorithms process this data using MongoDB Vector Search and Google Cloud's Vertex AI to identify patterns and risks."
            />
            <ProcessStep
              number={3}
              icon={<FaUserMd />}
              title="Personalized Insights"
              description="Based on your health profile and preferences, we generate actionable recommendations for your daily activities."
            />
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-accent to-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-playfair font-bold text-accent mb-6">
            Ready to Breathe Better?
          </h2>
          <p className="text-accent/90 max-w-2xl mx-auto mb-10">
            Join thousands of users who are taking control of their outdoor air
            quality exposure.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="bg-transparent border-2 border-white text-accent hover:bg-white/10 py-3 px-8 rounded-full font-medium transition-colors text-lg">
              View Demo
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
