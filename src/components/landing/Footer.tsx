import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-white py-12 border-t border-primary">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-center items-start md:items-center gap-16 text-center md:text-left">
          <div className="max-w-md">
            <div className="flex justify-center md:justify-start items-center space-x-2 mb-4">
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
              {[
                "Live AQI Heatmap",
                "Health Advisories",
                "Clean-Air Routes",
                "Personalized Plans",
              ].map((feature, idx) => (
                <li key={idx}>
                  <Link
                    href="#"
                    className="text-text-light hover:text-accent transition-colors text-sm"
                  >
                    {feature}
                  </Link>
                </li>
              ))}
            </ul>
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
