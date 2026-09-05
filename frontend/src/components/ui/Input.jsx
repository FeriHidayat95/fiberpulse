import React from 'react';
import './ui.css';

export const Input = ({ label, icon, rightElement, className = '', ...props }) => {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        {icon && <span className="input-icon">{icon}</span>}
        <input className={`input-field ${icon ? 'with-icon' : ''} ${rightElement ? 'with-right-element' : ''}`} {...props} />
        {rightElement && <div className="input-right-element">{rightElement}</div>}
      </div>
    </div>
  );
};
