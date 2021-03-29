import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface PostContent {
  heading: string;
  body: string;
}

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
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
  return (
    <>
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
              {post.first_publication_date}
            </time>

            <span>
              <FiUser size={20} />
              {post.data.author}
            </span>

            <span>
              <FiClock size={20} />4 min
            </span>
          </div>

          <article>
            {post.data.content.map(section => (
              <>
                <section>
                  <h2>{section.heading}</h2>
                  <div dangerouslySetInnerHTML={{ __html: section.body }} />
                </section>
              </>
            ))}
          </article>
        </header>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  /* const prismic = getPrismicClient();
  const posts = await prismic.query(); */

  return {
    paths: [],
    fallback: 'blocking',
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
      body: RichText.asHtml(group.body),
    };
  });

  const post: Post = {
    first_publication_date: format(
      new Date(response.last_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
    data: {
      title: response.data.title,
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
    revalidate: 60 * 1,
  };
};
