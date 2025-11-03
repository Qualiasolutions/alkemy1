
import React from 'react';
import { THEME_COLORS } from '../constants';

interface PlaceholderTabProps {
  title: string;
  description: string;
}

const PlaceholderTab: React.FC<PlaceholderTabProps> = ({ title, description }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)] text-center">
      <div className={`p-10 border border-dashed border-[${THEME_COLORS.border_color}] rounded-2xl`}>
        <h2 className={`text-3xl font-bold mb-2 text-[${THEME_COLORS.text_primary}]`}>{title}</h2>
        <p className={`text-lg text-[${THEME_COLORS.text_secondary}] max-w-md`}>
          {description} This section is under construction.
        </p>
      </div>
    </div>
  );
};

export default PlaceholderTab;
