import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white py-12 border-t border-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-lg font-playfair font-semibold text-text">
                Puriwise
              </span>
            </div>
            <p className="text-text-light text-sm">
              Empowering healthier outdoor decisions with real-time air quality
              data and AI-driven insights.
            </p>
          </div>

          <div>
            <h4 className="font-playfair font-semibold text-text mb-4">
              Features
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-text-light hover:text-accent transition-colors text-sm"
                >
                  Live AQI Heatmap
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-text-light hover:text-accent transition-colors text-sm"
                >
                  Health Advisories
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-text-light hover:text-accent transition-colors text-sm"
                >
                  Clean-Air Routes
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-text-light hover:text-accent transition-colors text-sm"
                >
                  Personalized Plans
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair font-semibold text-text mb-4">
              Company
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-text-light hover:text-accent transition-colors text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-text-light hover:text-accent transition-colors text-sm"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-text-light hover:text-accent transition-colors text-sm"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-text-light hover:text-accent transition-colors text-sm"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-playfair font-semibold text-text mb-4">
              Subscribe
            </h4>
            <p className="text-text-light text-sm mb-4">
              Get the latest updates on air quality innovations
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 rounded-l-lg w-full text-sm border border-primary-dark focus:outline-none focus:ring-1 focus:ring-accent bg-white"
              />
              <button className="bg-accent hover:bg-accent-dark text-white px-4 rounded-r-lg text-sm transition-colors">
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-primary mt-12 pt-8 text-center text-text-light text-sm">
          <p>© {new Date().getFullYear()} Puriwise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
