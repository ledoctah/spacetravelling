import { NextApiRequest, NextApiResponse } from 'next';

export default async (
  _req: NextApiRequest,
  res: NextApiResponse
): Promise<void> => {
  res.clearPreviewData();

  res.writeHead(307, { Location: '/' });
  return res.end();
};
