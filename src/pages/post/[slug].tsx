/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';

import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';

import styles from './post.module.scss';

import Header from '../../components/Header';

interface PostContent {
  heading: string;
  body: string;
}

interface Post {
  first_publication_date: string | null;
  uid: string;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: PostContent[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const totalWords = post.data.content.reduce((acc, curr) => {
    const wordsInBody = RichText.asText(curr.body).split(/\w+/).length;
    const wordsInHeading = curr.heading.split(/\w+/).length;

    return acc + wordsInBody + wordsInHeading;
  }, 0);

  const readingTime = Math.ceil(totalWords / 200);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetravelling</title>
      </Head>

      <Header />

      <img
        className={styles.banner}
        src="https://images.prismic.io/ledoctah-spacetravelling/8ec765e9-ca4d-46d3-92c9-71615feba9c1_Banner.png?auto=compress,formatIma"
        alt="Banner"
      />

      <div className={styles.contentContainer}>
        <header>
          <h1>{post.data.title}</h1>

          <div>
            <time>
              <FiCalendar size={20} />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>

            <span>
              <FiUser size={20} />
              {post.data.author}
            </span>

            <span>
              <FiClock size={20} />
              {readingTime} min
            </span>
          </div>

          <article>
            {router.isFallback ? (
              <div className={styles.loading}>Carregando...</div>
            ) : (
              post.data.content.map(section => (
                <section key={section.heading}>
                  <h2>{section.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(section.body),
                    }}
                  />
                </section>
              ))
            )}
          </article>
        </header>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    { page: 1, pageSize: 2 }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const content: PostContent[] = response.data.content.map(group => {
    return {
      heading: group.heading,
      body: group.body,
    };
  });

  const post: Post = {
    first_publication_date: response.first_publication_date,
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content,
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60 * 1, // 1 HOUR
  };
};
