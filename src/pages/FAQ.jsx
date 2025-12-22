import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  HelpCircle,
  Users,
  Building2,
  Shield,
  Globe,
  CheckCircle
} from 'lucide-react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: 'What is GEOSTAT?',
      answer: 'GEOSTAT is a geo-intelligence platform that turns complex city data into simple, actionable insights. It helps people, businesses, and governments understand population, income, mobility, real estate, and urban trends at a neighborhood level.'
    },
    {
      question: 'Who is GEOSTAT for?',
      answer: 'GEOSTAT is designed for multiple user groups, including: Residents and expats choosing where to live, Businesses deciding where to open or expand, Investors and developers analyzing demand, Government and public-sector teams planning services, Researchers, NGOs, and urban analysts. Each group sees insights relevant to their decisions — not raw data.'
    },
    {
      question: 'Is GEOSTAT a real estate listing website?',
      answer: 'No. GEOSTAT does not show property listings or ads. Instead, it focuses on: Area-level averages, Trends over time, Demand and supply indicators, Location comparisons. This makes it useful even when listings change or disappear.'
    },
    {
      question: 'What kind of data does GEOSTAT use?',
      answer: 'GEOSTAT works with aggregated and anonymized datasets, such as: Population and demographic statistics, Income and spending proxies, Real estate prices and rental trends, Mobility and accessibility data, Points of interest and service coverage. The focus is always on areas, not individuals.'
    },
    {
      question: 'Does GEOSTAT collect or display personal data?',
      answer: 'No. GEOSTAT does not collect, process, or display any personal or identifiable information. All insights are built from aggregated, privacy-safe data and are designed for planning and decision-making purposes only.'
    },
    {
      question: 'Where does the data come from?',
      answer: 'GEOSTAT combines data from: Public and official sources, Licensed third-party providers, Institutional and research partners, Contributing data partners. The platform is built as a collaborative data ecosystem, not a single-source database.'
    },
    {
      question: 'Do you already cover all areas and datasets?',
      answer: 'GEOSTAT is continuously expanding. Coverage and datasets are added in phases, with priority given to: High-demand areas, Partner-supported datasets, Government and institutional use cases. Early users and partners help influence what is added next.'
    },
    {
      question: 'How accurate is the data?',
      answer: 'Accuracy depends on the dataset and update frequency. GEOSTAT prioritizes: Verified sources, Transparent methodologies, Regular updates where available. Each insight is designed to show trends and comparisons, not exact point-level measurements.'
    },
    {
      question: 'Can businesses use GEOSTAT for site selection and expansion?',
      answer: 'Yes. Businesses use GEOSTAT to: Identify high-demand locations, Understand footfall and accessibility, Analyze income and population fit, Compare multiple areas quickly. This reduces risk before making location decisions.'
    },
    {
      question: 'How can government or public-sector teams use GEOSTAT?',
      answer: 'Public-sector teams use GEOSTAT for: Evidence-based planning, Identifying service gaps, Infrastructure and transport analysis, Housing and population monitoring. All use cases follow data privacy and aggregation standards suitable for public institutions.'
    },
    {
      question: 'Can I request access to GEOSTAT?',
      answer: 'Yes. GEOSTAT is available through data partnerships. You can request access if you are: A business or investor, A public-sector organization, A researcher or NGO. Data partners help shape future features.'
    },
    {
      question: 'What does it mean to become a Data Partner?',
      answer: 'A Data Partner contributes aggregated datasets that help improve insights across the platform. Data partners may include: Government entities, Utilities and mobility providers, Research institutions, Private data companies. All partnerships follow strict data ethics and privacy guidelines.'
    },
    {
      question: 'Is GEOSTAT only for Dubai?',
      answer: 'GEOSTAT is built for Dubai first, with a roadmap to expand across: UAE, GCC cities, Other high-growth urban regions. The platform is designed to scale geographically over time.'
    },
    {
      question: 'How is GEOSTAT different from other data dashboards?',
      answer: 'GEOSTAT focuses on: Clarity over complexity, Decisions over raw numbers, Multiple user groups, not just analysts, Urban intelligence, not single-domain data. It is built to be useful even for non-technical users.'
    },
    {
      question: 'How can I get in touch or collaborate?',
      answer: 'You can: Request access, Apply to become a data partner, Explore partnership opportunities. Use the "Become a Data Partner" option on the website to get started.'
    }
  ];

  const categories = [
    {
      icon: HelpCircle,
      title: 'General Questions',
      count: 3
    },
    {
      icon: Users,
      title: 'For Users',
      count: 4
    },
    {
      icon: Shield,
      title: 'Privacy & Data',
      count: 3
    },
    {
      icon: Building2,
      title: 'Business & Partnerships',
      count: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dubai-gray-50 to-dubai-blue-50 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-dubai-blue bg-opacity-10 rounded-full mb-6">
              <HelpCircle className="h-8 w-8 text-dubai-blue" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-dubai-gray-900 mb-6">
              Frequently Asked <span className="text-dubai-blue">Questions</span>
            </h1>
            <p className="text-xl md:text-2xl text-dubai-gray-600">
              Everything you need to know about GeoStats, data partnerships, and how we help you make smarter decisions.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="py-12 bg-white border-b border-dubai-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <div
                  key={index}
                  className="text-center p-4 rounded-lg hover:bg-dubai-gray-50 transition-colors"
                >
                  <Icon className="h-6 w-6 text-dubai-blue mx-auto mb-2" />
                  <p className="text-sm font-semibold text-dubai-gray-900">{category.title}</p>
                  <p className="text-xs text-dubai-gray-500">{category.count} questions</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="border border-dubai-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between bg-white hover:bg-dubai-gray-50 transition-colors"
                  >
                    <span className="text-lg font-semibold text-dubai-gray-900 pr-4">
                      {faq.question}
                    </span>
                    <div className="flex-shrink-0">
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-dubai-blue" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-dubai-gray-400" />
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 py-5 bg-dubai-gray-50 border-t border-dubai-gray-200">
                      <p className="text-dubai-gray-700 leading-relaxed whitespace-pre-line">
                        {faq.answer}
                      </p>
                    </div>
                  )}
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
            Still Have Questions?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Can't find what you're looking for? Get in touch with our team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="bg-white text-dubai-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-dubai-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Become a Data Partner
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/contact"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-dubai-blue transition-colors inline-flex items-center justify-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
