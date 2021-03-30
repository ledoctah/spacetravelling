import { Document } from '@prismicio/client/types/documents';
import { NextApiRequest, NextApiResponse } from 'next';
import { getPrismicClient } from '../../services/prismic';

function linkResolver(doc: Document): string {
  if (doc.type === 'post') {
    return `/post/${doc.uid}`;
  }

  return '/';
}

const Preview = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  const ref = req.query.token as string;
  const documentId = req.query.ref as string;

  const redirectUrl = await getPrismicClient(req)
    .getPreviewResolver(ref, documentId)
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setPreviewData({ ref });
  res.writeHead(302, { Location: `${redirectUrl}` });
  return res.end();
};

export default Preview;
