import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';

export default function HomeFooter() {
  return (
    <section className=" mt-16 px-6 py-8 md:text-base text-xs">
      <hr className="my-4 bg-complementary" />
      <div className="flex flex-col items-center justify-center gap-2 text-complementary text-center">
        <div className="text-sm md:text-base">
          © 2025 RWA Hackathon Taiwan | RWA Nexus. All rights reserved.
        </div>
      </div>
    </section>
  );
}
