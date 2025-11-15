import { GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';

interface BootcampPageProps {
  htmlContent: string;
}

export default function BootcampPage({ htmlContent }: BootcampPageProps) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'bootcamp.html');
    const htmlContent = fs.readFileSync(filePath, 'utf8');

    return {
      props: {
        htmlContent,
      },
    };
  } catch (error) {
    console.error('Error reading bootcamp.html:', error);
    return {
      props: {
        htmlContent: '<h1>Bootcamp content temporarily unavailable</h1>',
      },
    };
  }
};
