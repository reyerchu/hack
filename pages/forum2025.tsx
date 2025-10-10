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
  const filePath = path.join(process.cwd(), 'public', 'forum2025.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');

  return {
    props: {
      htmlContent,
    },
  };
};
