import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const submissions = await prisma.submission.findMany({
      include: {
        user: { select: { id: true, alias: true } },
        team: { select: { id: true, name: true, color: true, icon: true } },
        challenge: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

const handleDelete = async (request: Request) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let body: { submissionId?: string; challengeId?: string; teamId?: string } = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const submissionId = body.submissionId;
    let { challengeId, teamId } = body;

    if (submissionId) {
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        select: { id: true, isCorrect: true, challengeId: true, teamId: true }
      });

      if (!submission) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }

      if (!submission.isCorrect) {
        await prisma.submission.delete({ where: { id: submissionId } });
        return NextResponse.json({ message: 'Submission deleted' });
      }

      challengeId = submission.challengeId;
      teamId = submission.teamId;
    }

    if (!challengeId || !teamId) {
      return NextResponse.json(
        { error: 'challengeId and teamId are required to delete a solve' },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { title: true }
    });

    await prisma.$transaction(async (tx) => {
      const scores = await tx.score.findMany({
        where: { teamId, challengeId },
        select: { points: true }
      });

      const pointsToRemove = scores.reduce((sum, score) => sum + score.points, 0);

      await tx.submission.deleteMany({
        where: { teamId, challengeId, isCorrect: true }
      });

      await tx.score.deleteMany({
        where: { teamId, challengeId }
      });

      if (pointsToRemove > 0) {
        const team = await tx.team.findUnique({
          where: { id: teamId },
          select: { score: true }
        });

        if (team) {
          const newScore = Math.max(0, team.score - pointsToRemove);
          await tx.team.update({
            where: { id: teamId },
            data: { score: newScore }
          });

          await tx.teamPointHistory.create({
            data: {
              teamId,
              points: -pointsToRemove,
              totalPoints: newScore,
              reason: 'ADMIN_ADJUSTMENT',
              metadata: JSON.stringify({
                action: 'DELETE_SOLVE',
                challengeId,
                challengeTitle: challenge?.title || null,
                points: pointsToRemove
              })
            }
          });
        }
      }
    });

    return NextResponse.json({ message: 'Solve deleted' });
  } catch (error) {
    console.error('Error deleting submission/solve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export { handleDelete as DELETE };
