import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background-color: #1e1e1e;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
`;

const Logo = styled(Link)`
  font-size: 1.8rem;
  font-weight: bold;
  color: #4d9aff;
  text-decoration: none;
`;

const Navigation = styled.nav`
  display: flex;
  gap: 1.5rem;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: #f0f0f0;
  text-decoration: none;
  font-weight: 500;
  
  &:hover {
    color: #4d9aff;
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const LogoutButton = styled.button`
  background: none;
  color: #f0f0f0;
  border: 1px solid #4d9aff;
  padding: 6px 12px;
  
  &:hover {
    background-color: rgba(77, 154, 255, 0.1);
  }
`;

const Header: React.FC = () => {

  return (
    <HeaderContainer>
      <Logo to="/">TD Vibe</Logo>      <Navigation>
        <NavLink to="/">Home</NavLink>

      </Navigation>
    </HeaderContainer>
  );
};

export default Header;
