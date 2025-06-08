import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { logout } from '../../features/user/userSlice';
import { RootState } from '../../store';

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
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, currentUser, isTemporaryUser } = useSelector((state: RootState) => state.user);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <HeaderContainer>
      <Logo to="/">TD Vibe</Logo>      <Navigation>
        <NavLink to="/">Home</NavLink>
        {isAuthenticated ? (
          <>
            <UserInfo>
              {!isTemporaryUser && (
                <NavLink to={`/profile`}>
                  {currentUser?.username}
                </NavLink>
              )}
              {isTemporaryUser && (
                <span>
                  {currentUser?.username}
                </span>
              )}
              <LogoutButton onClick={handleLogout}>
                {isTemporaryUser ? 'Change Username' : 'Logout'}
              </LogoutButton>
            </UserInfo>
          </>
        ) : (
          <>
            <NavLink to="/username-entry">Quick Play</NavLink>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </Navigation>
    </HeaderContainer>
  );
};

export default Header;
