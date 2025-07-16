// hoc/withAuth.js
import jwt from 'jsonwebtoken';

export function withAuth(gssp) {
  return async (ctx) => {
    const { req, res } = ctx;
    const token = req.cookies.token || '';
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return await gssp(ctx);
    } catch {
      return { redirect: { destination: '/login', permanent: false } };
    }
  };
}
