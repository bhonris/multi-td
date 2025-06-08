import { createGlobalStyle } from "styled-components";

const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Roboto', sans-serif;
  }

  body {
    background-color: #121212;
    color: #f0f0f0;
    line-height: 1.6;
  }

  a {
    text-decoration: none;
    color: #4d9aff;
  }

  button {
    cursor: pointer;
    border: none;
    background-color: #4d9aff;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 16px;
    transition: background-color 0.3s;
    
    &:hover {
      background-color: #2980ff;
    }
    
    &:disabled {
      background-color: #555;
      cursor: not-allowed;
    }
  }

  input {
    padding: 10px;
    margin: 8px 0;
    border-radius: 4px;
    border: 1px solid #555;
    background-color: #1e1e1e;
    color: white;
    width: 100%;
  }

  h1, h2, h3, h4, h5 {
    margin: 1rem 0;
  }
`;

export default GlobalStyles;
