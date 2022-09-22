import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { FC, PropsWithChildren } from "react";

interface LayoutProps {
children :PropsWithChildren<any>,
type: string;  
}
const Layout:FC<LayoutProps> = ({type, children }) => {
  return (

    <>
      <Header text="Loud normalizer with ffmpeg dual pass" />
      <main className="w-full max-w-lg">{children}</main>
      {/* <Footer /> */}
    </>

  );
};


export default Layout;
