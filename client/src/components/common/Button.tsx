import React from 'react';
import styled from 'styled-components';

const ButtonElement = styled.button<ButtonProps>`
  padding: ${props => props.size === 'large' ? '12px 24px' : props.size === 'small' ? '6px 12px' : '10px 20px'};
  font-size: ${props => props.size === 'large' ? '18px' : props.size === 'small' ? '14px' : '16px'};
  background-color: ${props => {
    switch (props.variant) {
      case 'primary': return '#4d9aff';
      case 'secondary': return '#555';
      case 'danger': return '#e74c3c';
      case 'success': return '#2ecc71';
      default: return '#4d9aff';
    }
  }};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.6 : 1};
  transition: background-color 0.3s, transform 0.1s;
  
  &:hover {
    background-color: ${props => {
    if (props.disabled) return '';

    switch (props.variant) {
      case 'primary': return '#2980ff';
      case 'secondary': return '#444';
      case 'danger': return '#c0392b';
      case 'success': return '#27ae60';
      default: return '#2980ff';
    }
  }};
  }
  
  &:active {
    transform: ${props => props.disabled ? 'none' : 'scale(0.98)'};
  }
`;

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  onClick,
  disabled = false,
  children,
  className,
  type = 'button',
  style
}) => {
  return (
    <ButtonElement
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled}
      className={className}
      type={type}
      style={style}
    >
      {children}
    </ButtonElement>
  );
};

export default Button;
