import React from "react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
}

const TestimonialCard = ({
  quote,
  author,
  role,
}: TestimonialCardProps) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-primary-dark h-full">
      <p className="text-text-light mb-6">{quote}</p>
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center text-accent mr-4">
          <span className="font-bold">{author.charAt(0)}</span>
        </div>
        <div>
          <p className="font-medium">{author}</p>
          <p className="text-text-light text-sm">{role}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
