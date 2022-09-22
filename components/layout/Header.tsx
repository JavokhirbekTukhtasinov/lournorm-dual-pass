import React, { FC } from "react";


interface HeaderProps {
  text :string
}
const Header: FC<HeaderProps> = ({text}) => {
  return (
    <header className="p-4 text-center bg-white dark:bg-black">
      <h1 className="text-xl">
        <span className="font-bold"> {text}</span>
      </h1>
    </header>
  );
};
export default Header;
