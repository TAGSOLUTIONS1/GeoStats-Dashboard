import React, { useState } from 'react';
import { 
  Mail, 
  MapPin, 
  Send,
  CheckCircle,
  Building2,
  User,
  Briefcase
} from 'lucide-react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    useCase: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setFormData({
            name: '',
            email: '',
            organization: '',
            role: '',
            useCase: '',
            message: ''
          });
        }, 3000);
      } else {
        alert('Failed to submit request. Please try again.');
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit request. Please check your connection and try again.');
    }
  };

  const useCases = [
    'Personal use (finding a place to live)',
    'Business location planning',
    'Real estate investment',
    'Government/Public sector planning',
    'Research & Analysis',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-dubai-gray-50 to-dubai-blue-50 py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-dubai-gray-900 mb-6">
              Become a <span className="text-dubai-blue">Data Partner</span>
            </h1>
            <p className="text-xl md:text-2xl text-dubai-gray-600">
              Help us build the future of urban intelligence. Partner with us to create comprehensive geo-intelligence for Dubai.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <h2 className="text-3xl font-bold text-dubai-gray-900 mb-8">
                Data Partnerships
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-dubai-blue bg-opacity-10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-dubai-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dubai-gray-900 mb-1">Email</h3>
                    <a href="mailto:contact@tagsolutionsltd.com" className="text-dubai-blue hover:underline">
                      contact@tagsolutionsltd.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-dubai-blue bg-opacity-10 w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-dubai-blue" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dubai-gray-900 mb-1">Location</h3>
                    <p className="text-dubai-gray-600">Dubai, United Arab Emirates</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 bg-dubai-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-dubai-gray-900 mb-4">
                  What happens next?
                </h3>
                <ul className="space-y-3 text-dubai-gray-600">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-dubai-blue mr-2 flex-shrink-0 mt-0.5" />
                    <span>We'll review your request within 24-48 hours</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-dubai-blue mr-2 flex-shrink-0 mt-0.5" />
                    <span>We'll reach out to discuss data partnership opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-dubai-blue mr-2 flex-shrink-0 mt-0.5" />
                    <span>You'll be among the first to access the platform when it launches</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Request Access Form */}
            <div className="lg:col-span-2">
              <div className="bg-dubai-gray-50 rounded-xl p-8">
                {submitted ? (
                  <div className="text-center py-12">
                    <div className="bg-dubai-blue bg-opacity-10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="h-8 w-8 text-dubai-blue" />
                    </div>
                    <h3 className="text-2xl font-bold text-dubai-gray-900 mb-4">
                      Request Submitted!
                    </h3>
                    <p className="text-dubai-gray-600">
                      We'll get back to you within 24-48 hours to discuss data partnership opportunities.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-dubai-gray-700 mb-2">
                          <User className="h-4 w-4 inline mr-2" />
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-dubai-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-blue focus:border-transparent"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-dubai-gray-700 mb-2">
                          <Mail className="h-4 w-4 inline mr-2" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-dubai-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-blue focus:border-transparent"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="organization" className="block text-sm font-medium text-dubai-gray-700 mb-2">
                          <Building2 className="h-4 w-4 inline mr-2" />
                          Organization
                        </label>
                        <input
                          type="text"
                          id="organization"
                          name="organization"
                          value={formData.organization}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-dubai-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-blue focus:border-transparent"
                          placeholder="Company or Institution"
                        />
                      </div>
                      <div>
                        <label htmlFor="role" className="block text-sm font-medium text-dubai-gray-700 mb-2">
                          <Briefcase className="h-4 w-4 inline mr-2" />
                          Role
                        </label>
                        <input
                          type="text"
                          id="role"
                          name="role"
                          value={formData.role}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-dubai-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-blue focus:border-transparent"
                          placeholder="Your role or title"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="useCase" className="block text-sm font-medium text-dubai-gray-700 mb-2">
                        Primary Use Case *
                      </label>
                      <select
                        id="useCase"
                        name="useCase"
                        required
                        value={formData.useCase}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-dubai-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-blue focus:border-transparent"
                      >
                        <option value="">Select a use case</option>
                        {useCases.map((useCase, index) => (
                          <option key={index} value={useCase}>
                            {useCase}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-dubai-gray-700 mb-2">
                        Tell us more about your needs
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows="5"
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-dubai-gray-300 rounded-lg focus:ring-2 focus:ring-dubai-blue focus:border-transparent"
                        placeholder="Tell us about your interest in becoming a data partner. What data can you contribute? How do you plan to use GeoStats? What specific questions are you trying to answer?"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-dubai-blue text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-dubai-blue-dark transition-colors inline-flex items-center justify-center"
                    >
                      <Send className="h-5 w-5 mr-2" />
                      Submit Request
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
