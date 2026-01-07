'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  School, 
  Home, 
  ShoppingBag, 
  Heart,
  MapPin,
  BarChart3,
  TrendingUp,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

// Lazy load Layout to avoid blocking page render
const Layout = dynamic(() => import('@/components/Layout'), {
  ssr: false,
});

const UseCases = () => {
  const useCases = [
    {
      icon: School,
      problem: 'Where should a new school be built?',
      description: 'A growing residential area needs better educational access, but where exactly should the new school be located?',
      dataUsed: [
        'Population density by age group',
        'Existing school locations and capacity',
        'Commute times to nearest schools',
        'Projected population growth',
        'Residential development plans'
      ],
      outcome: 'Identify the optimal location that serves the maximum number of families while minimizing travel time and avoiding over-saturation in other areas.'
    },
    {
      icon: Home,
      problem: 'Which areas face rental pressure?',
      description: 'Rising rents are making housing unaffordable for many residents. Where is the pressure most acute?',
      dataUsed: [
        'Average rental prices by area',
        'Income distribution',
        'Rental price trends over time',
        'Population growth rates',
        'Housing supply vs demand'
      ],
      outcome: 'Pinpoint neighborhoods where rental costs are rising faster than incomes, enabling targeted housing policies and development incentives.'
    },
    {
      icon: ShoppingBag,
      problem: 'Where does footfall exceed retail supply?',
      description: 'Some areas have high visitor traffic but limited shopping options. Where are the opportunities?',
      dataUsed: [
        'Footfall data by location',
        'Retail density and types',
        'Population and visitor patterns',
        'Spending power indicators',
        'Competition analysis'
      ],
      outcome: 'Identify high-traffic areas with retail gaps, helping businesses find prime locations and planners understand market needs.'
    },
    {
      icon: Heart,
      problem: 'Which communities lack healthcare access?',
      description: 'Ensuring all residents have access to quality healthcare is a priority. Where are the gaps?',
      dataUsed: [
        'Healthcare facility locations',
        'Population density and demographics',
        'Travel time to nearest facilities',
        'Age distribution (elderly care needs)',
        'Service capacity vs demand'
      ],
      outcome: 'Map healthcare deserts and identify optimal locations for new clinics or hospitals to improve access for underserved communities.'
    },
    {
      icon: MapPin,
      problem: 'Where should public transport be expanded?',
      description: 'Limited public transport access affects mobility and quality of life. Which areas need better connectivity?',
      dataUsed: [
        'Current metro/bus coverage',
        'Population density',
        'Commute patterns and destinations',
        'Traffic congestion data',
        'Employment centers and residential areas'
      ],
      outcome: 'Prioritize transport expansion to areas with high population density and limited access, improving mobility for thousands of residents.'
    },
    {
      icon: TrendingUp,
      problem: 'Where should new residential development be prioritized?',
      description: 'Balancing housing supply with demand while considering infrastructure capacity and community needs.',
      dataUsed: [
        'Housing demand indicators',
        'Available land and zoning',
        'Infrastructure capacity (water, power, roads)',
        'Employment centers proximity',
        'Community amenities and services'
      ],
      outcome: 'Guide development planning to areas where housing is most needed, infrastructure can support growth, and communities will thrive.'
    }
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section 
        className="relative py-20 lg:py-24 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(/images/casestudy.jpg)`
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-dubai-gray-50/80 via-dubai-blue-50/70 to-dubai-gray-50/80"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-dubai-gray-900 mb-6">
              Real Problems, <span className="text-dubai-blue">Real Solutions</span>
            </h1>
            <p className="text-xl md:text-2xl text-dubai-gray-600 mb-8">
              See how GeoStats helps solve complex urban challenges with data-driven insights.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <div
                  key={index}
                  className="bg-dubai-gray-50 rounded-xl p-8 lg:p-10 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-6 mb-6">
                    <div className="bg-dubai-blue bg-opacity-10 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="h-8 w-8 text-dubai-blue" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-dubai-gray-900 mb-3">
                        {useCase.problem}
                      </h2>
                      <p className="text-lg text-dubai-gray-600">
                        {useCase.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Data Used */}
                    <div className="bg-white rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <BarChart3 className="h-5 w-5 text-dubai-blue mr-2" />
                        <h3 className="text-xl font-bold text-dubai-gray-900">
                          Data Used
                        </h3>
                      </div>
                      <ul className="space-y-3">
                        {useCase.dataUsed.map((data, idx) => (
                          <li key={idx} className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-dubai-blue mr-3 flex-shrink-0 mt-0.5" />
                            <span className="text-dubai-gray-700">{data}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Outcome */}
                    <div className="bg-white rounded-lg p-6">
                      <div className="flex items-center mb-4">
                        <CheckCircle className="h-5 w-5 text-dubai-blue mr-2" />
                        <h3 className="text-xl font-bold text-dubai-gray-900">
                          Outcome
                        </h3>
                      </div>
                      <p className="text-dubai-gray-700 leading-relaxed">
                        {useCase.outcome}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-dubai-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-dubai-gray-600 max-w-2xl mx-auto">
              Simple steps from problem to solution.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="bg-dubai-blue bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-dubai-blue">1</span>
              </div>
              <h3 className="text-xl font-bold text-dubai-gray-900 mb-4">
                Define the Problem
              </h3>
              <p className="text-dubai-gray-600">
                Start with a clear question about urban planning, service delivery, or community needs.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="bg-dubai-blue bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-dubai-blue">2</span>
              </div>
              <h3 className="text-xl font-bold text-dubai-gray-900 mb-4">
                Explore the Data
              </h3>
              <p className="text-dubai-gray-600">
                Use our platform to visualize relevant metrics, compare areas, and identify patterns.
              </p>
            </div>
            <div className="bg-white rounded-xl p-8 text-center">
              <div className="bg-dubai-blue bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-dubai-blue">3</span>
              </div>
              <h3 className="text-xl font-bold text-dubai-gray-900 mb-4">
                Make Decisions
              </h3>
              <p className="text-dubai-gray-600">
                Get clear, actionable insights to guide your planning, investment, or policy decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-dubai-blue to-dubai-blue-dark text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Solve Your Urban Challenges?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            See how GeoStats can help you make data-driven decisions for your organization.
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

export default UseCases;
