import React, { useState } from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({
  rating = 0,
  onChange = null,
  maxStars = 5,
  size = 6, // Tailwind size classes (w-6 h-6)
  interactive = true
}) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (value) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const starsArray = Array.from({ length: maxStars }, (_, i) => i + 1);

  return (
    <div className="flex items-center space-x-1.5" onMouseLeave={handleMouseLeave}>
      {starsArray.map((value) => {
        // Star is active if rating value is less than equal to active selection or active hover
        const active = hoverRating ? value <= hoverRating : value <= rating;

        return (
          <button
            key={value}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            className={`transition-all duration-150 transform focus:outline-none 
              ${interactive ? 'hover:scale-125 cursor-pointer' : ''}
            `}
          >
            <Star
              className={`w-${size} h-${size} transition-colors
                ${active
                  ? 'text-amber-400 fill-current drop-shadow-md'
                  : 'text-gray-500 hover:text-amber-300'
                }
              `}
            />
          </button>
        );
      })}
    </div>
  );
};

export default RatingStars;
