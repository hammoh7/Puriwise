import React from "react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-primary-dark transition-all hover:shadow-md h-full">
      <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center text-accent text-2xl mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-playfair font-semibold mb-3">{title}</h3>
      <p className="text-text-light">{description}</p>
    </div>
  );
};

export default FeatureCard;
