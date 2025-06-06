import React from 'react';
import { Mail, Phone } from 'lucide-react';

const Footer = () => {
  const credits = [
    {
      name: "Shrikavin B",
      email: "shrikavinkbs@gmail.com",
      phone: "9965278945"
    },
    {
      name: "Srikavin S",
      email: "srikavin1103@gmail.com",
      phone: "9442666528"
    },
    {
      name: "Joshika S",
      email: "joshika.0703@gmail.com",
      phone: "9944344536"
    },
    {
      name: "Vaishak K R",
      email: "vaishakkr2006@gmail.com",
      phone: "7736626625"
    }
  ];

  return (
    <footer className="bg-white text-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2 text-gray-900">LocalLang.Codes</h2>
          <p className="text-gray-600">Transforming ideas into code using natural language</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {credits.map((credit, index) => (
            <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 shadow-lg border border-gray-200 backdrop-blur-sm hover:shadow-xl transition-shadow duration-300">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">{credit.name}</h3>
              <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                  <Mail className="w-5 h-5 mr-2" />
                  <a href={`mailto:${credit.email}`} className="hover:text-blue-600 transition-colors">
                    {credit.email}
                  </a>
                </div>
                <div className="flex items-center text-gray-600">
                  <Phone className="w-5 h-5 mr-2" />
                  <a href={`tel:${credit.phone}`} className="hover:text-blue-600 transition-colors">
                    {credit.phone}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} LocalLang.Codes. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 