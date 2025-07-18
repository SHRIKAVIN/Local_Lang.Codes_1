import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Code, Globe, Zap, BookOpen, Star, Users, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <Code className="w-6 h-6" />,
      title: "Code Generation",
      description: "Generate code in multiple programming languages using natural language descriptions in your native language."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "App Blueprint Generation",
      description: "Generate structured blueprints and plans for your applications using natural language."
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Code Explanation",
      description: "Get detailed explanations of generated code in your preferred language."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your code and data are processed securely with industry-standard encryption."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Developer",
      content: "This tool has revolutionized how I write code. The ability to describe what I want in my native language is incredible.",
      rating: 5,
      date: "2 weeks ago",
      avatar: "https://i.pravatar.cc/150?img=1"
    },
    {
      name: "Raj Patel",
      role: "Web Designer",
      content: "I can now create complex websites without writing a single line of code. The explanations are crystal clear!",
      rating: 4.5,
      date: "1 month ago",
      avatar: "https://i.pravatar.cc/150?img=2"
    },
    {
      name: "Maria Garcia",
      role: "Student",
      content: "As a beginner, this tool has helped me understand programming concepts better through its detailed explanations.",
      rating: 5,
      date: "3 weeks ago",
      avatar: "https://i.pravatar.cc/150?img=3"
    }
  ];

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-current" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-5 h-5">
          <Star className="w-5 h-5 text-yellow-400 fill-current opacity-50" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
          </div>
        </div>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-5 h-5 text-yellow-400 fill-current opacity-50" />
      );
    }

    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6">
              LocalLang.Codes
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-6 md:mb-8 text-blue-100">
              Transform your ideas into code using natural language in your native tongue
            </p>
            {!user ? (
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/signup"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Link
                  to="/code"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Generate Code
                </Link>
                <Link
                  to="/app-plan"
                  className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
                >
                  Build App Plan
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Features Section */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">Features</h2>
          <p className="text-base md:text-lg text-gray-600">Unlock the power of AI-assisted coding in your native language.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center text-center"
            >
              <div className="text-blue-600 mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* How It Works Section */}
        <div className="mb-12 md:mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-base md:text-lg text-gray-600">Three simple steps to transform your ideas into code</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-md p-6 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Describe Your Idea</h3>
                <p className="text-gray-600">Write your requirements in your native language. Be as detailed as you want - our AI understands natural language perfectly.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI Processing</h3>
                <p className="text-gray-600">Our advanced AI analyzes your requirements and generates the appropriate code or application blueprint.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
              <div className="mt-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Get Your Code</h3>
                <p className="text-gray-600">Receive your generated code with detailed explanations in your preferred language. Ready to use and customize.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-12 md:mb-16">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">What Our Users Say</h2>
            <p className="text-base md:text-lg text-gray-600">Join thousands of satisfied developers using LocalLang.Codes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md p-6 flex flex-col"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <div className="flex mb-4">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="text-gray-600 mb-4 flex-grow">{testimonial.content}</p>
                <p className="text-sm text-gray-500">{testimonial.date}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action Section */}
        <div className="bg-blue-600 text-white rounded-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
            <div className="text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-base md:text-xl mb-6 md:mb-8 text-blue-100">
                Join thousands of developers creating amazing things
              </p>
              {!user ? (
                <Link
                  to="/signup"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Create Free Account
                </Link>
              ) : (
                <Link
                  to="/code"
                  className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Start Generating Code
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 