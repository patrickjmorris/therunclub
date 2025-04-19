// Reusable RaceCard component stub
import React from 'react';

export interface RaceCardProps {
  title: string;
  imageUrl?: string;
  location: string;
  date: string;
  isOpen: boolean;
  onClick?: () => void;
}

const RaceCard: React.FC<RaceCardProps> = ({ title, imageUrl, location, date, isOpen, onClick }) => {
  // UI and styling to be implemented
  return (
    <div onClick={onClick} role="button" tabIndex={0}>
      {/* Card layout here */}
      <span>{title}</span>
    </div>
  );
};

export default RaceCard;
