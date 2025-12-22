import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  TrendingUp, 
  Users, 
  Building2, 
  Briefcase, 
  Landmark, 
  GraduationCap,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Target,
  Globe
} from 'lucide-react';
import Map from '../components/ui/Map';

const Home = () => {
  const valueBlocks = [
    {
      icon: MapPin,
      title: 'Location Intelligence',
      description: 'Population density, income levels, commute times, and footfall data at your fingertips.',
      features: ['Population density', 'Income levels', 'Commute times', 'Footfall']
    },
    {
      icon: Target,
      title: 'Real-World Decisions',
      description: 'Make informed choices about where to live, work, invest, and build.',
      features: ['Where to live', 'Where to open a business', 'Where to invest', 'Where to build']
    },
    {
      icon: Globe,
      title: 'Built for Dubai',
      description: 'Community-level insights powered by local data sources, focused on growth and planning.',
      features: ['Community-level insights', 'Local data sources', 'Growth & planning focused']
    }
  ];

  const userGroups = [
    {
      icon: Users,
      title: 'Residents & Expats',
      decision: 'Find the best neighborhood to live based on rent, commute, and amenities.'
    },
    {
      icon: Briefcase,
      title: 'Business Owners',
      decision: 'Identify high-demand locations and understand customer demographics.'
    },
    {
      icon: TrendingUp,
      title: 'Investors & Developers',
      decision: 'Discover growth areas and make data-driven investment decisions.'
    },
    {
      icon: Landmark,
      title: 'Urban Planners',
      decision: 'Plan infrastructure and services based on population and demand data.'
    },
    {
      icon: Building2,
      title: 'Government Agencies',
      decision: 'Make evidence-based policy decisions with comprehensive urban analytics.'
    },
    {
      icon: GraduationCap,
      title: 'NGOs & Researchers',
      decision: 'Access aggregated data for research and community development projects.'
    }
  ];

  const whyUsePoints = [
    {
      icon: CheckCircle,
      title: 'One Source of Truth',
      description: 'All your urban intelligence needs in one platform, no need to juggle multiple sources.'
    },
    {
      icon: BarChart3,
      title: 'Area-Level Averages',
      description: 'Get meaningful insights from aggregated data, not noisy individual listings.'
    },
    {
      icon: TrendingUp,
      title: 'Easy Comparisons',
      description: 'Compare neighborhoods, districts, and communities side-by-side effortlessly.'
    },
    {
      icon: MapPin,
      title: 'Historical + Future Insights',
      description: 'Understand trends over time and see projections for better planning.'
    }
  ];

  const [mapFilter, setMapFilter] = useState('Population');

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dubai-gray-50 to-dubai-blue-50 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-dubai-gray-900 mb-6 leading-tight">
              Understand Dubai.<br />
              <span className="text-dubai-blue">Decide Smarter.</span>
            </h1>
            <p className="text-xl md:text-2xl text-dubai-gray-600 mb-10 leading-relaxed">
              Population, income, mobility, and real-estate insights — explained simply.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/use-cases"
                className="bg-dubai-blue text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-dubai-blue-dark transition-colors inline-flex items-center justify-center"
              >
                Explore Use Cases
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/contact"
                className="bg-white text-dubai-blue border-2 border-dubai-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-dubai-gray-50 transition-colors inline-flex items-center justify-center"
              >
                Become a Data Partner
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Value Blocks */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {valueBlocks.map((block, index) => {
              const Icon = block.icon;
              return (
                <div
                  key={index}
                  className="bg-dubai-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow"
                >
                  <div className="bg-dubai-blue-light bg-opacity-10 w-16 h-16 rounded-lg flex items-center justify-center mb-6">
                    <Icon className="h-8 w-8 text-dubai-blue" />
                  </div>
                  <h3 className="text-2xl font-bold text-dubai-gray-900 mb-4">
                    {block.title}
                  </h3>
                  <p className="text-dubai-gray-600 mb-6 text-lg">
                    {block.description}
                  </p>
                  <ul className="space-y-2">
                    {block.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-dubai-gray-700">
                        <CheckCircle className="h-5 w-5 text-dubai-blue mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Map Preview Section */}
      <section className="py-20 bg-dubai-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-dubai-gray-500 font-semibold">Interactive Map</p>
              <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-3">
                Explore Dubai Communities
              </h2>
              <p className="text-lg text-dubai-gray-600 max-w-2xl">
                View the original GeoStats map dashboard. Compare population and area data across Dubai communities in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {['Emirates', 'Area'].map((item) => (
                <button
                  key={item}
                  onClick={() => setMapFilter(item)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                    mapFilter === item
                      ? 'bg-dubai-blue text-white border-dubai-blue'
                      : 'bg-white text-dubai-gray-700 border-dubai-gray-300 hover:border-dubai-blue'
                  }`}
                >
                  {item}
                </button>
              ))}
              <Link
                to="/map"
                className="px-4 py-2 rounded-lg text-sm font-semibold border border-dubai-blue text-dubai-blue hover:bg-dubai-blue hover:text-white transition-colors"
              >
                Open Full Map
              </Link>
            </div>
          </div>
          <div className="h-[550px] rounded-2xl overflow-hidden shadow-lg border border-dubai-gray-200 relative">
            <Map selectedFilter={mapFilter} disableScrollZoom={true} />
          </div>
        </div>
      </section>

      {/* User Groups Section */}
      <section className="py-20 bg-dubai-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-4">
              Built for Everyone
            </h2>
            <p className="text-xl text-dubai-gray-600 max-w-2xl mx-auto">
              Whether you're making personal decisions or shaping public policy, we help you make smarter choices.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userGroups.map((group, index) => {
              const Icon = group.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow border border-dubai-gray-200"
                >
                  <div className="bg-dubai-blue bg-opacity-10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-dubai-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-dubai-gray-900 mb-3">
                    {group.title}
                  </h3>
                  <p className="text-dubai-gray-600">
                    <span className="font-semibold">Decision:</span> {group.decision}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Use This Platform */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-dubai-gray-900 mb-4">
              Why Use This Platform
            </h2>
            <p className="text-xl text-dubai-gray-600 max-w-2xl mx-auto">
              Decision intelligence made simple. No complex GIS tools, no data science expertise required.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {whyUsePoints.map((point, index) => {
              const Icon = point.icon;
              return (
                <div key={index} className="flex items-start space-x-4">
                  <div className="bg-dubai-blue bg-opacity-10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="h-6 w-6 text-dubai-blue" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-dubai-gray-900 mb-2">
                      {point.title}
                    </h3>
                    <p className="text-dubai-gray-600 text-lg">
                      {point.description}
                    </p>
                  </div>
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
            Ready to Make Smarter Decisions?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join residents, businesses, and government agencies using GeoStats to understand Dubai better.
          </p>
          <Link
            to="/contact"
            className="bg-white text-dubai-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-dubai-gray-100 transition-colors inline-flex items-center"
          >
            Become a Data Partner
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
