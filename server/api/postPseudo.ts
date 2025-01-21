import { PrismaClient } from '@prisma/client';
import type { H3Event } from 'h3';

const prisma = new PrismaClient();

const postPseudo = async (event: H3Event) => {
  const body: { name: string } = await readBody(event);

  const newPseudo = await prisma.pseudo.create({
    data: {
      name: body.name,
    },
  });

  return {
    success: true,
    pseudo: newPseudo,
  };
};

export default postPseudo;