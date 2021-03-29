import { GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page?: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState(postsPagination.results);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function loadPosts(): Promise<void> {
    if (!nextPage) return;

    const data = await fetch(postsPagination.next_page).then(response =>
      response.json()
    );

    setNextPage(data.next_page);

    const newPosts = data.results.map(post => ({
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    }));

    const updatedPosts = [...posts, ...newPosts];

    setPosts(
      updatedPosts.filter((item, index) => {
        const foundIndex = updatedPosts.findIndex(
          elem => elem.uid === item.uid
        );

        console.log(index, foundIndex);

        return foundIndex === index;
      })
    );
  }

  return (
    <>
      <Head>
        <title>Posts | spacetravelling</title>
      </Head>

      <main className={styles.contentContainer}>
        <div className={styles.posts}>
          {posts.map(post => (
            <a key={post.uid}>
              <h1>{post.data.title}</h1>
              <p>{post.data.subtitle}</p>

              <section>
                <time>
                  <FiCalendar size={20} />
                  <span>{post.first_publication_date}</span>
                </time>

                <div>
                  <FiUser size={20} />
                  <span>{post.data.author}</span>
                </div>
              </section>
            </a>
          ))}

          <button type="button" onClick={loadPosts}>
            Carregar mais posts
          </button>
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      fetch: ['uid', 'title', 'subtitle', 'author'],
      page: 1,
      pageSize: 2,
    }
  );

  console.log(postsResponse.next_page);

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsResponse.results,
      },
    },
    revalidate: 60 * 1,
  };
};
