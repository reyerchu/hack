import Link from 'next/link';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';

export default function HomeFooter() {
  return (
    <section className=" mt-16 px-6 py-8 md:text-base text-xs">
      <hr className="my-4 bg-complementary" />
      <div className="flex flex-col items-center justify-center gap-4 text-complementary text-center">
        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm md:text-base">
          <Link href="/privacy">
            <a
              className="hover:underline transition-all cursor-pointer"
              style={{ color: '#1a3a6e' }}
            >
              隱私權政策
            </a>
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/terms">
            <a
              className="hover:underline transition-all cursor-pointer"
              style={{ color: '#1a3a6e' }}
            >
              服務條款
            </a>
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-sm md:text-base">
          © 2025 RWA Hackathon Taiwan | RWA Nexus. All rights reserved.
        </div>
      </div>
    </section>
  );
}
