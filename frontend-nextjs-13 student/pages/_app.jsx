// pages/_app.jsx
import '../styles/globals.css';
import { HeroUIProvider } from '@heroui/react';
import { I18nProvider } from '@react-aria/i18n';
import Navbar from '../component/Navbar';
import MobileTabBar from '../component/MobileTabBar';

export default function App({ Component, pageProps }) {
    return (
        <I18nProvider locale="th-TH">
            <HeroUIProvider>
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    {/* pb-16 เว้นที่ให้แถบเมนูล่างบนมือถือ */}
                    <main className="flex-1 flex flex-col pb-16 md:pb-0">
                        <Component {...pageProps} />
                    </main>
                </div>
                <MobileTabBar />
            </HeroUIProvider>
        </I18nProvider>
    );
}