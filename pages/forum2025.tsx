import { GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';

interface Forum2025Props {
  htmlContent: string;
}

export default function Forum2025({ htmlContent }: Forum2025Props) {
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
}

export const getStaticProps: GetStaticProps = async () => {
  try {
    const filePath = path.join(process.cwd(), 'public', 'forum2025.html');
    const htmlContent = fs.readFileSync(filePath, 'utf8');

    return {
      props: {
        htmlContent,
      },
    };
  } catch (error) {
    console.error('Error reading forum2025.html:', error);
    return {
      props: {
        htmlContent: '<h1>Forum content temporarily unavailable</h1>',
      },
    };
  }
};
