'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  Target, 
  Eye, 
  Globe, 
  Heart,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

// Lazy load Layout to avoid blocking page render
const Layout = dynamic(() => import('@/components/Layout'), {
  ssr: false,
});

const About = () => {
  const values = [
    {
      icon: Target,
      title: 'Mission',
      description: 'Make urban data understandable and accessible to everyone. We believe that better data leads to better decisions, which lead to better cities and better lives.'
    },
    {
      icon: Eye,
      title: 'Vision',
      description: 'Smarter cities, better lives. We envision a future where every urban decision—from where to live to where to build infrastructure—is informed by clear, accessible data.'
    },
    {
      icon: Globe,
      title: 'Expansion',
      description: 'Starting with Dubai, we\'re building a platform that scales across the UAE and GCC region. Our goal is to become the go-to source for urban intelligence in the Middle East.'
    },
    {
      icon: Heart,
      title: 'Values',
      description: 'Neutral, transparent, and people-first. We provide data without bias, maintain transparency in our methods, and always prioritize the public good over commercial interests.'
    }
  ];

  const principles = [
    'Privacy-first: All data is aggregated and anonymized',
    'Transparency: Clear explanations of data sources and methods',
    'Accessibility: Simple interfaces, no technical expertise required',
    'Accuracy: Rigorous data validation and quality assurance',
    'Impact: Focus on decisions that improve lives and communities'
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dubai-gray-50 to-dubai-blue-50 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-dubai-gray-900 mb-6">
              About <span className="text-dubai-blue">GeoStats</span>
            </h1>
            <p className="text-xl md:text-2xl text-dubai-gray-600">
              Making urban intelligence simple, accessible, and actionable for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div
                  key={index}
                  className="bg-dubai-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="bg-dubai-blue bg-opacity-10 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="h-8 w-8 text-dubai-blue" />
                  </div>
                  <h2 className="text-2xl font-bold text-dubai-gray-900 mb-4">
                    {value.title}
                  </h2>
                  <p className="text-lg text-dubai-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Stand For */}
      <section className="py-20 bg-dubai-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-8 text-center">
              What We Stand For
            </h2>
            <div className="bg-white rounded-xl p-8 space-y-4">
              {principles.map((principle, index) => (
                <div key={index} className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-dubai-blue mr-4 flex-shrink-0 mt-0.5" />
                  <span className="text-lg text-dubai-gray-700">{principle}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-8 text-center">
              Our Approach
            </h2>
            <div className="space-y-6 text-lg text-dubai-gray-700 leading-relaxed">
              <p>
                GeoStats was born from a simple observation: urban data exists in abundance, but it's often locked away in complex systems, spread across multiple sources, or presented in ways that only data scientists can understand.
              </p>
              <p>
                We believe that everyone—from residents choosing where to live, to businesses deciding where to open, to governments planning infrastructure—deserves access to clear, actionable urban intelligence.
              </p>
              <p>
                Our platform aggregates data from multiple trusted sources, processes it to ensure accuracy and relevance, and presents it through simple maps and clear explanations. No heavy GIS tools. No data science expertise required. Just the insights you need to make better decisions.
              </p>
              <p>
                We're starting with Dubai because it's a city of rapid growth, innovation, and opportunity. But our vision extends across the UAE and GCC region, where urban intelligence can help shape the future of cities and communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Not What We Are */}
      <section className="py-20 bg-dubai-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-8 text-center">
              What We're Not
            </h2>
            <div className="bg-white rounded-xl p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-dubai-gray-900 mb-2">
                  Not a Real Estate Listings Site
                </h3>
                <p className="text-dubai-gray-600">
                  We don't list properties. We provide area-level insights about neighborhoods, communities, and districts to help you understand the context around real estate decisions.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-dubai-gray-900 mb-2">
                  Not a Heavy GIS Tool
                </h3>
                <p className="text-dubai-gray-600">
                  You don't need specialized training to use GeoStats. Our interface is designed for clarity and simplicity, not technical complexity.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold text-dubai-gray-900 mb-2">
                  Not Data Science Dashboards
                </h3>
                <p className="text-dubai-gray-600">
                  We focus on decision intelligence, not data exploration. Every feature is designed to answer a specific question and guide a specific decision.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-dubai-blue to-dubai-blue-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Join Us in Building Smarter Cities
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Whether you're a resident, business owner, or government agency, we'd love to have you on this journey.
          </p>
          <Link href="/contact"
            className="bg-white text-dubai-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-dubai-gray-100 transition-colors inline-flex items-center"
          >
            Get in Touch
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
        </div>
    </Layout>
  );
};

export default About;
