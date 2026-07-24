import Head from "next/head";

const PageMeta = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <Head>
    <title>{title}</title>
    <meta name="description" content={description} />
  </Head>
);

export const AppWrapper = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export default PageMeta;
