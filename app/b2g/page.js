import React from 'react';
import Link from 'next/link';
import { 
  Landmark, 
  Users, 
  MapPin, 
  TrendingUp, 
  Building2,
  Heart,
  Shield,
  BarChart3,
  ArrowRight,
  CheckCircle,
  Target
} from 'lucide-react';
import Layout from '@/components/Layout';

const B2G = () => {
  const targetAudience = [
    {
      icon: Landmark,
      title: 'City Planners',
      description: 'Plan infrastructure and services based on comprehensive population and demand data.'
    },
    {
      icon: Building2,
      title: 'Municipal Bodies',
      description: 'Optimize service delivery and resource allocation across districts.'
    },
    {
      icon: Users,
      title: 'Policy Makers',
      description: 'Make evidence-based decisions with aggregated urban analytics.'
    },
    {
      icon: Building2,
      title: 'Infrastructure Teams',
      description: 'Identify gaps and plan transportation, utilities, and public facilities.'
    }
  ];

  const keySections = [
    {
      icon: TrendingUp,
      title: 'Population Growth & Density',
      description: 'Track population trends, density patterns, and demographic shifts across Dubai. Understand where people live, work, and move to plan for the future.',
      metrics: ['Population growth rates', 'Density heat maps', 'Demographic breakdowns', 'Migration patterns']
    },
    {
      icon: MapPin,
      title: 'Service Coverage Gaps',
      description: 'Identify areas with insufficient access to essential services like healthcare, education, and public transportation.',
      metrics: ['Healthcare accessibility', 'School coverage', 'Public transport gaps', 'Service demand vs supply']
    },
    {
      icon: Building2,
      title: 'Transport Accessibility',
      description: 'Analyze public transport coverage, commute patterns, and identify areas needing better connectivity.',
      metrics: ['Metro/bus coverage', 'Average commute times', 'Traffic patterns', 'Accessibility scores']
    },
    {
      icon: BarChart3,
      title: 'Housing Supply vs Demand',
      description: 'Understand housing market dynamics, rental pressure, and identify areas needing more residential development.',
      metrics: ['Housing stock', 'Rental trends', 'Affordability indicators', 'Development opportunities']
    },
    {
      icon: Target,
      title: 'Planning & Forecasting Insights',
      description: 'Use historical data and projections to plan infrastructure, services, and policies for future growth.',
      metrics: ['Growth projections', 'Trend analysis', 'Scenario planning', 'Impact assessments']
    }
  ];

  const emphasisPoints = [
    {
      icon: Shield,
      title: 'Aggregated & Anonymized Data',
      description: 'All data is aggregated at the area level and fully anonymized. We respect privacy while providing actionable insights.'
    },
    {
      icon: Target,
      title: 'Planning, Not Surveillance',
      description: 'Our platform is designed for urban planning and policy making, not individual tracking or monitoring.'
    },
    {
      icon: BarChart3,
      title: 'Evidence-Based Policy Making',
      description: 'Make informed decisions backed by comprehensive data, reducing guesswork and improving outcomes for citizens.'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        className="relative py-20 lg:py-24 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/images/gandp.jpg)`
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-dubai-gray-50/80 via-dubai-blue-50/70 to-dubai-gray-50/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-dubai-gray-900 mb-6">
              For <span className="text-dubai-blue">Government</span> & Public Sector
            </h1>
            <p className="text-xl md:text-2xl text-dubai-gray-600 mb-8">
              Evidence-based urban planning and policy making powered by comprehensive data analytics.
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
              Built for Public Service
            </h2>
            <p className="text-xl text-dubai-gray-600 max-w-2xl mx-auto">
              Empowering government agencies and public sector organizations to serve citizens better.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Key Sections */}
      <section className="py-20 bg-dubai-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-4">
              Comprehensive Urban Analytics
            </h2>
            <p className="text-xl text-dubai-gray-600 max-w-2xl mx-auto">
              Everything you need to plan, analyze, and make informed policy decisions.
            </p>
          </div>
          <div className="space-y-8">
            {keySections.map((section, index) => {
              const Icon = section.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-8 hover:shadow-lg transition-shadow border border-dubai-gray-200"
                >
                  <div className="flex items-start space-x-6">
                    <div className="bg-dubai-blue bg-opacity-10 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-8 w-8 text-dubai-blue" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-dubai-gray-900 mb-4">
                        {section.title}
                      </h3>
                      <p className="text-lg text-dubai-gray-600 mb-6">
                        {section.description}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {section.metrics.map((metric, idx) => (
                          <div key={idx} className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-dubai-blue mr-3 flex-shrink-0" />
                            <span className="text-dubai-gray-700">{metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Emphasis Points */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-4">
              Our Commitment
            </h2>
            <p className="text-xl text-dubai-gray-600 max-w-2xl mx-auto">
              Privacy, transparency, and public good are at the core of everything we do.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {emphasisPoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div
                  key={index}
                  className="bg-dubai-gray-50 rounded-xl p-8 text-center"
                >
                  <div className="bg-dubai-blue bg-opacity-10 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-dubai-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-dubai-gray-900 mb-4">
                    {point.title}
                  </h3>
                  <p className="text-dubai-gray-600">
                    {point.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-dubai-blue to-dubai-blue-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Transform Urban Planning with Data
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join government agencies across Dubai using GeoStats to make evidence-based decisions.
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

export default B2G;
