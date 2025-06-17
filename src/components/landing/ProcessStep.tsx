import React from "react";

interface ProcessStepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ProcessStep = ({
  number,
  title,
  description,
  icon,
}: ProcessStepProps) => {
  return (
    <div className="flex flex-col items-center text-center p-6 bg-white rounded-xl shadow-sm border border-primary-dark transition-all hover:shadow-md">
      <div className="w-16 h-16 rounded-full bg-accent-light flex items-center justify-center text-accent mb-6 relative">
        <span className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
          {number}
        </span>
        <div className="text-2xl">{icon}</div>
      </div>
      <h3 className="text-xl font-playfair font-semibold mb-3">{title}</h3>
      <p className="text-text-light">{description}</p>
    </div>
  );
};

export default ProcessStep;
