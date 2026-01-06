import React from 'react';
import Link from 'next/link';
import { 
  Home, 
  DollarSign, 
  Users, 
  Clock, 
  School, 
  Hospital,
  MapPin,
  TrendingUp,
  Building2,
  Briefcase,
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import Layout from '@/components/Layout';

const B2C = () => {
  const targetAudience = [
    {
      icon: Users,
      title: 'Residents',
      description: 'Find your perfect neighborhood based on your lifestyle and budget.'
    },
    {
      icon: Users,
      title: 'Expats',
      description: 'Navigate Dubai with confidence using data-driven location insights.'
    },
    {
      icon: Briefcase,
      title: 'Entrepreneurs',
      description: 'Identify the best locations to start and grow your business.'
    },
    {
      icon: Building2,
      title: 'Retail Brands',
      description: 'Understand footfall, demographics, and competition in target areas.'
    },
    {
      icon: TrendingUp,
      title: 'Property Investors',
      description: 'Make informed investment decisions with comprehensive market data.'
    }
  ];

  const metrics = [
    {
      icon: DollarSign,
      title: 'Average Rent',
      description: 'Understand rental costs across different neighborhoods and property types.'
    },
    {
      icon: TrendingUp,
      title: 'Income Bracket',
      description: 'See average household income levels to understand affordability.'
    },
    {
      icon: Users,
      title: 'Population Mix',
      description: 'Learn about demographics, age groups, and community composition.'
    },
    {
      icon: Clock,
      title: 'Travel Time',
      description: 'Calculate commute times to key destinations like work, schools, and malls.'
    },
    {
      icon: School,
      title: 'Schools & Hospitals',
      description: 'Find nearby educational and healthcare facilities with distance and ratings.'
    },
    {
      icon: MapPin,
      title: 'Amenities',
      description: 'Discover parks, shopping centers, restaurants, and other essential services.'
    }
  ];

  const useCases = [
    {
      title: 'Choose Where to Live',
      description: 'Compare neighborhoods based on rent, income levels, commute times, and nearby amenities. Find the perfect balance for your lifestyle and budget.',
      features: ['Rent comparisons', 'Commute analysis', 'Amenity mapping', 'Safety indicators']
    },
    {
      title: 'Understand Rent, Income & Commute',
      description: 'Get a clear picture of living costs, earning potential, and transportation options in any area of Dubai.',
      features: ['Rental trends', 'Income distribution', 'Public transport access', 'Traffic patterns']
    },
    {
      title: 'Find High-Demand Business Locations',
      description: 'Identify areas with high footfall, growing populations, and underserved markets for your business.',
      features: ['Footfall data', 'Population growth', 'Competition analysis', 'Market gaps']
    },
    {
      title: 'Compare Neighborhoods Easily',
      description: 'Side-by-side comparisons of multiple areas to make informed decisions quickly.',
      features: ['Multi-area comparison', 'Key metrics dashboard', 'Visual maps', 'Export reports']
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        className="relative py-20 lg:py-24 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/images/pandb.jpg)`
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-dubai-gray-50/80 via-dubai-blue-50/70 to-dubai-gray-50/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-dubai-gray-900 mb-6">
              For People & <span className="text-dubai-blue">Businesses</span>
            </h1>
            <p className="text-xl md:text-2xl text-dubai-gray-600 mb-8">
              Make smarter decisions about where to live, work, and invest in Dubai.
            </p>
            <Link href="/contact"
              className="bg-dubai-blue text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-dubai-blue-dark transition-colors inline-flex items-center"
            >
              Become a Data Partner
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Target Audience */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-4">
              Built for You
            </h2>
            <p className="text-xl text-dubai-gray-600 max-w-2xl mx-auto">
              Whether you're moving to Dubai or expanding your business, we provide the insights you need.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {targetAudience.map((audience, index) => {
              const Icon = audience.icon;
              return (
                <div
                  key={index}
                  className="bg-dubai-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="bg-dubai-blue bg-opacity-10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-dubai-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-dubai-gray-900 mb-2">
                    {audience.title}
                  </h3>
                  <p className="text-dubai-gray-600">
                    {audience.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="py-20 bg-dubai-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-4">
              Key Metrics You Need
            </h2>
            <p className="text-xl text-dubai-gray-600 max-w-2xl mx-auto">
              Simple, clear data to help you make informed decisions.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-dubai-gray-200"
                >
                  <div className="bg-dubai-blue bg-opacity-10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-dubai-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-dubai-gray-900 mb-3">
                    {metric.title}
                  </h3>
                  <p className="text-dubai-gray-600">
                    {metric.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-4">
              How We Help You Decide
            </h2>
            <p className="text-xl text-dubai-gray-600 max-w-2xl mx-auto">
              Real problems, real solutions. See how our platform helps you make better decisions.
            </p>
          </div>
          <div className="space-y-8">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-dubai-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow"
              >
                <h3 className="text-2xl font-bold text-dubai-gray-900 mb-4">
                  {useCase.title}
                </h3>
                <p className="text-lg text-dubai-gray-600 mb-6">
                  {useCase.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {useCase.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-dubai-blue mr-3 flex-shrink-0" />
                      <span className="text-dubai-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-dubai-blue to-dubai-blue-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Making Smarter Decisions Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of residents and businesses using GeoStats to navigate Dubai with confidence.
          </p>
          <Link href="/contact"
            className="bg-white text-dubai-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-dubai-gray-100 transition-colors inline-flex items-center"
          >
            Become a Data Partner
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
        </div>
    </Layout>
  );
};

export default B2C;
