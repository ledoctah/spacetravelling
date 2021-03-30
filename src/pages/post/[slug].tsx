/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import ptBR from 'date-fns/locale/pt-BR';
import Head from 'next/head';
import Link from 'next/link';

import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Document } from '@prismicio/client/types/documents';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';

import styles from './post.module.scss';

import Header from '../../components/Header';
import CommentsSection from '../../components/CommentsSection';

interface PostContent {
  heading: string;
  body: string;
}

interface PreviewData {
  ref: string;
}

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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

interface NavigationProps {
  slug: string;
  title: string;
}

interface PostProps {
  post: Post;
  nextPost: NavigationProps;
  previousPost: NavigationProps;
  preview?: boolean;
}

export default function Post({
  post,
  nextPost,
  previousPost,
  preview = false,
}: PostProps): JSX.Element {
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

          <span>
            {format(
              new Date(post.first_publication_date),
              "'* editado em ' dd MMM yyyy', às ' HH:mm",
              {
                locale: ptBR,
              }
            )}
          </span>
        </header>

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

        <footer>
          <div className={styles.postNavigation}>
            <div>
              {previousPost && (
                <>
                  <h2>{previousPost.title}</h2>
                  <Link href={`/post/${previousPost.slug}`}>
                    <a>Post anterior</a>
                  </Link>
                </>
              )}
            </div>

            <div>
              {nextPost && (
                <>
                  <h2>{nextPost.title}</h2>
                  <Link href={`/post/${nextPost.slug}`}>
                    <a>Próximo post</a>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div>
            <CommentsSection />
          </div>

          {preview && (
            <aside className={commonStyles.exitPreview}>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </footer>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post')
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const ref = previewData?.ref;

  let response: Document;

  const prismic = getPrismicClient();

  if (ref) {
    response = await prismic.getSingle('post', {
      ref,
    });
  } else {
    response = await prismic.getByUID('post', String(slug), {});
  }

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
    last_publication_date: response.last_publication_date,
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

  const nextPost = response.first_publication_date
    ? await prismic.query(
        Prismic.Predicates.dateAfter(
          'document.first_publication_date',
          response.first_publication_date
        ),
        {
          pageSize: 1,
          orderings: '[document.first_publication_date]',
        }
      )
    : { results: [] };

  const previousPost = response.first_publication_date
    ? await prismic.query(
        Prismic.Predicates.dateBefore(
          'document.first_publication_date',
          response.first_publication_date
        ),
        { pageSize: 1, orderings: '[document.first_publication_date desc]' }
      )
    : { results: [] };

  return {
    props: {
      post,
      nextPost: nextPost.results[0]
        ? {
            slug: nextPost.results[0].uid,
            title: nextPost.results[0].data.title,
          }
        : null,
      previousPost: previousPost.results[0]
        ? {
            slug: previousPost.results[0].uid,
            title: previousPost.results[0].data.title,
          }
        : null,
      preview,
    },
    revalidate: 60 * 60 * 1, // 1 HOUR
  };
};
