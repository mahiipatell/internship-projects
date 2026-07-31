import { useState } from 'react';
import { FaStar } from 'react-icons/fa';

// Interactive 10-point rating control (rendered as 5 stars, each worth 2 points,
// with half-star precision on hover/click via left/right click zones).
export default function RatingStars({ value = 0, onChange, size = 'text-2xl', readOnly = false }) {
  const [hover, setHover] = useState(null);
  const display = hover !== null ? hover : value;

  const handleClick = (starIndex, isHalf) => {
    if (readOnly) return;
    const score = isHalf ? starIndex * 2 - 1 : starIndex * 2;
    onChange?.(score);
  };

  return (
    <div className={`flex items-center gap-1 ${readOnly ? '' : 'cursor-pointer'}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = display >= star * 2;
        const halfFilled = display === star * 2 - 1;
        return (
          <span key={star} className="relative inline-block" onMouseLeave={() => setHover(null)}>
            <FaStar className={`${size} ${filled || halfFilled ? 'text-marquee-gold' : 'text-marquee-border'}`} />
            {halfFilled && (
              <FaStar
                className={`${size} text-marquee-gold absolute inset-0 overflow-hidden`}
                style={{ clipPath: 'inset(0 50% 0 0)' }}
              />
            )}
            {!readOnly && (
              <>
                <button
                  type="button"
                  aria-label={`Rate ${star * 2 - 1} out of 10`}
                  className="absolute inset-y-0 left-0 w-1/2"
                  onMouseEnter={() => setHover(star * 2 - 1)}
                  onClick={() => handleClick(star, true)}
                />
                <button
                  type="button"
                  aria-label={`Rate ${star * 2} out of 10`}
                  className="absolute inset-y-0 right-0 w-1/2"
                  onMouseEnter={() => setHover(star * 2)}
                  onClick={() => handleClick(star, false)}
                />
              </>
            )}
          </span>
        );
      })}
      <span className="ml-2 text-sm text-marquee-muted font-medium">{value > 0 ? `${value}/10` : 'Rate this'}</span>
    </div>
  );
}
