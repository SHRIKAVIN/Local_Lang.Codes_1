import React from 'react';
import { CheckCircle } from 'lucide-react';

const Pricing = () => {
  const pricingTiers = [
    {
      name: 'Free',
      price: '₹0',
      frequency: '/month',
      description: 'For hobbyists and small projects.',
      features: [
        'Basic Code Generation (LLC 1)',
        'Limited App Blueprint Generation',
        'Community Support',
        'Up to 10 generations per day',
        'No API Access',
      ],
      cta: 'Sign Up',
      ctaLink: '/signup',
    },
    {
      name: 'Pro',
      price: '₹499',
      frequency: '/month',
      description: 'For professional developers.',
      features: [
        'Unlimited Code Generation (LLC 2)',
        'Advanced App Blueprint Generation',
        'Priority Email Support',
        'Unlimited generations',
        'Access to Beta Features',
      ],
      cta: 'Start Pro Trial',
      ctaLink: '#', // Placeholder link
    },
    {
      name: 'Business',
      price: '₹1499',
      frequency: '/month',
      description: 'For teams and agencies.',
      features: [
        'All Pro Features',
        'Team Management',
        'Dedicated Support Channel',
        'Custom AI Model Training (LLC 3)',
        'API Access',
      ],
      cta: 'Contact Sales',
      ctaLink: '#', // Placeholder link
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Pricing Plans</h1>
          <p className="mt-4 text-xl text-gray-600">Choose the perfect plan for your needs.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <div key={tier.name} className="flex flex-col rounded-lg shadow-lg overflow-hidden h-full">
              <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
                <div className="flex-grow">
                  <h3 className="text-lg font-medium text-gray-900">{tier.name}</h3>
                  <p className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                    <span className="ml-1 text-xl font-semibold text-gray-600">{tier.frequency}</span>
                  </p>
                  <p className="mt-4 text-sm text-gray-600">{tier.description}</p>
                  <ul role="list" className="mt-6 space-y-4">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <div className="flex-shrink-0">
                          <CheckCircle className="h-6 w-6 text-blue-500" aria-hidden="true" />
                        </div>
                        <p className="ml-3 text-base text-gray-600">{feature}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="px-6 py-8 bg-gray-50 sm:p-10 sm:pt-6">
                 <a
                    href={tier.ctaLink}
                    className="block w-full text-center rounded-md border border-transparent bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700"
                  >
                    {tier.cta}
                  </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing; 