import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="th" className="h-full" style={{ backgroundColor: '#F3F3F3' }}>
      <Head>
        <title>ระบบแผนที่น้ำท่วมและเส้นทางอพยพเรียลไทม์</title>
        <link rel="icon" href="/logo/logoitteam1.png" type="image/png" />

        {/* QR Code Library */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrious/4.0.2/qrious.min.js"></script>

        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css?family=Kanit:400,300&subset=thai,latin" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Niramit&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Niramit&family=Sarabun&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@500;600;700&family=Noto+Sans+Thai:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet"></link>

        {/* Animate.css */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css" />

        {/* Viewport สำหรับมือถือ */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <body className="h-screen overflow-hidden p-0 m-0 bg-black">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
