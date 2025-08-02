'use client';

import React from 'react';
import styled from 'styled-components';

interface EncryptedButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const EncryptedButton: React.FC<EncryptedButtonProps> = ({ 
  children, 
  className = "", 
  onClick 
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [displayText, setDisplayText] = React.useState(children);
  
  const originalText = typeof children === 'string' ? children : 'Create Capsule';
  
  const scrambleText = (text: string) => {
    const chars = '!@#$%^&*(){}[]<>?/|\\+=~;:';
    return text.split('').map(() => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  };

  const revealText = (text: string) => {
    let iteration = 0;
    
    const interval = setInterval(() => {
      setDisplayText(text.split('').map((char, index) => {
        if (index < iteration) {
          return char;
        }
        return scrambleText(char);
      }).join(''));
      
      if (iteration >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
      }
      
      iteration += 1 / 3;
    }, 50);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    revealText(originalText);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setDisplayText(originalText);
  };

  return (
    <StyledWrapper className={className}>
      <button 
        className="buttonpro" 
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span>{displayText}</span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .buttonpro {
    --btn-default-bg: linear-gradient(135deg, #15803d 0%, #166534 100%);
    --btn-padding: 15px 32px;
    --btn-hover-bg: #15803d;
    --btn-transition: 0.3s;
    --btn-letter-spacing: 0.1rem;
    --btn-animation-duration: 0.8s;
    --btn-shadow-color: rgba(21, 128, 61, 0.5);
    --btn-shadow: 0 4px 20px 0 var(--btn-shadow-color);
    --hover-btn-color: #ffffff;
    --default-btn-color: #ffffff;
    --font-size: 18px;
    --font-weight: 600;
    --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border-radius: 12px;
  }

  .buttonpro {
    box-sizing: border-box;
    padding: var(--btn-padding);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--default-btn-color);
    font: var(--font-weight) var(--font-size) var(--font-family);
    background: var(--btn-default-bg);
    cursor: pointer;
    transition: var(--btn-transition);
    overflow: hidden;
    box-shadow: var(--btn-shadow);
    border-radius: 12px;
    border: 2px solid rgba(21, 128, 61, 0.4);
    position: relative;
  }

  .buttonpro span {
    letter-spacing: var(--btn-letter-spacing);
    transition: var(--btn-transition);
    box-sizing: border-box;
    position: relative;
    background: inherit;
    z-index: 1;
  }

  .buttonpro span::before {
    box-sizing: border-box;
    position: absolute;
    content: "";
    background: inherit;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: -1;
    display: block;
    width: 100%;
    height: 100%;
  }

  .buttonpro:focus {
    transform: scale(1.05);
    outline: none;
  }

  .buttonpro:hover,
  .buttonpro:focus {
    background: linear-gradient(135deg, #14532d 0%, #15803d 100%);
    box-shadow: 0px 0px 25px 0px rgba(21, 128, 61, 0.9);
    border: 2px solid #15803d;
    transform: scale(1.05);
  }

  .buttonpro:hover span,
  .buttonpro:focus span {
    color: #ffffff;
  }
`;

export default EncryptedButton;
