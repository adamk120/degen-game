import styled from "styled-components";


export const Header = styled.header`
  background-color: #FAAF40;
  min-height: 60px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-left: 2%;
  padding-right: 2%;
  color: white;
`;

export const HeaderDegen = styled.header`
  background-color: #FAAF40;
  min-height: 60px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  padding-left: 2%;
  padding-right: 2%;
  color: white;
`;

export const Body = styled.body`
  align-items: center;
  background-image: url("DegenGif.gif");
  background-size: 100% 100%;
  color: white;
  display: flex;
  flex-direction: column;
  font-size: calc(10px + 2vmin);
  justify-content: center;
  min-height: calc(100vh - 70px);
`;

export const Image = styled.img`
  height: 40vmin;
  margin-bottom: 16px;
  pointer-events: none;
`;

export const Link = styled.a.attrs({
  target: "_blank",
  rel: "noopener noreferrer",
})`
  color: #61dafb;
  margin-top: 10px;
`;

export const Button = styled.button`
  background-color: white;
  border: none;
  border-radius: 8px;
  color: #282c34;
  cursor: pointer;
  font-size: 16px;
  text-align: center;
  text-decoration: none;
  margin: 0px 20px;
  padding: 12px 24px;
  transition: all 0.4s;  

  :hover {
    color: #FAAF40;
    background-color: #618b2a;
  }

`;

export const WallButton = styled.button`
  background-color: white;
  border: none;
  border-radius: 8px;
  color: #282c34;
  cursor: pointer;
  font-size: 16px;
  text-align: center;
  text-decoration: none;
  margin: 0px;
  padding: 12px 24px;
  transition: all 0.4s;  

  :hover {
    color: #FAAF40;
    background-color: #618b2a;
  }

`;
